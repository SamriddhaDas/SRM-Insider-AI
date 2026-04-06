import "dotenv/config";
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { db, seedFaqs } from './db.js';
import { signToken, authMiddleware } from './auth.js';
import { SRM_SYSTEM_PROMPT } from './prompt.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Check API key early
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('\n⚠️  WARNING: ANTHROPIC_API_KEY is not set!');
  console.warn('   Chat will fail. Set it with:');
  console.warn('   export ANTHROPIC_API_KEY=sk-ant-...\n');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' });

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

seedFaqs().catch(console.error);

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SRM Insider AI',
    version: '1.0.0',
    api_key_set: !!process.env.ANTHROPIC_API_KEY
  });
});

// ── Auth ──
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

// ── Chat (streaming SSE) ──
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { conversation_id, message } = req.body;
    if (!conversation_id || !message) return res.status(400).json({ error: 'conversation_id and message required' });

    const conv = await db.conversations.findOne({ _id: conversation_id, user_id: req.user.id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    await db.messages.insert({
      _id: uuidv4(), conversation_id, role: 'user',
      content: message, created_at: new Date().toISOString()
    });

    const allMsgs = await db.messages.find({ conversation_id }).sort({ created_at: 1 });
    if (allMsgs.length === 1) {
      const title = message.length > 50 ? message.slice(0, 47) + '...' : message;
      await db.conversations.update({ _id: conversation_id }, { $set: { title, updated_at: new Date().toISOString() } });
    } else {
      await db.conversations.update({ _id: conversation_id }, { $set: { updated_at: new Date().toISOString() } });
    }

    const user = await db.users.findOne({ _id: req.user.id });
    const sysPrompt = SRM_SYSTEM_PROMPT +
      `\n\nStudent context — Name: ${user.name}, Department: ${user.department || 'CSE'}, Year: ${user.year || 1}, Reg No: ${user.reg_number || 'N/A'}`;
    const history = allMsgs.map(m => ({ role: m.role, content: m.content }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
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
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
});

// ── FAQs ──
app.get('/api/faqs', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const faqs = await db.faqs.find(query).sort({ helpful_count: -1 });
    res.json(faqs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/faqs/categories', async (req, res) => {
  try {
    const faqs = await db.faqs.find({});
    const cats = [...new Set(faqs.map(f => f.category))].sort();
    res.json(cats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Feedback ──
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

// ── Stats ──
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const convCount = await db.conversations.count({ user_id: req.user.id });
    const convs = await db.conversations.find({ user_id: req.user.id });
    let msgCount = 0;
    for (const c of convs) {
      msgCount += await db.messages.count({ conversation_id: c._id, role: 'user' });
    }
    const faqCount = await db.faqs.count({});
    res.json({ conversations: convCount, messages_sent: msgCount, faqs_available: faqCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Serve React frontend (production) ──
const FRONTEND_DIST = join(__dirname, '..', 'frontend', 'dist');
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(join(FRONTEND_DIST, 'index.html'));
  });
  console.log('  Static frontend: serving from frontend/dist');
} else {
  console.log('  Static frontend: not found (run build step first)');
}

// ── Start ──
app.listen(PORT, () => {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       SRM Insider AI — Unified Server    │');
  console.log('└─────────────────────────────────────────┘');
  console.log(`\n  App running at:  http://localhost:${PORT}`);
  console.log(`  API health:      http://localhost:${PORT}/api/health`);
  console.log(`  API Key set:     ${process.env.ANTHROPIC_API_KEY ? '✅ Yes' : '❌ No — set ANTHROPIC_API_KEY'}`);
  console.log('\n  Ready for connections...\n');
});
