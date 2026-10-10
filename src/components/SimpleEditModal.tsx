import React, { useState, useEffect } from 'react';
import { FlatUnit, MonthDueRecord, BILLING_MONTHS } from '../data/mockData';
import { X, Save, Trash2, Building2, Calendar, CheckCircle2, Clock, Home } from 'lucide-react';

interface SimpleEditModalProps {
  flat: FlatUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFlat: FlatUnit) => void;
  onDelete?: (flatId: string) => void;
}

export const SimpleEditModal: React.FC<SimpleEditModalProps> = ({
  flat,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !flat) return null;

  const [status, setStatus] = useState<FlatUnit['status']>(flat.status);
  const [wing, setWing] = useState<'A' | 'C'>(flat.wing === 'C' ? 'C' : 'A');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(flat.monthlyMaintenance);
  const [isExemptFromDefaulter, setIsExemptFromDefaulter] = useState<boolean>(Boolean(flat.isExemptFromDefaulter));
  const [exemptionReason, setExemptionReason] = useState<string>(flat.exemptionReason || '');
  const [monthlyDues, setMonthlyDues] = useState<MonthDueRecord[]>(() => {
    if (flat.monthlyDues && flat.monthlyDues.length > 0) {
      return flat.monthlyDues;
    }
    return BILLING_MONTHS.map((m) => ({
      month: m,
      isPaid: flat.status === 'Paid',
      amount: flat.monthlyMaintenance,
    }));
  });
  const [paymentMode, setPaymentMode] = useState<FlatUnit['lastPaymentMode']>(flat.lastPaymentMode || 'UPI');
  const [notes, setNotes] = useState(flat.secretaryNotes || '');

  // Manual arrears amount override by Secretary
  const [manualArrears, setManualArrears] = useState<number>(() => {
    return flat.customOverdueAmount !== undefined
      ? flat.customOverdueAmount
      : (flat.accumulatedArrears > 0 ? flat.accumulatedArrears : (flat.status === 'Pending' ? flat.monthlyMaintenance : 0));
  });
  const [isManualArrearsActive, setIsManualArrearsActive] = useState<boolean>(
    Boolean(flat.customOverdueAmount !== undefined)
  );

  useEffect(() => {
    if (flat) {
      const isAllExempt = flat.monthlyDues && flat.monthlyDues.length > 0 && flat.monthlyDues.every((m) => m.isExempt);
      const isCurrentlyEmpty = flat.status === 'Empty' || Boolean(flat.isExemptFromDefaulter) || Boolean(isAllExempt);

      setStatus(isCurrentlyEmpty ? 'Empty' : flat.status);
      setWing(flat.wing === 'C' ? 'C' : 'A');
      setMonthlyMaintenance(flat.monthlyMaintenance);
      setIsExemptFromDefaulter(isCurrentlyEmpty);
      setExemptionReason(flat.exemptionReason || (isCurrentlyEmpty ? 'Flat was empty / Vacant' : ''));
      setPaymentMode(flat.lastPaymentMode || 'UPI');
      setNotes(flat.secretaryNotes || '');

      const initialAmt = isCurrentlyEmpty
        ? 0
        : (flat.customOverdueAmount !== undefined
            ? flat.customOverdueAmount
            : (flat.accumulatedArrears > 0 ? flat.accumulatedArrears : (flat.status === 'Pending' ? flat.monthlyMaintenance : 0)));
      setManualArrears(initialAmt);
      setIsManualArrearsActive(Boolean(!isCurrentlyEmpty && flat.customOverdueAmount !== undefined));

      if (flat.monthlyDues && flat.monthlyDues.length > 0) {
        setMonthlyDues(flat.monthlyDues);
      } else {
        setMonthlyDues(
          BILLING_MONTHS.map((m) => ({
            month: m,
            isPaid: flat.status === 'Paid',
            amount: flat.monthlyMaintenance,
          }))
        );
      }
    }
  }, [flat]);

  // Set individual month state: Paid, Pending, or Exempt (Flat was empty)
  const handleSetMonthState = (monthName: string, mode: 'paid' | 'pending' | 'exempt') => {
    const nextDues = monthlyDues.map((m) => {
      if (m.month === monthName) {
        if (mode === 'paid') {
          return {
            ...m,
            isPaid: true,
            isExempt: false,
            amount: Number(monthlyMaintenance),
            paidDate: 'Today',
            paymentMode: paymentMode || 'UPI',
          };
        } else if (mode === 'pending') {
          return {
            ...m,
            isPaid: false,
            isExempt: false,
            amount: Number(monthlyMaintenance),
            paidDate: undefined,
            paymentMode: undefined,
          };
        } else {
          // Exempt: Flat was empty in this month (₹0 Due, does not count as unpaid debt)
          return {
            ...m,
            isPaid: false,
            isExempt: true,
            amount: 0,
            paidDate: undefined,
            paymentMode: undefined,
          };
        }
      }
      return m;
    });

    setMonthlyDues(nextDues);

    // Auto-update overall status based on actual unpaid non-exempt months
    const unpaid = nextDues.filter((m) => !m.isPaid && !m.isExempt);
    const exempt = nextDues.filter((m) => m.isExempt);
    const newCalculated = unpaid.reduce((sum, item) => sum + item.amount, 0);

    if (isExemptFromDefaulter || (nextDues.length > 0 && exempt.length === nextDues.length)) {
      setStatus('Empty');
      setManualArrears(0);
    } else if (unpaid.length === 0) {
      setStatus('Paid');
      setManualArrears(0);
    } else if (unpaid.length === 1) {
      setStatus('Pending');
      if (!isManualArrearsActive) setManualArrears(newCalculated);
    } else {
      setStatus('Defaulter');
      if (!isManualArrearsActive) setManualArrears(newCalculated);
    }
  };

  // Cycle toggle on row click: Paid -> Pending -> Empty -> Paid
  const handleCycleMonth = (monthName: string) => {
    const current = monthlyDues.find((m) => m.month === monthName);
    if (!current) return;
    if (current.isExempt) {
      handleSetMonthState(monthName, 'paid');
    } else if (current.isPaid) {
      handleSetMonthState(monthName, 'pending');
    } else {
      handleSetMonthState(monthName, 'exempt');
    }
  };

  // Update specific month's amount
  const handleUpdateMonthAmount = (monthName: string, newAmt: number) => {
    const nextDues = monthlyDues.map((m) => (m.month === monthName ? { ...m, amount: newAmt } : m));
    setMonthlyDues(nextDues);
    const unpaid = nextDues.filter((m) => !m.isPaid && !m.isExempt);
    const newCalculated = unpaid.reduce((sum, item) => sum + item.amount, 0);
    if (!isManualArrearsActive) {
      setManualArrears(newCalculated);
    }
  };

  // Quick mark all months
  const handleMarkAllMonths = (mode: 'paid' | 'unpaid' | 'empty') => {
    if (mode === 'empty') {
      const nextDues = monthlyDues.map((m) => ({
        ...m,
        isPaid: false,
        isExempt: true,
        amount: 0,
        paidDate: undefined,
        paymentMode: undefined,
      }));
      setMonthlyDues(nextDues);
      setIsExemptFromDefaulter(true);
      setStatus('Empty');
      setManualArrears(0);
      if (!exemptionReason) setExemptionReason('Flat was empty / Vacant');
      return;
    }

    const paid = mode === 'paid';
    const nextDues = monthlyDues.map((m) => ({
      ...m,
      isPaid: paid,
      isExempt: false,
      amount: Number(monthlyMaintenance),
      paidDate: paid ? 'Today' : undefined,
      paymentMode: paid ? paymentMode || 'UPI' : undefined,
    }));
    setMonthlyDues(nextDues);
    setIsExemptFromDefaulter(false);
    setStatus(paid ? 'Paid' : 'Defaulter');
    setManualArrears(paid ? 0 : Number(monthlyMaintenance) * BILLING_MONTHS.length);
  };

  // Calculate unpaid sum (exempt months have 0 due and are excluded)
  const unpaidMonthsList = monthlyDues.filter((m) => !m.isPaid && !m.isExempt);
  const exemptMonthsList = monthlyDues.filter((m) => m.isExempt);
  const calculatedArrears = isExemptFromDefaulter || status === 'Empty'
    ? 0 
    : unpaidMonthsList.reduce((sum, m) => sum + m.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isAllMonthsExempt = monthlyDues.length > 0 && monthlyDues.every((m) => m.isExempt);
    const isFlatEmpty = isExemptFromDefaulter || isAllMonthsExempt || status === 'Empty';

    let finalStatus: FlatUnit['status'];
    if (isFlatEmpty) {
      finalStatus = 'Empty';
    } else if (unpaidMonthsList.length === 0) {
      finalStatus = 'Paid';
    } else {
      finalStatus = status;
    }

    const effectiveArrears = isManualArrearsActive 
      ? manualArrears 
      : (calculatedArrears > 0 ? calculatedArrears : manualArrears);

    const finalArrears = (isFlatEmpty || finalStatus === 'Paid') ? 0 : effectiveArrears;
    const finalOverdueMonths = (isFlatEmpty || finalStatus === 'Paid') ? 0 : (unpaidMonthsList.length || 1);

    const updated: FlatUnit = {
      ...flat,
      wing,
      status: finalStatus,
      monthlyMaintenance: Number(monthlyMaintenance),
      overdueMonths: finalOverdueMonths,
      accumulatedArrears: finalArrears,
      customOverdueAmount: finalStatus !== 'Paid' && finalStatus !== 'Empty' && isManualArrearsActive ? finalArrears : undefined,
      manualStatusOverride: true,
      isExemptFromDefaulter: isFlatEmpty,
      exemptionReason: isFlatEmpty ? (exemptionReason.trim() || 'Flat was empty / Vacant') : undefined,
      lastPaymentMode: finalStatus === 'Paid' ? (paymentMode || 'UPI') : null,
      lastPaidDate: finalStatus === 'Paid' ? (flat.lastPaidDate || 'Today') : null,
      secretaryNotes: notes,
      monthlyDues,
    };
    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove Flat ${flat.flatNo}?`)) {
      if (onDelete) {
        onDelete(flat.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header - Black with Yellow emblem */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 font-bold flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono tracking-tight text-white">{flat.flatNo}</span>
                <span className="text-xs text-yellow-300 font-bold">({flat.residentName})</span>
              </div>
              <p className="text-xs text-slate-300">Month-Wise Dues & Payment Status</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm bg-white max-h-[80vh] overflow-y-auto">
          {/* Wing Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Assigned Wing
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWing('A')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  wing === 'A'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏢 Wing A
              </button>
              <button
                type="button"
                onClick={() => setWing('C')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  wing === 'C'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏢 Wing C
              </button>
            </div>
          </div>

          {/* MONTH-BY-MONTH STATUS TRACKER WITH EMPTY/EXEMPT BUTTON */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <span>Month-Wise Dues Clearance</span>
              </label>

              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleMarkAllMonths('paid')}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                >
                  All Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllMonths('unpaid')}
                  className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold hover:bg-rose-200"
                >
                  All Unpaid
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllMonths('empty')}
                  className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold hover:bg-amber-200"
                >
                  All Empty
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Tap any month to cycle status, or use buttons to mark <strong>Paid (🟢)</strong>, <strong>Pending (🔴)</strong>, or <strong>Flat Empty (🟡 ₹0 Due)</strong>.
            </p>

            {/* List of Months */}
            <div className="space-y-1.5 pt-1">
              {monthlyDues.map((m) => (
                <div
                  key={m.month}
                  className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                    m.isExempt
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : m.isPaid
                      ? 'bg-white border-emerald-300 shadow-xs'
                      : 'bg-rose-50 border-rose-300 shadow-xs'
                  }`}
                >
                  <div 
                    onClick={() => handleCycleMonth(m.month)}
                    className="flex items-center gap-2 cursor-pointer select-none"
                    title="Click to cycle status"
                  >
                    {m.isExempt ? (
                      <Home className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : m.isPaid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">{m.month}</span>
                    {m.isExempt ? (
                      <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.5 rounded border border-amber-300">
                        Flat Empty (₹0 Due)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-600">
                        <span className="font-bold">₹</span>
                        <input
                          type="number"
                          value={m.amount}
                          onChange={(e) => handleUpdateMonthAmount(m.month, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-yellow-500 shadow-xs"
                          title="Edit amount due for this month by yourself"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3 Quick buttons for each month */}
                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetMonthState(m.month, 'paid')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                        m.isPaid && !m.isExempt
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetMonthState(m.month, 'pending')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                        !m.isPaid && !m.isExempt
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs font-black'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⏳ Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetMonthState(m.month, 'exempt')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                        m.isExempt
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs font-black'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Exempt dues for this month because flat was empty / vacant"
                    >
                      🏠 Flat Empty
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total summary of pending months */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-1">
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <span>Pending Months: <strong className="text-slate-900">{unpaidMonthsList.length}</strong></span>
                {exemptMonthsList.length > 0 && (
                  <span className="text-amber-800">
                    Empty / Exempt: <strong>{exemptMonthsList.length}</strong>
                  </span>
                )}
              </div>
              <span className={`font-mono font-black text-sm ${
                calculatedArrears > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                Auto Sum: ₹{calculatedArrears}
              </span>
            </div>
          </div>

          {/* Defaulter Status & Vacant Flat Exemption */}
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase">
                Overall Flat Status
              </label>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                status === 'Empty' || isExemptFromDefaulter
                  ? 'bg-amber-100 text-amber-950 border border-yellow-400'
                  : status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'Pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                Current: {status === 'Empty' || isExemptFromDefaulter ? 'Empty Flat' : status}
              </span>
            </div>

            {/* Manual Status Buttons (Paid | Pending | Defaulter | Empty Flat) */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStatus('Paid');
                  setIsExemptFromDefaulter(false);
                  setManualArrears(0);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  status === 'Paid' && !isExemptFromDefaulter
                    ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ✓ Paid
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('Pending');
                  setIsExemptFromDefaulter(false);
                  if (manualArrears === 0) setManualArrears(monthlyMaintenance);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  status === 'Pending' && !isExemptFromDefaulter
                    ? 'bg-yellow-400 text-slate-950 border-yellow-500 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⏳ Pending
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('Defaulter');
                  setIsExemptFromDefaulter(false);
                  if (manualArrears === 0) setManualArrears(monthlyMaintenance * 2);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  status === 'Defaulter' && !isExemptFromDefaulter
                    ? 'bg-rose-600 text-white border-rose-700 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚨 Defaulter
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('Empty');
                  setIsExemptFromDefaulter(true);
                  if (!exemptionReason) setExemptionReason('Flat was empty / Vacant');
                  setManualArrears(0);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  status === 'Empty' || isExemptFromDefaulter
                    ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏠 Empty
              </button>
            </div>

            {/* MANUAL TOTAL AMOUNT OVERRIDE BY SECRETARY */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black text-slate-900 uppercase">
                  Total Outstanding Amount Due (₹)
                </label>
                {isManualArrearsActive && (
                  <span className="text-[10px] bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                    Custom Amount Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    disabled={isExemptFromDefaulter || status === 'Empty' || status === 'Paid'}
                    value={isExemptFromDefaulter || status === 'Empty' || status === 'Paid' ? 0 : manualArrears}
                    onChange={(e) => {
                      setManualArrears(Number(e.target.value));
                      setIsManualArrearsActive(true);
                    }}
                    className={`w-full pl-6 pr-3 py-1.5 rounded-xl font-mono font-black text-sm border focus:outline-none focus:ring-1 ${
                      isExemptFromDefaulter || status === 'Empty' || status === 'Paid'
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : status === 'Defaulter'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 focus:border-rose-500 focus:ring-rose-400'
                        : 'bg-amber-50 text-amber-900 border-amber-300 focus:border-amber-500 focus:ring-amber-400'
                    }`}
                  />
                </div>

                {status !== 'Paid' && status !== 'Empty' && !isExemptFromDefaulter && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualArrears(calculatedArrears);
                      setIsManualArrearsActive(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shrink-0"
                    title="Reset to calculated total from months"
                  >
                    ↺ Auto (₹{calculatedArrears})
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                You can directly edit the amount above (e.g. for settlements or fines).
              </p>
            </div>

            {/* Exemption Checkbox (Marks flat as Empty / Vacant with ₹0 due) */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-yellow-50/70 border border-yellow-300 hover:bg-yellow-50 transition">
                <input
                  type="checkbox"
                  checked={isExemptFromDefaulter || status === 'Empty'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsExemptFromDefaulter(checked);
                    if (checked) {
                      setStatus('Empty');
                      if (!exemptionReason) {
                        setExemptionReason('Flat was empty / Vacant');
                      }
                      setManualArrears(0);
                    } else {
                      setStatus(unpaidMonthsList.length > 0 ? (unpaidMonthsList.length >= 2 ? 'Defaulter' : 'Pending') : 'Paid');
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded text-yellow-500 border-slate-300 focus:ring-yellow-400"
                />
                <div className="text-xs">
                  <span className="font-black text-slate-950 block">
                    Mark Flat as Empty / Vacant (₹0 Due)
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5 font-medium leading-relaxed">
                    Check this when the flat is empty. It will be <strong>removed from Paid, Pending, and Defaulters lists</strong> with ₹0 outstanding.
                  </span>
                </div>
              </label>

              {(isExemptFromDefaulter || status === 'Empty') && (
                <div className="mt-2.5 pl-6">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Exemption / Vacant Note:
                  </label>
                  <input
                    type="text"
                    value={exemptionReason}
                    onChange={(e) => setExemptionReason(e.target.value)}
                    placeholder="e.g. Flat was empty / Vacant"
                    className="w-full px-3 py-1.5 bg-white border border-yellow-400 rounded-lg text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode (if paying) */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Payment Method (When cleared)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['UPI', 'Cash', 'Bank Transfer'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                    paymentMode === mode
                      ? 'bg-slate-950 text-white border-slate-950'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Maintenance Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Monthly Maintenance Charge (₹)
            </label>
            <input
              type="number"
              value={monthlyMaintenance}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMonthlyMaintenance(val);
                setMonthlyDues(monthlyDues.map(m => (m.isExempt ? m : { ...m, amount: val })));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note / Remark (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Promised to clear August and September by Monday"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                title="Remove Flat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm border border-yellow-500/60 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

