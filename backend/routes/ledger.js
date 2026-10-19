const express = require('express');
const router = express.Router();
const { getLedger, createLedgerEntry, getReports } = require('../controllers/ledgerController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/reports', getReports);
router.get('/', getLedger);
router.post('/', createLedgerEntry);

module.exports = router;
