import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldX, LogOut, Info } from 'lucide-react';

export const BlockedAccountView: React.FC = () => {
  const { userProfile, user, logout } = useAuth();

  return (
    <div className="w-full max-w-lg mx-auto my-16 px-4 text-center">
      <div className="card-relief rounded-2xl p-8 relative overflow-hidden border-red-900/40">
        <div className="w-20 h-20 rounded-full bg-red-950/60 border border-red-600/50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-950/60">
          <ShieldX className="w-10 h-10" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
          Conta <span className="text-red-500">Bloqueada</span>
        </h1>

        <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto">
          O acesso ao editor e gerenciador de lotes está temporariamente suspenso para este usuário.
        </p>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-300 text-left space-y-3 mb-6">
          <div className="flex items-start gap-2 text-zinc-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Nota sobre seus QR Codes:</strong> As plaquinhas físicas já impressas continuam redirecionando normalmente os visitantes pelo nosso serviço autônomo. Apenas o acesso administrativo a novas criações está bloqueado.
            </span>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-400">
            Usuário: <code className="text-zinc-200 font-mono">{userProfile?.email || user?.email}</code>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );
};
