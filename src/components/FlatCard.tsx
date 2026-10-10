import React, { useState } from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency, generateWhatsAppMessage, getWhatsAppLink } from '../utils/helpers';
import { 
  MessageCircle, 
  Edit3, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  User,
  Sparkles
} from 'lucide-react';

interface FlatCardProps {
  flat: FlatUnit;
  config: SocietyConfig;
  isAdmin: boolean;
  onEdit: (flat: FlatUnit) => void;
  onViewReceipt: (flat: FlatUnit) => void;
}

export const FlatCard: React.FC<FlatCardProps> = ({
  flat,
  config,
  isAdmin,
  onEdit,
  onViewReceipt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPaid = flat.status === 'Paid';
  const isPending = flat.status === 'Pending';

  const waMessage = generateWhatsAppMessage(flat, config);
  const waLink = getWhatsAppLink(flat.phone || '', waMessage);

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isPaid
        ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-800/60'
        : 'bg-slate-900/95 border-amber-900/50 hover:border-amber-700/60 shadow-md shadow-amber-950/20'
    }`}>
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Unit & Resident Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
                {flat.flatNo}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Wing {flat.wing} · F{flat.floor}
              </span>
              <span className="text-[11px] text-slate-400">
                ({flat.ownership})
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                {flat.residentName}
              </h3>
            </div>
          </div>

          {/* Status Badge & Amount */}
          <div className="text-right shrink-0">
            {/* Status Badge */}
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-600/70 text-emerald-400 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paid</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 border border-amber-600/70 text-amber-300 shadow-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
              </span>
            )}

            <div className="text-base sm:text-lg font-bold text-white font-mono tracking-tight mt-1.5">
              {formatCurrency(flat.monthlyMaintenance)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              per month
            </span>
          </div>
        </div>

        {/* Payment info summary row */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex flex-wrap items-center justify-between gap-2 text-xs">
          {isPaid ? (
            <>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paid on {flat.lastPaidDate}</span>
                <span className="text-[11px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800/60 font-semibold">
                  {flat.lastPaymentMode}
                </span>
              </div>
              {flat.referenceNo && (
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">
                  Ref: {flat.referenceNo}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Due for {config.currentBillingMonth}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Last: {flat.lastPaidDate || 'N/A'} ({flat.lastPaymentMode || 'N/A'})
              </span>
            </>
          )}
        </div>

        {/* Secretary notes preview */}
        {flat.secretaryNotes && (
          <div className="mt-2 text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 flex items-start gap-1.5">
            <span className="text-amber-400 not-italic font-bold text-[10px] uppercase shrink-0">Note:</span>
            <span className="truncate">{flat.secretaryNotes}</span>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Quick WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition active:scale-95 min-h-[44px]"
            title="Chat with resident on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          {/* View Official Receipt / Ledger */}
          <button
            type="button"
            onClick={() => onViewReceipt(flat)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-h-[44px]"
            title="View & Print Official Maintenance Receipt"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Receipt</span>
          </button>

          {/* Secretary Quick Edit (Admin Only) */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onEdit(flat)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition active:scale-95 min-h-[44px]"
              title="Secretary Quick Update"
            >
              <Edit3 className="w-4 h-4" />
              <span>Update</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-750 text-slate-400 border border-slate-800 transition min-h-[44px]"
            >
              <span>Details</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Expandable History Drawer */}
        {isAdmin && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-slate-400 hover:text-slate-300 inline-flex items-center gap-1 py-1"
            >
              <span>{isExpanded ? 'Hide payment history' : 'View past payment history'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-xs">
            <h4 className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Recent Payment Log & Ledger
            </h4>
            {flat.history.length > 0 ? (
              <div className="space-y-1.5">
                {flat.history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-300"
                  >
                    <div>
                      <span className="font-medium text-white">{item.month}</span>
                      <div className="text-[11px] text-slate-400">
                        {item.date} · {item.mode} {item.referenceNo && `(${item.referenceNo})`}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No previous ledger entries stored.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
