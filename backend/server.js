import "dotenv/config";
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { db, seedFaqs } from './db.js';
import { signToken, authMiddleware } from './auth.js';
import { SRM_SYSTEM_PROMPT } from './prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Render usually uses port 10000, but process.env.PORT will handle it
const PORT = process.env.PORT || 3001;

// ── Configuration ──
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('\n⚠️  WARNING: ANTHROPIC_API_KEY is not set!');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' });

// Updated CORS to specifically allow your Vercel frontend
app.use(cors({
  origin: ['https://srm-insider-ai.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Initialize DB
seedFaqs().catch(console.error);

// ── Root Route (Prevents "Cannot GET /" error) ──
app.get('/', (req, res) => {
  res.status(200).json({
    message: "SRM Insider AI Backend is Live",
    frontend: "https://srm-insider-ai.vercel.app",
    health: "/api/health"
  });
});

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SRM Insider AI',
    version: '1.0.0',
    api_key_set: !!process.env.ANTHROPIC_API_KEY
  });
});

// ── Auth Routes ──
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, reg_number, department, year } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = await db.users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await db.users.insert({
      _id: uuidv4(), name, email, password_hash: hash,
      reg_number: reg_number || '', department: department || 'CSE', year: year || 1,
      role: 'student', created_at: new Date().toISOString()
    });
    const token = signToken({ id: user._id, email, role: 'student' });
    const { password_hash, ...safe } = user;
    res.status(201).json({ token, user: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await db.users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user._id, email, role: user.role });
    const { password_hash, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await db.users.findOne({ _id: req.user.id });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password_hash, ...safe } = user;
  res.json(safe);
});

// ── Conversations ──
app.get('/api/conversations', authMiddleware, async (req, res) => {
  const convs = await db.conversations.find({ user_id: req.user.id }).sort({ updated_at: -1 });
  res.json(convs);
});

app.post('/api/conversations', authMiddleware, async (req, res) => {
  const conv = await db.conversations.insert({
    _id: uuidv4(), user_id: req.user.id,
    title: req.body.title || 'New Conversation',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  res.status(201).json(conv);
});

app.delete('/api/conversations/:id', authMiddleware, async (req, res) => {
  const conv = await db.conversations.findOne({ _id: req.params.id, user_id: req.user.id });
  if (!conv) return res.status(404).json({ error: 'Not found' });
  await db.conversations.remove({ _id: req.params.id });
  await db.messages.remove({ conversation_id: req.params.id }, { multi: true });
  res.json({ success: true });
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  const conv = await db.conversations.findOne({ _id: req.params.id, user_id: req.user.id });
  if (!conv) return res.status(404).json({ error: 'Not found' });
  const msgs = await db.messages.find({ conversation_id: req.params.id }).sort({ created_at: 1 });
  res.json(msgs);
});

// ── Chat (Streaming) ──
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { conversation_id, message } = req.body;
    if (!conversation_id || !message) return res.status(400).json({ error: 'ID and message required' });

    const conv = await db.conversations.findOne({ _id: conversation_id, user_id: req.user.id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    await db.messages.insert({
      _id: uuidv4(), conversation_id, role: 'user',
      content: message, created_at: new Date().toISOString()
    });

    const allMsgs = await db.messages.find({ conversation_id }).sort({ created_at: 1 });
    
    // Update Title if it's the first message
    if (allMsgs.length === 1) {
      const title = message.length > 50 ? message.slice(0, 47) + '...' : message;
      await db.conversations.update({ _id: conversation_id }, { $set: { title, updated_at: new Date().toISOString() } });
    }

    const user = await db.users.findOne({ _id: req.user.id });
    const sysPrompt = SRM_SYSTEM_PROMPT + `\n\nStudent: ${user.name}, Dept: ${user.department}, Year: ${user.year}`;
    const history = allMsgs.map(m => ({ role: m.role, content: m.content }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.stream({
      model: 'claude-3-sonnet-20240229', // Updated to a current valid model string
      max_tokens: 1024,
      system: sysPrompt,
      messages: history
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullResponse += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ type: 'delta', text: chunk.delta.text })}\n\n`);
      }
    }

    const asstId = uuidv4();
    await db.messages.insert({
      _id: asstId, conversation_id, role: 'assistant',
      content: fullResponse, created_at: new Date().toISOString()
    });

    res.write(`data: ${JSON.stringify({ type: 'done', message_id: asstId })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

// ── FAQs & Feedback ──
app.get('/api/faqs', async (req, res) => {
  const { category } = req.query;
  const query = category ? { category } : {};
  const faqs = await db.faqs.find(query).sort({ helpful_count: -1 });
  res.json(faqs);
});

app.post('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const { message_id, rating, comment } = req.body;
    await db.feedback.insert({
      _id: uuidv4(), message_id, user_id: req.user.id,
      rating, comment: comment || '', created_at: new Date().toISOString()
    });
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`Backend Running: http://localhost:${PORT}`);
});
