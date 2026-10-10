import React, { useState } from 'react';
import { registerBuyer } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  onSwitchToLogin: () => void;
  onOpenSetup: () => void;
}

export const RegisterView: React.FC<Props> = ({ onSwitchToLogin, onOpenSetup }) => {
  const { isFirebaseConfigured, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError('Firebase não configurado. Conecte o Firebase para habilitar novos cadastros.');
      return;
    }

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setLoading(true);
    try {
      await registerBuyer(name, email, password);
      setSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Erro ao realizar cadastro.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado na plataforma.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'O formato do e-mail é inválido.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'A senha deve conter ao menos 6 dígitos.';
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
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/30 shadow-xl shadow-red-950/50 mb-4">
          <span className="text-2xl font-black text-white">D</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          Cadastro de <span className="text-red-500">Comprador</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
          Crie sua conta única para gerenciar lotes de plaquinhas e QR Codes dinâmicos
        </p>
      </div>

      {/* Main Form Card with Relief */}
      <div className="card-relief rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Cadastro realizado com sucesso!
            </h2>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-300 leading-relaxed text-left mb-6">
              <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Seu acesso ao DINÂMICO PRO está aguardando aprovação.
              </p>
              <p className="text-zinc-400">
                Nosso administrador validará sua liberação em instantes. Você receberá acesso completo a todas as ferramentas do editor assim que o status for aprovado.
              </p>
            </div>
            <button
              onClick={onSwitchToLogin}
              className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Ir para Tela de Acesso
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  E-mail
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
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Cadastrando...' : 'Criar Conta de Comprador'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-xs text-zinc-400">
                Já possui uma conta cadastrada?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
                >
                  Fazer Login
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
