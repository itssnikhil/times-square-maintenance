import React from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency, exportToCSV } from '../utils/helpers';
import { X, Download, Printer, FileSpreadsheet, TrendingUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  flats: FlatUnit[];
  config: SocietyConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  flats,
  config,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const paidFlats = flats.filter((f) => f.status === 'Paid');
  const pendingFlats = flats.filter((f) => f.status === 'Pending');
  const defaulterFlats = flats.filter((f) => f.status === 'Defaulter');

  const totalCollected = paidFlats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);
  const targetMonthly = flats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);
  const pendingCurrentMonth = pendingFlats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);
  const totalArrears = defaulterFlats.reduce(
    (sum, f) => sum + f.accumulatedArrears + (f.lateFeeApplied ? f.lateFeeAmount : 0),
    0
  );

  // By payment mode for paid flats
  const modeStats = paidFlats.reduce((acc, f) => {
    const m = f.lastPaymentMode || 'UPI';
    acc[m] = (acc[m] || 0) + f.monthlyMaintenance;
    return acc;
  }, {} as Record<string, number>);

  // By wing
  const wingAFlats = flats.filter((f) => f.wing === 'A');
  const wingBFlats = flats.filter((f) => f.wing === 'B');
  const wingACollected = wingAFlats.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + f.monthlyMaintenance, 0);
  const wingBCollected = wingBFlats.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + f.monthlyMaintenance, 0);

  const handleDownloadCSV = () => {
    exportToCSV(flats, config);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="no-print p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Monthly Collection Audit Report
              </h2>
              <p className="text-xs text-slate-400">
                {config.name} · {config.currentBillingMonth}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 print-card text-xs sm:text-sm">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Total Target</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">{formatCurrency(targetMonthly)}</span>
              <span className="text-[10px] text-slate-500">{flats.length} flats</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
              <span className="text-[10px] uppercase text-emerald-400 font-semibold block">Collected</span>
              <span className="text-base font-bold text-emerald-300 font-mono mt-0.5 block">{formatCurrency(totalCollected)}</span>
              <span className="text-[10px] text-emerald-400/80">{paidFlats.length} flats</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60">
              <span className="text-[10px] uppercase text-amber-400 font-semibold block">Pending</span>
              <span className="text-base font-bold text-amber-300 font-mono mt-0.5 block">{formatCurrency(pendingCurrentMonth)}</span>
              <span className="text-[10px] text-amber-400/80">{pendingFlats.length} flats</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60">
              <span className="text-[10px] uppercase text-rose-400 font-semibold block">Arrears Due</span>
              <span className="text-base font-bold text-rose-300 font-mono mt-0.5 block">{formatCurrency(totalArrears)}</span>
              <span className="text-[10px] text-rose-400/80">{defaulterFlats.length} defaulters</span>
            </div>
          </div>

          {/* Breakdown by Payment Mode */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Collections by Payment Method
            </h3>
            <div className="space-y-2">
              {Object.entries(modeStats).map(([mode, amt]) => {
                const pct = totalCollected > 0 ? Math.round((amt / totalCollected) * 100) : 0;
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{mode}</span>
                      <span className="text-white font-mono font-bold">{formatCurrency(amt)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wing-wise Collections */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold text-white block">Wing A Performance</span>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1">{formatCurrency(wingACollected)}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {wingAFlats.filter((f) => f.status === 'Paid').length} / {wingAFlats.length} flats cleared
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold text-white block">Wing B Performance</span>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1">{formatCurrency(wingBCollected)}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {wingBFlats.filter((f) => f.status === 'Paid').length} / {wingBFlats.length} flats cleared
              </p>
            </div>
          </div>

          {/* Defaulter Action Items Summary */}
          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Critical Defaulter Action Register</span>
            </div>
            <div className="space-y-1.5">
              {defaulterFlats.map((d) => (
                <div key={d.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-mono font-bold text-white">{d.flatNo}</span> · {d.residentName}
                    <div className="text-[10px] text-rose-400">{d.overdueMonths} months overdue</div>
                  </div>
                  <span className="font-mono font-bold text-rose-300">
                    {formatCurrency(d.accumulatedArrears + (d.lateFeeApplied ? d.lateFeeAmount : 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with CSV Export button */}
        <div className="no-print p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex-1 min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-950/50"
          >
            <Download className="w-4 h-4" />
            <span>Download Full CSV Export ({flats.length} Flats)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
