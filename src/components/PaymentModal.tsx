import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Calendar, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Member, PaymentRecord } from '../types';
import { useAccessControl } from '../context/AccessControlContext';
import { calculatePaymentStatus, calculateOverdueDebt, formatDate, addMonthsToDueDate } from '../utils/date';

interface PaymentModalProps {
  member: Member;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ member, onClose, onSuccess }) => {
  const { settings, recordPayment, processAccessByDni } = useAccessControl();

  const { status, daysOverdue, isOverdue } = calculatePaymentStatus(member.feeDueDate, settings.gracePeriodDays);
  const { monthsOverdue } = calculateOverdueDebt(member.feeDueDate, member.monthlyFee);

  // Default months to pay: if overdue by 2 months, suggest 2 months, otherwise 1 month
  const initialMonths = isOverdue ? Math.max(1, monthsOverdue) : 1;
  const [monthsToAdd, setMonthsToAdd] = useState<number>(initialMonths);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('Efectivo');
  const [receiptNumber, setReceiptNumber] = useState<string>(
    `REC-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [notes, setNotes] = useState('');
  const [alsoRecordEntry, setAlsoRecordEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = member.monthlyFee * monthsToAdd;
  const simulatedNewDueDate = addMonthsToDueDate(member.feeDueDate, monthsToAdd);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      recordPayment({
        memberId: member.id,
        amount: totalAmount,
        monthsToAdd,
        paymentMethod,
        receiptNumber,
        notes: notes.trim() || undefined,
      });

      // If user selected to record entrance upon payment:
      if (alsoRecordEntry && !member.isInside) {
        processAccessByDni(member.dni, 'entrada', true);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert('Error al registrar el cobro: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Registrar Cobro de Cuota</h3>
              <p className="text-xs text-slate-400">Regularizar membresía y extender vigencia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Status Summary Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{member.fullName}</h4>
              <span className="text-xs font-mono text-slate-500">DNI: {member.dni} · {member.plan}</span>
            </div>
            {isOverdue ? (
              <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                Atrasado ({daysOverdue} días)
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Al Día
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
            <span>Vencimiento actual: <strong>{formatDate(member.feeDueDate)}</strong></span>
            <span>Cuota mensual: <strong>{settings.currencySymbol} {member.monthlyFee.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Months selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cantidad de meses a abonar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 6].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMonthsToAdd(m)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    monthsToAdd === m
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m} {m === 1 ? 'Mes' : 'Meses'}
                </button>
              ))}
            </div>
          </div>

          {/* Projection Calculation Box */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
            <div className="flex justify-between items-center">
              <span>Monto total a cobrar:</span>
              <span className="text-lg font-bold font-mono text-emerald-800">
                {settings.currencySymbol} {totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-emerald-200/80">
              <span>Nueva fecha de vencimiento:</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatDate(simulatedNewDueDate)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  'Efectivo',
                  'Transferencia Bancaria',
                  'Tarjeta Débito/Crédito',
                  'Billetera Digital',
                ] as const
              ).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 text-left rounded-lg border transition-all font-medium ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Recibo / Comprobante
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full h-9 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nota / Observación (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Pago en caja recepción"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Checkbox to also record entrance if outside */}
          {!member.isInside && (
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoRecordEntry}
                  onChange={(e) => setAlsoRecordEntry(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span className="font-medium">
                  Registrar <strong>ENTRADA</strong> de este socio inmediatamente al procesar el cobro
                </span>
              </label>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Pago de {settings.currencySymbol} {totalAmount.toFixed(2)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
