import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ShieldCheck,
  LogOut,
  Database,
  Sparkles,
  Key,
} from 'lucide-react';

interface Props {
  onOpenAdmin: () => void;
  onOpenSetup: () => void;
  onOpenTests: () => void;
}

export const AccountView: React.FC<Props> = ({
  onOpenAdmin,
  onOpenSetup,
  onOpenTests,
}) => {
  const { user, userProfile, isAdmin, logout, isFirebaseConfigured } = useAuth();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-left">
      <div className="card-relief rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/40 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-red-950/50">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {userProfile?.name || 'Minha Conta'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {userProfile?.status === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Acesso Aprovado
              </span>
            )}
            {isAdmin && (
              <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-600/40 text-[10px] font-mono font-bold">
                ADMINISTRADOR
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 text-xs mb-6">
          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px] block">Identificador Único (UID):</span>
            <code className="text-zinc-300 font-mono text-[11px] block truncate">
              {user?.uid}
            </code>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px] block">Data de Cadastro:</span>
            <span className="text-zinc-300 font-mono">
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR') : '—'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px] block">Tipo de Licença:</span>
            <span className="text-white font-semibold">
              Pagamento Único · Acesso Vitalício
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px] block">Status no Banco:</span>
            <span className="text-emerald-400 font-semibold uppercase">
              {userProfile?.status || 'Ativo'}
            </span>
          </div>
        </div>

        {/* Management Shortcuts */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full p-3 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-600/40 text-red-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Abrir Painel Administrativo de Compradores</span>
              </div>
              <span>&rarr;</span>
            </button>
          )}

          <button
            onClick={onOpenSetup}
            className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-zinc-400" />
              <span>Conexão e Configuração do Firebase</span>
            </div>
            <span className="text-[10px] text-zinc-500">
              {isFirebaseConfigured ? 'Conectado' : 'Configurar'}
            </span>
          </button>

          <button
            onClick={onOpenTests}
            className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span>Diagnóstico & Testes Automatizados</span>
            </div>
            <span className="text-[10px] text-zinc-500">20 Requisitos</span>
          </button>
        </div>

        {/* Logout */}
        <div className="pt-6 border-t border-white/10 mt-6 flex justify-end">
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
