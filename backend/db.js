import Datastore from 'nedb-promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const dbPath = (name) => join(__dir, `data_${name}.db`);

export const db = {
  users: Datastore.create({ filename: dbPath('users'), autoload: true }),
  conversations: Datastore.create({ filename: dbPath('conversations'), autoload: true }),
  messages: Datastore.create({ filename: dbPath('messages'), autoload: true }),
  faqs: Datastore.create({ filename: dbPath('faqs'), autoload: true }),
  feedback: Datastore.create({ filename: dbPath('feedback'), autoload: true }),
};

export async function seedFaqs() {
  const count = await db.faqs.count({});
  if (count > 0) return;
  const faqs = [
    { category: 'Registration', question: 'How do I register on SRM Insider?', answer: 'Visit insider.srmist.edu.in, click "New Student Registration", enter your SRM registration number, official SRM email, set a password, and verify via OTP sent to your email.' },
    { category: 'Submission', question: 'What is the file format for project submission?', answer: 'All documents must be PDF (max 10MB). Naming: REG_NUMBER_PROJECTTITLE_SEM.pdf. PDF must NOT be password protected.' },
    { category: 'Deadlines', question: 'When are the submission deadlines?', answer: 'Mid-sem: Week 8, End-sem: Week 15. FYP Phase 1 (Synopsis): November/April. FYP Phase 2 (Report): March/October. Check portal for exact dates.' },
    { category: 'Plagiarism', question: 'What is the plagiarism threshold?', answer: 'Turnitin/Unicheck is used. Similarity must be < 20% overall and < 5% from single source. Above 20% = auto-rejected. Use "Pre-Check" feature before final submission.' },
    { category: 'Status', question: 'How do I check my submission status?', answer: 'Login → Dashboard → My Submissions. Status: Draft, Submitted, Under Review, Approved, Revision Requested, or Rejected. Check email notifications for updates.' },
    { category: 'Resubmission', question: 'Can I resubmit after rejection?', answer: 'Yes. Download feedback PDF, make corrections, resubmit within 5 working days. Maximum 3 resubmission attempts per submission cycle.' },
    { category: 'Format', question: 'What formatting standard should I follow?', answer: 'B.Tech: IEEE format, 12pt Times New Roman. Reports: A4, TNR 12pt, 1.5 spacing, 1-inch margins. Min pages: FYP≥80, Mini-Project≥30, Internship≥25.' },
    { category: 'Technical', question: 'Getting file too large error?', answer: 'Compress PDF using SmallPDF or iLovePDF. Ensure images are 150-200 DPI. Remove embedded fonts if possible to stay under 10MB limit.' },
  ];
  for (const faq of faqs) {
    await db.faqs.insert({ ...faq, helpful_count: 0, created_at: new Date().toISOString() });
  }
  console.log('FAQs seeded');
}
