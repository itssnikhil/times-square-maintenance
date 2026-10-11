import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Lock, Unlock, X, Check, ArrowRight } from 'lucide-react';
import { StorageService, DEFAULT_ADMIN_PIN } from '../services/storage';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAuthenticate: (authenticated: boolean) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onAuthenticate,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentSavedPin = StorageService.getAdminPin();

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === currentSavedPin) {
      onAuthenticate(true);
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleLogout = () => {
    onAuthenticate(false);
    onClose();
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      StorageService.setAdminPin(newPin);
      setSuccessMsg('PIN successfully updated!');
      setNewPin('');
      setTimeout(() => {
        setIsChangingPin(false);
        setSuccessMsg('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Top Close */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Secretary Security Gate</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAdmin ? (
          /* Already Logged In / Secretary Options */
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Secretary Mode Active</h2>
              <p className="text-xs text-slate-400 mt-1">
                You have unrestricted administrative write access to flat maintenance dues and notes.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full min-h-[46px] rounded-xl font-bold text-xs bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Lock & Switch to Resident View</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="w-full min-h-[44px] rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{isChangingPin ? 'Cancel PIN Change' : 'Change Secretary PIN'}</span>
              </button>
            </div>

            {isChangingPin && (
              <form onSubmit={handleSaveNewPin} className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full text-center px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono tracking-widest text-base focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={newPin.length !== 4}
                  className="w-full py-2 bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Save New PIN
                </button>
                {successMsg && <p className="text-emerald-400 text-xs font-semibold">{successMsg}</p>}
              </form>
            )}
          </div>
        ) : (
          /* PIN Input Pad */
          <div className="py-2 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">Enter Secretary PIN</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized secretary login required to edit records.
              </p>
            </div>

            {/* 4 PIN Dots */}
            <div className="flex justify-center items-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    pin.length > idx
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                      : error
                      ? 'bg-rose-950 border-rose-500 animate-bounce'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-semibold animate-pulse">
                Incorrect PIN. Please try again.
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-lg font-bold text-white transition active:scale-95 border border-slate-750 flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="h-12 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-slate-400 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-lg font-bold text-white transition active:scale-95 border border-slate-750 flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-slate-850 hover:bg-slate-800 text-sm font-semibold text-slate-400 transition flex items-center justify-center"
              >
                ⌫
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
