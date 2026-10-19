const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String, unique: true, sparse: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  description: { type: String },
  // Pricing
  costPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  // Stock
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  unit: { type: String, default: 'pcs', enum: ['pcs', 'meter', 'kg', 'liter', 'yard', 'roll'] },
  // Textile specific
  fabric: { type: String },
  color: { type: String },
  size: { type: String },
  isActive: { type: Boolean, default: true },
  image: { type: String, default: '' },
}, { timestamps: true });

productSchema.virtual('finalPrice').get(function () {
  const discounted = this.sellingPrice * (1 - this.discountPercent / 100);
  return parseFloat(discounted.toFixed(2));
});

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);
