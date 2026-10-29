import React, { useState, useEffect } from 'react';
import { AccessControlProvider, useAccessControl } from './context/AccessControlContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { AccessTerminal } from './components/AccessTerminal';
import { MembersList } from './components/MembersList';
import { DebtorsList } from './components/DebtorsList';
import { AccessLogsList } from './components/AccessLogsList';
import { AccessAnalyticsDashboard } from './components/AccessAnalyticsDashboard';
import { MemberModal } from './components/MemberModal';
import { PaymentModal } from './components/PaymentModal';
import { MemberIdCardModal } from './components/MemberIdCardModal';
import { SettingsModal } from './components/SettingsModal';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { UserManagementModal } from './components/UserManagementModal';
import { Member } from './types';

function MainApp() {
  const { session, activeRole } = useAccessControl();
  const [currentTab, setCurrentTab] = useState<'terminal' | 'analytics' | 'members' | 'debtors' | 'logs'>('terminal');

  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [initialDniForNewMember, setInitialDniForNewMember] = useState<string | undefined>(undefined);

  const [payingMember, setPayingMember] = useState<Member | null>(null);
  const [viewingIdCardMember, setViewingIdCardMember] = useState<Member | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);

  // If in 'socio' mode, force tab to 'terminal' to lock out administrative panels
  useEffect(() => {
    if (activeRole === 'socio' && currentTab !== 'terminal') {
      setCurrentTab('terminal');
    }
  }, [activeRole, currentTab]);

  // If no authenticated session, show the login gate screen with role detection
  if (!session) {
    return <LoginScreen />;
  }

  const handleOpenNewMember = (dni?: string) => {
    setEditingMember(null);
    setInitialDniForNewMember(dni);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setInitialDniForNewMember(undefined);
    setIsMemberModalOpen(true);
  };

  const handleOpenPayment = (member: Member) => {
    setPayingMember(member);
  };

  const handleOpenIdCard = (member: Member) => {
    setViewingIdCardMember(member);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewMemberModal={() => handleOpenNewMember()}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenRoleSwitchModal={() => setIsRoleSwitchModalOpen(true)}
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'terminal' && (
          <AccessTerminal
            onOpenPaymentModal={handleOpenPayment}
            onOpenNewMemberModalWithDni={(dni) => handleOpenNewMember(dni)}
          />
        )}

        {activeRole === 'admin' && (
          <>
            {currentTab === 'analytics' && <AccessAnalyticsDashboard />}

            {currentTab === 'members' && (
              <MembersList
                onOpenNewMemberModal={() => handleOpenNewMember()}
                onOpenEditMemberModal={handleOpenEditMember}
                onOpenPaymentModal={handleOpenPayment}
                onOpenIdCardModal={handleOpenIdCard}
              />
            )}

            {currentTab === 'debtors' && (
              <DebtorsList onOpenPaymentModal={handleOpenPayment} />
            )}

            {currentTab === 'logs' && <AccessLogsList />}
          </>
        )}
      </main>

      {/* Modals (Only rendered when triggered) */}
      {isMemberModalOpen && activeRole === 'admin' && (
        <MemberModal
          initialMember={editingMember}
          initialDni={initialDniForNewMember}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}

      {payingMember && activeRole === 'admin' && (
        <PaymentModal
          member={payingMember}
          onClose={() => setPayingMember(null)}
        />
      )}

      {viewingIdCardMember && activeRole === 'admin' && (
        <MemberIdCardModal
          member={viewingIdCardMember}
          onClose={() => setViewingIdCardMember(null)}
        />
      )}

      {isSettingsModalOpen && activeRole === 'admin' && (
        <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
      )}

      {isRoleSwitchModalOpen && (
        <RoleSwitchModal onClose={() => setIsRoleSwitchModalOpen(false)} />
      )}

      {isUserManagementModalOpen && activeRole === 'admin' && (
        <UserManagementModal onClose={() => setIsUserManagementModalOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AccessControlProvider>
      <MainApp />
    </AccessControlProvider>
  );
}
