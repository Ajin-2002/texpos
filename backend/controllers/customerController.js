const Customer = require('../models/Customer');

const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const customers = await Customer.find(query).sort({ name: 1 }).limit(100);
    res.json({ success: true, data: customers });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getCustomers, createCustomer, updateCustomer };
