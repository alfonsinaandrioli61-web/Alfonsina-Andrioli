import React, { useState } from 'react';
import {
  X,
  Settings,
  RotateCcw,
  Save,
  Volume2,
  Shield,
  CreditCard,
  Plus,
  Trash2,
  Check,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { FacilitySettings, MembershipType } from '../types';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    membershipTypes,
    addMembershipType,
    deleteMembershipType,
  } = useAccessControl();

  const [activeTab, setActiveTab] = useState<'general' | 'memberships'>('general');
  const [form, setForm] = useState<FacilitySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New membership form state
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [planForm, setPlanForm] = useState<{
    name: string;
    price: number;
    durationMonths: number;
    description: string;
  }>({
    name: '',
    price: settings.defaultFeeAmount,
    durationMonths: 1,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) return;

    addMembershipType({
      name: planForm.name.trim(),
      price: Number(planForm.price) || 0,
      durationMonths: Number(planForm.durationMonths) || 1,
      description: planForm.description.trim() || undefined,
    });

    setPlanForm({
      name: '',
      price: settings.defaultFeeAmount,
      durationMonths: 1,
      description: '',
    });
    setIsAddingPlan(false);
  };

  const handleReset = () => {
    if (window.confirm('¿Desea restaurar todos los datos a la configuración y socios iniciales de prueba?')) {
      resetToDemoData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Configuración del Sistema</h3>
              <p className="text-xs text-slate-400">
                Parámetros del gimnasio, molinete y catálogo de tipos de membresía
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ajustes Generales & Molinete
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memberships')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'memberships'
                ? 'border-amber-500 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Tipos de Membresía ({membershipTypes.length})</span>
          </button>
        </div>

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Entidad / Establecimiento
              </label>
              <input
                type="text"
                required
                value={form.facilityName}
                onChange={(e) => setForm({ ...form, facilityName: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Símbolo de Moneda
                </label>
                <input
                  type="text"
                  required
                  value={form.currencySymbol}
                  onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
                  placeholder="$, €, S/."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cuota Mensual Base ({form.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.defaultFeeAmount}
                  onChange={(e) => setForm({ ...form, defaultFeeAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Días de Gracia tras Vencimiento
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={form.gracePeriodDays}
                  onChange={(e) => setForm({ ...form, gracePeriodDays: parseInt(e.target.value, 10) || 0 })}
                  className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
                />
                <span className="text-[10px] text-slate-400">Tolerancia antes de marcar mora</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiempo Auto-Reinicio Terminal
                </label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={form.autoResetTerminalSeconds}
                  onChange={(e) => setForm({ ...form, autoResetTerminalSeconds: parseInt(e.target.value, 10) || 5 })}
                  className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-500"
                />
                <span className="text-[10px] text-slate-400">Segundos de visibilidad del pase</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.soundEnabled}
                  onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
                  className="rounded text-slate-900"
                />
                <span className="font-medium flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  Efectos de sonido (Web Audio: timbre de acceso y alerta de mora)
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.strictAccessBlock}
                  onChange={(e) => setForm({ ...form, strictAccessBlock: e.target.checked })}
                  className="rounded text-slate-900"
                />
                <span className="font-medium flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  Bloqueo estricto: rechazar acceso automáticamente si la cuota está vencida
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar datos de prueba</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savedSuccess ? 'Guardado' : 'Guardar Ajustes'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Membership Types / Plans Catalog */}
        {activeTab === 'memberships' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Tipos de Membresía & Planes
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina los planes disponibles para inscribir a los socios y sus tarifas correspondientes.
                </p>
              </div>

              {!isAddingPlan && (
                <button
                  type="button"
                  onClick={() => setIsAddingPlan(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Tipo de Membresía</span>
                </button>
              )}
            </div>

            {/* Add Membership Form */}
            {isAddingPlan && (
              <form onSubmit={handleCreatePlan} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nuevo Tipo de Membresía</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => setIsAddingPlan(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nombre de la Membresía / Plan*
                    </label>
                    <input
                      type="text"
                      required
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Ej: Pase Trimestral Crossfit"
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Precio de Cuota ({settings.currencySymbol})*
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.5"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full h-9 px-3 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Duración (Meses)*
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={planForm.durationMonths}
                      onChange={(e) => setPlanForm({ ...planForm, durationMonths: parseInt(e.target.value, 10) || 1 })}
                      className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Beneficios / Cobertura
                    </label>
                    <input
                      type="text"
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Ej: Sala de pesas + Clases funcionales"
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingPlan(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs"
                  >
                    Guardar Membresía
                  </button>
                </div>
              </form>
            )}

            {/* List of Configured Membership Types */}
            <div className="space-y-2.5">
              {membershipTypes.map((type) => (
                <div
                  key={type.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-amber-600 shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{type.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900">
                          {type.durationMonths ? `${type.durationMonths} ${type.durationMonths === 1 ? 'Mes' : 'Meses'}` : '1 Mes'}
                        </span>
                      </div>
                      {type.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-black text-base text-slate-900">
                        {settings.currencySymbol} {type.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">cuota sugerida</span>
                    </div>

                    {membershipTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteMembershipType(type.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar tipo de membresía"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Los tipos de membresía configurados aquí aparecerán automáticamente en la ficha de inscripción de nuevos socios y al momento de cobrar la renovación.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
