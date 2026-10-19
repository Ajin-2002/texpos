import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discount: 0,

  addItem: (product) => {
    const items = get().items;
    const existing = items.find(i => i.product === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) return { success: false, message: 'Insufficient stock' };
      set({ items: items.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      if (product.stock <= 0) return { success: false, message: 'Out of stock' };
      const discountedPrice = product.sellingPrice * (1 - (product.discountPercent || 0) / 100);
      set({ items: [...items, {
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        maxStock: product.stock,
        unitPrice: product.sellingPrice,
        discountPercent: product.discountPercent || 0,
        taxPercent: product.taxPercent || 0,
        finalPrice: discountedPrice,
        unit: product.unit,
      }]});
    }
    return { success: true };
  },

  removeItem: (productId) => set({ items: get().items.filter(i => i.product !== productId) }),

  updateQuantity: (productId, qty) => {
    const items = get().items;
    const item = items.find(i => i.product === productId);
    if (!item) return;
    if (qty <= 0) { set({ items: items.filter(i => i.product !== productId) }); return; }
    if (qty > item.maxStock) return;
    set({ items: items.map(i => i.product === productId ? { ...i, quantity: qty } : i) });
  },

  updateDiscount: (productId, discountPercent) => {
    set({ items: get().items.map(i => {
      if (i.product !== productId) return i;
      const finalPrice = i.unitPrice * (1 - discountPercent / 100);
      return { ...i, discountPercent, finalPrice };
    })});
  },

  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0),
  getTaxAmount: () => get().items.reduce((sum, i) => sum + (i.finalPrice * i.quantity * i.taxPercent / 100), 0),
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTaxAmount();
    const discount = get().discount;
    return subtotal + tax - discount;
  },
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  clear: () => set({ items: [], customer: null, discount: 0 }),
}));

export default useCartStore;
