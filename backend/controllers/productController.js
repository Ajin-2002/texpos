const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc Get all products
const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock, isActive, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = category;
    if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$minStock'] };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category supplier');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Create product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await product.populate('category supplier');
    res.status(201).json({ success: true, data: product });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('category supplier');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc Adjust stock
const adjustStock = async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.stock = Math.max(0, product.stock + adjustment);
    await product.save();
    res.json({ success: true, data: product, message: `Stock adjusted by ${adjustment}` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Category CRUD
const getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: cats });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createCategory = async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock, getCategories, createCategory, updateCategory, deleteCategory };
