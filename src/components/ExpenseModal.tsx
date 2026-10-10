import React, { useState, useEffect } from 'react';
import { SocietyExpense } from '../data/expenseData';
import { X, Receipt, IndianRupee, Trash2, CheckCircle2, Clock, Calendar, Briefcase } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: SocietyExpense) => void;
  onDelete?: (id: string) => void;
  initialExpense?: SocietyExpense | null;
  defaultMonth: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialExpense,
  defaultMonth,
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<SocietyExpense['category']>('Staff Salary');
  const [title, setTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState<number>(10000);
  const [dueDate, setDueDate] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [paymentMode, setPaymentMode] = useState<SocietyExpense['paymentMode']>('Bank Transfer');
  const [billNo, setBillNo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialExpense) {
      setCategory(initialExpense.category);
      setTitle(initialExpense.title);
      setVendorName(initialExpense.vendorName);
      setAmount(initialExpense.amount);
      setDueDate(initialExpense.dueDate);
      setPaidDate(initialExpense.paidDate || '');
      setStatus(initialExpense.status);
      setPaymentMode(initialExpense.paymentMode || 'Bank Transfer');
      setBillNo(initialExpense.billNo || '');
      setNotes(initialExpense.notes || '');
    } else {
      setCategory('Staff Salary');
      setTitle('');
      setVendorName('');
      setAmount(5000);
      setDueDate(`15 ${defaultMonth}`);
      setPaidDate('');
      setStatus('Pending');
      setPaymentMode('Bank Transfer');
      setBillNo('');
      setNotes('');
    }
  }, [initialExpense, defaultMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const expenseRecord: SocietyExpense = {
      id: initialExpense ? initialExpense.id : `exp-${Date.now().toString().slice(-6)}`,
      category,
      title: title.trim(),
      vendorName: vendorName.trim() || 'Society Vendor / Staff',
      month: initialExpense ? initialExpense.month : defaultMonth,
      amount: Number(amount),
      dueDate: dueDate.trim() || `15 ${defaultMonth}`,
      paidDate: status === 'Paid' ? (paidDate.trim() || 'Today') : undefined,
      status,
      paymentMode: status === 'Paid' ? paymentMode : undefined,
      billNo: billNo.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(expenseRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header - Official Black with Yellow Badge */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b-2 border-yellow-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                {initialExpense ? 'Edit Society Expense' : 'Add Society Expense'}
              </h2>
              <p className="text-[11px] text-yellow-300 font-mono">
                Month: {initialExpense ? initialExpense.month : defaultMonth}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-800">
          {/* Category Selection */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SocietyExpense['category'])}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none focus:border-yellow-500 focus:bg-white"
            >
              <option value="Staff Salary">👷 Staff Salary (Housekeeping, Cleaners, Manager)</option>
              <option value="Security">👮 Security (Agency Guards, Watchmen)</option>
              <option value="Electricity">⚡ Electricity Bill (Pumps & Common Lights)</option>
              <option value="Lift & AMC">🛗 Lift & Elevator AMC (Otis/Schindler)</option>
              <option value="Water">💧 Water Tanker & Supply</option>
              <option value="Repairs & Misc">🔧 Repairs, Painting & Maintenance</option>
            </select>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Expense Title / Purpose *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Security Guards Monthly Salary (3 staff)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-yellow-500 focus:bg-white text-xs"
            />
          </div>

          {/* Vendor Name & Amount */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                Vendor / Payee Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Security / MSEDCL"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-yellow-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Payment Status: Paid vs Pending Toggle */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Paid')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                  status === 'Paid'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Paid</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Pending')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                  status === 'Pending'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pending Bill</span>
              </button>
            </div>
          </div>

          {/* Due Date & Paid Date (if Paid) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                Due Date
              </label>
              <input
                type="text"
                placeholder="e.g. 15 Oct 2026"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-yellow-500 focus:bg-white"
              />
            </div>

            {status === 'Paid' ? (
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Paid Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. 05 Oct 2026"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-yellow-500 focus:bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Bill / Invoice No
                </label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-yellow-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Payment Mode & Bill No if Paid */}
          {status === 'Paid' && (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as SocietyExpense['paymentMode'])}
                  className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash (Petty Cash)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-1">
                  Voucher / Ref No
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-99410"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Secretary Internal Notes */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Internal Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Paid from HDFC Society Account, receipt filed in office."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-yellow-500 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
            {initialExpense && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete expense "${initialExpense.title}"?`)) {
                    onDelete(initialExpense.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold flex items-center gap-1 border border-rose-200 text-xs transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="py-2.5 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl border border-yellow-500 shadow-sm transition active:scale-95 text-xs flex items-center gap-1.5"
            >
              <span>{initialExpense ? 'Save Changes' : 'Add Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
