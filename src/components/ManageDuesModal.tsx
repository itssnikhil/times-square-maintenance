import React, { useState, useMemo } from 'react';
import { FlatUnit } from '../data/mockData';
import { 
  X, 
  Save, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Home, 
  Check, 
  Building2, 
  Layers,
  RotateCcw
} from 'lucide-react';

interface ManageDuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  flats: FlatUnit[];
  onSaveAll: (updatedFlats: FlatUnit[]) => void;
  currentMonth?: string;
}

interface EditableFlatDraft {
  status: 'Paid' | 'Pending' | 'Defaulter' | 'Empty';
  isExemptFromDefaulter: boolean;
  exemptionReason: string;
  accumulatedArrears: number;
  overdueMonths: number;
  secretaryNotes: string;
}

// Indian Rupee Formatter
const formatINR = (amt: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amt);
};

export const ManageDuesModal: React.FC<ManageDuesModalProps> = ({
  isOpen,
  onClose,
  flats,
  onSaveAll,
  currentMonth = 'Oct 2026',
}) => {
  if (!isOpen) return null;

  // Local state of all draft flats indexed by flat ID
  const [drafts, setDrafts] = useState<Record<string, EditableFlatDraft>>(() => {
    const initial: Record<string, EditableFlatDraft> = {};
    flats.forEach((f) => {
      const isFlatEmpty = f.status === 'Empty' || Boolean(f.isExemptFromDefaulter) || (f.monthlyDues && f.monthlyDues.length > 0 && f.monthlyDues.every((m) => m.isExempt));
      initial[f.id] = {
        status: isFlatEmpty ? 'Empty' : f.status,
        isExemptFromDefaulter: Boolean(isFlatEmpty),
        exemptionReason: f.exemptionReason || (isFlatEmpty ? 'Flat was empty / Vacant' : ''),
        accumulatedArrears: isFlatEmpty 
          ? 0 
          : (f.customOverdueAmount !== undefined ? f.customOverdueAmount : f.accumulatedArrears),
        overdueMonths: isFlatEmpty ? 0 : f.overdueMonths,
        secretaryNotes: f.secretaryNotes || '',
      };
    });
    return initial;
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DEFAULTER' | 'PENDING' | 'PAID' | 'EMPTY'>('ALL');
  const [wingFilter, setWingFilter] = useState<'ALL' | 'A' | 'C'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Count changes
  const changedCount = useMemo(() => {
    let count = 0;
    flats.forEach((f) => {
      const d = drafts[f.id];
      if (!d) return;
      const isOriginalExempt = Boolean(f.isExemptFromDefaulter);
      if (
        d.status !== f.status ||
        d.isExemptFromDefaulter !== isOriginalExempt ||
        d.accumulatedArrears !== f.accumulatedArrears ||
        d.overdueMonths !== f.overdueMonths ||
        d.secretaryNotes !== f.secretaryNotes ||
        d.exemptionReason !== (f.exemptionReason || '')
      ) {
        count++;
      }
    });
    return count;
  }, [drafts, flats]);

  // Update a single field in draft
  const handleUpdateDraft = (id: string, updates: Partial<EditableFlatDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
      },
    }));
  };

  // Change flat status with smart default amount
  const handleSetStatus = (flat: FlatUnit, newStatus: 'Paid' | 'Pending' | 'Defaulter' | 'Exempt' | 'Empty') => {
    if (newStatus === 'Exempt' || newStatus === 'Empty') {
      handleUpdateDraft(flat.id, {
        status: 'Empty',
        isExemptFromDefaulter: true,
        exemptionReason: drafts[flat.id]?.exemptionReason || 'Flat was empty / Vacant',
        accumulatedArrears: 0,
        overdueMonths: 0,
      });
      return;
    }

    if (newStatus === 'Paid') {
      handleUpdateDraft(flat.id, {
        status: 'Paid',
        isExemptFromDefaulter: false,
        accumulatedArrears: 0,
        overdueMonths: 0,
      });
      return;
    }

    if (newStatus === 'Pending') {
      const prevAmt = drafts[flat.id]?.accumulatedArrears || 0;
      const defaultAmt = prevAmt > 0 ? prevAmt : flat.monthlyMaintenance;
      handleUpdateDraft(flat.id, {
        status: 'Pending',
        isExemptFromDefaulter: false,
        accumulatedArrears: defaultAmt,
        overdueMonths: drafts[flat.id]?.overdueMonths || 1,
      });
      return;
    }

    if (newStatus === 'Defaulter') {
      const prevAmt = drafts[flat.id]?.accumulatedArrears || 0;
      const defaultAmt = prevAmt > flat.monthlyMaintenance 
        ? prevAmt 
        : (flat.monthlyMaintenance * 2);
      handleUpdateDraft(flat.id, {
        status: 'Defaulter',
        isExemptFromDefaulter: false,
        accumulatedArrears: defaultAmt,
        overdueMonths: Math.max(drafts[flat.id]?.overdueMonths || 2, 2),
      });
    }
  };

  // Filter flats
  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      const d = drafts[flat.id];
      if (!d) return true;

      // Wing filter
      if (wingFilter !== 'ALL' && flat.wing !== wingFilter) return false;

      // Status filter
      if (activeFilter === 'DEFAULTER') {
        if (d.status !== 'Defaulter' || d.isExemptFromDefaulter) return false;
      } else if (activeFilter === 'PENDING') {
        if (d.status !== 'Pending' || d.isExemptFromDefaulter) return false;
      } else if (activeFilter === 'PAID') {
        if (d.status !== 'Paid' || d.isExemptFromDefaulter) return false;
      } else if (activeFilter === 'EMPTY') {
        if (d.status !== 'Empty' && !d.isExemptFromDefaulter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesFlat = flat.flatNo.toLowerCase().includes(q);
        const matchesName = flat.residentName.toLowerCase().includes(q);
        if (!matchesFlat && !matchesName) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort Defaulters first, then Pending, then Paid, then Empty
      const da = drafts[a.id];
      const db = drafts[b.id];
      const order: Record<string, number> = { Defaulter: 1, Pending: 2, Paid: 3, Empty: 4 };
      const statusA = da?.isExemptFromDefaulter ? 4 : (order[da?.status || 'Paid'] || 3);
      const statusB = db?.isExemptFromDefaulter ? 4 : (order[db?.status || 'Paid'] || 3);
      if (statusA !== statusB) return statusA - statusB;
      return a.flatNo.localeCompare(b.flatNo);
    });
  }, [flats, drafts, wingFilter, activeFilter, searchQuery]);

  // Aggregate stats from current drafts
  const stats = useMemo(() => {
    let defaultersCount = 0;
    let defaultersSum = 0;
    let pendingCount = 0;
    let pendingSum = 0;
    let paidCount = 0;
    let emptyCount = 0;

    flats.forEach((f) => {
      const d = drafts[f.id];
      if (!d) return;
      if (d.status === 'Empty' || d.isExemptFromDefaulter) {
        emptyCount++;
      } else if (d.status === 'Paid') {
        paidCount++;
      } else if (d.status === 'Defaulter') {
        defaultersCount++;
        defaultersSum += Number(d.accumulatedArrears || 0);
      } else {
        pendingCount++;
        pendingSum += Number(d.accumulatedArrears || f.monthlyMaintenance);
      }
    });

    return {
      defaultersCount,
      defaultersSum,
      pendingCount,
      pendingSum,
      paidCount,
      emptyCount,
    };
  }, [flats, drafts]);

  const handleSaveAll = () => {
    const updatedFlats = flats.map((f) => {
      const d = drafts[f.id];
      if (!d) return f;

      const isDraftEmpty = d.status === 'Empty' || d.isExemptFromDefaulter;
      const finalStatus: FlatUnit['status'] = isDraftEmpty ? 'Empty' : d.status;
      const finalArrears = (isDraftEmpty || finalStatus === 'Paid') ? 0 : Number(d.accumulatedArrears || 0);

      // If flat is marked empty or paid, update monthly dues appropriately
      let nextDues = f.monthlyDues;
      if (finalStatus === 'Empty') {
        nextDues = f.monthlyDues?.map((m) => ({
          ...m,
          isPaid: false,
          isExempt: true,
          amount: 0,
        }));
      } else if (finalStatus === 'Paid') {
        nextDues = f.monthlyDues?.map((m) => ({
          ...m,
          isPaid: true,
          isExempt: false,
        }));
      }

      return {
        ...f,
        status: finalStatus,
        isExemptFromDefaulter: isDraftEmpty,
        exemptionReason: isDraftEmpty ? (d.exemptionReason.trim() || 'Flat was empty / Vacant') : undefined,
        accumulatedArrears: finalArrears,
        customOverdueAmount: (finalStatus !== 'Paid' && finalStatus !== 'Empty') ? finalArrears : undefined,
        manualStatusOverride: true,
        overdueMonths: (finalStatus === 'Paid' || finalStatus === 'Empty') ? 0 : d.overdueMonths,
        secretaryNotes: d.secretaryNotes,
        monthlyDues: nextDues || f.monthlyDues,
      };
    });

    onSaveAll(updatedFlats);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b-2 border-yellow-400 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Edit Pending & Defaulter List
                </h2>
                <span className="text-[10px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                  Secretary Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Directly add/remove flats from Pending & Defaulter list and set custom overdue amounts by yourself.
              </p>
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

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100 border-b border-slate-200 shrink-0 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-rose-200 shadow-xs">
            <span className="text-[10px] font-black uppercase text-rose-700 block">
              🚨 Defaulters List ({stats.defaultersCount})
            </span>
            <div className="font-mono font-black text-sm sm:text-base text-rose-700 mt-0.5">
              {formatINR(stats.defaultersSum)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-xs">
            <span className="text-[10px] font-black uppercase text-amber-700 block">
              ⏳ Pending List ({stats.pendingCount})
            </span>
            <div className="font-mono font-black text-sm sm:text-base text-amber-700 mt-0.5">
              {formatINR(stats.pendingSum)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-black uppercase text-emerald-700 block">
              ✓ Paid / Cleared ({stats.paidCount})
            </span>
            <div className="font-mono font-black text-sm sm:text-base text-emerald-700 mt-0.5">
              ₹0 Due
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'DEFAULTER', 'PENDING', 'PAID', 'EMPTY'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`py-1.5 px-2.5 text-xs font-bold rounded-lg transition ${
                  activeFilter === tab
                    ? 'bg-slate-950 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Units' : tab === 'DEFAULTER' ? 'Defaulters' : tab === 'PENDING' ? 'Pending' : tab === 'PAID' ? 'Paid' : 'Empty'}
              </button>
            ))}
          </div>

          {/* Wing Filter & Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'A', 'C'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWingFilter(w)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg transition ${
                    wingFilter === w
                      ? 'bg-yellow-400 text-slate-950 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {w === 'ALL' ? 'Both' : `Wing ${w}`}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flat/name..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Flat List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-50">
          {filteredFlats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No flats matching the selected filter.
            </div>
          ) : (
            filteredFlats.map((flat) => {
              const d = drafts[flat.id];
              if (!d) return null;

              const isExempt = d.isExemptFromDefaulter;
              const isDefaulter = !isExempt && d.status === 'Defaulter';
              const isPending = !isExempt && d.status === 'Pending';
              const isPaid = isExempt || d.status === 'Paid';

              return (
                <div
                  key={flat.id}
                  className={`p-3 rounded-2xl border transition shadow-xs bg-white ${
                    isDefaulter
                      ? 'border-rose-300 border-l-4 border-l-rose-600'
                      : isPending
                      ? 'border-amber-300 border-l-4 border-l-amber-500'
                      : isExempt
                      ? 'border-yellow-300 border-l-4 border-l-yellow-400'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Flat Info */}
                    <div className="min-w-0 sm:w-48">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-base text-slate-950">
                          {flat.flatNo}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-yellow-100 text-slate-900 border border-yellow-300">
                          Wing {flat.wing}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                        {flat.residentName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Rate: ₹{flat.monthlyMaintenance}/mo
                      </div>
                    </div>

                    {/* Status Buttons: 4 instant choices */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(flat, 'Paid')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                          isPaid && !isExempt
                            ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(flat, 'Pending')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                          isPending
                            ? 'bg-yellow-400 text-slate-950 border-yellow-500 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(flat, 'Defaulter')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                          isDefaulter
                            ? 'bg-rose-600 text-white border-rose-700 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Defaulter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(flat, 'Exempt')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                          isExempt
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Exempt flat from both Defaulters & Pending (Flat was empty)"
                      >
                        <Home className="w-3.5 h-3.5" />
                        <span>Exempt (Empty)</span>
                      </button>
                    </div>

                    {/* Direct Custom Amount & Overdue Months input */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Amount Due (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            disabled={isPaid}
                            value={isPaid ? 0 : d.accumulatedArrears}
                            onChange={(e) => {
                              handleUpdateDraft(flat.id, {
                                accumulatedArrears: Number(e.target.value),
                              });
                            }}
                            className={`w-28 pl-6 pr-2 py-1.5 text-xs font-mono font-black rounded-lg border focus:outline-none focus:ring-1 ${
                              isPaid
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : isDefaulter
                                ? 'bg-rose-50 text-rose-700 border-rose-300 focus:border-rose-500 focus:ring-rose-400'
                                : 'bg-amber-50 text-amber-800 border-amber-300 focus:border-amber-500 focus:ring-amber-400'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Months
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          min={0}
                          max={12}
                          value={isPaid ? 0 : d.overdueMonths}
                          onChange={(e) => {
                            handleUpdateDraft(flat.id, {
                              overdueMonths: Number(e.target.value),
                            });
                          }}
                          className={`w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border text-center focus:outline-none ${
                            isPaid
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-yellow-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes / Reason Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">
                      {isExempt ? 'Exemption Reason:' : 'Note / Remark:'}
                    </span>
                    <input
                      type="text"
                      value={isExempt ? d.exemptionReason : d.secretaryNotes}
                      onChange={(e) => {
                        if (isExempt) {
                          handleUpdateDraft(flat.id, { exemptionReason: e.target.value });
                        } else {
                          handleUpdateDraft(flat.id, { secretaryNotes: e.target.value });
                        }
                      }}
                      placeholder={isExempt ? "e.g. Flat was empty / Committee approved" : "e.g. Promised by Monday / Settlement agreed"}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            {changedCount > 0 ? (
              <span className="font-bold text-amber-700">
                ⚠️ {changedCount} flat(s) modified in this session
              </span>
            ) : (
              <span className="text-slate-500">
                No changes yet. Edit status or amount above.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-500 shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save All Updates ({changedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
