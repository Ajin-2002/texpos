const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');
const mongoose = require('mongoose');

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Generate invoice number
const generateInvoiceNumber = async (session) => {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const lastInvoice = await Transaction.findOne({ invoiceNumber: { $regex: `^${prefix}` } })
    .sort({ createdAt: -1 })
    .session(session || null);
  const seq = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-').pop()) + 1 : 1;
  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

// @desc Create sale transaction
const createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      items, customer, customerName, customerPhone, paymentMethod,
      amountPaid, notes, discountAmount = 0, paymentConfirmed, paymentReference,
    } = req.body;
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Add at least one product');
    if (!['cash', 'card', 'upi'].includes(paymentMethod)) throw httpError(400, 'Invalid payment method');
    const orderDiscount = Number(discountAmount);
    if (!Number.isFinite(orderDiscount) || orderDiscount < 0) throw httpError(400, 'Invalid discount amount');
    if (orderDiscount > 0 && req.user.role !== 'admin') throw httpError(403, 'Only an admin can apply an order discount');
    if (paymentMethod !== 'cash' && (!paymentConfirmed || !String(paymentReference || '').trim())) {
      throw httpError(400, 'Confirm the external payment and enter its receipt reference');
    }

    let transaction;
    await session.withTransaction(async () => {
      let subtotal = 0;
      let taxAmount = 0;
      const processedItems = [];

      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!mongoose.isValidObjectId(item.product) || !Number.isFinite(quantity) || quantity <= 0) {
          throw httpError(400, 'Each item needs a valid product and positive quantity');
        }
        const product = await Product.findOneAndUpdate(
          { _id: item.product, isActive: true, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );
        if (!product) {
          const exists = await Product.exists({ _id: item.product }).session(session);
          if (!exists) throw httpError(404, 'A selected product no longer exists');
          throw httpError(400, 'A selected product is inactive or has insufficient stock');
        }

        const discountPercent = Number(product.discountPercent || 0);
        const taxPercent = Number(product.taxPercent || 0);
        if (discountPercent < 0 || discountPercent > 100 || taxPercent < 0) throw httpError(400, `Invalid pricing setup for ${product.name}`);
        const unitPrice = Number(product.sellingPrice);
        const discountedPrice = unitPrice * (1 - discountPercent / 100);
        const itemTax = discountedPrice * quantity * taxPercent / 100;
        const itemTotal = discountedPrice * quantity + itemTax;
        subtotal += discountedPrice * quantity;
        taxAmount += itemTax;
        processedItems.push({
          product: product._id, productName: product.name, sku: product.sku,
          quantity, unit: product.unit, unitPrice, discountPercent, taxPercent,
          taxAmount: itemTax, total: itemTotal,
        });
      }

      if (orderDiscount > subtotal + taxAmount) throw httpError(400, 'Discount cannot exceed the sale total');
      const totalAmount = Math.round((subtotal + taxAmount - orderDiscount) * 100) / 100;
      const received = paymentMethod === 'cash' ? Number(amountPaid) : totalAmount;
      if (!Number.isFinite(received) || received < totalAmount) throw httpError(400, 'Payment received is less than the total due');
      const invoiceNumber = await generateInvoiceNumber(session);
      if (customer) {
        const updatedCustomer = await Customer.findByIdAndUpdate(
          customer,
          { $inc: { totalPurchases: totalAmount, loyaltyPoints: Math.floor(totalAmount / 100) } },
          { session }
        );
        if (!updatedCustomer) throw httpError(400, 'Selected customer was not found');
      }

      [transaction] = await Transaction.create([{
        invoiceNumber, type: 'sale', customer: customer || null,
        customerName: customerName || 'Walk-in Customer', customerPhone,
        staff: req.user._id, staffName: req.user.name, items: processedItems,
        subtotal, discountAmount: orderDiscount, taxAmount, totalAmount,
        amountPaid: received, changeAmount: Math.max(0, received - totalAmount),
        paymentMethod,
        paymentDetails: { cash: paymentMethod === 'cash' ? received : 0, card: paymentMethod === 'card' ? totalAmount : 0, upi: paymentMethod === 'upi' ? totalAmount : 0 },
        paymentConfirmed: paymentMethod === 'cash' || Boolean(paymentConfirmed),
        paymentReference: paymentMethod === 'cash' ? '' : String(paymentReference).trim(),
        notes, status: 'completed',
      }], { session });

      await Ledger.create([{
        type: 'sale', description: `Sale Invoice ${invoiceNumber}`, amount: totalAmount,
        credit: totalAmount, reference: transaction._id, referenceModel: 'Transaction',
        referenceNumber: invoiceNumber, createdBy: req.user._id,
      }], { session });
    });

    await transaction.populate('staff', 'name email');
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  } finally { await session.endSession(); }
};

// @desc Get all transactions
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate, status, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
    ];
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); query.createdAt.$lte = end; }
    }
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('staff', 'name')
      .populate('customer', 'name phone')
      .populate('originalTransaction', 'invoiceNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Get single transaction
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('staff', 'name email phone')
      .populate('customer')
      .populate('items.product', 'name sku barcode');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: transaction });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Process return
const processReturn = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { originalTransactionId, items, returnReason } = req.body;
    if (!mongoose.isValidObjectId(originalTransactionId) || !Array.isArray(items) || !items.length) {
      throw httpError(400, 'Select a valid sale and at least one item to return');
    }
    let returnTransaction;
    await session.withTransaction(async () => {
      const original = await Transaction.findById(originalTransactionId).session(session);
      if (!original) throw httpError(404, 'Original transaction not found');
      if (original.type !== 'sale' || !['completed', 'partially_returned'].includes(original.status)) {
        throw httpError(400, 'This sale is not eligible for another return');
      }
      const priorReturns = await Transaction.find({ originalTransaction: original._id, type: 'return' }).session(session);
      const returnedByProduct = new Map();
      priorReturns.forEach((record) => record.items.forEach((item) => {
        const key = String(item.product);
        returnedByProduct.set(key, (returnedByProduct.get(key) || 0) + Number(item.quantity));
      }));

      const requested = new Map();
      for (const item of items) {
        const productId = String(item.product || '');
        const quantity = Number(item.quantity);
        if (!mongoose.isValidObjectId(productId) || !Number.isFinite(quantity) || quantity <= 0 || requested.has(productId)) {
          throw httpError(400, 'Return items must have unique products and positive quantities');
        }
        requested.set(productId, quantity);
      }

      let subtotal = 0;
      let discountAmount = 0;
      const processedItems = [];
      const originalGross = original.items.reduce((sum, item) => sum + Number(item.total || 0), 0);
      for (const [productId, quantity] of requested) {
        const origItem = original.items.find((item) => String(item.product) === productId);
        if (!origItem) throw httpError(400, 'Item not in original transaction');
        const remaining = Number(origItem.quantity) - (returnedByProduct.get(productId) || 0);
        if (quantity > remaining) throw httpError(400, `Only ${remaining} of this item remain eligible for return`);
        const ratio = quantity / Number(origItem.quantity);
        const itemTotal = Math.round(Number(origItem.total) * ratio * 100) / 100;
        subtotal += itemTotal;
        if (originalGross > 0) discountAmount += Number(original.discountAmount || 0) * (itemTotal / originalGross);
        processedItems.push({
          ...origItem.toObject(), quantity, total: itemTotal,
          taxAmount: Math.round(Number(origItem.taxAmount || 0) * ratio * 100) / 100,
        });
        const restored = await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }, { session });
        if (!restored) throw httpError(409, 'A returned product no longer exists; restore inventory before completing this return');
      }

      subtotal = Math.round(subtotal * 100) / 100;
      discountAmount = Math.round(discountAmount * 100) / 100;
      const refundAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
      const invoiceNumber = await generateInvoiceNumber(session);
      [returnTransaction] = await Transaction.create([{
        invoiceNumber, type: 'return', customer: original.customer,
        customerName: original.customerName, customerPhone: original.customerPhone,
        staff: req.user._id, staffName: req.user.name, items: processedItems,
        subtotal, discountAmount, totalAmount: refundAmount, amountPaid: refundAmount,
        paymentMethod: original.paymentMethod, status: 'completed',
        originalTransaction: original._id, returnReason,
      }], { session });

      const nowReturned = new Map(returnedByProduct);
      requested.forEach((quantity, productId) => nowReturned.set(productId, (nowReturned.get(productId) || 0) + quantity));
      const allReturned = original.items.every((item) => (nowReturned.get(String(item.product)) || 0) >= Number(item.quantity));
      original.status = allReturned ? 'returned' : 'partially_returned';
      await original.save({ session });

      await Ledger.create([{
        type: 'return', description: `Return for Invoice ${original.invoiceNumber}`,
        amount: refundAmount, debit: refundAmount, reference: returnTransaction._id,
        referenceModel: 'Transaction', referenceNumber: invoiceNumber, createdBy: req.user._id,
      }], { session });
    });

    res.status(201).json({ success: true, data: returnTransaction });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  } finally { await session.endSession(); }
};

// @desc Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [todaySales, monthSales, yearSales, totalTransactions] = await Promise.all([
      Transaction.aggregate([{ $match: { type: 'sale', status: 'completed', createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $match: { type: 'sale', status: 'completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $match: { type: 'sale', status: 'completed', createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Transaction.countDocuments({ type: 'sale', status: 'completed' }),
    ]);

    // Last 7 days sales
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const sales = await Transaction.aggregate([{ $match: { type: 'sale', status: 'completed', createdAt: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]);
      last7Days.push({ date: start.toISOString().split('T')[0], total: sales[0]?.total || 0, count: sales[0]?.count || 0 });
    }

    // Low stock products
    const Product = require('../models/Product');
    const lowStockProducts = await Product.find({ $expr: { $lte: ['$stock', '$minStock'] }, isActive: true }).select('name stock minStock sku').limit(5);

    // Top products
    const topProducts = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const Product2 = require('../models/Product');
    const totalProducts = await Product2.countDocuments({ isActive: true });
    const User = require('../models/User');
    const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });

    res.json({
      success: true,
      data: {
        todaySales: { total: todaySales[0]?.total || 0, count: todaySales[0]?.count || 0 },
        monthSales: { total: monthSales[0]?.total || 0, count: monthSales[0]?.count || 0 },
        yearSales: { total: yearSales[0]?.total || 0, count: yearSales[0]?.count || 0 },
        totalTransactions,
        last7Days,
        lowStockProducts,
        topProducts,
        totalProducts,
        totalStaff,
      }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { createTransaction, getTransactions, getTransaction, processReturn, getDashboardStats };
