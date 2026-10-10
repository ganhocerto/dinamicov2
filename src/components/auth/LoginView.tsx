import React, { useState } from 'react';
import { loginWithEmail } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';

interface Props {
  onSwitchToRegister: () => void;
  onOpenForgotPassword: () => void;
  onOpenSetup: () => void;
}

export const LoginView: React.FC<Props> = ({
  onSwitchToRegister,
  onOpenForgotPassword,
  onOpenSetup,
}) => {
  const { isFirebaseConfigured, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError('Firebase não configurado. Clique em "Configurar Firebase" abaixo para conectar.');
      return;
    }

    if (!email || !password) {
      setError('Por favor preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      await refreshProfile();
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Erro ao realizar login. Verifique suas credenciais.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas sem sucesso. Aguarde alguns instantes.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 px-4">
      {/* Visual Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/30 shadow-xl shadow-red-950/50 mb-4">
          <span className="text-2xl font-black text-white">D</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          Acesse o <span className="text-red-500">DINÂMICO PRO</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
          Plataforma de alta precisão para plaquinhas NFC e QR Codes com destinos dinâmicos
        </p>
      </div>

      {/* Main Form Card with Relief */}
      <div className="card-relief rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle red accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {!isFirebaseConfigured && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/30 text-amber-200 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Conexão Firebase pendente.</span>
            </div>
            <button
              onClick={onOpenSetup}
              type="button"
              className="text-amber-400 underline font-semibold hover:text-white cursor-pointer"
            >
              Conectar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@dominio.com"
                className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Senha
              </label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Validando acesso...' : 'Entrar no Sistema'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-400">
            Ainda não tem acesso?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
            >
              Cadastre-se aqui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
