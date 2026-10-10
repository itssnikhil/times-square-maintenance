import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  RotateCcw, 
  Search,
  BellRing,
  Smartphone,
  Monitor
} from 'lucide-react';
import { SocietyConfig } from '../data/mockData';

interface NavbarProps {
  config: SocietyConfig;
  isAdmin: boolean;
  onOpenPinModal: () => void;
  onOpenReportModal: () => void;
  onOpenBroadcastModal: () => void;
  onOpenResidentLookup: () => void;
  onResetData: () => void;
  isDesktopPreview: boolean;
  onToggleDesktopPreview: () => void;
  defaultersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  isAdmin,
  onOpenPinModal,
  onOpenReportModal,
  onOpenBroadcastModal,
  onOpenResidentLookup,
  onResetData,
  isDesktopPreview,
  onToggleDesktopPreview,
  defaultersCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Society Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  Times Square
                </h1>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {config.currentBillingMonth}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden xs:block">
                CHS Ltd. · Maint. Portal
              </p>
            </div>
          </div>

          {/* Quick Actions & Admin Lock Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View As Resident Button */}
            {!isAdmin && (
              <button
                type="button"
                onClick={onOpenResidentLookup}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-h-[44px]"
                title="Search your flat dues"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">My Flat</span>
              </button>
            )}

            {/* Broadcast Defaulters Action (Admin Only) */}
            {isAdmin && defaultersCount > 0 && (
              <button
                type="button"
                onClick={onOpenBroadcastModal}
                className="relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-700/60 transition active:scale-95 min-h-[44px]"
                title="WhatsApp Defaulters Broadcast"
              >
                <BellRing className="w-4 h-4 text-rose-400 animate-bounce" />
                <span className="hidden md:inline">Reminders</span>
                <span className="w-4 h-4 text-[10px] font-bold rounded-full bg-rose-600 text-white flex items-center justify-center">
                  {defaultersCount}
                </span>
              </button>
            )}

            {/* Export Monthly Report */}
            <button
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-h-[44px]"
              title="Monthly Collection Report & CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Report</span>
            </button>

            {/* Admin Lock / Unlock Status Toggle */}
            <button
              type="button"
              onClick={onOpenPinModal}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-sm active:scale-95 min-h-[44px] ${
                isAdmin
                  ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/50 border-amber-600/60 text-amber-300 hover:bg-amber-900/50'
              }`}
              title={isAdmin ? "Admin Mode Active (Tap to lock)" : "Resident Mode (Tap to unlock Admin PIN)"}
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Secretary</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Unlock PIN</span>
                </>
              )}
            </button>

            {/* Reset Data Button */}
            <button
              type="button"
              onClick={onResetData}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Reset to default sample data (15 flats, 3 defaulters)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Toggle Mobile Phone Mockup vs Responsive Width (for testing on desktop) */}
            <button
              type="button"
              onClick={onToggleDesktopPreview}
              className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition min-h-[44px] min-w-[44px] items-center justify-center"
              title={isDesktopPreview ? "Switch to Wide Responsive View" : "Switch to Mobile Phone Viewport (390px)"}
            >
              {isDesktopPreview ? (
                <Monitor className="w-4 h-4 text-sky-400" />
              ) : (
                <Smartphone className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Admin status indicator banner */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isAdmin ? (
              <span className="text-emerald-300 font-medium">Secretary Mode Unlocked · Full Editing & Dues Control</span>
            ) : (
              <span className="text-slate-300">Resident Public Mode (View-Only) · Unlock with Secretary PIN to edit</span>
            )}
          </div>
          <div className="hidden xs:block text-slate-400">
            Reg: <span className="font-mono text-slate-300">{config.registrationNo}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
