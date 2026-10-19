const Ledger = require('../models/Ledger');

const getLedger = async (req, res) => {
  try {
    const { startDate, endDate, type, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); query.date.$lte = end; }
    }
    const total = await Ledger.countDocuments(query);
    const entries = await Ledger.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Summary
    const summary = await Ledger.aggregate([
      { $match: query },
      { $group: { _id: null, totalCredit: { $sum: '$credit' }, totalDebit: { $sum: '$debit' } } }
    ]);

    res.json({
      success: true,
      data: entries,
      total,
      summary: summary[0] || { totalCredit: 0, totalDebit: 0 },
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createLedgerEntry = async (req, res) => {
  try {
    const entry = await Ledger.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: entry });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReports = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    const Transaction = require('../models/Transaction');

    // Monthly report
    const monthlyData = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed', createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59`) } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, sales: { $sum: '$totalAmount' }, transactions: { $sum: 1 }, tax: { $sum: '$taxAmount' }, discount: { $sum: '$discountAmount' } } },
      { $sort: { '_id.month': 1 } }
    ]);

    const returnData = await Transaction.aggregate([
      { $match: { type: 'return', status: 'completed', createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59`) } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, returns: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const report = months.map((month, idx) => {
      const mData = monthlyData.find(d => d._id.month === idx + 1) || { sales: 0, transactions: 0, tax: 0, discount: 0 };
      const rData = returnData.find(d => d._id.month === idx + 1) || { returns: 0, count: 0 };
      return { month, sales: mData.sales, transactions: mData.transactions, tax: mData.tax, discount: mData.discount, returns: rData.returns, returnCount: rData.count, net: mData.sales - rData.returns };
    });

    // Payment method breakdown
    const paymentBreakdown = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed', createdAt: { $gte: new Date(`${year}-01-01`) } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    // Top categories
    const topCategories = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed' } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$category._id', name: { $first: '$category.name' }, revenue: { $sum: '$items.total' }, quantity: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    res.json({ success: true, data: { monthlyReport: report, paymentBreakdown, topCategories } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getLedger, createLedgerEntry, getReports };
