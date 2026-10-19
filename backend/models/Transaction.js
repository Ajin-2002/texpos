const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'pcs' },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const transactionSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true },
  type: { type: String, enum: ['sale', 'return'], default: 'sale' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String },
  items: [transactionItemSchema],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'mixed', 'credit'], default: 'cash' },
  paymentConfirmed: { type: Boolean, default: false },
  paymentReference: { type: String, default: '' },
  paymentDetails: {
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['completed', 'pending', 'cancelled', 'partially_returned', 'returned'], default: 'completed' },
  notes: { type: String },
  originalTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }, // for returns
  returnReason: { type: String },
}, { timestamps: true });

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ customer: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
