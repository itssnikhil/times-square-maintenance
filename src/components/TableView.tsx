import React from 'react';
import { FlatUnit, SocietyConfig } from '../data/mockData';
import { formatCurrency, generateWhatsAppMessage, getWhatsAppLink } from '../utils/helpers';
import { 
  MessageCircle, 
  Edit3, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

interface TableViewProps {
  flats: FlatUnit[];
  config: SocietyConfig;
  isAdmin: boolean;
  onEdit: (flat: FlatUnit) => void;
  onViewReceipt: (flat: FlatUnit) => void;
  onToggleLateFee: (flatId: string, applied: boolean) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  flats,
  config,
  isAdmin,
  onEdit,
  onViewReceipt,
  onToggleLateFee,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/95 shadow-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
            <th className="py-3 px-3 sm:px-4">Flat No</th>
            <th className="py-3 px-3 sm:px-4">Resident</th>
            <th className="py-3 px-3 sm:px-4">Status</th>
            <th className="py-3 px-3 sm:px-4">Monthly Dues</th>
            <th className="py-3 px-3 sm:px-4">Overdue / Arrears</th>
            <th className="py-3 px-3 sm:px-4">Last Payment</th>
            <th className="py-3 px-3 sm:px-4">Secretary Memo</th>
            <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {flats.map((flat) => {
            const isDefaulter = flat.status === 'Defaulter';
            const isPaid = flat.status === 'Paid';
            const totalDue = isDefaulter
              ? flat.accumulatedArrears + (flat.lateFeeApplied ? flat.lateFeeAmount : 0)
              : isPaid
              ? 0
              : flat.monthlyMaintenance;

            const waMessage = generateWhatsAppMessage(flat, config);
            const waLink = getWhatsAppLink(flat.phone || '', waMessage);

            return (
              <tr
                key={flat.id}
                className={`transition-colors ${
                  isDefaulter
                    ? 'bg-rose-950/20 hover:bg-rose-950/30 font-medium'
                    : isPaid
                    ? 'hover:bg-slate-850/50'
                    : 'bg-amber-950/10 hover:bg-amber-950/20'
                }`}
              >
                {/* Flat No */}
                <td className="py-3 px-3 sm:px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white text-sm">
                      {flat.flatNo}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      W-{flat.wing}
                    </span>
                  </div>
                </td>

                {/* Resident */}
                <td className="py-3 px-3 sm:px-4">
                  <div className="font-semibold text-slate-100">{flat.residentName}</div>
                </td>

                {/* Status */}
                <td className="py-3 px-3 sm:px-4">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 border border-emerald-600/60 text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Paid
                    </span>
                  ) : isDefaulter ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950 border border-rose-600/70 text-rose-300 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Defaulter ({flat.overdueMonths} mo)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 border border-amber-600/60 text-amber-300">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Pending
                    </span>
                  )}
                </td>

                {/* Monthly Dues */}
                <td className="py-3 px-3 sm:px-4 font-mono text-slate-200">
                  {formatCurrency(flat.monthlyMaintenance)}
                </td>

                {/* Overdue / Arrears */}
                <td className="py-3 px-3 sm:px-4">
                  {isDefaulter ? (
                    <div>
                      <span className="font-mono font-bold text-rose-400">
                        {formatCurrency(totalDue)}
                      </span>
                      <div className="text-[10px] text-amber-400">
                        {flat.lateFeeApplied ? `(incl. ${formatCurrency(flat.lateFeeAmount)} fee)` : '(Late fee waived)'}
                      </div>
                    </div>
                  ) : isPaid ? (
                    <span className="text-slate-500 font-mono">₹0</span>
                  ) : (
                    <span className="font-mono text-amber-300">
                      {formatCurrency(flat.monthlyMaintenance)}
                    </span>
                  )}
                </td>

                {/* Last Payment */}
                <td className="py-3 px-3 sm:px-4">
                  {flat.lastPaidDate ? (
                    <div>
                      <span className="text-slate-300">{flat.lastPaidDate}</span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {flat.lastPaymentMode} {flat.referenceNo && `(${flat.referenceNo.slice(0, 12)}...)`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No record</span>
                  )}
                </td>

                {/* Secretary Memo */}
                <td className="py-3 px-3 sm:px-4 max-w-[200px]">
                  <span className="text-slate-400 italic truncate block" title={flat.secretaryNotes}>
                    {flat.secretaryNotes || '—'}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-3 sm:px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* WhatsApp */}
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition"
                      title="WhatsApp Reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>

                    {/* Receipt */}
                    <button
                      type="button"
                      onClick={() => onViewReceipt(flat)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                      title="View Bill / Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit (Admin only) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onEdit(flat)}
                        className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                        title="Secretary Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
