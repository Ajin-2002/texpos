const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

module.exports = router;
