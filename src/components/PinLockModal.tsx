import React, { useState } from 'react';
import { Lock, Unlock, X, KeyRound, ShieldAlert, Check } from 'lucide-react';
import { StorageService } from '../services/storage';

interface PinLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onUnlock,
  onLock,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentPin = StorageService.getAdminPin();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === currentPin) {
      onUnlock();
      onClose();
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      StorageService.setAdminPin(newPin.trim());
      setSuccessMsg('Secretary PIN updated successfully!');
      setNewPin('');
      setTimeout(() => {
        setIsChangingPin(false);
        setSuccessMsg('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-5 text-center"
        role="dialog"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Secretary Admin Access</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAdmin ? (
          /* Secretary already logged in */
          <div className="py-2 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-xs">
              <Unlock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Secretary Mode Active</h3>
              <p className="text-xs text-slate-500 mt-1">
                You currently have full permissions to edit flats, mark payments, and add new units.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onLock();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition"
              >
                🔒 Lock Secretary Access (View-Only Mode)
              </button>

              <button
                type="button"
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                {isChangingPin ? 'Cancel' : 'Change Secret PIN'}
              </button>
            </div>

            {isChangingPin && (
              <form onSubmit={handleSaveNewPin} className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN (e.g. 9876)"
                  className="w-full text-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:border-yellow-500"
                />
                <button
                  type="submit"
                  disabled={newPin.length < 4}
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs border border-yellow-500/60"
                >
                  Save New PIN
                </button>
                {successMsg && <p className="text-emerald-600 text-xs font-bold">{successMsg}</p>}
              </form>
            )}
          </div>
        ) : (
          /* Locked - Enter PIN to unlock */
          <div className="py-2 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-yellow-100 border border-yellow-300 flex items-center justify-center text-slate-950 shadow-xs font-bold">
              <ShieldAlert className="w-6 h-6 text-yellow-600" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Enter Secretary PIN</h3>
              <p className="text-xs text-slate-500 mt-1">
                Only the Secretary can edit records and add flats.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-3 pt-1">
              <input
                type="password"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Enter 4-digit PIN"
                className={`w-full text-center px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono tracking-widest text-lg font-bold focus:bg-white focus:outline-none ${
                  error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-yellow-500'
                }`}
              />

              {error && (
                <p className="text-xs text-rose-600 font-bold">
                  Incorrect PIN. Please try again.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-xs border border-yellow-500/60 transition active:scale-95"
              >
                Unlock Secretary Controls
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
