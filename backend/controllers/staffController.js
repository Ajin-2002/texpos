const User = require('../models/User');

// @desc Get all staff
const getStaff = async (req, res) => {
  try {
    const users = await User.find({ role: 'staff' }).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Create staff
const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, address, salary } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password, phone, address, salary, role: 'staff' });
    res.status(201).json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Update staff
const updateStaff = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (password) { user.password = password; await user.save(); }
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Toggle staff status
const toggleStaffStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: `Staff ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Delete staff
const deleteStaff = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff deleted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getStaff, createStaff, updateStaff, toggleStaffStatus, deleteStaff };
