import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Check } from 'lucide-react';
import { Member, MembershipPlan } from '../types';
import { useAccessControl } from '../context/AccessControlContext';
import { addMonthsToDueDate, getTodayString } from '../utils/date';

interface MemberModalProps {
  initialMember?: Member | null;
  initialDni?: string;
  onClose: () => void;
  onSuccess?: (savedMember: Member) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  initialMember,
  initialDni,
  onClose,
  onSuccess,
}) => {
  const { settings, addMember, updateMember, members, membershipTypes } = useAccessControl();

  const isEditing = !!initialMember;

  const [dni, setDni] = useState(initialMember?.dni || initialDni || '');
  const [fullName, setFullName] = useState(initialMember?.fullName || '');
  const [email, setEmail] = useState(initialMember?.email || '');
  const [phone, setPhone] = useState(initialMember?.phone || '');
  const [plan, setPlan] = useState<MembershipPlan>(
    initialMember?.plan || (membershipTypes[0]?.name || 'Mensual Estándar')
  );
  const [monthlyFee, setMonthlyFee] = useState<number>(
    initialMember?.monthlyFee || (membershipTypes[0]?.price || settings.defaultFeeAmount)
  );
  const [feeDueDate, setFeeDueDate] = useState<string>(
    initialMember?.feeDueDate || addMonthsToDueDate(getTodayString(), 1)
  );
  const [status, setStatus] = useState<'active' | 'suspended' | 'inactive'>(
    initialMember?.status || 'active'
  );
  const [notes, setNotes] = useState(initialMember?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Update fee when plan changes (if creating new)
  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    if (!isEditing) {
      const matched = membershipTypes.find((t) => t.name === newPlan);
      if (matched) {
        setMonthlyFee(matched.price);
      } else {
        setMonthlyFee(settings.defaultFeeAmount);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDni = dni.trim().replace(/\D/g, '');
    if (!cleanDni) {
      setError('El número de documento de identidad es obligatorio (solo dígitos).');
      return;
    }

    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    // Check duplicate DNI if creating new or changing DNI
    const existingWithSameDni = members.find(
      (m) => m.dni.replace(/\D/g, '') === cleanDni && m.id !== initialMember?.id
    );
    if (existingWithSameDni) {
      setError(`Ya existe un socio registrado con el DNI ${cleanDni} (${existingWithSameDni.fullName}).`);
      return;
    }

    if (isEditing && initialMember) {
      updateMember(initialMember.id, {
        dni: cleanDni,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan,
        monthlyFee: Number(monthlyFee),
        feeDueDate,
        status,
        notes: notes.trim() || undefined,
      });

      const updated = {
        ...initialMember,
        dni: cleanDni,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan,
        monthlyFee: Number(monthlyFee),
        feeDueDate,
        status,
        notes: notes.trim() || undefined,
      };
      if (onSuccess) onSuccess(updated);
    } else {
      const created = addMember({
        dni: cleanDni,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan,
        monthlyFee: Number(monthlyFee),
        feeDueDate,
        status,
        notes: notes.trim() || undefined,
      });
      if (onSuccess) onSuccess(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isEditing ? 'Editar Datos del Socio' : 'Inscribir Nuevo Socio'}
              </h3>
              <p className="text-xs text-slate-400">
                Control de identidad y asignación de cuota mensual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Documento de Identidad (DNI)*
              </label>
              <input
                type="text"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 40123456"
                className="w-full h-9 px-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre Completo*
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono de Contacto (WhatsApp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan de Membresía
              </label>
              <select
                value={plan}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              >
                {membershipTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name} ({settings.currencySymbol} {type.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto Cuota Mensual ({settings.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Vencimiento de Cuota
              </label>
              <input
                type="date"
                required
                value={feeDueDate}
                onChange={(e) => setFeeDueDate(e.target.value)}
                className="w-full h-9 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de Habilitación
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended' | 'inactive')}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              >
                <option value="active">Activo (Habilitado)</option>
                <option value="inactive">Inactivo (No Renueva / Baja Temporal)</option>
                <option value="suspended">Suspendido (Bloqueado por Admin)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información médica, turno asignado o notas adicionales..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
            />
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Socio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
