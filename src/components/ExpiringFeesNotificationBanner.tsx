import React, { useState } from 'react';
import {
  BellRing,
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { Member } from '../types';
import { calculatePaymentStatus, formatDate, formatTimeOnly } from '../utils/date';
import { generateReminderMessage, getWhatsAppUrl, getSmsUrl } from '../utils/notifications';

interface ExpiringFeesNotificationBannerProps {
  onOpenPaymentModal: (member: Member) => void;
}

export const ExpiringFeesNotificationBanner: React.FC<ExpiringFeesNotificationBannerProps> = ({
  onOpenPaymentModal,
}) => {
  const { members, settings, markReminderSent } = useAccessControl();
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);
  const [previewMember, setPreviewMember] = useState<Member | null>(null);

  // Find members whose fee is due within the next 5 days (including today and overdue within grace period)
  const expiringMembers = members
    .map((member) => {
      const { status, daysDiff, daysOverdue, isOverdue } = calculatePaymentStatus(
        member.feeDueDate,
        settings.gracePeriodDays
      );
      return {
        member,
        status,
        daysDiff,
        daysOverdue,
        isOverdue,
      };
    })
    .filter((item) => {
      // Include members who are 'por_vencer' (diff between 0 and 5 days)
      return item.status === 'por_vencer' || (item.daysDiff >= 0 && item.daysDiff <= 5);
    })
    .sort((a, b) => a.daysDiff - b.daysDiff);

  if (expiringMembers.length === 0) {
    return null; // Don't take space if nobody is due soon
  }

  const handleWhatsAppClick = (member: Member) => {
    const { text } = generateReminderMessage(member, settings, 'whatsapp');
    markReminderSent(member.id, 'whatsapp');
    window.open(getWhatsAppUrl(member.phone, text), '_blank', 'noopener,noreferrer');
  };

  const handleSmsClick = (member: Member) => {
    const { text } = generateReminderMessage(member, settings, 'sms');
    markReminderSent(member.id, 'sms');
    window.location.href = getSmsUrl(member.phone, text);
  };

  const handleCopyMessage = (member: Member) => {
    const { text } = generateReminderMessage(member, settings, 'whatsapp');
    navigator.clipboard.writeText(text);
    setCopiedMemberId(member.id);
    setTimeout(() => {
      setCopiedMemberId(null);
    }, 2000);
  };

  return (
    <div className="bg-amber-500/10 border-2 border-amber-400 rounded-2xl overflow-hidden shadow-sm transition-all">
      {/* Banner Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0 animate-pulse">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-widest block">
                AVISOS PREVENTIVOS DE COBRANZA
              </span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                {expiringMembers.length} {expiringMembers.length === 1 ? 'socio' : 'socios'} próximos a vencer
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Recordatorios Automáticos por WhatsApp y SMS
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-amber-200/50 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <span>{isExpanded ? 'Ocultar Lista' : 'Ver Socios'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded List of Expiring Members */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-amber-200/80 bg-white/60 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringMembers.map(({ member, daysDiff }) => {
              const { text: msgText } = generateReminderMessage(member, settings, 'whatsapp');
              const isToday = daysDiff === 0;

              return (
                <div
                  key={member.id}
                  className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Member info */}
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-800 font-bold text-xs">
                            {member.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {member.fullName}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                              isToday
                                ? 'bg-red-500 text-white'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {isToday ? '¡VENCE HOY!' : `Vence en ${daysDiff}d`}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          DNI: {member.dni} · {member.plan}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{member.phone || 'Sin celular registrado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Due Date & Fee pill */}
                    <div className="mt-3 p-2 bg-amber-50/70 border border-amber-100 rounded-lg text-xs flex items-center justify-between">
                      <span className="text-slate-600">
                        Fecha límite: <strong>{formatDate(member.feeDueDate)}</strong>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {settings.currencySymbol} {member.monthlyFee.toFixed(2)}
                      </span>
                    </div>

                    {/* Reminder Status */}
                    {member.lastReminderSentAt && (
                      <div className="mt-1.5 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Aviso enviado ({member.lastReminderChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppClick(member)}
                        disabled={!member.phone}
                        title="Enviar recordatorio automático por WhatsApp"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* SMS Button */}
                      <button
                        type="button"
                        onClick={() => handleSmsClick(member)}
                        disabled={!member.phone}
                        title="Enviar recordatorio por Mensaje de Texto (SMS)"
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </button>

                      {/* Copy message button */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(member)}
                        title="Copiar texto del mensaje"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        {copiedMemberId === member.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Collect fee */}
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal(member)}
                      title="Cobrar cuota y renovar"
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      Renovar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Los recordatorios utilizan el número de teléfono cargado en la planilla del socio con un texto personalizado con su nombre y fecha.
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
