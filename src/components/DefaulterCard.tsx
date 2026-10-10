import React, { useState } from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency, generateWhatsAppMessage, getWhatsAppLink } from '../utils/helpers';
import { 
  AlertOctagon, 
  MessageCircle, 
  Copy, 
  Check, 
  Edit3, 
  Calendar, 
  Receipt, 
  Clock, 
  ShieldAlert, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DefaulterCardProps {
  flat: FlatUnit;
  config: SocietyConfig;
  isAdmin: boolean;
  onEdit: (flat: FlatUnit) => void;
  onToggleLateFee: (flatId: string, applied: boolean) => void;
  onViewReceipt?: (flat: FlatUnit) => void;
}

export const DefaulterCard: React.FC<DefaulterCardProps> = ({
  flat,
  config,
  isAdmin,
  onEdit,
  onToggleLateFee,
  onViewReceipt,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const totalDues = flat.accumulatedArrears + (flat.lateFeeApplied ? flat.lateFeeAmount : 0);
  const waMessage = generateWhatsAppMessage(flat, config);
  const waLink = getWhatsAppLink(flat.phone || '', waMessage);

  const handleCopyMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleLateFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleLateFee(flat.id, e.target.checked);
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-rose-600/70 shadow-xl shadow-rose-950/30 overflow-hidden defaulter-pulse transition-all">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900/80 to-amber-950 px-3.5 py-2 flex items-center justify-between border-b border-rose-800/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-black tracking-wide uppercase text-rose-200 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            CRITICAL DEFAULTER · {flat.overdueMonths} MONTHS OVERDUE
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded-full border border-rose-700/60">
          Floor {flat.floor}
        </span>
      </div>

      <div className="p-3.5 sm:p-4">
        {/* Main Unit Header & Prominent Dues */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {flat.flatNo}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Wing {flat.wing}
              </span>
              <span className="text-[11px] text-slate-400">
                ({flat.ownership})
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-200 mt-1">
              {flat.residentName}
            </h3>
          </div>

          {/* Prominent Accumulated Arrears Box */}
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              Total Arrears Due
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight mt-0.5">
              {formatCurrency(totalDues)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Base: {formatCurrency(flat.accumulatedArrears)}
              {flat.lateFeeApplied && (
                <span className="text-amber-400 font-semibold"> + {formatCurrency(flat.lateFeeAmount)} fee</span>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Breakdown Bar */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/80 border border-rose-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Monthly Rate: <strong className="text-slate-100">{formatCurrency(flat.monthlyMaintenance)}/mo</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>Last Paid: <span className="text-slate-200 font-medium">{flat.lastPaidDate || 'None recorded'}</span></span>
          </div>
        </div>

        {/* Secretary Notes (Crucial context for admin) */}
        {flat.secretaryNotes && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase text-amber-400/90 block">
                Secretary Memo:
              </span>
              <p className="italic text-slate-300/90 text-xs mt-0.5">
                "{flat.secretaryNotes}"
              </p>
            </div>
          </div>
        )}

        {/* Late Fee Rule Toggle (Admin only) */}
        {isAdmin && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-amber-200 font-medium">
              <input
                type="checkbox"
                checked={flat.lateFeeApplied}
                onChange={handleLateFeeChange}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span>Apply Late Fee ({flat.overdueMonths} mo × ₹{config.lateFeePerMonth} = {formatCurrency(flat.lateFeeAmount)})</span>
            </label>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              {flat.lateFeeApplied ? 'ACTIVE' : 'WAIVED'}
            </span>
          </div>
        )}

        {/* Action Buttons: 1-Tap WhatsApp, Call, Copy Message, Admin Edit */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Automated 1-Tap WhatsApp Reminder */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40 transition active:scale-95 min-h-[44px]"
            title="Send pre-filled WhatsApp reminder"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Copy Message Text */}
          <button
            type="button"
            onClick={handleCopyMessage}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-h-[44px]"
            title="Copy pre-filled reminder template"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* Secretary Quick Edit (Admin Only) */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onEdit(flat)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-950/30 transition active:scale-95 min-h-[44px]"
              title="Update status, record payment, or add notes"
            >
              <Edit3 className="w-4 h-4" />
              <span>Update</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onViewReceipt && onViewReceipt(flat)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-h-[44px]"
              title="View account ledger statement"
            >
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>Dues Bill</span>
            </button>
          )}
        </div>

        {/* Expandable Preview of Pre-filled WhatsApp message */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-300 py-1"
          >
            <span className="flex items-center gap-1 font-medium">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              Preview 1-Tap WhatsApp Reminder Message
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="mt-1.5 p-3 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono leading-relaxed border border-slate-800 select-all whitespace-pre-wrap">
              {waMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
