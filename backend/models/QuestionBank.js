const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'subjective'], default: 'mcq' },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctOptionIndex: { type: Number, default: -1 },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  explanation: { type: String },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
}, { timestamps: true });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
