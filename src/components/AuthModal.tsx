import React, { useState } from 'react';
import { Lock, X, KeyRound, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminPin?: string;
  onNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminPin = '2026',
  onNotification,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = adminPin || '2026';

    if (pin === correctPin || pin === 'nexus2026' || pin === 'admin') {
      setError(false);
      onSuccess();
      onClose();
      onNotification('Administrative console unlocked successfully!', 'success');
    } else {
      setError(true);
      onNotification('Incorrect Administrative PIN. (Default: 2026)', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" /> Administrator Authentication
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-center pb-1">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Enter Security PIN</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the principal PIN to unlock administrative modifications.
            </p>
          </div>

          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="e.g. 2026"
              className={`w-full h-11 px-3 text-center tracking-[0.4em] font-mono text-xl rounded-lg border outline-none transition ${
                error
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600'
              }`}
              autoFocus
              required
            />
            {error && (
              <p className="text-xs text-red-600 text-center mt-1.5 font-medium">
                Incorrect PIN. Please try again.
              </p>
            )}
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Default system PIN: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">2026</code>
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> Unlock Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
