import React, { useState } from 'react';
import {
  isFirebaseConfigured,
  currentFirebaseConfig,
  testFirestoreConnection,
  saveCustomStoredConfig,
  clearCustomStoredConfig,
} from '../lib/firebase';
import { Database, AlertTriangle, CheckCircle, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
}

export const FirebaseSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Manual configuration fields
  const [apiKey, setApiKey] = useState(currentFirebaseConfig.apiKey || '');
  const [projectId, setProjectId] = useState(currentFirebaseConfig.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentFirebaseConfig.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentFirebaseConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentFirebaseConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentFirebaseConfig.appId || '');

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      alert('Preencha ao menos API Key e Project ID');
      return;
    }
    saveCustomStoredConfig({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    });
  };

  const envSnippet = `VITE_FIREBASE_API_KEY="${apiKey || 'AIzaSy...'}"
VITE_FIREBASE_AUTH_DOMAIN="${authDomain || `${projectId || 'dinamico-pro'}.firebaseapp.com`}"
VITE_FIREBASE_PROJECT_ID="${projectId || 'seu-projeto-firebase'}"
VITE_FIREBASE_STORAGE_BUCKET="${storageBucket || `${projectId || 'dinamico-pro'}.firebasestorage.app`}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${messagingSenderId || '1234567890'}"
VITE_FIREBASE_APP_ID="${appId || '1:1234567890:web:abcdef'}"
VITE_APP_URL="https://seu-dominio.vercel.app"`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl p-6 lg:p-8 text-left my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isFirebaseConfigured ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/40 text-red-400 border border-red-800/40'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Integração Firebase do DINÂMICO PRO
              </h2>
              <p className="text-xs text-zinc-400">
                Conexão com o banco Firestore e serviço de autenticação
              </p>
            </div>
          </div>
          {onClose && isFirebaseConfigured && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Current status alert */}
        <div className="mt-5">
          {isFirebaseConfigured ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Firebase Conectado com Sucesso!
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Projeto ativo: <code className="text-emerald-400 font-mono">{currentFirebaseConfig.projectId}</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-600/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  Aguardando Configuração Inicial do Firebase
                </p>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Conforme os requisitos do sistema, o editor é protegido até que as credenciais do seu projeto Firebase sejam inseridas. Configure as variáveis no seu <code className="text-red-300 font-mono">.env</code> ou informe abaixo para testar diretamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Test connection action */}
        <div className="mt-4 flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-xl">
          <div className="text-xs text-zinc-400">
            Status da comunicação direta com Cloud Firestore:
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 border ${testResult.success ? 'bg-emerald-950/30 text-emerald-300 border-emerald-700/40' : 'bg-red-950/30 text-red-300 border-red-800/40'}`}>
            {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Direct configuration form */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              Credenciais do Projeto Firebase
            </h3>
            <button
              onClick={copyEnv}
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado para Vercel!' : 'Copiar formato .env'}
            </button>
          </div>

          <form onSubmit={handleSaveManual} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  API Key (VITE_FIREBASE_API_KEY)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Project ID (VITE_FIREBASE_PROJECT_ID)
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="dinamico-pro-12345"
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="meu-app.firebaseapp.com"
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  App ID (VITE_FIREBASE_APP_ID)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:1234567890:web:abcdef..."
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearCustomStoredConfig}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Restaurar padrões de ambiente
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-md shadow-red-900/30"
              >
                Salvar e Conectar
              </button>
            </div>
          </form>
        </div>

        {/* 3 Steps instructions */}
        <div className="mt-6 pt-5 border-t border-white/10 text-xs text-zinc-400 space-y-2">
          <p className="font-semibold text-zinc-300">
            Como configurar seu Firebase (Passo a Passo Único do Proprietário):
          </p>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
            <li>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-red-400 hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> e crie um projeto gratuito.</li>
            <li>No menu <strong>Authentication</strong>, ative o provedor <strong>E-mail/Senha</strong>.</li>
            <li>No menu <strong>Cloud Firestore</strong>, crie o banco em modo produção. As regras oficiais já estão criadas em <code className="text-zinc-300">firestore.rules</code>.</li>
            <li>O e-mail administrador inicial configurado é <code className="text-red-400 font-mono">jeannmkt2@gmail.com</code>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
