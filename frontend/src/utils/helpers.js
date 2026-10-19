// Format currency in Indian Rupees
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
};

// Format date
export const formatDate = (date, format = 'short') => {
  if (!date) return '—';
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (format === 'long') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  if (format === 'datetime') return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (format === 'time') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN');
};

// Format number with commas
export const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

// Get initials
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// Stock status
export const getStockStatus = (stock, minStock) => {
  if (stock <= 0) return { label: 'Out of Stock', class: 'badge-danger' };
  if (stock <= minStock) return { label: 'Low Stock', class: 'badge-warning' };
  return { label: 'In Stock', class: 'badge-success' };
};

// Payment method label
export const paymentLabel = (method) => {
  const map = { cash: 'Cash', card: 'Card', upi: 'UPI', mixed: 'Mixed', credit: 'Credit' };
  return map[method] || method;
};

// Debounce
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

// Today's date range
export const getTodayRange = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
};

// Generate a random color for charts
export const chartColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#84cc16'];
