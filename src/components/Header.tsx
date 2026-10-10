import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, Sparkles, Database, Layers } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenTests?: () => void;
  onOpenCalibration?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenTests,
  onOpenCalibration,
}) => {
  const { user, userProfile, isAdmin, logout, isFirebaseConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0d]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange(isAdmin ? 'admin' : 'dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform border border-red-500/40">
              <span className="tracking-tighter">D</span>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5">
                DINÂMICO <span className="text-red-600">PRO</span>
              </span>
              <span className="block text-[10px] text-zinc-400 font-medium tracking-widest uppercase">
                Plaquinhas NFC & QR Dinâmicos
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        {user && userProfile?.status === 'approved' && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentTab === 'dashboard' ? 'text-red-500 font-semibold' : ''
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => onTabChange('batches')}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentTab === 'batches' ? 'text-red-500 font-semibold' : ''
              }`}
            >
              Meus Lotes
            </button>
            <button
              onClick={() => onTabChange('plaques')}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentTab === 'plaques' ? 'text-red-500 font-semibold' : ''
              }`}
            >
              Meus QR Codes
            </button>
            <button
              onClick={() => onTabChange('export')}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentTab === 'export' ? 'text-red-500 font-semibold' : ''
              }`}
            >
              Exportar
            </button>
            {isAdmin && (
              <button
                onClick={() => onTabChange('admin')}
                className={`hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'admin' ? 'text-red-500 font-semibold' : 'text-zinc-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-red-500" />
                Painel Admin
              </button>
            )}
          </nav>
        )}

        {/* Zone 3: Actions & Account */}
        <div className="flex items-center gap-2.5">
          {onOpenCalibration && user && userProfile?.status === 'approved' && (
            <button
              onClick={onOpenCalibration}
              title="Calibrar modelos de plaquinhas"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-red-400" />
              <span>Calibrador</span>
            </button>
          )}

          {onOpenTests && (
            <button
              onClick={onOpenTests}
              title="Executar verificação e testes do sistema"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Diagnóstico & Testes</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTabChange('account')}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 border border-white/10 rounded-lg hover:border-red-500/40 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span className="max-w-[110px] truncate hidden sm:inline">
                  {userProfile?.name || user.email?.split('@')[0]}
                </span>
                {isAdmin && (
                  <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono">
                    ADMIN
                  </span>
                )}
              </button>

              <button
                onClick={() => logout()}
                title="Encerrar sessão"
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onTabChange('login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md shadow-red-900/30 cursor-pointer"
            >
              Acessar Plataforma
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
