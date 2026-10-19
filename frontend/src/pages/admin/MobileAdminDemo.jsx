import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Boxes,
  ChartNoAxesCombined, ChevronRight, CircleDollarSign, LayoutDashboard,
  LogOut, Package, Plus, Search, ShoppingBag, Tag, Truck, Users, X,
  ArrowLeftRight, ShoppingCart, Menu, Shirt, UserRound, WalletCards,
} from 'lucide-react';

const initialProducts = [
  { name: 'Cotton voile', sku: 'FAB-0142', category: 'Fabrics', price: 480, stock: 36, unit: 'm' },
  { name: 'Linen blend', sku: 'FAB-0118', category: 'Fabrics', price: 720, stock: 14, unit: 'm' },
  { name: 'Silk thread set', sku: 'ACC-0206', category: 'Accessories', price: 195, stock: 8, unit: 'set' },
  { name: 'Printed rayon', sku: 'FAB-0181', category: 'Fabrics', price: 360, stock: 42, unit: 'm' },
  { name: 'Tailor scissors', sku: 'TOO-0035', category: 'Tools', price: 540, stock: 5, unit: 'pc' },
];

const sections = [
  { id: 'Dashboard', icon: LayoutDashboard }, { id: 'Products', icon: Package },
  { id: 'Categories', icon: Tag }, { id: 'Staff', icon: Users },
  { id: 'Suppliers', icon: Truck }, { id: 'Transactions', icon: ShoppingCart },
  { id: 'Returns', icon: ArrowLeftRight }, { id: 'Ledger', icon: BookOpen },
  { id: 'Reports', icon: BarChart3 }, { id: 'Billing', icon: WalletCards },
];

const sales = [
  { id: 'TX-10482', name: 'Ananya Rao', time: 'Today · 10:42 AM', amount: 2460, status: 'Paid' },
  { id: 'TX-10481', name: 'Walk-in customer', time: 'Today · 10:18 AM', amount: 1180, status: 'Paid' },
  { id: 'TX-10480', name: 'Priya Nair', time: 'Today · 9:54 AM', amount: 3750, status: 'Paid' },
];

const money = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

function MobileAdminDemo() {
  const [page, setPage] = useState('Dashboard');
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [products, setProducts] = useState(initialProducts);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', sku: '', price: '', stock: '' });
  const [cartCount, setCartCount] = useState(2);
  const [paid, setPaid] = useState(false);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'All' || product.category === filter;
    return matchesQuery && matchesFilter;
  }), [products, query, filter]);

  const goTo = (target) => {
    setPage(target);
    setMoreOpen(false);
    setQuery('');
  };

  const addProduct = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setProducts((items) => [{
      name: draft.name.trim(), sku: draft.sku.trim() || `DEMO-${String(items.length + 1).padStart(3, '0')}`,
      category: 'Fabrics', price: Number(draft.price) || 0, stock: Number(draft.stock) || 0, unit: 'm',
    }, ...items]);
    setDraft({ name: '', sku: '', price: '', stock: '' });
    setAddOpen(false);
  };

  const renderPageTitle = (title, subtitle, action) => (
    <div className="mad-page-heading">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      {action}
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="mad-greeting"><span>MONDAY, 19 OCTOBER</span><h1>Good morning, Alex</h1><p>Here’s how your store is doing today.</p></div>
      <div className="mad-metrics">
        <article className="mad-metric mad-metric-featured"><div className="mad-metric-top"><span>Today’s sales</span><CircleDollarSign size={18} /></div><strong>{money(28450)}</strong><small><ArrowUpRight size={13} /> 12.8% <span>vs. yesterday</span></small></article>
        <article className="mad-metric"><div className="mad-metric-top"><span>Orders</span><ShoppingBag size={17} /></div><strong>38</strong><small className="mad-neutral">Today</small></article>
        <article className="mad-metric"><div className="mad-metric-top"><span>Low stock</span><Boxes size={17} /></div><strong>6</strong><small className="mad-warn">Needs attention</small></article>
        <article className="mad-metric"><div className="mad-metric-top"><span>Customers</span><UserRound size={17} /></div><strong>12</strong><small className="mad-neutral">Added today</small></article>
      </div>
      <section className="mad-panel">
        <div className="mad-panel-heading"><div><h2>Sales overview</h2><p>This week</p></div><button className="mad-period">This week <ChevronRight size={14} /></button></div>
        <div className="mad-chart" aria-label="Sales chart for the last seven days">
          {[42, 66, 49, 80, 61, 94, 72].map((height, index) => <div className="mad-chart-column" key={index}><span style={{ height: `${height}%` }} /><small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</small></div>)}
        </div>
      </section>
      <section className="mad-panel">
        <div className="mad-panel-heading"><div><h2>Recent transactions</h2><p>Your latest sales</p></div><button className="mad-text-button" onClick={() => goTo('Transactions')}>View all <ArrowRight size={14} /></button></div>
        <div className="mad-list">{sales.slice(0, 2).map((sale) => <div className="mad-sale-row" key={sale.id}><span className="mad-list-icon"><ShoppingBag size={16} /></span><div className="mad-list-copy"><strong>{sale.name}</strong><small>{sale.id} · {sale.time.split('·')[1]}</small></div><div className="mad-list-end"><strong>{money(sale.amount)}</strong><small className="mad-paid">Paid</small></div></div>)}</div>
      </section>
      <section className="mad-panel mad-low-stock">
        <div className="mad-panel-heading"><div><h2>Stock to watch</h2><p>Products below minimum quantity</p></div><button className="mad-text-button" onClick={() => goTo('Products')}>Inventory <ArrowRight size={14} /></button></div>
        {products.filter((product) => product.stock <= 8).slice(0, 2).map((product) => <div className="mad-stock-row" key={product.sku}><div><strong>{product.name}</strong><small>{product.sku}</small></div><span>{product.stock} {product.unit} left</span></div>)}
      </section>
    </>
  );

  const renderProducts = () => (
    <>
      {renderPageTitle('Products', `${products.length} products in your catalog`, <button className="mad-primary-button mad-add-button" onClick={() => setAddOpen(true)}><Plus size={16} /><span>Add</span></button>)}
      <div className="mad-search"><Search size={17} /><input placeholder="Search products or SKU" value={query} onChange={(event) => setQuery(event.target.value)} /><button aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button></div>
      <div className="mad-filter-tabs">{['All', 'Fabrics', 'Accessories', 'Tools'].map((category) => <button className={filter === category ? 'active' : ''} key={category} onClick={() => setFilter(category)}>{category}</button>)}</div>
      <div className="mad-product-list">{visibleProducts.map((product) => <article className="mad-product-card" key={product.sku}><div className="mad-product-icon"><Shirt size={20} /></div><div className="mad-product-main"><strong>{product.name}</strong><small>{product.sku} · {product.category}</small><span>{product.stock} {product.unit} in stock</span></div><div className="mad-product-price"><strong>{money(product.price)}</strong><small>per {product.unit}</small></div></article>)}</div>
      {visibleProducts.length === 0 && <div className="mad-empty">No products match that search.</div>}
    </>
  );

  const renderTransactions = () => (
    <>
      {renderPageTitle('Transactions', 'Sales recorded in your store')}
      <div className="mad-search"><Search size={17} /><input placeholder="Search invoice or customer" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="mad-summary-strip"><span><b>38</b> sales today</span><span><b>{money(28450)}</b> collected</span></div>
      <div className="mad-panel mad-records">{sales.filter((sale) => `${sale.id} ${sale.name}`.toLowerCase().includes(query.toLowerCase())).map((sale) => <div className="mad-record" key={sale.id}><div className="mad-record-top"><span>{sale.id}</span><b className="mad-paid">{sale.status}</b></div><div className="mad-record-bottom"><div><strong>{sale.name}</strong><small>{sale.time}</small></div><strong>{money(sale.amount)}</strong></div></div>)}</div>
    </>
  );

  const renderSimpleList = (title, subtitle, records, icon, actionLabel) => {
    const Icon = icon;
    return <>
      {renderPageTitle(title, subtitle, actionLabel && <button className="mad-primary-button mad-add-button" onClick={() => window.alert('This is a sample preview. No store records will be changed.')}><Plus size={16} /><span>{actionLabel}</span></button>)}
      <div className="mad-search"><Search size={17} /><input placeholder={`Search ${title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="mad-panel mad-records">{records.filter((record) => record.toLowerCase().includes(query.toLowerCase())).map((record, index) => <div className="mad-generic-row" key={record}><span className="mad-list-icon"><Icon size={16} /></span><div className="mad-list-copy"><strong>{record}</strong><small>{index % 2 === 0 ? 'Updated today' : 'Updated yesterday'}</small></div><ChevronRight size={16} /></div>)}</div>
    </>;
  };

  const renderBilling = () => (
    <>
      {renderPageTitle('Billing', 'Sample checkout · Demo mode')}
      <section className="mad-panel mad-demo-notice"><span className="mad-list-icon"><ShoppingCart size={17} /></span><div><strong>Walk-in customer</strong><small>Tap an item below to add it to this sample cart.</small></div></section>
      <div className="mad-billing-products">{products.slice(0, 3).map((product) => <button key={product.sku} onClick={() => { setCartCount((count) => count + 1); setPaid(false); }}><span>{product.name}</span><strong>{money(product.price)}</strong><Plus size={15} /></button>)}</div>
      <section className="mad-panel mad-cart-panel"><div className="mad-panel-heading"><div><h2>Current sale</h2><p>{cartCount} items</p></div></div><div className="mad-cart-total"><span>Estimated total</span><strong>{money(cartCount * 480)}</strong></div><button className="mad-primary-button mad-pay-button" onClick={() => { setPaid(true); setCartCount(0); }}>{paid ? 'Sample payment complete' : 'Complete sample payment'}</button>{paid && <small className="mad-demo-confirmation">Demo sale completed locally. No transaction was recorded.</small>}</section>
    </>
  );

  const pageContent = () => {
    switch (page) {
      case 'Dashboard': return renderDashboard();
      case 'Products': return renderProducts();
      case 'Transactions': return renderTransactions();
      case 'Categories': return renderSimpleList('Categories', 'Organize your product catalog', ['Fabrics · 124 products', 'Accessories · 38 products', 'Tools · 17 products'], Tag, 'New category');
      case 'Staff': return renderSimpleList('Staff', 'Team members with portal access', ['Alex Morgan · Administrator', 'Maya Joseph · Staff', 'Arjun Menon · Staff'], Users, 'Add staff');
      case 'Suppliers': return renderSimpleList('Suppliers', 'Manage your supplier directory', ['South Looms · Bengaluru', 'Malabar Textiles · Kochi', 'Weave House · Chennai'], Truck, 'Add supplier');
      case 'Returns': return renderSimpleList('Returns', 'Recent items returned by customers', ['RT-0028 · Cotton voile · ₹960', 'RT-0027 · Silk thread set · ₹195', 'RT-0026 · Linen blend · ₹720'], ArrowLeftRight);
      case 'Ledger': return renderSimpleList('Ledger', 'Sample store income and expenses', ['Sale · TX-10482 · +₹2,460', 'Supplier payment · South Looms · −₹8,400', 'Sale · TX-10481 · +₹1,180'], BookOpen);
      case 'Reports': return <>{renderPageTitle('Reports', 'A snapshot of store performance')}<section className="mad-panel"><div className="mad-panel-heading"><div><h2>Monthly sales</h2><p>October · sample data</p></div><ChartNoAxesCombined size={19} /></div><div className="mad-report-total">{money(486200)}<small>Sales this month</small></div><div className="mad-chart mad-report-chart">{[55, 42, 70, 62, 84, 67, 94].map((height, index) => <div className="mad-chart-column" key={index}><span style={{ height: `${height}%` }} /><small>{['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'][index]}</small></div>)}</div></section><section className="mad-panel"><div className="mad-panel-heading"><div><h2>Top categories</h2><p>By sales volume</p></div></div><div className="mad-stock-row"><div><strong>Fabrics</strong><small>64% of sales</small></div><b>{money(311168)}</b></div><div className="mad-stock-row"><div><strong>Accessories</strong><small>24% of sales</small></div><b>{money(116688)}</b></div></section></>;
      case 'Billing': return renderBilling();
      default: return renderDashboard();
    }
  };

  const mainNav = ['Dashboard', 'Products', 'Transactions'];

  return (
    <div className="mobile-admin-demo">
      <header className="mad-topbar"><div className="mad-brand"><span className="mad-brand-mark">🧵</span><span>TexPOS <small>ADMIN</small></span></div><span className="mad-demo-badge">DEMO PREVIEW</span><button className="mad-profile" aria-label="Demo profile"><span>A</span></button></header>
      <main className="mad-content">{pageContent()}</main>
      <nav className="mad-bottom-nav" aria-label="Demo portal navigation">
        {mainNav.map((item) => { const Icon = sections.find((section) => section.id === item)?.icon; return <button key={item} className={page === item ? 'active' : ''} onClick={() => goTo(item)}><Icon size={19} /><span>{item === 'Transactions' ? 'Sales' : item}</span></button>; })}
        <button className={moreOpen || !mainNav.includes(page) ? 'active' : ''} onClick={() => setMoreOpen((open) => !open)}><Menu size={19} /><span>More</span></button>
      </nav>
      {moreOpen && <><button className="mad-sheet-backdrop" aria-label="Close menu" onClick={() => setMoreOpen(false)} /><section className="mad-more-sheet"><div className="mad-sheet-handle" /><div className="mad-sheet-heading"><div><h2>All sections</h2><p>Explore the sample admin portal</p></div><button onClick={() => setMoreOpen(false)} aria-label="Close"><X size={18} /></button></div><div className="mad-section-grid">{sections.filter((section) => !mainNav.includes(section.id)).map(({ id, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => goTo(id)}><span><Icon size={19} /></span><strong>{id}</strong></button>)}</div><div className="mad-sheet-demo-note">Sample content only · no real store data or actions</div></section></>}
      {addOpen && <><button className="mad-sheet-backdrop" aria-label="Close form" onClick={() => setAddOpen(false)} /><section className="mad-add-sheet"><div className="mad-sheet-handle" /><div className="mad-sheet-heading"><div><h2>Add sample product</h2><p>Saved in this preview only.</p></div><button onClick={() => setAddOpen(false)} aria-label="Close"><X size={18} /></button></div><form onSubmit={addProduct}><label>Product name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Handloom cotton" /></label><label>SKU<input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} placeholder="Optional" /></label><div className="mad-form-split"><label>Price (₹)<input type="number" min="0" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="0" /></label><label>Stock<input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} placeholder="0" /></label></div><button className="mad-primary-button" type="submit">Save sample product</button></form></section></>}
      <footer className="mad-footer-note"><ArrowDownLeft size={13} /> Unauthenticated preview · Sample data only</footer>
    </div>
  );
}

export default MobileAdminDemo;
