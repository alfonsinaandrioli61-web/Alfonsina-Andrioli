import { AccessLog, Member } from '../types';
import { formatExactTimestamp, calculatePaymentStatus, calculateOverdueDebt } from './date';

export function exportAccessLogsToCSV(logs: AccessLog[], facilityName: string) {
  const headers = ['ID', 'Fecha y Hora', 'Documento (DNI)', 'Nombre Completo', 'Tipo', 'Estado de Cuota', 'Días Retraso', 'Autorizado', 'Notas'];
  
  const rows = logs.map((log) => [
    log.id,
    `"${formatExactTimestamp(log.timestamp)}"`,
    `"${log.dni}"`,
    `"${log.memberName.replace(/"/g, '""')}"`,
    log.type === 'entrada' ? 'ENTRADA' : 'SALIDA',
    log.feeStatusAtAccess === 'al_dia' ? 'Al Día' : log.feeStatusAtAccess === 'por_vencer' ? 'Por Vencer' : 'Atrasado',
    log.daysOverdue || 0,
    log.authorized ? 'SI' : 'NO',
    `"${(log.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `registro_accesos_${facilityName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDebtorsToCSV(members: Member[], currencySymbol: string) {
  const overdueMembers = members.filter((m) => {
    const { isOverdue } = calculatePaymentStatus(m.feeDueDate);
    return isOverdue;
  });

  const headers = ['DNI', 'Nombre Completo', 'Teléfono', 'Email', 'Plan', 'Fecha Vencimiento', 'Días Atrasado', 'Meses Estimados', 'Monto Deuda Estimada'];
  
  const rows = overdueMembers.map((m) => {
    const { daysOverdue } = calculatePaymentStatus(m.feeDueDate);
    const { monthsOverdue, totalDebt } = calculateOverdueDebt(m.feeDueDate, m.monthlyFee);
    return [
      `"${m.dni}"`,
      `"${m.fullName.replace(/"/g, '""')}"`,
      `"${m.phone}"`,
      `"${m.email}"`,
      `"${m.plan}"`,
      m.feeDueDate,
      daysOverdue,
      monthsOverdue,
      `"${currencySymbol} ${totalDebt.toFixed(2)}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_cuotas_atrasadas_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
