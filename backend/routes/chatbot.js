const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OrgHomepage = require('../models/OrgHomepage');
const Course = require('../models/Course');
const Partner = require('../models/Partner');

const router = express.Router();

const SYSTEM_PROMPT = `You are a helpful AI assistant for an educational institute CRM system. Your role is to help visitors with:
- Course information and details
- Admission process and requirements
- Fee structure and payment options
- Institute locations and partner centers
- Certificate and examination queries
- General inquiries about the organization

Guidelines:
- Be friendly, concise, and helpful
- Answer in the same language the user is using (Hindi, English, or Hinglish)
- If you don't know something specific, guide the user to contact the institute
- Keep responses short and to the point
- Use bullet points for lists
- Do not make up information - use only the context provided
- If asked about specific fees or course details, use the provided course/institute data`;

async function getContext() {
  let context = '';
  try {
    const org = await OrgHomepage.findOne().lean();
    if (org) {
      const orgName = org.settings?.orgName || 'the institute';
      const orgDesc = org.settings?.orgDescription || '';
      const orgPhone = org.settings?.contactPhone || '';
      const orgEmail = org.settings?.contactEmail || '';
      const orgAddress = org.settings?.address || '';
      context += `Organization: ${orgName}\nDescription: ${orgDesc}\nContact: ${orgPhone}, ${orgEmail}\nAddress: ${orgAddress}\n\n`;
    }

    const courses = await Course.find({ isActive: true }).select('name description fee duration category').limit(20).lean();
    if (courses.length > 0) {
      context += 'Available Courses:\n';
      courses.forEach(c => {
        context += `- ${c.name}${c.category ? ` (${c.category})` : ''}${c.fee ? ` | Fee: Rs.${c.fee}` : ''}${c.duration ? ` | Duration: ${c.duration}` : ''}\n`;
      });
      context += '\n';
    }

    const partners = await Partner.find({ status: 'active' }).select('instituteName city state address phone email').limit(10).lean();
    if (partners.length > 0) {
      context += 'Partner Centers:\n';
      partners.forEach(p => {
        context += `- ${p.instituteName}, ${p.city || ''}, ${p.state || ''}${p.phone ? ` | Phone: ${p.phone}` : ''}\n`;
      });
    }
  } catch (e) {
    console.error('[Chatbot Context Error]', e.message);
  }
  return context;
}

router.post('/message', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Chatbot is not configured. GEMINI_API_KEY missing.' });
    }

    const context = await getContext();
    const fullPrompt = `${SYSTEM_PROMPT}\n\n--- Institute Context ---\n${context || 'No specific institute data available.'}\n--- End Context ---\n\nUser: ${message}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: fullPrompt }] },
        { role: 'model', parts: [{ text: 'I understand. I will help visitors with their queries using the provided institute context.' }] },
        ...((history || []).slice(-10).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        }))),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({ success: true, reply: response });
  } catch (error) {
    console.error('[Chatbot Error]', error.message);
    res.status(500).json({ success: false, message: 'Sorry, I could not process your message. Please try again.' });
  }
});

module.exports = router;
