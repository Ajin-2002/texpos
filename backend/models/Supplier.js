const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  gstNumber: { type: String },
  isActive: { type: Boolean, default: true },
  balance: { type: Number, default: 0 }, // positive = we owe them, negative = they owe us
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
