import React, { useState } from 'react';
import { X, Users, UserPlus, Shield, User, Trash2, KeyRound, Check } from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { UserRole, SystemUser } from '../types';

interface UserManagementModalProps {
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { systemUsers, addSystemUser, deleteSystemUser, activeRole } = useAccessControl();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    role: UserRole;
    pin: string;
  }>({
    name: '',
    username: '',
    role: 'socio',
    pin: '',
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      return;
    }

    if (formData.role === 'admin' && !formData.pin.trim()) {
      alert('Los usuarios con rol Administrador requieren un PIN numérico de acceso.');
      return;
    }

    addSystemUser({
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase().replace(/\s+/g, '_'),
      role: formData.role,
      pin: formData.role === 'admin' ? formData.pin.trim() : '',
    });

    setFormData({ name: '', username: '', role: 'socio', pin: '' });
    setIsAdding(false);
    setFeedback('Usuario creado con éxito');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Gestión de Usuarios del Sistema</h3>
              <p className="text-xs text-slate-400">
                Cree perfiles para Administradores (acceso total) o Socios (kiosco autónomo de acceso).
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* User List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Usuarios Registrados ({systemUsers.length})
              </h4>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nuevo Usuario</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {systemUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                        user.role === 'admin'
                          ? 'bg-slate-900 text-amber-400'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{user.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-slate-900 text-white'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {user.role === 'admin' ? 'Administrador' : 'Socio / Kiosco'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>@{user.username}</span>
                        {user.role === 'admin' && (
                          <span className="font-mono text-slate-600">
                            PIN: {user.pin ? '•••• (' + user.pin + ')' : 'Sin PIN'}
                          </span>
                        )}
                        <span>Creado: {user.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {systemUsers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteSystemUser(user.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add User Form */}
          {isAdding && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  <span>Crear Nuevo Usuario</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nombre o Descripción
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Sofía Gómez (Recepcionista)"
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ej: sofia_admin"
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Rol en la Aplicación
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  >
                    <option value="socio">Socio (Solo Terminal de Acceso / Kiosco)</option>
                    <option value="admin">Administrador (Acceso Total a Todas las Funciones)</option>
                  </select>
                </div>

                {formData.role === 'admin' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>PIN Numérico (4 dígitos)</span>
                      <span className="text-[11px] text-slate-400 font-normal">Para desbloqueo</span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      required={formData.role === 'admin'}
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="Ej: 5678"
                      className="w-full h-10 px-3 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                {formData.role === 'admin' ? (
                  <span className="text-slate-900 font-medium">
                    ✓ El <strong>Administrador</strong> tendrá acceso ilimitado a Tablero de métricas Recharts, Padrón de Socios, Control de Cuotas vencidas, Historial de accesos, Configuración y este panel de usuarios.
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    ✓ El <strong>Socio</strong> únicamente podrá interactuar con la Terminal de Acceso (kiosco autónomo touch/teclado). Todos los paneles de gestión administrativa quedarán bloqueados y ocultos.
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Rol activo actual: <strong className="uppercase text-slate-800">{activeRole}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
