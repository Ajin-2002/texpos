const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getTransaction, processReturn, getDashboardStats } = require('../controllers/transactionController');
const { protect, adminOnly, staffOrAdmin } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.post('/return', protect, processReturn);
router.get('/', protect, getTransactions);
router.post('/', protect, createTransaction);
router.get('/:id', protect, getTransaction);

module.exports = router;
