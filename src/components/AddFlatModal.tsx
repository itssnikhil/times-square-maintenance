import React, { useState } from 'react';
import { FlatUnit, BILLING_MONTHS } from '../data/mockData';
import { X, Plus, Building2, User, IndianRupee } from 'lucide-react';

interface AddFlatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newFlat: FlatUnit) => void;
}

export const AddFlatModal: React.FC<AddFlatModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  if (!isOpen) return null;

  const [flatNo, setFlatNo] = useState('');
  const [wing, setWing] = useState<'A' | 'C'>('A');
  const [floor, setFloor] = useState(1);
  const [residentName, setResidentName] = useState('');
  const [ownership, setOwnership] = useState<'Owner' | 'Tenant'>('Owner');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(5500);
  const [status, setStatus] = useState<FlatUnit['status']>('Pending');
  const [paymentMode, setPaymentMode] = useState<FlatUnit['lastPaymentMode']>('UPI');
  const [notes, setNotes] = useState('');

  // Auto-detect floor and wing from flat number if typed (e.g. A-302 -> Wing A, C-201 -> Wing C)
  const handleFlatNoChange = (value: string) => {
    setFlatNo(value);
    const upper = value.toUpperCase();
    if (upper.startsWith('A')) setWing('A');
    if (upper.startsWith('C')) setWing('C');

    // Extract digits to estimate floor (e.g. 101 -> 1, 302 -> 3)
    const match = value.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= 100) {
        setFloor(Math.floor(num / 100));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNo.trim() || !residentName.trim()) return;

    const rate = Number(monthlyMaintenance) || 5500;
    const isDef = status === 'Defaulter';
    const isPend = status === 'Pending';
    const isEmpty = status === 'Empty';
    const overdueCount = isDef ? 3 : (isPend ? 1 : 0);

    const newFlat: FlatUnit = {
      id: `flat-${flatNo.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      flatNo: flatNo.trim().toUpperCase(),
      wing,
      floor: Number(floor) || 1,
      residentName: residentName.trim(),
      email: `${residentName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      ownership,
      monthlyMaintenance: rate,
      status,
      overdueMonths: isEmpty ? 0 : overdueCount,
      accumulatedArrears: isEmpty ? 0 : overdueCount * rate,
      isExemptFromDefaulter: isEmpty,
      exemptionReason: isEmpty ? 'Flat was empty / Vacant' : undefined,
      lastPaidDate: status === 'Paid' ? 'Today' : null,
      lastPaymentMode: status === 'Paid' ? paymentMode : null,
      referenceNo: status === 'Paid' ? `REC-${Date.now().toString().slice(-6)}` : null,
      secretaryNotes: notes.trim(),
      history: [],
      monthlyDues: BILLING_MONTHS.map((m, idx) => ({
        month: m,
        isPaid: status === 'Paid' || (status === 'Pending' && idx < BILLING_MONTHS.length - 1) || (status === 'Defaulter' && idx < BILLING_MONTHS.length - 3),
        isExempt: isEmpty,
        amount: isEmpty ? 0 : rate,
      })),
    };

    onAdd(newFlat);
    onClose();

    // Reset form
    setFlatNo('');
    setResidentName('');
    setNotes('');
    setStatus('Pending');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header - Official Black with Yellow Emblem */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add New Flat Unit</h2>
              <p className="text-xs text-slate-300">Add resident & maintenance details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Clean White */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm bg-white">
          {/* Flat Number & Wing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Flat Number *
              </label>
              <input
                type="text"
                required
                value={flatNo}
                onChange={(e) => handleFlatNoChange(e.target.value)}
                placeholder="e.g. A-501 or C-302"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-yellow-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Wing & Floor
              </label>
              <div className="flex gap-1.5">
                <select
                  value={wing}
                  onChange={(e) => setWing(e.target.value as 'A' | 'C')}
                  className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="A">Wing A</option>
                  <option value="C">Wing C</option>
                </select>

                <input
                  type="number"
                  min={1}
                  max={50}
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  placeholder="Floor"
                  className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-center font-bold focus:bg-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Resident Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Resident Name *
            </label>
            <input
              type="text"
              required
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              placeholder="e.g. Rahul Mehta"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Occupancy */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Occupancy Status
            </label>
            <select
              value={ownership}
              onChange={(e) => setOwnership(e.target.value as 'Owner' | 'Tenant')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-yellow-500"
            >
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
            </select>
          </div>

          {/* Monthly Maintenance Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Monthly Maintenance (₹)
            </label>
            <input
              type="number"
              required
              value={monthlyMaintenance}
              onChange={(e) => setMonthlyMaintenance(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Initial Status
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setStatus('Paid')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                  status === 'Paid'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟢 Paid
              </button>
              <button
                type="button"
                onClick={() => setStatus('Pending')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                  status === 'Pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟡 Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('Defaulter')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                  status === 'Defaulter'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔴 Defaulter
              </button>
              <button
                type="button"
                onClick={() => setStatus('Empty')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                  status === 'Empty'
                    ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏠 Empty
              </button>
            </div>
          </div>

          {/* Payment Mode if Paid */}
          {status === 'Paid' && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-900">Payment Mode</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI', 'Cash', 'Bank Transfer'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`py-1.5 text-xs rounded-lg font-bold border ${
                      paymentMode === m
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remark / Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. New resident moved in this month"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-sm border border-yellow-500/60 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Flat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
