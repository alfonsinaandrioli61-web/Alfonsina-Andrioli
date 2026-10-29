import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Member,
  AccessLog,
  PaymentRecord,
  FacilitySettings,
  AccessType,
  PaymentStatus,
  UserRole,
  SystemUser,
  MembershipType,
  UserSession,
} from '../types';
import { calculatePaymentStatus, addMonthsToDueDate } from '../utils/date';
import { soundManager } from '../utils/sound';

interface AccessResult {
  status: 'granted' | 'overdue_warning' | 'denied' | 'not_found';
  message: string;
  member?: Member;
  log?: AccessLog;
  type?: AccessType;
  feeStatus?: PaymentStatus;
  daysOverdue?: number;
}

interface AccessControlContextType {
  members: Member[];
  accessLogs: AccessLog[];
  payments: PaymentRecord[];
  settings: FacilitySettings;
  activeResult: AccessResult | null;
  peopleInsideCount: number;
  // User Session & Roles (Admin vs Socio)
  session: UserSession | null;
  activeRole: UserRole;
  systemUsers: SystemUser[];
  currentSystemUser: SystemUser;
  login: (identifier: string, pin?: string) => { success: boolean; role?: UserRole; name?: string; error?: string };
  logout: () => void;
  switchRole: (targetRole: UserRole, enteredPin?: string) => { success: boolean; error?: string };
  addSystemUser: (userData: Omit<SystemUser, 'id' | 'createdAt'>) => SystemUser;
  deleteSystemUser: (id: string) => void;
  // Membership Plans / Types Config
  membershipTypes: MembershipType[];
  addMembershipType: (typeData: Omit<MembershipType, 'id'>) => MembershipType;
  updateMembershipType: (id: string, updates: Partial<MembershipType>) => void;
  deleteMembershipType: (id: string) => void;
  // Actions
  processAccessByDni: (dni: string, forcedType?: AccessType, allowOverdueOverride?: boolean) => AccessResult;
  clearActiveResult: () => void;
  addMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'isInside'>) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  recordPayment: (payment: {
    memberId: string;
    amount: number;
    monthsToAdd: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    receiptNumber: string;
    notes?: string;
  }) => PaymentRecord;
  updateSettings: (newSettings: Partial<FacilitySettings>) => void;
  markReminderSent: (memberId: string, channel: 'whatsapp' | 'sms') => void;
  clearLogs: () => void;
  resetToDemoData: () => void;
}

const STORAGE_KEYS = {
  MEMBERS: 'access_control_members_v1',
  LOGS: 'access_control_logs_v1',
  PAYMENTS: 'access_control_payments_v1',
  SETTINGS: 'access_control_settings_v1',
  USERS: 'access_control_system_users_v1',
  ROLE: 'access_control_active_role_v1',
  SESSION: 'access_control_session_v1',
  MEMBERSHIP_TYPES: 'access_control_membership_types_v1',
};

const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Administrador New Age',
    role: 'admin',
    pin: '1234',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-socio-1',
    username: 'socio_kiosk',
    name: 'Terminal Socios (Kiosco)',
    role: 'socio',
    pin: '',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-recepcion',
    username: 'recepcion',
    name: 'Recepción Central',
    role: 'admin',
    pin: '0000',
    createdAt: '2026-01-01',
  },
];

const DEFAULT_SETTINGS: FacilitySettings = {
  facilityName: 'NEW AGE GYM',
  logoUrl: '/assets/aistudio/image_fec4e5d4.png',
  currencySymbol: '$',
  defaultFeeAmount: 35.00,
  gracePeriodDays: 2,
  strictAccessBlock: false, // Default: warns loudly with alert banner, but allows receptionist to override or collect payment
  soundEnabled: true,
  autoResetTerminalSeconds: 6,
};

const DEFAULT_MEMBERSHIP_TYPES: MembershipType[] = [
  {
    id: 'plan-estandar',
    name: 'Mensual Estándar',
    price: 35.0,
    description: 'Acceso a sala de musculación y zona cardio',
    durationMonths: 1,
  },
  {
    id: 'plan-vip',
    name: 'Plan VIP Total',
    price: 45.0,
    description: 'Pase libre total + clases grupales, spinning, crossfit y vestuario VIP',
    durationMonths: 1,
  },
  {
    id: 'plan-estudiante',
    name: 'Pase Estudiante',
    price: 25.0,
    description: 'Tarifa bonificada para estudiantes secundarios y universitarios',
    durationMonths: 1,
  },
  {
    id: 'plan-corporativo',
    name: 'Plan Corporativo',
    price: 50.0,
    description: 'Convenio con empresas aliadas y entrenamiento funcional',
    durationMonths: 1,
  },
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    dni: '40123456',
    fullName: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+54 9 11 4522-8901',
    photoUrl: '/src/assets/images/avatar_member_carlos_1793278286295.jpg',
    plan: 'Plan VIP Total',
    monthlyFee: 45.0,
    feeDueDate: '2026-11-20', // Al día
    status: 'active',
    isInside: false,
    lastAccessAt: '2026-10-29T10:15:00',
    lastAccessType: 'salida',
    notes: 'Entrenamiento de fuerza y funcional',
    createdAt: '2026-01-15',
  },
  {
    id: 'mem-2',
    dni: '32987654',
    fullName: 'Ana Belén Gómez',
    email: 'ana.gomez@email.com',
    phone: '+54 9 11 5133-7722',
    photoUrl: '/src/assets/images/avatar_member_ana_1793278286033.jpg',
    plan: 'Mensual Estándar',
    monthlyFee: 35.0,
    feeDueDate: '2026-10-12', // Atrasada por 17 días
    status: 'active',
    isInside: false,
    lastAccessAt: '2026-10-25T18:10:00',
    lastAccessType: 'salida',
    notes: 'Avisar por WhatsApp cuando abone la cuota pendiente',
    createdAt: '2026-03-10',
  },
  {
    id: 'mem-3',
    dni: '28555111',
    fullName: 'Lucía Morales',
    email: 'lucia.morales@email.com',
    phone: '+54 9 11 6344-9988',
    photoUrl: '/src/assets/images/avatar_member_lucia_1793278287153.jpg',
    plan: 'Mensual Estándar',
    monthlyFee: 35.0,
    feeDueDate: '2026-09-10', // Atrasada por 49 días (2 meses adeudados)
    status: 'active',
    isInside: false,
    lastAccessAt: '2026-10-10T09:15:00',
    lastAccessType: 'salida',
    notes: 'Debe cuotas de septiembre y octubre',
    createdAt: '2025-11-04',
  },
  {
    id: 'mem-4',
    dni: '19444333',
    fullName: 'Diego Herrera',
    email: 'diego.herrera@email.com',
    phone: '+54 9 11 7722-1133',
    photoUrl: '/src/assets/images/avatar_member_diego_1793278287085.jpg',
    plan: 'Pase Estudiante',
    monthlyFee: 25.0,
    feeDueDate: '2026-11-15', // Al día
    status: 'active',
    isInside: true, // Adentro actualmente
    lastAccessAt: '2026-10-29T08:30:15',
    lastAccessType: 'entrada',
    notes: 'Pase universitario de musculación',
    createdAt: '2026-06-01',
  },
  {
    id: 'mem-5',
    dni: '44778899',
    fullName: 'Valeria Ramos',
    email: 'valeria.ramos@email.com',
    phone: '+54 9 11 4400-3321',
    plan: 'Mensual Estándar',
    monthlyFee: 35.0,
    feeDueDate: '2026-10-31', // Por vencer en 2 días
    status: 'active',
    isInside: false,
    lastAccessAt: '2026-10-28T19:05:00',
    lastAccessType: 'salida',
    notes: 'Vence a fin de mes',
    createdAt: '2026-04-12',
  },
  {
    id: 'mem-6',
    dni: '38222666',
    fullName: 'Martín Silva',
    email: 'martin.silva@email.com',
    phone: '+54 9 11 5566-2244',
    plan: 'Plan Corporativo',
    monthlyFee: 50.0,
    feeDueDate: '2026-12-01', // Al día
    status: 'active',
    isInside: true, // Adentro actualmente
    lastAccessAt: '2026-10-29T07:15:00',
    lastAccessType: 'entrada',
    notes: 'Plan Crossfit y Musculación',
    createdAt: '2026-02-18',
  },
  {
    id: 'mem-7',
    dni: '35661244',
    fullName: 'Joaquín Benítez',
    email: 'joaquin.b@email.com',
    phone: '+54 9 11 6611-9922',
    plan: 'Plan VIP Total',
    monthlyFee: 45.0,
    feeDueDate: '2026-11-25',
    status: 'active',
    isInside: false,
    createdAt: '2026-05-10',
  },
  {
    id: 'mem-8',
    dni: '41998822',
    fullName: 'Camila Rossi',
    email: 'camila.rossi@email.com',
    phone: '+54 9 11 3322-1144',
    plan: 'Mensual Estándar',
    monthlyFee: 35.0,
    feeDueDate: '2026-11-05',
    status: 'active',
    isInside: false,
    createdAt: '2026-07-22',
  },
  {
    id: 'mem-9',
    dni: '30111222',
    fullName: 'Gonzalo Castro',
    email: 'gonzalo.castro@email.com',
    phone: '+54 9 11 8899-7711',
    plan: 'Mensual Estándar',
    monthlyFee: 35.0,
    feeDueDate: '2026-08-15', // No renovó hace más de 2 meses
    status: 'inactive', // Inactivo por falta de asistencia
    isInside: false,
    lastAccessAt: '2026-08-14T19:30:00',
    notes: 'No renovó membresía desde agosto. Inactivo por inasistencia prolongada.',
    createdAt: '2025-10-10',
  },
  {
    id: 'mem-10',
    dni: '27888999',
    fullName: 'Mariana Ruiz',
    email: 'mariana.ruiz@email.com',
    phone: '+54 9 11 2233-4455',
    plan: 'Plan VIP Total',
    monthlyFee: 45.0,
    feeDueDate: '2026-09-28', // Vencida
    status: 'suspended', // Suspendida temporalmente
    isInside: false,
    lastAccessAt: '2026-09-25T17:00:00',
    notes: 'Suspendida temporalmente por solicitud de baja médica hasta nueva alta.',
    createdAt: '2025-08-01',
  },
];

const INITIAL_LOGS: AccessLog[] = [
  // Hoy (2026-10-29)
  {
    id: 'log-today-1',
    memberId: 'mem-6',
    dni: '38222666',
    memberName: 'Martín Silva',
    type: 'entrada',
    timestamp: '2026-10-29T07:15:00',
    feeStatusAtAccess: 'al_dia',
    daysOverdue: 0,
    authorized: true,
  },
  {
    id: 'log-today-2',
    memberId: 'mem-1',
    dni: '40123456',
    memberName: 'Carlos Mendoza',
    photoUrl: '/src/assets/images/avatar_member_carlos_1793278286295.jpg',
    type: 'entrada',
    timestamp: '2026-10-29T08:05:00',
    feeStatusAtAccess: 'al_dia',
    daysOverdue: 0,
    authorized: true,
  },
  {
    id: 'log-today-3',
    memberId: 'mem-4',
    dni: '19444333',
    memberName: 'Diego Herrera',
    photoUrl: '/src/assets/images/avatar_member_diego_1793278287085.jpg',
    type: 'entrada',
    timestamp: '2026-10-29T08:30:15',
    feeStatusAtAccess: 'al_dia',
    daysOverdue: 0,
    authorized: true,
  },
  {
    id: 'log-today-4',
    memberId: 'mem-1',
    dni: '40123456',
    memberName: 'Carlos Mendoza',
    photoUrl: '/src/assets/images/avatar_member_carlos_1793278286295.jpg',
    type: 'salida',
    timestamp: '2026-10-29T10:15:00',
    feeStatusAtAccess: 'al_dia',
    daysOverdue: 0,
    authorized: true,
  },
  // Ayer (2026-10-28)
  { id: 'log-28-1', memberId: 'mem-6', dni: '38222666', memberName: 'Martín Silva', type: 'entrada', timestamp: '2026-10-28T07:10:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-2', memberId: 'mem-6', dni: '38222666', memberName: 'Martín Silva', type: 'salida', timestamp: '2026-10-28T08:45:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-3', memberId: 'mem-7', dni: '35661244', memberName: 'Joaquín Benítez', type: 'entrada', timestamp: '2026-10-28T08:15:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-4', memberId: 'mem-7', dni: '35661244', memberName: 'Joaquín Benítez', type: 'salida', timestamp: '2026-10-28T09:40:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-5', memberId: 'mem-4', dni: '19444333', memberName: 'Diego Herrera', type: 'entrada', timestamp: '2026-10-28T14:20:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-6', memberId: 'mem-4', dni: '19444333', memberName: 'Diego Herrera', type: 'salida', timestamp: '2026-10-28T15:50:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-7', memberId: 'mem-5', dni: '44778899', memberName: 'Valeria Ramos', type: 'entrada', timestamp: '2026-10-28T17:45:00', feeStatusAtAccess: 'por_vencer', daysOverdue: 0, authorized: true },
  { id: 'log-28-8', memberId: 'mem-8', dni: '41998822', memberName: 'Camila Rossi', type: 'entrada', timestamp: '2026-10-28T18:10:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-9', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'entrada', timestamp: '2026-10-28T18:25:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-10', memberId: 'mem-5', dni: '44778899', memberName: 'Valeria Ramos', type: 'salida', timestamp: '2026-10-28T19:05:00', feeStatusAtAccess: 'por_vencer', daysOverdue: 0, authorized: true },
  { id: 'log-28-11', memberId: 'mem-8', dni: '41998822', memberName: 'Camila Rossi', type: 'salida', timestamp: '2026-10-28T19:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-28-12', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'salida', timestamp: '2026-10-28T19:40:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },

  // 2026-10-27
  { id: 'log-27-1', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'entrada', timestamp: '2026-10-27T07:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-27-2', memberId: 'mem-7', dni: '35661244', memberName: 'Joaquín Benítez', type: 'entrada', timestamp: '2026-10-27T08:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-27-3', memberId: 'mem-6', dni: '38222666', memberName: 'Martín Silva', type: 'entrada', timestamp: '2026-10-27T12:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-27-4', memberId: 'mem-4', dni: '19444333', memberName: 'Diego Herrera', type: 'entrada', timestamp: '2026-10-27T18:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-27-5', memberId: 'mem-8', dni: '41998822', memberName: 'Camila Rossi', type: 'entrada', timestamp: '2026-10-27T18:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-27-6', memberId: 'mem-5', dni: '44778899', memberName: 'Valeria Ramos', type: 'entrada', timestamp: '2026-10-27T19:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },

  // 2026-10-26 (Lunes pico)
  { id: 'log-26-1', memberId: 'mem-6', dni: '38222666', memberName: 'Martín Silva', type: 'entrada', timestamp: '2026-10-26T07:05:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-26-2', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'entrada', timestamp: '2026-10-26T07:45:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-26-3', memberId: 'mem-7', dni: '35661244', memberName: 'Joaquín Benítez', type: 'entrada', timestamp: '2026-10-26T08:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-26-4', memberId: 'mem-4', dni: '19444333', memberName: 'Diego Herrera', type: 'entrada', timestamp: '2026-10-26T17:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-26-5', memberId: 'mem-8', dni: '41998822', memberName: 'Camila Rossi', type: 'entrada', timestamp: '2026-10-26T18:15:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-26-6', memberId: 'mem-5', dni: '44778899', memberName: 'Valeria Ramos', type: 'entrada', timestamp: '2026-10-26T18:45:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-26-7', memberId: 'mem-2', dni: '32987654', memberName: 'Ana Belén Gómez', type: 'entrada', timestamp: '2026-10-26T19:15:00', feeStatusAtAccess: 'atrasado', daysOverdue: 14, authorized: true, notes: 'Ingreso excepcional autorizado' },
  { id: 'log-26-8', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'entrada', timestamp: '2026-10-26T19:40:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },

  // 2026-10-25 (Domingo)
  { id: 'log-25-1', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'entrada', timestamp: '2026-10-25T10:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-25-2', memberId: 'mem-7', dni: '35661244', memberName: 'Joaquín Benítez', type: 'entrada', timestamp: '2026-10-25T11:15:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-25-3', memberId: 'mem-2', dni: '32987654', memberName: 'Ana Belén Gómez', type: 'entrada', timestamp: '2026-10-25T16:30:00', feeStatusAtAccess: 'atrasado', daysOverdue: 13, authorized: true },
  { id: 'log-25-4', memberId: 'mem-2', dni: '32987654', memberName: 'Ana Belén Gómez', type: 'salida', timestamp: '2026-10-25T18:10:00', feeStatusAtAccess: 'atrasado', daysOverdue: 13, authorized: true },

  // 2026-10-24 (Sábado)
  { id: 'log-24-1', memberId: 'mem-6', dni: '38222666', memberName: 'Martín Silva', type: 'entrada', timestamp: '2026-10-24T09:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-24-2', memberId: 'mem-4', dni: '19444333', memberName: 'Diego Herrera', type: 'entrada', timestamp: '2026-10-24T10:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-24-3', memberId: 'mem-8', dni: '41998822', memberName: 'Camila Rossi', type: 'entrada', timestamp: '2026-10-24T11:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-24-4', memberId: 'mem-1', dni: '40123456', memberName: 'Carlos Mendoza', type: 'entrada', timestamp: '2026-10-24T12:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },

  // 2026-10-23 (Viernes)
  { id: 'log-23-1', memberId: 'mem-6', dni: '38222666', memberName: 'Martín Silva', type: 'entrada', timestamp: '2026-10-23T07:15:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-23-2', memberId: 'mem-7', dni: '35661244', memberName: 'Joaquín Benítez', type: 'entrada', timestamp: '2026-10-23T08:20:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-23-3', memberId: 'mem-4', dni: '19444333', memberName: 'Diego Herrera', type: 'entrada', timestamp: '2026-10-23T18:00:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-23-4', memberId: 'mem-5', dni: '44778899', memberName: 'Valeria Ramos', type: 'entrada', timestamp: '2026-10-23T18:40:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
  { id: 'log-23-5', memberId: 'mem-8', dni: '41998822', memberName: 'Camila Rossi', type: 'entrada', timestamp: '2026-10-23T19:30:00', feeStatusAtAccess: 'al_dia', daysOverdue: 0, authorized: true },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    memberId: 'mem-1',
    memberName: 'Carlos Mendoza',
    dni: '40123456',
    amount: 45.0,
    date: '2026-10-20T11:00:00',
    periodCovered: 'Noviembre 2026',
    monthsAdded: 1,
    paymentMethod: 'Tarjeta Débito/Crédito',
    receiptNumber: 'REC-001089',
    notes: 'Pago mensual al día',
  },
  {
    id: 'pay-2',
    memberId: 'mem-4',
    memberName: 'Diego Herrera',
    dni: '19444333',
    amount: 25.0,
    date: '2026-10-15T15:30:00',
    periodCovered: 'Noviembre 2026',
    monthsAdded: 1,
    paymentMethod: 'Efectivo',
    receiptNumber: 'REC-001088',
    notes: 'Pase estudiante mensual',
  },
];

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export const AccessControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return stored ? JSON.parse(stored) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 5) {
          return parsed;
        }
      }
      return INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return stored ? JSON.parse(stored) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [settings, setSettings] = useState<FacilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          facilityName: parsed.facilityName && parsed.facilityName !== 'Club Deportivo & Gimnasio Apolo'
            ? parsed.facilityName
            : 'NEW AGE GYM',
          logoUrl: '/assets/aistudio/image_fec4e5d4.png',
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : DEFAULT_SYSTEM_USERS;
    } catch {
      return DEFAULT_SYSTEM_USERS;
    }
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROLE);
      return stored === 'socio' || stored === 'admin' ? stored : 'admin';
    } catch {
      return 'admin';
    }
  });

  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEMBERSHIP_TYPES);
      return stored ? JSON.parse(stored) : DEFAULT_MEMBERSHIP_TYPES;
    } catch {
      return DEFAULT_MEMBERSHIP_TYPES;
    }
  });

  const [activeResult, setActiveResult] = useState<AccessResult | null>(null);

  // Sync state to local storage
  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch {
      // Ignore
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERSHIP_TYPES, JSON.stringify(membershipTypes));
    } catch {
      // Ignore
    }
  }, [membershipTypes]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(systemUsers));
    } catch {
      // Ignore
    }
  }, [systemUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, activeRole);
    } catch {
      // Ignore
    }
  }, [activeRole]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    } catch {
      // Ignore
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(accessLogs));
    } catch {
      // Ignore
    }
  }, [accessLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch {
      // Ignore
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  const peopleInsideCount = members.filter((m) => m.isInside).length;

  const clearActiveResult = () => {
    setActiveResult(null);
  };

  /**
   * Main Access Control Execution:
   * Called when entering a DNI
   */
  const processAccessByDni = (
    dniInput: string,
    forcedType?: AccessType,
    allowOverdueOverride = false
  ): AccessResult => {
    const cleanDni = dniInput.trim().replace(/\D/g, '');
    if (!cleanDni) {
      if (settings.soundEnabled) soundManager.playDenied();
      const res: AccessResult = {
        status: 'denied',
        message: 'Por favor ingrese un número de documento válido.',
      };
      setActiveResult(res);
      return res;
    }

    const member = members.find((m) => m.dni.replace(/\D/g, '') === cleanDni);

    if (!member) {
      if (settings.soundEnabled) soundManager.playDenied();
      const res: AccessResult = {
        status: 'not_found',
        message: `El documento ${cleanDni} no está registrado en el sistema.`,
      };
      setActiveResult(res);
      return res;
    }

    if (member.status === 'suspended' || member.status === 'inactive') {
      if (settings.soundEnabled) soundManager.playDenied();
      const statusLabel = member.status === 'suspended' ? 'SUSPENDIDO' : 'INACTIVO (Baja/No Renovó)';
      const res: AccessResult = {
        status: 'denied',
        message: `El socio ${member.fullName} figura como ${statusLabel} en administración. Acérquese a recepción para reactivar su membresía.`,
        member,
      };
      setActiveResult(res);
      return res;
    }

    // Determine type: Entrada vs Salida
    // If not forced, automatic toggle: If currently inside, it's a SALIDA; otherwise ENTRADA
    const determinedType: AccessType = forcedType || (member.isInside ? 'salida' : 'entrada');

    // Check payment status
    const paymentCheck = calculatePaymentStatus(member.feeDueDate, settings.gracePeriodDays);

    // If attempting ENTRADA and overdue:
    if (determinedType === 'entrada' && paymentCheck.isOverdue && !allowOverdueOverride) {
      if (settings.soundEnabled) soundManager.playOverdueWarning();

      // If strict mode, access is flatly denied; otherwise it's a critical warning that requires confirmation
      const res: AccessResult = {
        status: 'overdue_warning',
        message: `¡ALERTA DE MORA! La cuota mensual de ${member.fullName} venció hace ${paymentCheck.daysOverdue} días (${member.feeDueDate}).`,
        member,
        type: determinedType,
        feeStatus: paymentCheck.status,
        daysOverdue: paymentCheck.daysOverdue,
      };
      setActiveResult(res);
      return res;
    }

    // If access is authorized (or Salida, which should always be permitted to let people leave):
    const nowIso = new Date().toISOString();
    const newInsideStatus = determinedType === 'entrada';

    const newLog: AccessLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      memberId: member.id,
      dni: member.dni,
      memberName: member.fullName,
      photoUrl: member.photoUrl,
      type: determinedType,
      timestamp: nowIso,
      feeStatusAtAccess: paymentCheck.status,
      daysOverdue: paymentCheck.daysOverdue,
      authorized: true,
      notes: allowOverdueOverride ? 'Acceso autorizado con cuota atrasada (Permiso especial)' : undefined,
    };

    // Update member record
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              isInside: newInsideStatus,
              lastAccessAt: nowIso,
              lastAccessType: determinedType,
            }
          : m
      )
    );

    // Append log
    setAccessLogs((prev) => [newLog, ...prev]);

    if (settings.soundEnabled) soundManager.playGranted();

    const successMessage =
      determinedType === 'entrada'
        ? `¡Bienvenido/a, ${member.fullName}! ENTRADA registrada correctamente.`
        : `¡Hasta luego, ${member.fullName}! SALIDA registrada correctamente.`;

    const res: AccessResult = {
      status: 'granted',
      message: successMessage,
      member: {
        ...member,
        isInside: newInsideStatus,
        lastAccessAt: nowIso,
        lastAccessType: determinedType,
      },
      log: newLog,
      type: determinedType,
      feeStatus: paymentCheck.status,
      daysOverdue: paymentCheck.daysOverdue,
    };

    setActiveResult(res);
    return res;
  };

  const addMember = (memberData: Omit<Member, 'id' | 'createdAt' | 'isInside'>): Member => {
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      isInside: false,
    };
    setMembers((prev) => [newMember, ...prev]);
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    if (activeResult?.member?.id === id) {
      setActiveResult((prev) => (prev && prev.member ? { ...prev, member: { ...prev.member, ...updates } } : prev));
    }
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const recordPayment = (params: {
    memberId: string;
    amount: number;
    monthsToAdd: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    receiptNumber: string;
    notes?: string;
  }): PaymentRecord => {
    const member = members.find((m) => m.id === params.memberId);
    if (!member) throw new Error('Socio no encontrado');

    const newDueDate = addMonthsToDueDate(member.feeDueDate, params.monthsToAdd);
    const nowIso = new Date().toISOString();

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      memberId: member.id,
      memberName: member.fullName,
      dni: member.dni,
      amount: params.amount,
      date: nowIso,
      periodCovered: `+${params.monthsToAdd} mes(es) hasta ${newDueDate}`,
      monthsAdded: params.monthsToAdd,
      paymentMethod: params.paymentMethod,
      receiptNumber: params.receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: params.notes,
    };

    // Update member's due date
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              feeDueDate: newDueDate,
            }
          : m
      )
    );

    // Append to payments
    setPayments((prev) => [newPayment, ...prev]);

    return newPayment;
  };

  const updateSettings = (newSettings: Partial<FacilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const markReminderSent = (memberId: string, channel: 'whatsapp' | 'sms') => {
    const nowIso = new Date().toISOString();
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              lastReminderSentAt: nowIso,
              lastReminderChannel: channel,
            }
          : m
      )
    );
  };

  const currentSystemUser = systemUsers.find((u) => u.role === activeRole) || systemUsers[0];

  const switchRole = (targetRole: UserRole, enteredPin?: string): { success: boolean; error?: string } => {
    if (targetRole === 'admin') {
      const trimmedPin = (enteredPin || '').trim();
      // Match any admin user PIN or master PIN 1234
      const matchedAdmin = systemUsers.find(
        (u) => u.role === 'admin' && (u.pin === trimmedPin || trimmedPin === '1234')
      );
      if (!matchedAdmin && trimmedPin !== '1234') {
        return {
          success: false,
          error: 'PIN incorrecto. Ingrese el código PIN de Administrador (Predeterminado: 1234).',
        };
      }
      setActiveRole('admin');
      return { success: true };
    } else {
      setActiveRole('socio');
      return { success: true };
    }
  };

  const addSystemUser = (userData: Omit<SystemUser, 'id' | 'createdAt'>): SystemUser => {
    const newUser: SystemUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSystemUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const deleteSystemUser = (id: string) => {
    setSystemUsers((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target?.role === 'admin') {
        const remainingAdmins = prev.filter((u) => u.role === 'admin' && u.id !== id);
        if (remainingAdmins.length === 0) {
          alert('No se puede eliminar el único administrador del sistema.');
          return prev;
        }
      }
      return prev.filter((u) => u.id !== id);
    });
  };

  const login = (
    identifier: string,
    pin?: string
  ): { success: boolean; role?: UserRole; name?: string; error?: string } => {
    const clean = identifier.trim();
    if (!clean) {
      return { success: false, error: 'Por favor ingrese su número de documento (DNI) o usuario.' };
    }

    const cleanDigits = clean.replace(/\D/g, '');

    // 1. Check if matches an admin or receptionist system user by username
    const matchedSystemUser = systemUsers.find(
      (u) => u.username.toLowerCase() === clean.toLowerCase()
    );

    if (matchedSystemUser) {
      if (matchedSystemUser.role === 'admin') {
        const trimmedPin = (pin || '').trim();
        if (matchedSystemUser.pin && matchedSystemUser.pin !== trimmedPin && trimmedPin !== '1234') {
          return { success: false, error: 'PIN incorrecto para este usuario administrador (Por defecto: 1234).' };
        }
        const newSession: UserSession = {
          role: 'admin',
          name: matchedSystemUser.name,
          username: matchedSystemUser.username,
          loginTime: new Date().toISOString(),
        };
        setSession(newSession);
        setActiveRole('admin');
        return { success: true, role: 'admin', name: matchedSystemUser.name };
      } else {
        const newSession: UserSession = {
          role: 'socio',
          name: matchedSystemUser.name,
          username: matchedSystemUser.username,
          loginTime: new Date().toISOString(),
        };
        setSession(newSession);
        setActiveRole('socio');
        return { success: true, role: 'socio', name: matchedSystemUser.name };
      }
    }

    // 2. Check if clean identifier is 'admin' or has entered '1234'
    if (clean.toLowerCase() === 'admin' || clean === '1234') {
      const trimmedPin = (pin || '').trim();
      if (clean !== '1234' && trimmedPin !== '1234' && !systemUsers.some((u) => u.role === 'admin' && u.pin === trimmedPin)) {
        return { success: false, error: 'Ingrese el PIN de Administrador (Predeterminado: 1234).' };
      }
      const adminUser = systemUsers.find((u) => u.role === 'admin') || systemUsers[0];
      const newSession: UserSession = {
        role: 'admin',
        name: adminUser.name,
        username: adminUser.username,
        loginTime: new Date().toISOString(),
      };
      setSession(newSession);
      setActiveRole('admin');
      return { success: true, role: 'admin', name: adminUser.name };
    }

    // 3. Check if clean digits match a registered Socio Member DNI
    if (cleanDigits.length >= 6) {
      const matchedMember = members.find((m) => m.dni.replace(/\D/g, '') === cleanDigits);
      if (matchedMember) {
        const newSession: UserSession = {
          role: 'socio',
          name: matchedMember.fullName,
          dni: matchedMember.dni,
          loginTime: new Date().toISOString(),
        };
        setSession(newSession);
        setActiveRole('socio');
        return { success: true, role: 'socio', name: matchedMember.fullName };
      }
    }

    // 4. If user entered 'socio' or 'kiosco'
    if (clean.toLowerCase() === 'socio' || clean.toLowerCase() === 'kiosco') {
      const newSession: UserSession = {
        role: 'socio',
        name: 'Terminal de Autoservicio Socios',
        loginTime: new Date().toISOString(),
      };
      setSession(newSession);
      setActiveRole('socio');
      return { success: true, role: 'socio', name: 'Terminal Kiosco' };
    }

    // 5. If digits entered >= 6, treat as socio check-in directly
    if (cleanDigits.length >= 6) {
      const newSession: UserSession = {
        role: 'socio',
        name: `Socio (DNI ${cleanDigits})`,
        dni: cleanDigits,
        loginTime: new Date().toISOString(),
      };
      setSession(newSession);
      setActiveRole('socio');
      return { success: true, role: 'socio', name: `DNI ${cleanDigits}` };
    }

    return {
      success: false,
      error: 'No se detectó un usuario ni socio registrado. Ingrese su número de DNI o usuario administrador.',
    };
  };

  const logout = () => {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      // Ignore
    }
  };

  const addMembershipType = (typeData: Omit<MembershipType, 'id'>): MembershipType => {
    const newType: MembershipType = {
      ...typeData,
      id: `plan-${Date.now()}`,
    };
    setMembershipTypes((prev) => [...prev, newType]);
    return newType;
  };

  const updateMembershipType = (id: string, updates: Partial<MembershipType>) => {
    setMembershipTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteMembershipType = (id: string) => {
    setMembershipTypes((prev) => {
      if (prev.length <= 1) {
        alert('Debe conservar al menos un tipo de membresía en el sistema.');
        return prev;
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const clearLogs = () => {
    setAccessLogs([]);
  };

  const resetToDemoData = () => {
    setMembers(INITIAL_MEMBERS);
    setAccessLogs(INITIAL_LOGS);
    setPayments(INITIAL_PAYMENTS);
    setSettings(DEFAULT_SETTINGS);
    setMembershipTypes(DEFAULT_MEMBERSHIP_TYPES);
    setActiveResult(null);
  };

  return (
    <AccessControlContext.Provider
      value={{
        members,
        accessLogs,
        payments,
        settings,
        activeResult,
        peopleInsideCount,
        session,
        activeRole,
        systemUsers,
        currentSystemUser,
        login,
        logout,
        switchRole,
        addSystemUser,
        deleteSystemUser,
        membershipTypes,
        addMembershipType,
        updateMembershipType,
        deleteMembershipType,
        processAccessByDni,
        clearActiveResult,
        addMember,
        updateMember,
        deleteMember,
        recordPayment,
        updateSettings,
        markReminderSent,
        clearLogs,
        resetToDemoData,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};
