import React, { useState } from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency, generateWhatsAppMessage, getWhatsAppLink } from '../utils/helpers';
import { X, MessageCircle, Copy, Check, Send, AlertOctagon, CheckCheck } from 'lucide-react';

interface WhatsAppBroadcastModalProps {
  defaulters: FlatUnit[];
  config: SocietyConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  defaulters,
  config,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopySingle = (flat: FlatUnit, index: number) => {
    const msg = generateWhatsAppMessage(flat, config);
    navigator.clipboard.writeText(msg);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = defaulters
      .map((f) => `--- FLAT ${f.flatNo} (${f.residentName}) ---\n${generateWhatsAppMessage(f, config)}`)
      .join('\n\n====================\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-600/60 flex items-center justify-center text-rose-300">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Defaulter WhatsApp Reminders</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                  {defaulters.length} Pending
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-Tap personalized automated messages as per society bylaws
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-300">
            💡 <strong>Official Protocol:</strong> Tapping "Send via WhatsApp" opens WhatsApp with the exact formal demand notice pre-filled.
          </div>

          {defaulters.map((flat, idx) => {
            const total = flat.accumulatedArrears + (flat.lateFeeApplied ? flat.lateFeeAmount : 0);
            const msg = generateWhatsAppMessage(flat, config);
            const waLink = getWhatsAppLink(flat.phone || '', msg);

            return (
              <div
                key={flat.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-900/60 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">
                        {flat.flatNo}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">
                        {flat.residentName}
                      </span>
                    </div>
                    <div className="text-xs text-rose-400 font-semibold mt-0.5">
                      {flat.overdueMonths} Months Overdue · {formatCurrency(total)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(flat, idx)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                      title="Copy text"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-amber-400" />
                      )}
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Message preview snippet */}
                <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono leading-relaxed line-clamp-3">
                  {msg}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-1 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
          >
            {copiedAll ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">All Messages Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy All {defaulters.length} Messages to Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
