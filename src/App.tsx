/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { BlockedAccountView } from './components/auth/BlockedAccountView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BuyerOverview } from './components/buyer/BuyerOverview';
import { BatchesList } from './components/buyer/BatchesList';
import { PlaquesGrid } from './components/buyer/PlaquesGrid';
import { ExportCenter } from './components/buyer/ExportCenter';
import { AccountView } from './components/buyer/AccountView';
import { CreateBatchModal } from './components/buyer/CreateBatchModal';
import { EditDestinationModal } from './components/buyer/EditDestinationModal';
import { ModelCalibrationModal } from './components/buyer/ModelCalibrationModal';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import { AutomatedTestsModal } from './components/AutomatedTestsModal';
import { RedirectLanding } from './components/public/RedirectLanding';
import { subscribeToBatches, subscribeToPlaques } from './services/buyerService';
import { Batch, Plaque } from './types';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const {
    user,
    userProfile,
    isAdmin,
    loading,
    isFirebaseConfigured,
  } = useAuth();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Real-time buyer data
  const [batches, setBatches] = useState<Batch[]>([]);
  const [plaques, setPlaques] = useState<Plaque[]>([]);

  // Modals state
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showEditDestination, setShowEditDestination] = useState(false);
  const [plaqueToEdit, setPlaqueToEdit] = useState<Plaque | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(!isFirebaseConfigured);
  const [showTests, setShowTests] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [selectedBatchForPlaques, setSelectedBatchForPlaques] = useState<string | null>(null);

  // Subscribe to buyer's batches and plaques in real time when user is approved
  useEffect(() => {
    if (!user || userProfile?.status !== 'approved') {
      setBatches([]);
      setPlaques([]);
      return;
    }

    const unsubBatches = subscribeToBatches(user.uid, (bList) => {
      setBatches(bList);
    });

    const unsubPlaques = subscribeToPlaques(user.uid, (pList) => {
      setPlaques(pList);
    });

    return () => {
      unsubBatches();
      unsubPlaques();
    };
  }, [user, userProfile?.status]);

  // Handle URL public redirect check
  const [publicRedirectId, setPublicRedirectId] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const queryR = urlParams.get('r');

    if (queryR) {
      setPublicRedirectId(queryR);
    } else if (path.startsWith('/r/')) {
      const id = path.replace('/r/', '').split('/')[0];
      if (id) setPublicRedirectId(id);
    } else if (path.startsWith('/redirect/')) {
      const id = path.replace('/redirect/', '').split('/')[0];
      if (id) setPublicRedirectId(id);
    }
  }, []);

  // 1. If public redirect link was clicked/scanned, serve public redirect landing
  if (publicRedirectId) {
    return <RedirectLanding publicId={publicRedirectId} />;
  }

  // 2. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/40 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-2xl shadow-red-950/60 animate-pulse">
            D
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
            <span>Inicializando DINÂMICO PRO...</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is not authenticated -> show Login / Register
  if (!user) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col justify-between">
        <Header
          currentTab="login"
          onTabChange={() => {}}
          onOpenTests={() => setShowTests(true)}
        />

        <main className="flex-1 flex items-center justify-center">
          {authView === 'login' ? (
            <LoginView
              onSwitchToRegister={() => setAuthView('register')}
              onOpenForgotPassword={() => setShowForgotPassword(true)}
              onOpenSetup={() => setShowFirebaseSetup(true)}
            />
          ) : (
            <RegisterView
              onSwitchToLogin={() => setAuthView('login')}
              onOpenSetup={() => setShowFirebaseSetup(true)}
            />
          )}
        </main>

        <footer className="py-6 text-center text-[11px] text-zinc-600 border-t border-white/5">
          DINÂMICO PRO &copy; {new Date().getFullYear()} · Plataforma de Plaquinhas NFC e QR Codes Dinâmicos
        </footer>

        {/* Global Modals */}
        <FirebaseSetupModal
          isOpen={showFirebaseSetup}
          onClose={() => setShowFirebaseSetup(false)}
        />
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
        <AutomatedTestsModal
          isOpen={showTests}
          onClose={() => setShowTests(false)}
        />
      </div>
    );
  }

  // 4. User is logged in, but status is 'pending' (unless super-admin)
  if (userProfile?.status === 'pending' && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col justify-between">
        <Header
          currentTab="pending"
          onTabChange={() => {}}
          onOpenTests={() => setShowTests(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <PendingApprovalView />
        </main>
        <footer className="py-6 text-center text-[11px] text-zinc-600 border-t border-white/5">
          DINÂMICO PRO &copy; {new Date().getFullYear()} · Aguardando validação de licença
        </footer>
        <AutomatedTestsModal
          isOpen={showTests}
          onClose={() => setShowTests(false)}
        />
      </div>
    );
  }

  // 5. User is logged in, but status is 'blocked' (unless super-admin)
  if (userProfile?.status === 'blocked' && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col justify-between">
        <Header
          currentTab="blocked"
          onTabChange={() => {}}
          onOpenTests={() => setShowTests(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <BlockedAccountView />
        </main>
        <footer className="py-6 text-center text-[11px] text-zinc-600 border-t border-white/5">
          DINÂMICO PRO &copy; {new Date().getFullYear()} · Acesso ao editor bloqueado
        </footer>
      </div>
    );
  }

  // 6. User is approved (or admin) -> Full Platform
  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col justify-between">
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedBatchForPlaques(null);
          setCurrentTab(tab);
        }}
        onOpenTests={() => setShowTests(true)}
        onOpenCalibration={() => setShowCalibration(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <BuyerOverview
            batches={batches}
            plaques={plaques}
            onCreateBatch={() => setShowCreateBatch(true)}
            onNavigateBatches={() => setCurrentTab('batches')}
            onNavigatePlaques={() => {
              setSelectedBatchForPlaques(null);
              setCurrentTab('plaques');
            }}
            onNavigateExport={() => setCurrentTab('export')}
          />
        )}

        {currentTab === 'batches' && (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Meus Lotes de Plaquinhas
                </h2>
                <p className="text-xs text-zinc-400">
                  Histórico completo de lotes gerados com numeração e modelos
                </p>
              </div>
              <button
                onClick={() => setShowCreateBatch(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                + Criar Novo Lote
              </button>
            </div>

            <BatchesList
              batches={batches}
              plaques={plaques}
              onOpenBatchPlaques={(batchId) => {
                setSelectedBatchForPlaques(batchId);
                setCurrentTab('plaques');
              }}
              onCreateNewBatch={() => setShowCreateBatch(true)}
            />
          </div>
        )}

        {currentTab === 'plaques' && (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Meus QR Codes & Plaquinhas
                </h2>
                <p className="text-xs text-zinc-400">
                  Edite os destinos dinâmicos e baixe artes individuais sem trocar o QR Code impresso
                </p>
              </div>
              <button
                onClick={() => setShowCreateBatch(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                + Gerar Novo Lote
              </button>
            </div>

            <PlaquesGrid
              plaques={plaques}
              batches={batches}
              selectedBatchId={selectedBatchForPlaques}
              onEditPlaque={(plaque) => {
                setPlaqueToEdit(plaque);
                setShowEditDestination(true);
              }}
            />
          </div>
        )}

        {currentTab === 'export' && (
          <div className="space-y-6 text-left">
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Central de Exportação & Impressão
              </h2>
              <p className="text-xs text-zinc-400">
                Gere PDF A4 (4 plaquinhas 10x10cm por folha) ou pacotes ZIP completos em 300 DPI
              </p>
            </div>

            <ExportCenter batches={batches} plaques={plaques} />
          </div>
        )}

        {currentTab === 'admin' && isAdmin && <AdminDashboard />}

        {currentTab === 'account' && (
          <AccountView
            onOpenAdmin={() => setCurrentTab('admin')}
            onOpenSetup={() => setShowFirebaseSetup(true)}
            onOpenTests={() => setShowTests(true)}
          />
        )}
      </main>

      <footer className="py-6 text-center text-[11px] text-zinc-600 border-t border-white/5">
        DINÂMICO PRO &copy; {new Date().getFullYear()} · Plataforma Profissional de Plaquinhas NFC e QR Codes Dinâmicos
      </footer>

      {/* Modals */}
      <CreateBatchModal
        isOpen={showCreateBatch}
        onClose={() => setShowCreateBatch(false)}
        onBatchCreated={(batchId) => {
          setSelectedBatchForPlaques(batchId);
          setCurrentTab('plaques');
        }}
      />

      <EditDestinationModal
        isOpen={showEditDestination}
        plaque={plaqueToEdit}
        onClose={() => {
          setShowEditDestination(false);
          setPlaqueToEdit(null);
        }}
      />

      <ModelCalibrationModal
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
      />

      <FirebaseSetupModal
        isOpen={showFirebaseSetup}
        onClose={() => setShowFirebaseSetup(false)}
      />

      <AutomatedTestsModal
        isOpen={showTests}
        onClose={() => setShowTests(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
