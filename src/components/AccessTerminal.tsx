import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  Users,
  CreditCard,
  UserPlus,
  Scan,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Delete,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { calculateOverdueDebt, formatExactTimestamp, formatDate } from '../utils/date';
import { AccessType, Member } from '../types';

interface AccessTerminalProps {
  onOpenPaymentModal: (member: Member) => void;
  onOpenNewMemberModalWithDni: (dni: string) => void;
}

export const AccessTerminal: React.FC<AccessTerminalProps> = ({
  onOpenPaymentModal,
  onOpenNewMemberModalWithDni,
}) => {
  const {
    settings,
    activeResult,
    peopleInsideCount,
    processAccessByDni,
    clearActiveResult,
    activeRole,
  } = useAccessControl();

  const [dniInput, setDniInput] = useState('');
  const [directionMode, setDirectionMode] = useState<'auto' | 'entrada' | 'salida'>('auto');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(settings.autoResetTerminalSeconds);

  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = activeRole === 'admin';

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus input on mount and after reset
  useEffect(() => {
    if (!activeResult) {
      inputRef.current?.focus();
    }
  }, [activeResult]);

  // Auto-reset terminal timer when a result is displayed
  useEffect(() => {
    if (!activeResult) return;

    // In admin mode, keep overdue alerts open until reception decides
    if (activeResult.status === 'overdue_warning' && isAdmin) {
      return;
    }

    setCountdown(settings.autoResetTerminalSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearActiveResult();
          setDniInput('');
          return settings.autoResetTerminalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeResult, settings.autoResetTerminalSeconds, clearActiveResult, isAdmin]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dniInput.trim()) return;

    const forced = directionMode === 'auto' ? undefined : directionMode;
    processAccessByDni(dniInput, forced, false);
  };

  const handleKeyPress = (digit: string) => {
    if (dniInput.length < 12) {
      setDniInput((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setDniInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDniInput('');
    inputRef.current?.focus();
  };

  const handleQuickTest = (testDni: string) => {
    setDniInput(testDni);
    const forced = directionMode === 'auto' ? undefined : directionMode;
    processAccessByDni(testDni, forced, false);
  };

  const handleAllowOverdueOverride = () => {
    if (!activeResult?.member) return;
    const forced = directionMode === 'auto' ? undefined : directionMode;
    processAccessByDni(activeResult.member.dni, forced, true);
  };

  const handleRegisterPaymentFromAlert = () => {
    if (!activeResult?.member) return;
    onOpenPaymentModal(activeResult.member);
  };

  const handleDismissResult = () => {
    clearActiveResult();
    setDniInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Athletic Banner: Logo, Live Clock & Occupancy */}
      <div className="bg-slate-950 text-white border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border-2 border-amber-400/40 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-black/60">
              <img
                src={settings.logoUrl || '/assets/aistudio/image_fec4e5d4.png'}
                alt={settings.facilityName}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  {settings.facilityName} · TERMINAL OFICIAL
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Molinete Activo
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                Control de Acceso Automático
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Acerque su carnet o ingrese su número de documento para registrar su paso.
              </p>
            </div>
          </div>

          {/* Right: Real-time clock and Occupancy Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Occupancy pill */}
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none">
                  En el Gimnasio
                </span>
                <span className="text-lg font-black text-white font-mono tabular-nums leading-tight">
                  {peopleInsideCount} socios
                </span>
              </div>
            </div>

            {/* Clock */}
            <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none capitalize">
                  {currentTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-lg font-black text-amber-400 font-mono tabular-nums leading-tight">
                  {currentTime.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tablet-Optimized Interactive Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (5 cols): Touch Keypad & Input */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="dniInput" className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Scan className="w-4 h-4 text-amber-500" />
                <span>Documento de Identidad</span>
              </label>
              {dniInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {/* DNI Display Bar */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  id="dniInput"
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ingrese DNI..."
                  autoComplete="off"
                  className="w-full h-16 pl-4 pr-12 text-2xl sm:text-3xl font-black font-mono tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:bg-white focus:border-slate-950 focus:outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                />
                {dniInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Direction Selector: Automático / Entrada / Salida */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDirectionMode('auto')}
                  className={`py-2 px-2 rounded-lg transition-all text-center ${
                    directionMode === 'auto'
                      ? 'bg-white text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionMode('entrada')}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    directionMode === 'entrada'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionMode('salida')}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    directionMode === 'salida'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salida</span>
                </button>
              </div>
            </form>

            {/* Tablet-Ready Big Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 mt-4 select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-14 sm:h-16 text-xl sm:text-2xl font-bold font-mono text-slate-800 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 sm:h-16 text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center font-semibold text-xs gap-1"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
                <span className="hidden sm:inline">Borrar</span>
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-14 sm:h-16 text-xl sm:text-2xl font-bold font-mono text-slate-800 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!dniInput.trim()}
                className="h-14 sm:h-16 text-slate-950 font-black bg-amber-400 hover:bg-amber-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed border border-amber-500 rounded-xl transition-all cursor-pointer flex items-center justify-center text-sm sm:text-base gap-1 shadow-sm"
              >
                <span>VALIDAR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Demo DNI Buttons (Admin can test quickly or hide) */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Accesos rápidos de prueba:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickTest('40123456')}
                className="p-1.5 px-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span className="font-mono font-bold text-slate-800 block">40123456</span>
                <span className="text-emerald-700 font-medium text-[10px]">Carlos (Al Día)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTest('44778899')}
                className="p-1.5 px-2 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                <span className="font-mono font-bold text-slate-800 block">44778899</span>
                <span className="text-amber-800 font-semibold text-[10px]">Valeria (Vence en 2d)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTest('32987654')}
                className="p-1.5 px-2 text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
              >
                <span className="font-mono font-bold text-slate-800 block">32987654</span>
                <span className="text-red-700 font-semibold text-[10px]">Ana (Atrasada 17d)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTest('28555111')}
                className="p-1.5 px-2 text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
              >
                <span className="font-mono font-bold text-slate-800 block">28555111</span>
                <span className="text-red-700 font-semibold text-[10px]">Lucía (Atrasada 49d)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Turnstile Status & Live Card Verification */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {!activeResult ? (
            /* Standby State with Athletic Turnstile Ready Visual */
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-8 sm:p-12 text-center text-white shadow-lg flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-slate-800/80 border-2 border-amber-400/30 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping opacity-25"></div>
                <Scan className="w-12 h-12 text-amber-400" />
              </div>

              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-1">
                SISTEMA LISTO PARA LECTURA
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Esperando Documento
              </h3>
              <p className="text-sm text-slate-300 max-w-md mt-2 leading-relaxed">
                Ingrese su número de documento de identidad en el teclado o presente su carnet con código de barras en el sensor del molinete.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-800/80 w-full flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Molinete Desbloqueado</span>
                </div>
                <div>·</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Sensor Óptico OK</span>
                </div>
              </div>
            </div>
          ) : activeResult.status === 'granted' ? (
            /* GRANTED ACCESS RESULT */
            <div className="bg-white border-3 border-emerald-500 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header Banner */}
              <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">¡PASE AUTORIZADO!</h3>
                    <span className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">
                      {activeResult.type === 'entrada' ? 'ENTRADA CONFIRMADA' : 'SALIDA CONFIRMADA'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-emerald-700/80 px-2.5 py-1 rounded-md text-emerald-100 font-bold">
                    {countdown}s
                  </span>
                  <button
                    onClick={handleDismissResult}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Photo */}
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 shadow-md">
                    {activeResult.member?.photoUrl ? (
                      <img
                        src={activeResult.member.photoUrl}
                        alt={activeResult.member.fullName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-600 font-black text-3xl">
                        {activeResult.member?.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                        {activeResult.member?.fullName}
                      </h4>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          DNI: {activeResult.member?.dni}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700">{activeResult.member?.plan}</span>
                      </div>
                    </div>

                    {/* Exact Verification Stamp */}
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-semibold">Hora exacta registrada:</span>
                        <span className="font-mono font-bold text-slate-950 text-sm">
                          {activeResult.log?.timestamp
                            ? formatExactTimestamp(activeResult.log.timestamp)
                            : formatExactTimestamp(new Date().toISOString())}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-semibold">Estado de Cuota Mensual:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          ✓ Al día (Vence: {activeResult.member ? formatDate(activeResult.member.feeDueDate) : '--'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-semibold">Ubicación Actual:</span>
                        <span className="font-semibold text-slate-800">
                          {activeResult.type === 'entrada' ? 'Ingresando al gimnasio (Adentro)' : 'Saliendo del gimnasio (Afuera)'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleDismissResult}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Siguiente Socio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeResult.status === 'overdue_warning' ? (
            /* OVERDUE WARNING ALERT RESULT */
            <div className="bg-white border-3 border-red-500 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">¡ALERTA DE CUOTA ATRASADA!</h3>
                    <span className="text-xs text-red-100 font-medium">
                      El socio registra pagos vencidos en su membresía
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDismissResult}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Photo */}
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-red-50 border-2 border-red-300 shrink-0 shadow-md">
                    {activeResult.member?.photoUrl ? (
                      <img
                        src={activeResult.member.photoUrl}
                        alt={activeResult.member.fullName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-700 font-black text-3xl">
                        {activeResult.member?.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-3">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                        {activeResult.member?.fullName}
                      </h4>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          DNI: {activeResult.member?.dni}
                        </span>
                        <span>·</span>
                        <span>{activeResult.member?.plan}</span>
                        <span>·</span>
                        <span>Tel: {activeResult.member?.phone}</span>
                      </div>
                    </div>

                    {/* Debt Breakdown */}
                    {activeResult.member && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center text-red-900">
                          <span className="font-semibold">Fecha de vencimiento:</span>
                          <span className="font-mono font-bold text-sm">
                            {formatDate(activeResult.member.feeDueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-red-900">
                          <span className="font-semibold">Mora acumulada:</span>
                          <span className="font-mono font-bold bg-red-200 px-2 py-0.5 rounded text-red-950">
                            {activeResult.daysOverdue} días atrasado
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-red-950 pt-2 border-t border-red-200">
                          <span className="font-bold text-sm">Importe de la cuota:</span>
                          <span className="font-mono font-black text-lg text-red-700">
                            {settings.currencySymbol}{' '}
                            {calculateOverdueDebt(
                              activeResult.member.feeDueDate,
                              activeResult.member.monthlyFee
                            ).totalDebt.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* If Socio mode: Friendly kiosk notice */}
                {!isAdmin ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                    <p className="text-sm font-bold text-amber-900">
                      Por favor, acérquese al mostrador de recepción para abonar su cuota y habilitar el molinete.
                    </p>
                    <button
                      type="button"
                      onClick={handleDismissResult}
                      className="px-6 py-2 text-xs font-bold text-slate-800 bg-white border border-amber-300 rounded-lg hover:bg-amber-100"
                    >
                      Aceptar
                    </button>
                  </div>
                ) : (
                  /* Admin Actions */
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleDismissResult}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Rechazar Acceso
                    </button>

                    <button
                      type="button"
                      onClick={handleAllowOverdueOverride}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4 text-amber-800" />
                      <span>Ingreso Excepcional</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegisterPaymentFromAlert}
                      className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cobrar Cuota Ahora</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeResult.status === 'not_found' ? (
            /* NOT FOUND / UNREGISTERED DNI */
            <div className="bg-white border-2 border-amber-400 rounded-2xl overflow-hidden shadow-lg p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Documento No Encontrado</h3>
                <p className="text-sm text-slate-600 mt-1">{activeResult.message}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDismissResult}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Volver a Intentar
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onOpenNewMemberModalWithDni(dniInput)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Inscribir Socio con este DNI</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* DENIED / SUSPENDED */
            <div className="bg-white border-2 border-slate-400 rounded-2xl overflow-hidden shadow-lg p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Acceso No Autorizado</h3>
                <p className="text-sm text-slate-600 mt-1">{activeResult.message}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissResult}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
