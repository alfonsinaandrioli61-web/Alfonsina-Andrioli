import React, { useState } from 'react';
import {
  AlertTriangle,
  CreditCard,
  MessageCircle,
  Download,
  Search,
  Receipt,
  CheckCircle,
  Calendar,
  Clock,
  Phone,
  DollarSign,
  TrendingDown,
  Smartphone,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { Member } from '../types';
import { calculatePaymentStatus, calculateOverdueDebt, formatDate, formatExactTimestamp } from '../utils/date';
import { exportDebtorsToCSV } from '../utils/csv';

interface DebtorsListProps {
  onOpenPaymentModal: (member: Member) => void;
}

export const DebtorsList: React.FC<DebtorsListProps> = ({ onOpenPaymentModal }) => {
  const { members, payments, settings, markReminderSent } = useAccessControl();
  const [activeTab, setActiveTab] = useState<'debtors' | 'history'>('debtors');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'recent' | 'critical'>('all');

  // Filter members that are overdue
  const overdueMembers = members
    .map((member) => {
      const { status, daysOverdue, isOverdue } = calculatePaymentStatus(
        member.feeDueDate,
        settings.gracePeriodDays
      );
      const { monthsOverdue, totalDebt } = calculateOverdueDebt(member.feeDueDate, member.monthlyFee);
      return {
        member,
        status,
        daysOverdue,
        isOverdue,
        monthsOverdue,
        totalDebt,
      };
    })
    .filter((item) => item.isOverdue)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Metrics
  const totalDebtSum = overdueMembers.reduce((sum, item) => sum + item.totalDebt, 0);
  const criticalDebtorsCount = overdueMembers.filter((item) => item.daysOverdue > 30).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = payments
    .filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Search filter
  const filteredDebtors = overdueMembers.filter((item) => {
    const matchesSearch =
      item.member.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.member.dni.includes(search) ||
      item.member.phone.includes(search);

    if (!matchesSearch) return false;

    if (severityFilter === 'recent') {
      return item.daysOverdue <= 30;
    }
    if (severityFilter === 'critical') {
      return item.daysOverdue > 30;
    }
    return true;
  });

  const generateWhatsAppLink = (m: Member, daysOverdue: number, debtAmount: number) => {
    const cleanPhone = m.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${m.fullName}, te saludamos de ${settings.facilityName}. Te informamos que tu cuota mensual venció el ${formatDate(m.feeDueDate)} (${daysOverdue} días de mora, total adeudado: ${settings.currencySymbol} ${debtAmount.toFixed(2)}). Te invitamos a regularizarla en recepción para mantener activo tu pase de acceso. ¡Muchas gracias!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Header and View Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block">
            Módulo Financiero y Cobranzas
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Control de Cuotas Mensuales & Alertas de Mora
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Seguimiento de membresías impagas, cálculo automático de deuda y emisión de recordatorios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('debtors')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'debtors'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Socios en Mora ({overdueMembers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-slate-600" />
              <span>Libro de Pagos ({payments.length})</span>
            </button>
          </div>

          {activeTab === 'debtors' && (
            <button
              onClick={() => exportDebtorsToCSV(members, settings.currencySymbol)}
              disabled={overdueMembers.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Deuda Total en Calle</span>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1">
            {settings.currencySymbol} {totalDebtSum.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Suma de todas las cuotas vencidas
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Socios Atrasados</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {overdueMembers.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              de {members.length} ({((overdueMembers.length / (members.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Requieren regularización
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Mora Crítica (&gt;30 días)</span>
          <div className="text-2xl font-bold font-mono text-red-700 mt-1">
            {criticalDebtorsCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Más de un período impago
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Cobranza del Mes</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {settings.currencySymbol} {monthlyRevenue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Ingresos ingresados en caja
          </span>
        </div>
      </div>

      {activeTab === 'debtors' ? (
        /* Debtors List Section */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setSeverityFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    severityFilter === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Todos ({overdueMembers.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('recent')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    severityFilter === 'recent' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Hasta 30 días
                </button>
                <button
                  onClick={() => setSeverityFilter('critical')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    severityFilter === 'critical' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Críticos (&gt;30d)
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por DNI, nombre o teléfono..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Socio & Documento</th>
                  <th className="py-3 px-4">Plan & Cuota</th>
                  <th className="py-3 px-4">Fecha Vencimiento</th>
                  <th className="py-3 px-4">Días de Mora</th>
                  <th className="py-3 px-4">Total Deuda</th>
                  <th className="py-3 px-4 text-right">Acciones de Cobranza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <span className="font-semibold text-slate-700 block">
                        ¡No hay socios con cuotas atrasadas en esta selección!
                      </span>
                      <span className="text-xs text-slate-500">
                        Todos los usuarios cumplen con el pago mensual reglamentario.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map(({ member, daysOverdue, monthsOverdue, totalDebt }) => (
                    <tr key={member.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.fullName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-700 font-bold text-xs">
                                {member.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {member.fullName}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              DNI: {member.dni}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block">{member.plan}</span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {settings.currencySymbol} {member.monthlyFee.toFixed(2)}/mes
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-800">
                        {formatDate(member.feeDueDate)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                            daysOverdue > 30
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{daysOverdue} días</span>
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          ({monthsOverdue} {monthsOverdue === 1 ? 'mes' : 'meses'} impago)
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-sm text-red-700">
                        {settings.currencySymbol} {totalDebt.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.phone && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const link = generateWhatsAppLink(member, daysOverdue, totalDebt);
                                  markReminderSent(member.id, 'whatsapp');
                                  window.open(link, '_blank', 'noopener,noreferrer');
                                }}
                                title="Enviar recordatorio por WhatsApp"
                                className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              <a
                                href={`sms:${member.phone.replace(/\D/g, '')}?body=${encodeURIComponent(
                                  `Recordatorio de ${settings.facilityName}: su cuota vencio el ${formatDate(member.feeDueDate)} (${daysOverdue} dias de retraso). Saludos.`
                                )}`}
                                onClick={() => markReminderSent(member.id, 'sms')}
                                title="Enviar recordatorio por SMS"
                                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                <Smartphone className="w-4 h-4" />
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenPaymentModal(member)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cobrar Cuota</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Payments History Section */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Historial de Cobranzas y Recibos</h2>
            <span className="text-xs text-slate-500">
              Registro contable de pagos registrados en el sistema
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">N° Recibo</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Socio & Documento</th>
                  <th className="py-3 px-4">Monto Cobrado</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4">Período Renovado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No hay pagos registrados aún en el libro contable.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatExactTimestamp(p.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block">{p.memberName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">DNI: {p.dni}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {settings.currencySymbol} {p.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {p.periodCovered}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
