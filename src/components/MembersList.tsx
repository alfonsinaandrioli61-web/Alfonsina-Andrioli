import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  IdCard,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  MessageCircle,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { Member } from '../types';
import { calculatePaymentStatus, formatDate, formatTimeOnly } from '../utils/date';
import { generateReminderMessage, getWhatsAppUrl } from '../utils/notifications';
import { ExpiringFeesNotificationBanner } from './ExpiringFeesNotificationBanner';

interface MembersListProps {
  onOpenNewMemberModal: () => void;
  onOpenEditMemberModal: (member: Member) => void;
  onOpenPaymentModal: (member: Member) => void;
  onOpenIdCardModal: (member: Member) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  onOpenNewMemberModal,
  onOpenEditMemberModal,
  onOpenPaymentModal,
  onOpenIdCardModal,
}) => {
  const { members, settings, processAccessByDni, deleteMember, updateMember, markReminderSent } = useAccessControl();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'no_renovados_o_inactivos' | 'no_renovados' | 'inactivos' | 'al_dia' | 'por_vencer' | 'inside'
  >('all');

  // Helper to determine unrenewed or inactive status
  const isUnrenewed = (m: Member) => {
    const { isOverdue } = calculatePaymentStatus(m.feeDueDate, settings.gracePeriodDays);
    return isOverdue;
  };

  const isInactiveOrSuspended = (m: Member) => {
    return m.status === 'inactive' || m.status === 'suspended';
  };

  // Metrics counts
  const unrenewedCount = members.filter(isUnrenewed).length;
  const inactiveCount = members.filter(isInactiveOrSuspended).length;
  const unrenewedOrInactiveCount = members.filter((m) => isUnrenewed(m) || isInactiveOrSuspended(m)).length;
  const activeAndPaidCount = members.filter((m) => !isUnrenewed(m) && m.status === 'active').length;

  const filteredMembers = members.filter((member) => {
    const query = search.toLowerCase();
    const matchesSearch =
      member.fullName.toLowerCase().includes(query) ||
      member.dni.includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.phone.includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === 'inside') {
      return member.isInside;
    }

    if (statusFilter === 'no_renovados_o_inactivos') {
      return isUnrenewed(member) || isInactiveOrSuspended(member);
    }

    if (statusFilter === 'no_renovados') {
      return isUnrenewed(member);
    }

    if (statusFilter === 'inactivos') {
      return isInactiveOrSuspended(member);
    }

    const { status } = calculatePaymentStatus(member.feeDueDate, settings.gracePeriodDays);
    if (statusFilter === 'al_dia') return status === 'al_dia' && member.status === 'active';
    if (statusFilter === 'por_vencer') return status === 'por_vencer';

    return true;
  });

  const handleDelete = (member: Member) => {
    if (window.confirm(`¿Está seguro de eliminar al socio ${member.fullName} (DNI ${member.dni})?`)) {
      deleteMember(member.id);
    }
  };

  const handleToggleAccess = (member: Member) => {
    const nextType = member.isInside ? 'salida' : 'entrada';
    processAccessByDni(member.dni, nextType, true);
  };

  const handleQuickReactivate = (member: Member) => {
    updateMember(member.id, { status: 'active' });
  };

  const handleQuickDeactivate = (member: Member) => {
    updateMember(member.id, { status: 'inactive' });
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Directorio de Usuarios & Estado de Membresías
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Padrón de Socios & Credenciales
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Administre los socios, controle quiénes no han renovado o están inactivos, y gestione sus accesos.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewMemberModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Inscribir Nuevo Socio</span>
        </button>
      </div>

      {/* KPI Cards: Highlight Non-Renewed and Inactive members */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-white border-slate-900 ring-2 ring-slate-900 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 block">Total de Socios</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {members.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">En la base de datos</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('no_renovados_o_inactivos')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'no_renovados_o_inactivos'
              ? 'bg-red-50 border-red-500 ring-2 ring-red-500 shadow-xs'
              : 'bg-red-50/50 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 block">No Renovados / Inactivos</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black font-mono text-red-700 mt-1">
            {unrenewedOrInactiveCount}
          </div>
          <span className="text-[11px] text-red-600 font-medium block mt-0.5">
            {unrenewedCount} sin renovar · {inactiveCount} inactivos
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('no_renovados')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'no_renovados'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 block">Cuota Vencida (No Renovó)</span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {unrenewedCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium block mt-0.5">Pendientes de pago</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('inactivos')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'inactivos'
              ? 'bg-slate-100 border-slate-700 ring-2 ring-slate-700 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 block">Inactivos / Suspendidos</span>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
            {inactiveCount}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Baja temporal o suspensión</span>
        </button>
      </div>

      {/* Special Banner when filtering by No Renovados o Inactivos */}
      {statusFilter === 'no_renovados_o_inactivos' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Mostrando únicamente Socios No Renovados o Inactivos ({filteredMembers.length})
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Listado filtrado para campañas de recuperación, regularización de cuotas y seguimiento de asistencias.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-red-200 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
          >
            Ver todos los socios
          </button>
        </div>
      )}

      {/* Avisos Preventivos de Cobranza (Exclusivo para el Padrón de Socios) */}
      <ExpiringFeesNotificationBanner onOpenPaymentModal={onOpenPaymentModal} />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status segmented filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({members.length})
          </button>

          <button
            onClick={() => setStatusFilter('no_renovados_o_inactivos')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'no_renovados_o_inactivos'
                ? 'bg-red-600 text-white font-bold shadow-2xs'
                : 'text-red-700 hover:text-red-900 hover:bg-red-50 font-semibold'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>No Renovados / Inactivos ({unrenewedOrInactiveCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('no_renovados')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'no_renovados'
                ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            No Renovaron ({unrenewedCount})
          </button>

          <button
            onClick={() => setStatusFilter('inactivos')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'inactivos'
                ? 'bg-slate-800 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactivos ({inactiveCount})
          </button>

          <button
            onClick={() => setStatusFilter('al_dia')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'al_dia'
                ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Al Día ({activeAndPaidCount})
          </button>

          <button
            onClick={() => setStatusFilter('inside')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'inside'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adentro Ahora ({members.filter((m) => m.isInside).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por DNI, nombre, email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
          />
        </div>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span className="font-semibold text-slate-700 block">No se encontraron socios</span>
            <span className="text-xs text-slate-500">Pruebe modificando el término de búsqueda o el filtro.</span>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const { status: paymentStatus, daysDiff, daysOverdue, isOverdue } = calculatePaymentStatus(
              member.feeDueDate,
              settings.gracePeriodDays
            );
            const isMemberInactive = member.status === 'inactive';
            const isMemberSuspended = member.status === 'suspended';

            return (
              <div
                key={member.id}
                className={`bg-white border rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between ${
                  isOverdue || isMemberInactive || isMemberSuspended
                    ? 'border-red-200 hover:border-red-300 bg-linear-to-b from-white to-red-50/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header: Avatar, Name, Status tags */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.fullName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center font-bold text-sm ${
                            isOverdue || isMemberInactive
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {member.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {member.fullName}
                        </h3>
                        {member.isInside ? (
                          <span className="shrink-0 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            ADENTRO
                          </span>
                        ) : isMemberInactive ? (
                          <span className="shrink-0 text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                            INACTIVO
                          </span>
                        ) : isMemberSuspended ? (
                          <span className="shrink-0 text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.2 rounded">
                            SUSPENDIDO
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            ACTIVO
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        DNI: <span className="font-semibold text-slate-800">{member.dni}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {member.plan} · {settings.currencySymbol} {member.monthlyFee.toFixed(2)}/mes
                      </div>
                    </div>
                  </div>

                  {/* Payment & Attendance Status indicator */}
                  <div
                    className={`mt-3.5 p-2.5 rounded-lg text-xs space-y-1.5 border ${
                      isOverdue || isMemberInactive
                        ? 'bg-red-50/70 border-red-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Vencimiento Cuota:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatDate(member.feeDueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Estado de membresía:</span>
                      {isOverdue ? (
                        <span className="font-bold text-red-700 bg-red-100/80 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>No renovó ({daysOverdue}d de mora)</span>
                        </span>
                      ) : paymentStatus === 'por_vencer' ? (
                        <span className="font-semibold text-amber-700">
                          Vence en {daysDiff} días
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          Al día ({daysDiff}d restantes)
                        </span>
                      )}
                    </div>

                    {/* Member Habilitation status */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">Habilitación de acceso:</span>
                      {isMemberInactive ? (
                        <span className="text-slate-700 font-bold">Inactivo (No asiste)</span>
                      ) : isMemberSuspended ? (
                        <span className="text-red-700 font-bold">Bloqueado en molinete</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Habilitado</span>
                      )}
                    </div>

                    {member.lastAccessAt && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Última asistencia:</span>
                        <span className="text-slate-600 font-mono">
                          {formatDate(member.lastAccessAt.slice(0, 10))} a las {formatTimeOnly(member.lastAccessAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleAccess(member)}
                      title={member.isInside ? 'Registrar Salida' : 'Registrar Entrada'}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        member.isInside
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {member.isInside ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenIdCardModal(member)}
                      title="Ver Carnet Digital"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <IdCard className="w-4 h-4" />
                    </button>

                    {/* WhatsApp contact for unrenewed or inactive members */}
                    {member.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          const customText = isOverdue
                            ? `Hola ${member.fullName}, te saludamos de ${settings.facilityName}. Tu cuota mensual venció el ${formatDate(member.feeDueDate)} (${daysOverdue} días de mora). Te invitamos a renovarla para reactivar tu acceso. ¡Te esperamos!`
                            : `Hola ${member.fullName}, te saludamos de ${settings.facilityName}. Queríamos saber si necesitas asistencia o consultar tu plan para retomar tus entrenamientos. ¡Te esperamos!`;
                          markReminderSent(member.id, 'whatsapp');
                          window.open(getWhatsAppUrl(member.phone, customText), '_blank', 'noopener,noreferrer');
                        }}
                        title="Enviar mensaje por WhatsApp (Cobro o Reactivación)"
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Activate / Deactivate Toggle */}
                    {isMemberInactive || isMemberSuspended ? (
                      <button
                        type="button"
                        onClick={() => handleQuickReactivate(member)}
                        title="Reactivar socio a estado Activo"
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickDeactivate(member)}
                        title="Marcar como Inactivo"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenEditMemberModal(member)}
                      title="Editar datos del socio"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      title="Eliminar socio"
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Action Button: Renovar / Cobrar */}
                  <button
                    type="button"
                    onClick={() => onOpenPaymentModal(member)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs ${
                      isOverdue || isMemberInactive
                        ? 'text-white bg-emerald-600 hover:bg-emerald-700'
                        : 'text-white bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isOverdue || isMemberInactive ? 'Renovar Cuota' : 'Cobrar'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
