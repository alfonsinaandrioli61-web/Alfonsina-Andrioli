import { Member, FacilitySettings } from '../types';
import { calculatePaymentStatus, formatDate } from './date';

/**
 * Builds the reminder text according to member status
 */
export function generateReminderMessage(
  member: Member,
  settings: FacilitySettings,
  channel: 'whatsapp' | 'sms' = 'whatsapp'
): { title: string; text: string; isUrgent: boolean } {
  const { status, daysDiff, daysOverdue, isOverdue } = calculatePaymentStatus(
    member.feeDueDate,
    settings.gracePeriodDays
  );

  const gymName = settings.facilityName || 'NEW AGE GYM';
  const dueDateFormatted = formatDate(member.feeDueDate);
  const feeFormatted = `${settings.currencySymbol} ${member.monthlyFee.toFixed(2)}`;

  if (isOverdue) {
    const text = channel === 'whatsapp'
      ? `Hola *${member.fullName}*, te saludamos de *${gymName}* 💪. Te informamos que tu cuota mensual venció el *${dueDateFormatted}* (${daysOverdue} días de mora, cuota: ${feeFormatted}). Por favor, acércate a recepción en tu próximo entrenamiento para regularizar tu pase de acceso. ¡Te esperamos!`
      : `Hola ${member.fullName}, recordatorio de ${gymName}: tu cuota mensual venció el ${dueDateFormatted} (${daysOverdue} días de retraso, cuota: ${feeFormatted}). Te esperamos en recepción para renovar tu acceso.`;
    return {
      title: `Aviso de Mora (${daysOverdue}d)`,
      text,
      isUrgent: true,
    };
  }

  if (daysDiff === 0) {
    const text = channel === 'whatsapp'
      ? `¡Hola *${member.fullName}*! Te saludamos de *${gymName}* 🏋️. Te recordamos amablemente que tu cuota mensual *vence hoy (${dueDateFormatted})*. Si vienes hoy a entrenar, puedes renovarla directamente en recepción. ¡A seguir con todo el entrenamiento!`
      : `Hola ${member.fullName}, recordatorio de ${gymName}: tu cuota mensual vence hoy ${dueDateFormatted}. Puedes renovarla en recepción hoy al entrenar.`;
    return {
      title: 'Vence Hoy',
      text,
      isUrgent: true,
    };
  }

  if (daysDiff <= 5 && daysDiff > 0) {
    const daysLabel = daysDiff === 1 ? 'mañana' : `en ${daysDiff} días`;
    const text = channel === 'whatsapp'
      ? `¡Hola *${member.fullName}*! Te saludamos de *${gymName}* 💪. Te pasamos un aviso preventivo: tu cuota mensual vence *${daysLabel} (${dueDateFormatted})*. Puedes renovar tu pase en recepción en tu próxima visita para no interrumpir tu entrenamiento. ¡Buen entreno!`
      : `Hola ${member.fullName}, recordatorio preventivo de ${gymName}: tu cuota mensual vence ${daysLabel} (${dueDateFormatted}). Puedes renovarla en recepción.`;
    return {
      title: `Vence ${daysLabel}`,
      text,
      isUrgent: false,
    };
  }

  // Al día
  return {
    title: 'Al Día',
    text: `Hola ${member.fullName}, tu cuota en ${gymName} está al día hasta el ${dueDateFormatted}. ¡Gracias por entrenar con nosotros!`,
    isUrgent: false,
  };
}

/**
 * Clean phone number for WhatsApp wa.me link
 */
export function cleanPhoneNumber(phone: string): string {
  // Remove non-digit chars
  return phone.replace(/\D/g, '');
}

/**
 * Creates WhatsApp Click-to-Chat URL
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates SMS URL (native protocol for mobile/desktop messenger)
 */
export function getSmsUrl(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  // Universal SMS link
  return `sms:${clean}?body=${encodeURIComponent(message)}`;
}
