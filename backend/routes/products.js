const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock,
  getCategories, createCategory, updateCategory, deleteCategory
} = require('../controllers/productController');
const { protect, adminOnly, staffOrAdmin } = require('../middleware/auth');

// Categories
router.get('/categories', protect, getCategories);
router.post('/categories', protect, adminOnly, createCategory);
router.put('/categories/:id', protect, adminOnly, updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

// Products
router.get('/', protect, getProducts);
router.post('/', protect, adminOnly, createProduct);
router.get('/:id', protect, getProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.patch('/:id/stock', protect, adminOnly, adjustStock);

module.exports = router;
