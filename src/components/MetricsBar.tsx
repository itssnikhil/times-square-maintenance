import React from 'react';
import { FlatUnit } from '../data/mockData';
import { formatCurrency } from '../utils/helpers';
import { CheckCircle2, Clock, AlertTriangle, Building, TrendingUp } from 'lucide-react';

interface MetricsBarProps {
  flats: FlatUnit[];
  onSelectFilter: (filter: 'ALL' | 'PAID' | 'PENDING' | 'DEFAULTER') => void;
  activeFilter: 'ALL' | 'PAID' | 'PENDING' | 'DEFAULTER';
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  flats,
  onSelectFilter,
  activeFilter,
}) => {
  const totalFlats = flats.length;
  const paidFlats = flats.filter((f) => f.status === 'Paid');
  const pendingFlats = flats.filter((f) => f.status === 'Pending');
  const defaulterFlats = flats.filter((f) => f.status === 'Defaulter');

  // Collected this month (sum of monthly maintenance for paid flats)
  const totalCollected = paidFlats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);

  // Target collection for the month (sum of monthly maintenance of all 15 flats)
  const targetCollection = flats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);

  // Pending for current month
  const totalPendingCurrentMonth = pendingFlats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);

  // Total Outstanding Defaulter Arrears (including late fees)
  const totalDefaulterArrears = defaulterFlats.reduce(
    (sum, f) => sum + f.accumulatedArrears + (f.lateFeeApplied ? f.lateFeeAmount : 0),
    0
  );

  const totalOutstanding = totalPendingCurrentMonth + totalDefaulterArrears;

  const collectionPercentage = targetCollection > 0 
    ? Math.round((totalCollected / targetCollection) * 100) 
    : 0;

  return (
    <div className="w-full">
      {/* 4 Cards Grid - 2x2 on mobile, 4-col on tablet/desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Total Flats */}
        <button
          type="button"
          onClick={() => onSelectFilter('ALL')}
          className={`flex flex-col text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-98 ${
            activeFilter === 'ALL'
              ? 'bg-slate-800/90 border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Flats
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {totalFlats}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Wing A (8) · Wing B (7)
          </span>
        </button>

        {/* Metric 2: Total Collected This Month */}
        <button
          type="button"
          onClick={() => onSelectFilter('PAID')}
          className={`flex flex-col text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-98 ${
            activeFilter === 'PAID'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-800/50 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
              Collected
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">
              {formatCurrency(totalCollected)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-400/90 mt-1">
            <span>{paidFlats.length} paid</span>
            <span className="font-semibold text-emerald-300">{collectionPercentage}%</span>
          </div>
        </button>

        {/* Metric 3: Pending Current Month */}
        <button
          type="button"
          onClick={() => onSelectFilter('PENDING')}
          className={`flex flex-col text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-98 ${
            activeFilter === 'PENDING'
              ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-800/50 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
              Pending
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
              {formatCurrency(totalPendingCurrentMonth)}
            </span>
          </div>
          <span className="text-[11px] text-amber-400/90 mt-1">
            {pendingFlats.length} flats due this month
          </span>
        </button>

        {/* Metric 4: Defaulters / Outstanding Arrears */}
        <button
          type="button"
          onClick={() => onSelectFilter('DEFAULTER')}
          className={`flex flex-col text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-98 relative overflow-hidden ${
            activeFilter === 'DEFAULTER'
              ? 'bg-rose-950/50 border-rose-500 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/40'
              : 'bg-rose-950/25 border-rose-900/60 hover:border-rose-700 hover:bg-rose-950/40'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <span>🚨 Defaulters</span>
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-900/70 border border-rose-600/50 flex items-center justify-center text-rose-300 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight">
              {formatCurrency(totalDefaulterArrears)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-rose-300 font-medium mt-1">
            <span>{defaulterFlats.length} units overdue</span>
            <span className="underline">Action Needed</span>
          </div>
        </button>
      </div>

      {/* Monthly Collection Progress Bar */}
      <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Monthly Target: {formatCurrency(targetCollection)}</span>
          </div>
          <span className="text-emerald-400 font-bold">
            {formatCurrency(totalCollected)} ({collectionPercentage}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
