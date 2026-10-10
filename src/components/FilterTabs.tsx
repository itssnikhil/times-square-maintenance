import React from 'react';
import { Search, LayoutGrid, Table, X } from 'lucide-react';

interface FilterTabsProps {
  activeTab: 'ALL' | 'PAID' | 'PENDING' | 'DEFAULTER';
  onTabChange: (tab: 'ALL' | 'PAID' | 'PENDING' | 'DEFAULTER') => void;
  counts: {
    all: number;
    paid: number;
    pending: number;
    defaulters: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  wingFilter: 'ALL' | 'A' | 'B';
  onWingFilterChange: (wing: 'ALL' | 'A' | 'B') => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
  wingFilter,
  onWingFilterChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="space-y-2.5">
      {/* Top Filter Switcher: [ All Units | Paid | Pending | 🚨 Defaulters ] */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
        {/* All Units */}
        <button
          type="button"
          onClick={() => onTabChange('ALL')}
          className={`min-h-[44px] px-2 py-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'ALL'
              ? 'bg-slate-750 text-white shadow-sm ring-1 ring-slate-600 font-bold bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <span>All Units</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {counts.all}
          </span>
        </button>

        {/* Paid */}
        <button
          type="button"
          onClick={() => onTabChange('PAID')}
          className={`min-h-[44px] px-2 py-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'PAID'
              ? 'bg-emerald-950/70 text-emerald-300 shadow-sm border border-emerald-600/50 ring-1 ring-emerald-500/30 font-bold'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-slate-850'
          }`}
        >
          <span>Paid</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'PAID' ? 'bg-emerald-800 text-white' : 'bg-emerald-950 text-emerald-400'
          }`}>
            {counts.paid}
          </span>
        </button>

        {/* Pending */}
        <button
          type="button"
          onClick={() => onTabChange('PENDING')}
          className={`min-h-[44px] px-2 py-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'PENDING'
              ? 'bg-amber-950/70 text-amber-300 shadow-sm border border-amber-600/50 ring-1 ring-amber-500/30 font-bold'
              : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-850'
          }`}
        >
          <span>Pending</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'PENDING' ? 'bg-amber-800 text-white' : 'bg-amber-950 text-amber-400'
          }`}>
            {counts.pending}
          </span>
        </button>

        {/* 🚨 Defaulters */}
        <button
          type="button"
          onClick={() => onTabChange('DEFAULTER')}
          className={`min-h-[44px] px-2 py-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 relative ${
            activeTab === 'DEFAULTER'
              ? 'bg-rose-950 text-rose-300 shadow-md border border-rose-500 ring-1 ring-rose-500/40 font-bold'
              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30'
          }`}
        >
          <span className="flex items-center gap-1">
            <span>🚨</span>
            <span>Defaulters</span>
          </span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'DEFAULTER' ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-950 text-rose-300'
          }`}>
            {counts.defaulters}
          </span>
        </button>
      </div>

      {/* Search Bar + Wing Filter + Card/Table Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search flat (e.g. A-202), resident name..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Secondary controls row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Wing Selector */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 min-h-[44px]">
            <button
              type="button"
              onClick={() => onWingFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                wingFilter === 'ALL'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Wings
            </button>
            <button
              type="button"
              onClick={() => onWingFilterChange('A')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                wingFilter === 'A'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wing A
            </button>
            <button
              type="button"
              onClick={() => onWingFilterChange('B')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                wingFilter === 'B'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wing B
            </button>
          </div>

          {/* View Mode Toggle: Card vs Table (for larger viewports) */}
          <div className="hidden md:flex bg-slate-900 p-1 rounded-xl border border-slate-800 min-h-[44px] items-center">
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              className={`p-2 rounded-lg text-xs transition ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card View (Mobile Optimized)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-2 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View (Spreadsheet)"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
