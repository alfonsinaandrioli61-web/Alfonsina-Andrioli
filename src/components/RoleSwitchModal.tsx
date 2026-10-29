import React, { useState } from 'react';
import { X, ShieldCheck, User, Lock, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { UserRole } from '../types';

interface RoleSwitchModalProps {
  onClose: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({ onClose }) => {
  const { activeRole, switchRole, systemUsers } = useAccessControl();
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    activeRole === 'admin' ? 'socio' : 'admin'
  );
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedRole === 'admin') {
      if (!pin.trim()) {
        setErrorMessage('Por favor ingrese el PIN de Administrador (PIN por defecto: 1234).');
        return;
      }
      const result = switchRole('admin', pin);
      if (!result.success) {
        setErrorMessage(result.error || 'PIN incorrecto.');
        return;
      }
    } else {
      switchRole('socio');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Cambio de Perfil / Modo</h3>
              <p className="text-xs text-slate-400">
                Rol actual: <span className="text-amber-400 font-semibold uppercase">{activeRole === 'admin' ? 'Administrador' : 'Socio / Kiosco'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSwitch} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Seleccionar Modo de Operación:
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Option Admin */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setErrorMessage('');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <ShieldCheck className={`w-5 h-5 ${selectedRole === 'admin' ? 'text-amber-400' : 'text-slate-600'}`} />
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${selectedRole === 'admin' ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-700'}`}>
                    PIN
                  </span>
                </div>
                <div className="font-bold text-sm">Administrador</div>
                <div className={`text-[11px] mt-0.5 leading-tight ${selectedRole === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Todas las funciones (Tablero, Socios, Cuotas, Historial, Ajustes)
                </div>
              </button>

              {/* Option Socio */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('socio');
                  setErrorMessage('');
                  setPin('');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'socio'
                    ? 'border-amber-500 bg-amber-500/10 border-2 text-slate-950 shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <User className={`w-5 h-5 ${selectedRole === 'socio' ? 'text-amber-600' : 'text-slate-600'}`} />
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900">
                    Kiosco
                  </span>
                </div>
                <div className="font-bold text-sm">Socio / Terminal</div>
                <div className="text-[11px] mt-0.5 leading-tight text-slate-500">
                  Solo terminal de acceso para auto-registro en tablet o celular
                </div>
              </button>
            </div>
          </div>

          {/* PIN Input if Admin is selected */}
          {selectedRole === 'admin' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="adminPin" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  <span>PIN de Seguridad Administrador:</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  (Por defecto: 1234)
                </span>
              </div>

              <input
                id="adminPin"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Ingrese PIN..."
                autoFocus
                className="w-full h-11 px-3 text-center text-xl font-bold font-mono tracking-widest bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />

              <div className="flex items-center justify-center gap-2">
                {['1234', '0000'].map((quickPin) => (
                  <button
                    key={quickPin}
                    type="button"
                    onClick={() => setPin(quickPin)}
                    className="text-[11px] font-mono font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded"
                  >
                    Usar PIN: {quickPin}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Aplicar Modo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
