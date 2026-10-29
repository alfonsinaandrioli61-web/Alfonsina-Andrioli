export type AccessType = 'entrada' | 'salida';

export type PaymentStatus = 'al_dia' | 'por_vencer' | 'atrasado';

export interface MembershipType {
  id: string;
  name: string;
  price: number;
  description?: string;
  durationMonths?: number;
}

export type MembershipPlan = string;

export interface Member {
  id: string;
  dni: string; // Documento de Identidad (DNI / Cédula / Pasaporte)
  fullName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  plan: MembershipPlan;
  monthlyFee: number; // Monto de cuota mensual
  feeDueDate: string; // YYYY-MM-DD fecha en que vence la cuota
  status: 'active' | 'suspended' | 'inactive';
  isInside: boolean; // Si actualmente se encuentra adentro del recinto
  lastAccessAt?: string; // ISO datetime
  lastAccessType?: AccessType;
  lastReminderSentAt?: string; // ISO datetime de última notificación enviada
  lastReminderChannel?: 'whatsapp' | 'sms';
  notes?: string;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  memberId: string;
  dni: string;
  memberName: string;
  photoUrl?: string;
  type: AccessType;
  timestamp: string; // ISO datetime
  feeStatusAtAccess: PaymentStatus;
  daysOverdue: number;
  authorized: boolean;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  dni: string;
  amount: number;
  date: string; // ISO datetime
  periodCovered: string; // e.g. "Noviembre 2026"
  monthsAdded: number;
  paymentMethod: 'Efectivo' | 'Transferencia Bancaria' | 'Tarjeta Débito/Crédito' | 'Billetera Digital';
  receiptNumber: string;
  notes?: string;
}

export type UserRole = 'admin' | 'socio';

export interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin: string; // PIN numérico para cambio rápido en tablet
  createdAt: string;
}

export interface UserSession {
  role: UserRole;
  name: string;
  username?: string;
  dni?: string;
  loginTime: string;
}

export interface FacilitySettings {
  facilityName: string;
  logoUrl?: string;
  currencySymbol: string;
  defaultFeeAmount: number;
  gracePeriodDays: number;
  strictAccessBlock: boolean; // Si true, deniega acceso automáticamente cuando está atrasado
  soundEnabled: boolean;
  autoResetTerminalSeconds: number; // Segundos antes de limpiar la pantalla del terminal
  whatsappTemplate?: string; // Plantilla personalizada de mensaje
  smsTemplate?: string;
  membershipTypes?: MembershipType[];
}
