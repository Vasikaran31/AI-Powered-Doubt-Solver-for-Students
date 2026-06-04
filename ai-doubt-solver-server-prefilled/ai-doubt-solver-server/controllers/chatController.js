// ============================================
// controllers/chatController.js
// ============================================
// All routes are protected (req.user is set).
//
// getChats    GET  /api/chats
// getChatById GET  /api/chats/:id
// createChat  POST /api/chats
// deleteChat  DEL  /api/chats/:id
// getStats    GET  /api/chats/stats
// askText     POST /api/chats/:id/text
// askImage    POST /api/chats/:id/image  (multipart)
// askVoice    POST /api/chats/:id/voice  (multipart)
// ============================================

const { groq } = require('../config/gemini');
const Chat     = require('../models/Chat');
const User     = require('../models/User');
const path     = require('path');
const fs       = require('fs');

// ── Helper: detect subject from text ──────────────────────────
const SUBJECT_KEYWORDS = {
  Mathematics:      ['math', 'algebra', 'calculus', 'geometry', 'equation', 'integral', 'derivative', 'trigonometry', 'polynomial'],
  Physics:          ['physics', 'force', 'velocity', 'acceleration', 'newton', 'energy', 'momentum', 'thermodynamics', 'optics'],
  Chemistry:        ['chemistry', 'element', 'compound', 'reaction', 'molecule', 'atom', 'periodic', 'bond', 'acid', 'base'],
  Biology:          ['biology', 'cell', 'dna', 'evolution', 'photosynthesis', 'organism', 'genetics', 'protein', 'enzyme'],
  History:          ['history', 'war', 'empire', 'revolution', 'civilization', 'ancient', 'medieval', 'century'],
  Geography:        ['geography', 'continent', 'ocean', 'climate', 'latitude', 'longitude', 'map', 'country'],
  English:          ['grammar', 'literature', 'essay', 'poem', 'shakespeare', 'metaphor', 'verb', 'noun'],
  'Computer Science':['programming', 'algorithm', 'code', 'software', 'computer', 'data structure', 'function', 'loop', 'array'],
  Economics:        ['economics', 'supply', 'demand', 'market', 'gdp', 'inflation', 'trade', 'fiscal'],
};

const detectSubject = (text) => {
  const lower = text.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return subject;
  }
  return 'General';
};

// ── Shared: build user + assistant messages and save ──────────
const saveMessages = async (chat, userContent, assistantContent, inputType, extras = {}) => {
  chat.messages.push({
    role: 'user',
    content: userContent,
    inputType,
    imageUrl:   extras.imageUrl   || null,
    voiceUrl:   extras.voiceUrl   || null,
    transcript: extras.transcript || null,
  });
  chat.messages.push({
    role: 'assistant',
    content: assistantContent,
    inputType: 'text',
  });
  await chat.save();

  // Increment user's totalDoubts counter
  await User.findByIdAndUpdate(chat.user, { $inc: { totalDoubts: 1 } });
};

// ============================================================
// getChats — GET /api/chats
// ============================================================
const getChats = async (req, res) => {
  const chats = await Chat.find({ user: req.user._id, isArchived: false })
    .select('title subject lastActivity messages createdAt')
    .sort({ lastActivity: -1 });

  const chatSummaries = chats.map(chat => ({
    _id:          chat._id,
    title:        chat.title,
    subject:      chat.subject,
    lastActivity: chat.lastActivity,
    messageCount: chat.messages.length,
    lastMessage:  chat.messages.length > 0
      ? chat.messages[chat.messages.length - 1].content.substring(0, 100)
      : '',
    createdAt: chat.createdAt,
  }));

  res.json({ success: true, chats: chatSummaries });
};

// ============================================================
// getChatById — GET /api/chats/:id
// ============================================================
const getChatById = async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }
  res.json({ success: true, chat });
};

// ============================================================
// createChat — POST /api/chats
// ============================================================
const createChat = async (req, res) => {
  const { subject } = req.body;
  const chat = await Chat.create({ user: req.user._id, subject: subject || 'General' });
  res.status(201).json({ success: true, chat });
};

// ============================================================
// deleteChat — DELETE /api/chats/:id
// ============================================================
const deleteChat = async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }
  res.json({ success: true, message: 'Chat deleted successfully' });
};

// ============================================================
// getStats — GET /api/chats/stats
// ============================================================
const getStats = async (req, res) => {
  const chats = await Chat.find({ user: req.user._id, isArchived: false });
  const subjectCounts = {};
  let totalMessages   = 0;

  chats.forEach(chat => {
    subjectCounts[chat.subject] = (subjectCounts[chat.subject] || 0) + 1;
    totalMessages += chat.messages.filter(m => m.role === 'user').length;
  });

  res.json({
    success: true,
    stats: {
      totalChats:       chats.length,
      totalDoubts:      totalMessages,
      subjectBreakdown: subjectCounts,
    },
  });
};

// ============================================================
// askText — POST /api/chats/:id/text
// Body: { question, subject }
// ============================================================
const askText = async (req, res) => {
  const { question, subject } = req.body;

  if (!question || question.trim() === '') {
    return res.status(400).json({ success: false, message: 'A question is required' });
  }

  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  // Detect subject if not provided
  const detectedSubject = subject && subject !== 'General'
    ? subject
    : detectSubject(question);

  // Build contextual messages for multi-turn conversation
  const conversationHistory = chat.messages.slice(-10).map(m => ({
    role:    m.role,
    content: m.content,
  }));

  const systemPrompt = `You are an expert academic tutor helping students from Grade 8 to College. 
You provide clear, step-by-step explanations tailored to the student's level.
Subject context: ${detectedSubject}.
Use markdown formatting for better readability (headings, bullet points, code blocks for formulas).
Be encouraging and patient. If there are multiple steps, number them clearly.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: question },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const aiAnswer = response.choices[0].message.content;

  // Update chat subject if it was General and we detected something
  if (chat.subject === 'General' && detectedSubject !== 'General') {
    chat.subject = detectedSubject;
  }

  await saveMessages(chat, question, aiAnswer, 'text');

  // Return the two new messages (last two after save)
  const msgs = chat.messages;
  res.json({
    success:          true,
    userMessage:      msgs[msgs.length - 2],
    assistantMessage: msgs[msgs.length - 1],
    subject:          chat.subject,
  });
};

// ============================================================
// askImage — POST /api/chats/:id/image
// Multipart: { image (file), question?, subject? }
// ============================================================
const askImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }

  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  const question = req.body.question || '';
  const subject  = req.body.subject  || 'General';

  // Convert image buffer to base64 for the vision API
  const base64Image = req.file.buffer.toString('base64');
  const mimeType    = req.file.mimetype;

  const textContent = question
    ? `Please analyze this image and answer the following question: ${question}\n\nProvide a detailed, step-by-step explanation suitable for a student.`
    : 'Please analyze this image carefully. If it contains a question, problem, or diagram, provide a detailed step-by-step explanation. Use markdown formatting for clarity.';

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{
      role: 'user',
      content: [
        {
          type:      'image_url',
          image_url: { url: `data:${mimeType};base64,${base64Image}` },
        },
        {
          type: 'text',
          text: textContent,
        },
      ],
    }],
    max_tokens: 2000,
  });

  const aiAnswer        = response.choices[0].message.content;
  const userContent     = question || 'Analyzing image...';
  const detectedSubject = detectSubject(aiAnswer);

  if (chat.subject === 'General' && detectedSubject !== 'General') {
    chat.subject = detectedSubject;
  }

  // Store base64 as data URL for frontend display
  const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

  await saveMessages(chat, userContent, aiAnswer, 'image', { imageUrl: imageDataUrl });

  const msgs = chat.messages;
  res.json({
    success:          true,
    userMessage:      msgs[msgs.length - 2],
    assistantMessage: msgs[msgs.length - 1],
    subject:          chat.subject,
  });
};

// ============================================================
// askVoice — POST /api/chats/:id/voice
// Multipart: { audio (file), subject? }
// ============================================================
const askVoice = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No audio file uploaded' });
  }

  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  const subject = req.body.subject || 'General';

  // ── Step 1: Transcribe via AssemblyAI ───────────────────────
  let transcript = '';

  try {
    const { AssemblyAI } = require('assemblyai');
    const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

    // Upload audio buffer to AssemblyAI
    const uploadResponse = await client.files.upload(req.file.buffer, {
      contentType: req.file.mimetype || 'audio/webm',
    });

    // Transcribe
    const transcription = await client.transcripts.transcribe({
      audio_url: uploadResponse.upload_url,
    });

    if (transcription.status === 'error') {
      throw new Error(transcription.error || 'Transcription failed');
    }

    transcript = transcription.text || '';
  } catch (transcribeError) {
    console.error('AssemblyAI transcription error:', transcribeError.message);
    return res.status(500).json({
      success: false,
      message: 'Voice transcription failed. Please check your ASSEMBLYAI_API_KEY or try again.',
    });
  }

  if (!transcript.trim()) {
    return res.status(400).json({ success: false, message: 'Could not transcribe audio. Please speak clearly and try again.' });
  }

  // ── Step 2: Ask Groq with the transcript ────────────────────
  const detectedSubject = detectSubject(transcript);
  const effectiveSubject = subject !== 'General' ? subject : detectedSubject;

  const systemPrompt = `You are an expert academic tutor helping students. 
The student asked this question verbally: "${transcript}"
Subject context: ${effectiveSubject}.
Provide a clear, step-by-step explanation using markdown formatting.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: transcript },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const aiAnswer = response.choices[0].message.content;

  if (chat.subject === 'General' && effectiveSubject !== 'General') {
    chat.subject = effectiveSubject;
  }

  await saveMessages(chat, transcript, aiAnswer, 'voice', { transcript });

  const msgs = chat.messages;
  res.json({
    success:          true,
    transcript,
    userMessage:      msgs[msgs.length - 2],
    assistantMessage: msgs[msgs.length - 1],
    subject:          chat.subject,
  });
};

module.exports = { getChats, getChatById, createChat, deleteChat, getStats, askText, askImage, askVoice };
