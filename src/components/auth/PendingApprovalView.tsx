import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, RefreshCw, LogOut, ShieldCheck, Mail } from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { userProfile, user, refreshProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckNow = async () => {
    setChecking(true);
    await refreshProfile();
    setTimeout(() => setChecking(false), 600);
  };

  return (
    <div className="w-full max-w-lg mx-auto my-16 px-4 text-center">
      <div className="card-relief rounded-2xl p-8 relative overflow-hidden">
        {/* Glow indicator */}
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-950/40">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
          Acesso em <span className="text-amber-400">Análise</span>
        </h1>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-[11px] font-semibold text-amber-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Status atual: Pendente de Aprovação
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-300 text-left space-y-2 mb-6">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Cadastro realizado com sucesso! Seu acesso ao DINÂMICO PRO está aguardando aprovação.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Olá, <strong className="text-zinc-200">{userProfile?.name || user?.email}</strong>. Para garantir a segurança e exclusividade de cada licença da plataforma, o administrador analisa manualmente cada nova conta de comprador antes de liberar o gerador de plaquinhas.
          </p>
          <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-zinc-400 text-[11px]">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span>E-mail cadastrado: <code className="text-zinc-300 font-mono">{user?.email}</code></span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleCheckNow}
            disabled={checking}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Verificando...' : 'Verificar se fui aprovado'}</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
