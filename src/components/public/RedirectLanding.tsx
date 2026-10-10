import React, { useEffect, useState } from 'react';
import { resolveDynamicRedirect } from '../../services/redirectService';
import { QrCode, AlertCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface Props {
  publicId: string;
}

export const RedirectLanding: React.FC<Props> = ({ publicId }) => {
  const [loading, setLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    resolveDynamicRedirect(publicId)
      .then((res) => {
        if (!mounted) return;
        if (res.found && res.targetUrl) {
          setTargetUrl(res.targetUrl);
          // Automatic seamless redirection
          setTimeout(() => {
            window.location.replace(res.targetUrl!);
          }, 350);
        } else {
          setError(res.error || 'Destino não encontrado.');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError('Falha ao processar o redirecionamento.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [publicId]);

  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 text-center">
      <div className="card-relief rounded-3xl p-8 max-w-md w-full relative overflow-hidden border-white/10 shadow-2xl">
        {/* Glow */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/30 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-950/60">
          <QrCode className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-400 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
          <span>DINÂMICO PRO · Redirecionador Seguro</span>
        </div>

        {loading ? (
          <div>
            <h1 className="text-xl font-bold text-white mb-2">
              Encaminhando seu acesso...
            </h1>
            <p className="text-xs text-zinc-400 mb-6">
              Identificador verificado: <code className="text-red-400 font-mono">{publicId}</code>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
              <span>Conectando ao destino cadastrado...</span>
            </div>

            {targetUrl && (
              <div className="mt-6">
                <a
                  href={targetUrl}
                  className="inline-flex items-center gap-2 text-xs text-red-400 underline font-medium"
                >
                  <span>Clique aqui caso não seja redirecionado automaticamente</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-600/40 text-red-300 text-xs mb-6 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Não foi possível prosseguir</p>
                <p className="text-zinc-400 mt-1">{error}</p>
              </div>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <span>Ir para a Página Principal</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
