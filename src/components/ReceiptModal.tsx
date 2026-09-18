import React, { useState } from 'react';
import { Receipt, Printer, X, Download, FileText, Check, Copy, ExternalLink } from 'lucide-react';
import { ReceiptData, NexusSettings } from '../types';

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  settings: NexusSettings;
  currency?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  settings,
  currency = 'PKR',
  onClose,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  // 1. Direct Save to PC as Standalone Printable HTML file
  const handleSaveToPC = () => {
    const safeStudentName = (receipt.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Receipt_${receipt.receiptNo}_${safeStudentName}.html`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receipt.receiptNo} - ${receipt.studentName}</title>
  <style>
    @media print {
      body { margin: 0; background: #fff; }
      .no-print { display: none !important; }
      .receipt-card { box-shadow: none !important; border: 1px solid #ccc !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 15px;
      margin: 0;
      color: #0f172a;
    }
    .action-bar {
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
    }
    .btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn:hover { background: #1d4ed8; }
    .receipt-card {
      background: #ffffff;
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
      padding: 30px;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 2px dashed #cbd5e1;
    }
    .logo {
      width: 64px;
      height: 64px;
      margin-bottom: 8px;
      border-radius: 50%;
      object-fit: contain;
    }
    .title { font-size: 20px; font-weight: 800; margin: 0; color: #0f172a; }
    .subtitle { font-size: 13px; color: #64748b; margin: 4px 0 2px 0; }
    .address { font-size: 11px; color: #94a3b8; margin: 0; }
    .badge {
      display: inline-block;
      margin-top: 10px;
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 4px;
    }
    .details { margin-top: 20px; font-size: 13px; }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    .label { color: #64748b; }
    .val { font-weight: 600; color: #0f172a; text-align: right; }
    .val-code { font-family: monospace; font-weight: 700; color: #2563eb; }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 12px 0;
    }
    .paid-row {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 16px;
      font-weight: 800;
    }
    .paid-amount { color: #15803d; }
    .dues-amount { color: ${receipt.remainingDues > 0 ? '#dc2626' : '#15803d'}; font-weight: 700; }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="receipt-card">
    <div class="header">
      <h2 class="title">${settings.name}</h2>
      <p class="subtitle">${settings.subtitle}</p>
      <p class="address">${settings.address}</p>
      <div class="badge">Official Fee Collection Receipt</div>
    </div>
    <div class="details">
      <div class="row">
        <span class="label">Receipt No:</span>
        <span class="val font-mono"><strong>${receipt.receiptNo}</strong></span>
      </div>
      <div class="row">
        <span class="label">Date:</span>
        <span class="val">${receipt.date}</span>
      </div>
      <div class="row">
        <span class="label">Student ID:</span>
        <span class="val val-code">${receipt.studentId}</span>
      </div>
      <div class="row">
        <span class="label">Student Name:</span>
        <span class="val">${receipt.studentName}</span>
      </div>
      <div class="row">
        <span class="label">Father Name:</span>
        <span class="val">${receipt.fatherName}</span>
      </div>
      <div class="row">
        <span class="label">Class / Course:</span>
        <span class="val">${receipt.className || 'N/A'}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Monthly Fee:</span>
        <span class="val">${currency} ${receipt.monthlyFee.toLocaleString()}</span>
      </div>
      <div class="row">
        <span class="label">Admission Fee:</span>
        <span class="val">${currency} ${receipt.admissionFee.toLocaleString()}</span>
      </div>
      <div class="row">
        <span class="label">Previous Outstanding Dues:</span>
        <span class="val">${currency} ${receipt.prevDues.toLocaleString()}</span>
      </div>

      <div class="row paid-row">
        <span>Paid Amount:</span>
        <span class="paid-amount">${currency} ${receipt.paidAmount.toLocaleString()}</span>
      </div>
      <div class="row">
        <span class="label">Remaining Dues:</span>
        <span class="dues-amount">${currency} ${receipt.remainingDues.toLocaleString()}</span>
      </div>
    </div>
    <div class="footer">
      Computer generated official academy receipt.<br>
      Thank you for being part of ${settings.name}.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  // 2. Direct Window Print (Outside iframe)
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=600,height=750');
      if (printWindow) {
        const safeStudentName = (receipt.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${receipt.receiptNo} - ${safeStudentName}</title>
  <style>
    body { font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 440px; margin: 0 auto; }
    .center { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .divider { border-top: 1px solid #e2e8f0; margin: 8px 0; }
    .paid { border-top: 2px solid #0f172a; padding: 8px 0; font-size: 15px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="center">
    <h2>${settings.name}</h2>
    <p style="font-size: 12px; color: #64748b; margin: 0;">${settings.subtitle}</p>
    <p style="font-size: 11px; color: #94a3b8; margin: 2px 0;">${settings.address}</p>
    <div style="font-size: 11px; font-weight: bold; margin-top: 6px;">FEE COLLECTION RECEIPT</div>
  </div>
  <div style="margin-top: 14px;">
    <div class="row"><span>Receipt No:</span><strong>${receipt.receiptNo}</strong></div>
    <div class="row"><span>Date:</span><strong>${receipt.date}</strong></div>
    <div class="row"><span>Student ID:</span><strong style="color: #2563eb;">${receipt.studentId}</strong></div>
    <div class="row"><span>Student Name:</span><strong>${receipt.studentName}</strong></div>
    <div class="row"><span>Father Name:</span><strong>${receipt.fatherName}</strong></div>
    <div class="row"><span>Class:</span><strong>${receipt.className || 'N/A'}</strong></div>
    <div class="divider"></div>
    <div class="row"><span>Monthly Fee:</span><span>${currency} ${receipt.monthlyFee.toLocaleString()}</span></div>
    <div class="row"><span>Admission Fee:</span><span>${currency} ${receipt.admissionFee.toLocaleString()}</span></div>
    <div class="row"><span>Previous Dues:</span><span>${currency} ${receipt.prevDues.toLocaleString()}</span></div>
    <div class="row paid"><span>Paid Amount:</span><span style="color: #16a34a;">${currency} ${receipt.paidAmount.toLocaleString()}</span></div>
    <div class="row"><span>Remaining Dues:</span><strong style="color: ${receipt.remainingDues > 0 ? '#dc2626' : '#16a34a'};">${currency} ${receipt.remainingDues.toLocaleString()}</strong></div>
  </div>
  <div style="text-align: center; margin-top: 16px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    Computer generated official receipt. Thank you!
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn('Popup blocked, falling back to window.print():', e);
    }
    window.print();
  };

  // 3. Copy Plain Text Receipt to Clipboard
  const handleCopyText = () => {
    const textReceipt = `====================================
${settings.name.toUpperCase()}
${settings.subtitle}
${settings.address}
FEE COLLECTION RECEIPT
====================================
Receipt No:     ${receipt.receiptNo}
Date:           ${receipt.date}
Student ID:     ${receipt.studentId}
Student Name:   ${receipt.studentName}
Father Name:    ${receipt.fatherName}
Class:          ${receipt.className || 'N/A'}
------------------------------------
Monthly Fee:    ${currency} ${receipt.monthlyFee.toLocaleString()}
Admission Fee:  ${currency} ${receipt.admissionFee.toLocaleString()}
Previous Dues:  ${currency} ${receipt.prevDues.toLocaleString()}
------------------------------------
PAID AMOUNT:    ${currency} ${receipt.paidAmount.toLocaleString()}
REMAINING DUES: ${currency} ${receipt.remainingDues.toLocaleString()}
====================================
Thank you for choosing ${settings.name}!`;

    navigator.clipboard.writeText(textReceipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Printable Area */}
        <div id="printableReceipt" className="p-6 sm:p-7 space-y-4 text-slate-900 bg-white">
          {/* Receipt Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <img
              src={settings.logo || '/nexus-logo.svg'}
              alt="Logo"
              className="w-16 h-16 mx-auto rounded-full object-contain mb-1.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/nexus-logo.svg';
              }}
            />
            <h2 className="text-lg font-bold text-slate-900">{settings.name}</h2>
            <p className="text-xs text-slate-500 font-medium">{settings.subtitle}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{settings.address}</p>
            <span className="inline-block px-2.5 py-0.5 mt-2 rounded bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              Fee Collection Receipt
            </span>
          </div>

          {/* Receipt Rows */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Receipt No:</span>
              <strong className="font-mono font-bold text-slate-900">{receipt.receiptNo}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Date:</span>
              <strong className="font-semibold text-slate-900">{receipt.date}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Student ID:</span>
              <strong className="font-mono text-blue-600 font-bold">{receipt.studentId}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Student Name:</span>
              <strong className="font-semibold text-slate-900">{receipt.studentName}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Father Name:</span>
              <strong className="font-semibold text-slate-900">{receipt.fatherName}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Class Option:</span>
              <strong className="font-semibold text-slate-900 truncate max-w-[200px] text-right">
                {receipt.className || 'N/A'}
              </strong>
            </div>

            <div className="border-t border-slate-100 my-2 pt-2 space-y-1">
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Monthly Class Fee:</span>
                <span>{currency} {receipt.monthlyFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Admission Fee:</span>
                <span>{currency} {receipt.admissionFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Previous Dues:</span>
                <span>{currency} {receipt.prevDues.toLocaleString()}</span>
              </div>
            </div>

            {/* Total Paid */}
            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
              <span>Paid Amount:</span>
              <span className="text-emerald-700">{currency} {receipt.paidAmount.toLocaleString()}</span>
            </div>

            {/* Remaining Dues */}
            <div className="flex justify-between py-1 text-xs font-semibold">
              <span className="text-slate-500">Remaining Dues:</span>
              <span className={receipt.remainingDues > 0 ? 'text-red-600' : 'text-emerald-600'}>
                {currency} {receipt.remainingDues.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-3 text-center border-t border-slate-100 text-[10px] text-slate-400">
            Thank you for being part of Nexus Academy. Computer generated receipt.
          </div>
        </div>

        {/* Modal Actions (Save to PC / Print / Copy) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Direct Save to PC Button */}
            <button
              type="button"
              onClick={handleSaveToPC}
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Save a standalone receipt file directly onto your computer"
            >
              {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloaded ? 'Saved to PC!' : 'Save Receipt to PC (.html)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="h-9 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
              title="Copy receipt summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
