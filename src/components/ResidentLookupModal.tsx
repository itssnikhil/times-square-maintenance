import React, { useState } from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency, getWhatsAppLink } from '../utils/helpers';
import { 
  X, 
  Search, 
  Building, 
  CreditCard, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageCircle,
  Receipt
} from 'lucide-react';

interface ResidentLookupModalProps {
  flats: FlatUnit[];
  config: SocietyConfig;
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (flat: FlatUnit) => void;
}

export const ResidentLookupModal: React.FC<ResidentLookupModalProps> = ({
  flats,
  config,
  isOpen,
  onClose,
  onViewReceipt,
}) => {
  if (!isOpen) return null;

  const [selectedFlatNo, setSelectedFlatNo] = useState<string>(flats[0]?.flatNo || 'A-101');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const flat = flats.find((f) => f.flatNo === selectedFlatNo) || flats[0];

  const isPaid = flat.status === 'Paid';
  const isDefaulter = flat.status === 'Defaulter';

  const totalPayable = isPaid
    ? 0
    : flat.accumulatedArrears + (flat.lateFeeApplied ? flat.lateFeeAmount : 0);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(config.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const notifySecretaryMessage = `Hello Secretary (${config.secretaryName}), I have initiated maintenance payment for Flat ${flat.flatNo} (${flat.residentName}). Please find the transaction details attached.\n\nThank you!`;
  const secretaryWaLink = getWhatsAppLink(config.secretaryContact, notifySecretaryMessage);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Resident Self-Service Portal</h2>
              <p className="text-xs text-slate-400">View your unit maintenance dues & pay online</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flat Selector Dropdown */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Select Your Flat Unit
            </label>
            <div className="relative">
              <select
                value={selectedFlatNo}
                onChange={(e) => setSelectedFlatNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              >
                {flats.map((f) => (
                  <option key={f.id} value={f.flatNo}>
                    Flat {f.flatNo} - {f.residentName} ({f.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Status Card */}
          <div className={`p-4 rounded-2xl border ${
            isPaid 
              ? 'bg-emerald-950/20 border-emerald-800/60' 
              : isDefaulter 
              ? 'bg-rose-950/25 border-rose-800/60' 
              : 'bg-amber-950/20 border-amber-800/60'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-white font-mono">
                  {flat.flatNo}
                </span>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  {flat.residentName} ({flat.ownership})
                </p>
              </div>

              {isPaid ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/70 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Paid
                </span>
              ) : isDefaulter ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-600/70 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue ({flat.overdueMonths} mo)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-600/70 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Total Outstanding:</span>
              <span className={`text-xl font-black font-mono ${
                isPaid ? 'text-emerald-400' : isDefaulter ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {isPaid ? '₹0 (All clear)' : formatCurrency(totalPayable)}
              </span>
            </div>

            {isPaid && (
              <p className="text-xs text-emerald-400 mt-1">
                Paid on {flat.lastPaidDate} via {flat.lastPaymentMode} {flat.referenceNo && `(${flat.referenceNo})`}
              </p>
            )}
          </div>

          {/* Payment Instructions & UPI Gateway */}
          {!isPaid && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Direct Society UPI Details
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">Zero Surcharge</span>
              </div>

              {/* UPI ID box */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-750">
                <div>
                  <span className="text-[10px] text-slate-400 block">UPI ID / VPA</span>
                  <span className="font-mono text-xs font-bold text-amber-300">{config.upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1 transition"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bank Details */}
              <div className="text-[11px] text-slate-400 space-y-0.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 font-mono">
                <div><strong>Bank:</strong> {config.bankDetails.bankName}</div>
                <div><strong>A/C:</strong> {config.bankDetails.accountNo}</div>
                <div><strong>IFSC:</strong> {config.bankDetails.ifsc}</div>
              </div>

              {/* Action: Notify Secretary after payment */}
              <a
                href={secretaryWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notify Secretary on WhatsApp after Paying</span>
              </a>
            </div>
          )}

          {/* View Official Bill / Receipt button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewReceipt(flat);
            }}
            className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>View & Download Official Receipt / Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
