const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');

// Generate invoice number
const generateInvoiceNumber = async () => {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const lastInvoice = await Transaction.findOne({ invoiceNumber: { $regex: `^${prefix}` } }).sort({ createdAt: -1 });
  const seq = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-').pop()) + 1 : 1;
  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

// @desc Create sale transaction
const createTransaction = async (req, res) => {
  try {
    const { items, customer, customerName, customerPhone, paymentMethod, paymentDetails, amountPaid, notes, discountAmount = 0 } = req.body;

    // Validate and process items
    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

      const discountedPrice = item.unitPrice * (1 - (item.discountPercent || product.discountPercent) / 100);
      const itemTax = discountedPrice * item.quantity * ((item.taxPercent || product.taxPercent) / 100);
      const itemTotal = discountedPrice * item.quantity + itemTax;

      subtotal += discountedPrice * item.quantity;
      taxAmount += itemTax;

      processedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || product.discountPercent,
        taxPercent: item.taxPercent || product.taxPercent,
        taxAmount: itemTax,
        total: itemTotal,
      });

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const totalAmount = subtotal + taxAmount - discountAmount;
    const changeAmount = amountPaid - totalAmount;
    const invoiceNumber = await generateInvoiceNumber();

    // Update customer if provided
    let customerId = null;
    if (customer) {
      customerId = customer;
      await Customer.findByIdAndUpdate(customer, { $inc: { totalPurchases: totalAmount, loyaltyPoints: Math.floor(totalAmount / 100) } });
    }

    const transaction = await Transaction.create({
      invoiceNumber,
      type: 'sale',
      customer: customerId,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      staff: req.user._id,
      staffName: req.user.name,
      items: processedItems,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      amountPaid,
      changeAmount: Math.max(0, changeAmount),
      paymentMethod,
      paymentDetails: paymentDetails || {},
      notes,
      status: 'completed',
    });

    // Create ledger entry
    await Ledger.create({
      type: 'sale',
      description: `Sale Invoice ${invoiceNumber}`,
      amount: totalAmount,
      credit: totalAmount,
      reference: transaction._id,
      referenceModel: 'Transaction',
      referenceNumber: invoiceNumber,
      createdBy: req.user._id,
    });

    await transaction.populate('staff', 'name email');
    res.status(201).json({ success: true, data: transaction });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
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
  try {
    const { originalTransactionId, items, returnReason } = req.body;
    const original = await Transaction.findById(originalTransactionId);
    if (!original) return res.status(404).json({ success: false, message: 'Original transaction not found' });

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const origItem = original.items.find(i => i.product.toString() === item.product);
      if (!origItem) return res.status(400).json({ success: false, message: 'Item not in original transaction' });
      if (item.quantity > origItem.quantity) return res.status(400).json({ success: false, message: 'Return quantity exceeds sold quantity' });

      const itemTotal = (origItem.total / origItem.quantity) * item.quantity;
      subtotal += itemTotal;
      processedItems.push({ ...origItem.toObject(), quantity: item.quantity, total: itemTotal });

      // Restore stock
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const returnTransaction = await Transaction.create({
      invoiceNumber,
      type: 'return',
      customer: original.customer,
      customerName: original.customerName,
      customerPhone: original.customerPhone,
      staff: req.user._id,
      staffName: req.user.name,
      items: processedItems,
      subtotal,
      totalAmount: subtotal,
      amountPaid: subtotal,
      paymentMethod: original.paymentMethod,
      status: 'completed',
      originalTransaction: originalTransactionId,
      returnReason,
    });

    // Update original transaction status
    original.status = 'returned';
    await original.save();

    // Create ledger entry
    await Ledger.create({
      type: 'return',
      description: `Return for Invoice ${original.invoiceNumber}`,
      amount: subtotal,
      debit: subtotal,
      reference: returnTransaction._id,
      referenceModel: 'Transaction',
      referenceNumber: invoiceNumber,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: returnTransaction });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
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
