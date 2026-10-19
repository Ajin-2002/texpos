const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense', 'purchase', 'sale', 'return', 'adjustment'], required: true },
  category: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  reference: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String, enum: ['Transaction', 'Supplier'] },
  referenceNumber: { type: String },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
