import React from 'react';
import { Plus, Lock, Unlock, Users, ShieldCheck, LogOut } from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { calculatePaymentStatus } from '../utils/date';

interface NavbarProps {
  currentTab: 'terminal' | 'analytics' | 'members' | 'debtors' | 'logs';
  onSelectTab: (tab: 'terminal' | 'analytics' | 'members' | 'debtors' | 'logs') => void;
  onOpenNewMemberModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenRoleSwitchModal: () => void;
  onOpenUserManagementModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewMemberModal,
  onOpenSettingsModal,
  onOpenRoleSwitchModal,
  onOpenUserManagementModal,
}) => {
  const { members, settings, activeRole, session, logout } = useAccessControl();

  // Count how many members are overdue
  const overdueCount = members.filter((m) => {
    const { isOverdue } = calculatePaymentStatus(m.feeDueDate, settings.gracePeriodDays);
    return isOverdue;
  }).length;

  const isAdmin = activeRole === 'admin';

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Logo and Gym Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-black border border-slate-700 overflow-hidden flex items-center justify-center p-0.5 shadow-sm shrink-0">
              <img
                src={settings.logoUrl || '/assets/aistudio/image_fec4e5d4.png'}
                alt="New Age Gym Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap block">
                {settings.facilityName}
              </span>
              <span className="text-[11px] text-amber-400 font-medium whitespace-nowrap block tracking-wider uppercase">
                {isAdmin ? 'Panel de Administración' : 'Kiosco de Acceso para Socios'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (ONLY VISIBLE FOR ADMINISTRATOR) */}
          {isAdmin ? (
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => onSelectTab('terminal')}
                className={`transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
                  currentTab === 'terminal'
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                Terminal de Acceso
              </button>
              <button
                onClick={() => onSelectTab('analytics')}
                className={`transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
                  currentTab === 'analytics'
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                Tablero & Horas Pico
              </button>
              <button
                onClick={() => onSelectTab('members')}
                className={`transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
                  currentTab === 'members'
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                Padrón de Socios
              </button>
              <button
                onClick={() => onSelectTab('debtors')}
                className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'debtors'
                    ? 'border-red-500 text-red-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <span>Control de Cuotas</span>
                {overdueCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold text-white bg-red-600 rounded-sm">
                    {overdueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onSelectTab('logs')}
                className={`transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
                  currentTab === 'logs'
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                Historial
              </button>
            </nav>
          ) : (
            /* Socio Mode Center Status Banner */
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Molinete Listo · Ingrese su DNI al ingresar o salir</span>
            </div>
          )}

          {/* Zone 3: Actions & Role Switching */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAdmin ? (
              <>
                {/* User management button */}
                <button
                  onClick={onOpenUserManagementModal}
                  title="Gestión de Usuarios (Admin / Socio)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Usuarios</span>
                </button>

                {/* Lock into Socio Mode button */}
                <button
                  onClick={onOpenRoleSwitchModal}
                  title="Bloquear en Modo Socio / Kiosco"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Modo Kiosco</span>
                </button>

                {/* Settings */}
                <button
                  onClick={onOpenSettingsModal}
                  title="Ajustes del Sistema"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="sr-only">Ajustes</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {/* Primary Action: New Member */}
                <button
                  onClick={onOpenNewMemberModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Socio</span>
                </button>
              </>
            ) : (
              /* Socio Mode: Discrete Admin Unlock button with PIN */
              <button
                onClick={onOpenRoleSwitchModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Desbloquear panel de administración (Requiere PIN)"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Acceso Admin</span>
              </button>
            )}

            {/* Logout / Exit button */}
            <button
              onClick={logout}
              title="Cerrar sesión / Salir a pantalla de ingreso"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="sr-only">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar for Admin ONLY */}
        {isAdmin && (
          <div className="flex lg:hidden border-t border-slate-800 py-2 gap-1 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => onSelectTab('terminal')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                currentTab === 'terminal' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                currentTab === 'analytics' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Tablero
            </button>
            <button
              onClick={() => onSelectTab('members')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                currentTab === 'members' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Socios
            </button>
            <button
              onClick={() => onSelectTab('debtors')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
                currentTab === 'debtors' ? 'bg-red-600 text-white font-bold' : 'text-slate-300'
              }`}
            >
              <span>Cuotas</span>
              {overdueCount > 0 && <span className="opacity-90">({overdueCount})</span>}
            </button>
            <button
              onClick={() => onSelectTab('logs')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                currentTab === 'logs' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Historial
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
