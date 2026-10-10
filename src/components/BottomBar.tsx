import React from 'react';
import { 
  PlusCircle, 
  AlertOctagon, 
  FileSpreadsheet, 
  ShieldCheck, 
  ShieldAlert, 
  Search,
  BellRing
} from 'lucide-react';

interface BottomBarProps {
  isAdmin: boolean;
  defaultersCount: number;
  onOpenPinModal: () => void;
  onOpenReportModal: () => void;
  onOpenBroadcastModal: () => void;
  onOpenResidentLookup: () => void;
  onSelectDefaultersTab: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  isAdmin,
  defaultersCount,
  onOpenPinModal,
  onOpenReportModal,
  onOpenBroadcastModal,
  onOpenResidentLookup,
  onSelectDefaultersTab,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 sm:hidden shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {/* Tab 1: Defaulters quick jump */}
        <button
          type="button"
          onClick={onSelectDefaultersTab}
          className="min-h-[46px] flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition active:scale-95 relative"
        >
          <div className="relative">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            {defaultersCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                {defaultersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-rose-300 mt-0.5">Defaulters</span>
        </button>

        {/* Tab 2: Broadcast (if admin) or Find Flat (if resident) */}
        {isAdmin ? (
          <button
            type="button"
            onClick={onOpenBroadcastModal}
            className="min-h-[46px] flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition active:scale-95"
          >
            <BellRing className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-semibold text-slate-300 mt-0.5">WhatsApp</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenResidentLookup}
            className="min-h-[46px] flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition active:scale-95"
          >
            <Search className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-300 mt-0.5">My Flat</span>
          </button>
        )}

        {/* Tab 3: Monthly Report */}
        <button
          type="button"
          onClick={onOpenReportModal}
          className="min-h-[46px] flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition active:scale-95"
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-semibold text-slate-300 mt-0.5">Report</span>
        </button>

        {/* Tab 4: Admin PIN lock/unlock */}
        <button
          type="button"
          onClick={onOpenPinModal}
          className={`min-h-[46px] flex flex-col items-center justify-center p-1 rounded-xl transition active:scale-95 ${
            isAdmin
              ? 'text-emerald-400 hover:bg-emerald-950/40'
              : 'text-amber-400 hover:bg-amber-950/40'
          }`}
        >
          {isAdmin ? (
            <>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 mt-0.5">Secretary</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 mt-0.5">Unlock</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
