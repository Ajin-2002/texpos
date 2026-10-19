import React, { useRef } from 'react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const BillPrint = ({ transaction }) => {
  const printRef = useRef();
  const storeName = import.meta.env.VITE_STORE_NAME || 'TexPOS';
  const storeAddress = import.meta.env.VITE_STORE_ADDRESS;
  const storePhone = import.meta.env.VITE_STORE_PHONE;
  const storeGst = import.meta.env.VITE_STORE_GST;

  if (!transaction) return null;

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html>
        <head>
          <title>Invoice ${transaction.invoiceNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: white; margin: 0; padding: 16px; width: 300px; }
            .bill-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .bill-title { font-size: 18px; font-weight: bold; }
            .bill-sub { font-size: 11px; }
            .bill-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .bill-divider { border-top: 1px dashed #000; margin: 8px 0; }
            .bill-total { font-weight: bold; font-size: 14px; }
            .bill-footer { text-align: center; margin-top: 12px; font-size: 10px; }
            .item-row { margin: 4px 0; }
            .item-detail { color: #666; font-size: 10px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div>
      {/* Screen Preview */}
      <div style={{ background: 'white', color: '#000', borderRadius: 8, padding: 20, fontFamily: "'Courier New', monospace", fontSize: 13, maxWidth: 340, margin: '0 auto' }}>
        <div ref={printRef}>
          {/* Header */}
          <div className="bill-header" style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
            <div className="bill-title" style={{ fontSize: 20, fontWeight: 'bold' }}>🧵 {storeName}</div>
            {storeAddress && <div className="bill-sub" style={{ fontSize: 11 }}>{storeAddress}</div>}
            {(storePhone || storeGst) && <div style={{ marginTop: 6, fontSize: 11 }}>
              {storePhone && <div>📞 {storePhone}</div>}
              {storeGst && <div>GST: {storeGst}</div>}
            </div>}
          </div>

          {/* Invoice Info */}
          <div style={{ marginBottom: 10, fontSize: 11 }}>
            <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Invoice:</span><strong>{transaction.invoiceNumber}</strong>
            </div>
            <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Date:</span><span>{formatDate(transaction.createdAt, 'datetime')}</span>
            </div>
            <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Staff:</span><span>{transaction.staffName}</span>
            </div>
            {transaction.customerName !== 'Walk-in Customer' && (
              <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Customer:</span><span>{transaction.customerName}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

          {/* Items */}
          <div style={{ marginBottom: 10 }}>
            {transaction.items?.map((item, i) => (
              <div key={i} className="item-row" style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 'bold', fontSize: 12 }}>{item.productName}</div>
                <div className="item-detail" style={{ color: '#555', fontSize: 10 }}>{item.sku}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
                {item.discountPercent > 0 && <div style={{ fontSize: 10, color: '#555' }}>Discount: {item.discountPercent}%</div>}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

          {/* Totals */}
          <div style={{ fontSize: 12 }}>
            <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span><span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discountAmount > 0 && (
              <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                <span>Discount</span><span>-{formatCurrency(transaction.discountAmount)}</span>
              </div>
            )}
            {transaction.taxAmount > 0 && (
              <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax</span><span>{formatCurrency(transaction.taxAmount)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px solid #000', margin: '8px 0' }} />
          <div className="bill-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 15 }}>
            <span>TOTAL</span><span>{formatCurrency(transaction.totalAmount)}</span>
          </div>

          <div style={{ marginTop: 8, fontSize: 11 }}>
            <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Payment ({transaction.paymentMethod?.toUpperCase()})</span>
              <span>{formatCurrency(transaction.amountPaid)}</span>
            </div>
            {transaction.changeAmount > 0 && (
              <div className="bill-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Change</span><span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '12px 0 8px' }} />

          {/* Footer */}
          <div className="bill-footer" style={{ textAlign: 'center', fontSize: 11 }}>
            <div>Thank you for shopping with us! 🙏</div>
            <div style={{ marginTop: 4 }}>Items sold are non-refundable without receipt.</div>
            <div style={{ marginTop: 6, fontWeight: 'bold' }}>Visit us again!</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          className="btn btn-primary"
          onClick={handlePrint}
          id="print-bill-btn"
        >
          🖨️ Print Invoice
        </button>
      </div>
    </div>
  );
};

export default BillPrint;
