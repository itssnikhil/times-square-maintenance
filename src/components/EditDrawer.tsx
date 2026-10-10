import React, { useState, useEffect } from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Save, 
  Receipt, 
  CreditCard, 
  StickyNote, 
  Calendar,
  Hash
} from 'lucide-react';

interface EditDrawerProps {
  flat: FlatUnit | null;
  config: SocietyConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFlat: FlatUnit) => void;
  onViewReceipt: (flat: FlatUnit) => void;
}

export const EditDrawer: React.FC<EditDrawerProps> = ({
  flat,
  config,
  isOpen,
  onClose,
  onSave,
  onViewReceipt,
}) => {
  if (!isOpen || !flat) return null;

  const [status, setStatus] = useState<FlatUnit['status']>(flat.status);
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(flat.monthlyMaintenance);
  const [overdueMonths, setOverdueMonths] = useState(flat.overdueMonths);
  const [accumulatedArrears, setAccumulatedArrears] = useState(flat.accumulatedArrears);
  const [lateFeeApplied, setLateFeeApplied] = useState(flat.lateFeeApplied);
  const [lastPaymentMode, setLastPaymentMode] = useState<FlatUnit['lastPaymentMode']>(flat.lastPaymentMode || 'UPI');
  const [lastPaidDate, setLastPaidDate] = useState(flat.lastPaidDate || '10 Oct 2026');
  const [referenceNo, setReferenceNo] = useState(flat.referenceNo || '');
  const [secretaryNotes, setSecretaryNotes] = useState(flat.secretaryNotes || '');

  // Keep state synchronized when flat changes
  useEffect(() => {
    if (flat) {
      setStatus(flat.status);
      setMonthlyMaintenance(flat.monthlyMaintenance);
      setOverdueMonths(flat.overdueMonths);
      setAccumulatedArrears(flat.accumulatedArrears);
      setLateFeeApplied(flat.lateFeeApplied);
      setLastPaymentMode(flat.lastPaymentMode || 'UPI');
      setLastPaidDate(flat.lastPaidDate || '10 Oct 2026');
      setReferenceNo(flat.referenceNo || '');
      setSecretaryNotes(flat.secretaryNotes || '');
    }
  }, [flat]);

  // Recalculate late fee
  const calculatedLateFee = overdueMonths * config.lateFeePerMonth;

  // Handle 1-click status change
  const handleQuickStatusChange = (newStatus: FlatUnit['status']) => {
    setStatus(newStatus);
    if (newStatus === 'Paid') {
      setOverdueMonths(0);
      setAccumulatedArrears(0);
      setLateFeeApplied(false);
      if (!lastPaidDate) setLastPaidDate('10 Oct 2026');
      if (!referenceNo) {
        setReferenceNo(`UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      }
    } else if (newStatus === 'Pending') {
      setOverdueMonths(0);
      setAccumulatedArrears(monthlyMaintenance);
      setLateFeeApplied(false);
    } else if (newStatus === 'Defaulter') {
      const months = overdueMonths > 0 ? overdueMonths : 2;
      setOverdueMonths(months);
      setAccumulatedArrears(months * monthlyMaintenance);
      setLateFeeApplied(true);
    }
  };

  const handleGenerateRef = () => {
    const timestamp = Date.now().toString().slice(-6);
    if (lastPaymentMode === 'UPI') {
      setReferenceNo(`UPI/TXN-${timestamp}`);
    } else if (lastPaymentMode === 'Cash') {
      setReferenceNo(`CASH-REC-${timestamp.slice(-3)}`);
    } else if (lastPaymentMode === 'Bank Transfer') {
      setReferenceNo(`NEFT-HDFC-${timestamp}`);
    } else {
      setReferenceNo(`CHQ-${timestamp}`);
    }
  };

  const handleAddNoteSnippet = (snippet: string) => {
    setSecretaryNotes((prev) => (prev ? `${prev}. ${snippet}` : snippet));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: FlatUnit = {
      ...flat,
      status,
      monthlyMaintenance: Number(monthlyMaintenance),
      overdueMonths: status === 'Paid' ? 0 : Number(overdueMonths),
      accumulatedArrears: status === 'Paid' ? 0 : Number(accumulatedArrears),
      lateFeeApplied: status === 'Defaulter' ? lateFeeApplied : false,
      lateFeeAmount: lateFeeApplied ? calculatedLateFee : 0,
      lastPaymentMode: status === 'Paid' ? lastPaymentMode : flat.lastPaymentMode,
      lastPaidDate: status === 'Paid' ? lastPaidDate : flat.lastPaidDate,
      referenceNo: status === 'Paid' ? referenceNo : flat.referenceNo,
      secretaryNotes,
    };

    if (status === 'Paid' && flat.status !== 'Paid') {
      // Confetti celebratory effect on marking paid!
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8'],
      });
    }

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Drawer / Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white font-mono">{flat.flatNo}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                Wing {flat.wing} · Floor {flat.floor}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {flat.residentName} · Secretary Inline Controls
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* 1-Click Status Pill Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1-Click Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Paid Button */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('Paid')}
                className={`min-h-[46px] p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  status === 'Paid'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark Paid</span>
              </button>

              {/* Pending Button */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('Pending')}
                className={`min-h-[46px] p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  status === 'Pending'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 ring-2 ring-amber-500/40 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Mark Pending</span>
              </button>

              {/* Defaulter Button */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('Defaulter')}
                className={`min-h-[46px] p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  status === 'Defaulter'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>🚨 Defaulter</span>
              </button>
            </div>
          </div>

          {/* Conditional Controls if Marking as PAID */}
          {status === 'Paid' && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Receipt & Payment Verification</span>
              </div>

              {/* Payment Mode Pills */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1.5 font-medium">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Cheque'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setLastPaymentMode(mode)}
                      className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        lastPaymentMode === mode
                          ? 'bg-emerald-600 text-slate-950 border-emerald-500 shadow-xs'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference / UTR Number with Auto-generate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 font-medium">
                    Reference / UTR / Receipt No.
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRef}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. UPI/627710928172"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                  Payment Received Date
                </label>
                <input
                  type="text"
                  value={lastPaidDate}
                  onChange={(e) => setLastPaidDate(e.target.value)}
                  placeholder="e.g. 10 Oct 2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Conditional Controls if Marking as DEFAULTER */}
          {status === 'Defaulter' && (
            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Defaulter Arrears & Penalty Setup</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Overdue Months Stepper */}
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                    Overdue Months
                  </label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, overdueMonths - 1);
                        setOverdueMonths(next);
                        setAccumulatedArrears(next * monthlyMaintenance);
                      }}
                      className="px-3 py-2 text-slate-400 hover:text-white font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={overdueMonths}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setOverdueMonths(val);
                        setAccumulatedArrears(val * monthlyMaintenance);
                      }}
                      className="w-full text-center bg-transparent py-2 text-white font-mono font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = overdueMonths + 1;
                        setOverdueMonths(next);
                        setAccumulatedArrears(next * monthlyMaintenance);
                      }}
                      className="px-3 py-2 text-slate-400 hover:text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Accumulated Base Arrears */}
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                    Base Arrears (₹)
                  </label>
                  <input
                    type="number"
                    value={accumulatedArrears}
                    onChange={(e) => setAccumulatedArrears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Late fee toggle */}
              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-amber-200">
                  <input
                    type="checkbox"
                    checked={lateFeeApplied}
                    onChange={(e) => setLateFeeApplied(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>Apply Auto Late Fee (+₹{calculatedLateFee})</span>
                </label>
                <span className="font-mono font-bold text-rose-300">
                  Total: {formatCurrency(accumulatedArrears + (lateFeeApplied ? calculatedLateFee : 0))}
                </span>
              </div>
            </div>
          )}

          {/* Monthly Maintenance Rate */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Monthly Maintenance Charge (₹)
            </label>
            <input
              type="number"
              value={monthlyMaintenance}
              onChange={(e) => setMonthlyMaintenance(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Internal Secretary Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                <span>Internal Secretary Notes (Confidential)</span>
              </label>
            </div>
            <textarea
              rows={3}
              value={secretaryNotes}
              onChange={(e) => setSecretaryNotes(e.target.value)}
              placeholder="e.g. Promised to clear dues on 15th Oct post salary..."
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            {/* Quick Note Snippets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 self-center">Quick tags:</span>
              {[
                'Promised by 15th',
                'Sent legal notice',
                'Cash paid at gate',
                'Awaiting owner transfer',
                'Out of town',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddNoteSnippet(tag)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Save & Generate Receipt */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewReceipt({
                ...flat,
                status,
                lastPaymentMode,
                lastPaidDate,
                referenceNo,
                accumulatedArrears,
                lateFeeApplied,
                lateFeeAmount: lateFeeApplied ? calculatedLateFee : 0,
              })}
              className="flex-1 min-h-[46px] rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Preview Receipt</span>
            </button>

            <button
              type="submit"
              className="flex-1 min-h-[46px] rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
