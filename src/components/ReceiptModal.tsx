import React, { useRef } from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency } from '../utils/helpers';
import { X, Printer, Download, CheckCircle2, AlertTriangle, Building, QrCode } from 'lucide-react';

interface ReceiptModalProps {
  flat: FlatUnit | null;
  config: SocietyConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  flat,
  config,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !flat) return null;

  const isPaid = flat.status === 'Paid';
  const totalAmount = isPaid
    ? flat.monthlyMaintenance
    : flat.accumulatedArrears + (flat.lateFeeApplied ? flat.lateFeeAmount : 0);

  const receiptNumber = flat.referenceNo || `TS-${flat.flatNo.replace('-', '')}-${Date.now().toString().slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
      >
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {isPaid ? 'Payment Receipt' : 'Maintenance Dues Bill'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-slate-900 text-slate-100 print-card text-xs sm:text-sm font-sans space-y-4">
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <Building className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
              {config.name}
            </h2>
            <p className="text-xs text-slate-400 font-medium">{config.subTitle}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{config.address}</p>
            <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
              Reg. No: {config.registrationNo}
            </div>
          </div>

          {/* Title Banner */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Document</span>
              <span className="text-xs font-bold text-white">
                {isPaid ? 'MAINTENANCE RECEIPT' : 'BILL OF DUES'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Document #</span>
              <span className="text-xs font-mono font-bold text-amber-400">{receiptNumber}</span>
            </div>
          </div>

          {/* Resident Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Flat & Wing</span>
              <p className="font-mono font-bold text-white text-sm sm:text-base">
                Flat {flat.flatNo} (Wing {flat.wing}, Floor {flat.floor})
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Resident Name</span>
              <p className="font-semibold text-slate-100">{flat.residentName}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ownership</span>
              <p className="font-semibold text-slate-300">{flat.ownership || 'Owner'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Billing Period</span>
              <p className="font-semibold text-amber-400">{config.currentBillingMonth}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-2 px-3 text-slate-200">
                    Monthly Maintenance Fee ({config.currentBillingMonth})
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-200">
                    {formatCurrency(flat.monthlyMaintenance)}
                  </td>
                </tr>

                {flat.status === 'Defaulter' && (
                  <>
                    <tr>
                      <td className="py-2 px-3 text-rose-300">
                        Previous Accumulated Arrears ({flat.overdueMonths} months overdue)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-300">
                        {formatCurrency(flat.accumulatedArrears - flat.monthlyMaintenance)}
                      </td>
                    </tr>
                    {flat.lateFeeApplied && (
                      <tr>
                        <td className="py-2 px-3 text-amber-300">
                          Overdue Penalty / Late Surcharge ({flat.overdueMonths} × ₹{config.lateFeePerMonth})
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-300">
                          {formatCurrency(flat.lateFeeAmount)}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                <tr className="bg-slate-950/80 font-bold">
                  <td className="py-2.5 px-3 text-white uppercase text-[11px]">
                    Total {isPaid ? 'Amount Paid' : 'Outstanding Balance'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-base text-amber-400">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status Stamp */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            {isPaid ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <div>PAYMENT RECEIVED WITH THANKS</div>
                  <div className="text-[11px] font-normal text-slate-400">
                    Mode: {flat.lastPaymentMode} · Paid on: {flat.lastPaidDate}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>PAYMENT DUE - KINDLY REMIT PROMPTLY</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Pay via UPI to: <strong className="font-mono text-amber-300">{config.upiId}</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  A/C: {config.bankDetails.accountNo} · IFSC: {config.bankDetails.ifsc}
                </p>
              </div>
            )}
          </div>

          {/* Footer Signature */}
          <div className="pt-4 flex items-end justify-between border-t border-slate-800 text-[11px] text-slate-400">
            <div>
              <p>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="text-[10px]">Times Square Society Management System</p>
            </div>
            <div className="text-right">
              <div className="font-serif italic text-amber-400 text-sm mb-1">
                {config.secretaryName}
              </div>
              <p className="font-semibold text-slate-300">Hon. Secretary</p>
              <p className="text-[10px]">Times Square CHS Ltd.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
