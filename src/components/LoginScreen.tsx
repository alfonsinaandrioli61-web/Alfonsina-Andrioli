import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Scan,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { UserRole } from '../types';

export const LoginScreen: React.FC = () => {
  const { login, settings, members, systemUsers } = useAccessControl();

  const [mode, setMode] = useState<'auto' | 'socio' | 'admin'>('auto');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Por favor ingrese su número de documento (DNI) o usuario.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = login(identifier, pin);
      if (!result.success) {
        setError(result.error || 'Credenciales no válidas.');
        setIsLoading(false);
      }
    }, 200);
  };

  const handleQuickLogin = (testIdentifier: string, testPin?: string) => {
    setIdentifier(testIdentifier);
    if (testPin) setPin(testPin);
    setError(null);
    login(testIdentifier, testPin);
  };

  // Determine if input looks like an admin username to reveal PIN field proactively
  const isInputAdmin =
    mode === 'admin' ||
    identifier.trim().toLowerCase() === 'admin' ||
    systemUsers.some(
      (u) => u.role === 'admin' && u.username.toLowerCase() === identifier.trim().toLowerCase()
    );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden select-none">
      {/* Background ambient decorative athletic glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-black border-2 border-amber-400/50 p-1 flex items-center justify-center shadow-xl shadow-amber-500/10">
            <img
              src={settings.logoUrl || '/assets/aistudio/image_fec4e5d4.png'}
              alt={settings.facilityName}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase block">
              {settings.facilityName} · CONTROL DE ACCESO
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Ingreso al Sistema
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto mt-1">
              Detección automática de perfil: ingrese su DNI para autoservicio de socio o sus credenciales de administrador.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('auto');
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
              mode === 'auto'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Detectar Auto
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('socio');
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'socio'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Soy Socio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'admin'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrador</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="loginIdentifier"
                className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Scan className="w-4 h-4 text-amber-400" />
                  <span>
                    {mode === 'socio'
                      ? 'Documento de Identidad (DNI)'
                      : mode === 'admin'
                      ? 'Usuario Administrador'
                      : 'DNI de Socio o Usuario Admin'}
                  </span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {mode === 'auto' ? 'Detección Inteligente' : ''}
                </span>
              </label>

              <input
                id="loginIdentifier"
                type="text"
                autoFocus
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                placeholder={
                  mode === 'socio'
                    ? 'Ej: 40123456'
                    : mode === 'admin'
                    ? 'Ej: admin o recepcion'
                    : 'Ingrese DNI o usuario...'
                }
                className="w-full h-14 px-4 text-lg font-bold text-white bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500 placeholder:font-normal font-mono"
              />
            </div>

            {/* PIN field (shown if mode is admin or input detected as admin) */}
            {isInputAdmin && (
              <div className="animate-in fade-in duration-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="loginPin" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN de Seguridad Administrador:</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">(Defecto: 1234)</span>
                </div>
                <input
                  id="loginPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="PIN numérico (1234)..."
                  className="w-full h-12 px-4 text-center text-lg font-mono font-black text-amber-400 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !identifier.trim()}
              className="w-full h-13 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm tracking-wide uppercase rounded-xl transition-all shadow-lg shadow-amber-400/10 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verificando...' : 'INGRESAR AL SISTEMA'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Shortcuts for Testing */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Accesos directos para evaluación rápida:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', '1234')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrador</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Todas las funciones (PIN 1234)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('40123456')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Socio Carlos</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">DNI: 40123456 (Terminal)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('32987654')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Socio Ana (Mora)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">DNI: 32987654 (Alerta cuota)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('socio')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-blue-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>Kiosco Front-Desk</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Modo tablet autónomo</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          <span>{settings.facilityName} · Sistema Integral de Molinetes y Membresías</span>
        </div>
      </div>
    </div>
  );
};
