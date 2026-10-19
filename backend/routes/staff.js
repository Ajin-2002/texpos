const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateStaff, toggleStaffStatus, deleteStaff } = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.patch('/:id/toggle', toggleStaffStatus);
router.delete('/:id', deleteStaff);

module.exports = router;
