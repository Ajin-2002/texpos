const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateSupplierBalance = async (req, res) => {
  try {
    const { amount, type, note } = req.body; // type: 'add' or 'subtract'
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    supplier.balance += type === 'add' ? amount : -amount;
    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, updateSupplierBalance };
