import { PaymentStatus } from '../types';

/**
 * Returns today's ISO date string (YYYY-MM-DD)
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days remaining until dueDate.
 * If positive: days left before payment is due.
 * If negative: days overdue (mora).
 */
export function getDaysDifference(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDateStr.split('-');
  if (parts.length !== 3) return 0;
  const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines the payment status of a member
 */
export function calculatePaymentStatus(dueDateStr: string, gracePeriodDays = 0): {
  status: PaymentStatus;
  daysDiff: number;
  isOverdue: boolean;
  daysOverdue: number;
} {
  const diff = getDaysDifference(dueDateStr);

  // If diff < -gracePeriodDays: overdue
  if (diff < -gracePeriodDays) {
    const daysOverdue = Math.abs(diff);
    return {
      status: 'atrasado',
      daysDiff: diff,
      isOverdue: true,
      daysOverdue,
    };
  }

  // If due within 5 days
  if (diff <= 5) {
    return {
      status: 'por_vencer',
      daysDiff: diff,
      isOverdue: false,
      daysOverdue: 0,
    };
  }

  return {
    status: 'al_dia',
    daysDiff: diff,
    isOverdue: false,
    daysOverdue: 0,
  };
}

/**
 * Estimate how many months are overdue and total debt
 */
export function calculateOverdueDebt(dueDateStr: string, monthlyFee: number): {
  monthsOverdue: number;
  totalDebt: number;
} {
  const diff = getDaysDifference(dueDateStr);
  if (diff >= 0) {
    return { monthsOverdue: 0, totalDebt: 0 };
  }
  const daysOverdue = Math.abs(diff);
  // Estimate months overdue: minimum 1 month if overdue
  const monthsOverdue = Math.max(1, Math.ceil(daysOverdue / 30));
  const totalDebt = monthsOverdue * monthlyFee;
  return { monthsOverdue, totalDebt };
}

/**
 * Format date nicely in Spanish: DD/MM/YYYY
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format exact timestamp with seconds: "29 oct 2026, 14:32:05"
 */
export function formatExactTimestamp(isoString: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${date}, ${time}`;
  } catch {
    return isoString;
  }
}

/**
 * Format only time with seconds: "14:32:05"
 */
export function formatTimeOnly(isoString: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

/**
 * Adds months to a YYYY-MM-DD date.
 * If the current dueDate is already past, it sets the base to today or adds from previous due date.
 */
export function addMonthsToDueDate(currentDueDateStr: string, monthsToAdd: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate = new Date();
  const parts = currentDueDateStr.split('-');
  if (parts.length === 3) {
    const candidate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    // If the due date is in the past, add months starting from today to make them current
    if (candidate < today) {
      baseDate = today;
    } else {
      baseDate = candidate;
    }
  }

  baseDate.setMonth(baseDate.getMonth() + monthsToAdd);

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
