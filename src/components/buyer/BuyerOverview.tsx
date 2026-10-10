import React from 'react';
import { Batch, Plaque } from '../../types';
import { getCalibratedModels } from '../../lib/models';
import {
  Layers,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface Props {
  batches: Batch[];
  plaques: Plaque[];
  onCreateBatch: () => void;
  onNavigateBatches: () => void;
  onNavigatePlaques: () => void;
  onNavigateExport: () => void;
}

export const BuyerOverview: React.FC<Props> = ({
  batches,
  plaques,
  onCreateBatch,
  onNavigateBatches,
  onNavigatePlaques,
  onNavigateExport,
}) => {
  const models = getCalibratedModels();

  const totalClicks = plaques.reduce((acc, p) => acc + (p.clicks || 0), 0);

  return (
    <div className="space-y-8 text-left">
      {/* Hero Welcome Banner with 3D Relief & Red Accent */}
      <div className="card-relief rounded-3xl p-6 sm:p-10 relative overflow-hidden border-red-950/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-xs font-semibold text-red-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Profissional de Plaquinhas NFC</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Gerencie e Imprima Suas Plaquinhas com <span className="text-red-500">QR Code Dinâmico</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 mt-3 leading-relaxed">
            Gere lotes personalizados em alta resolução (300 DPI), imprima em folha A4 e altere os links de destino a qualquer momento sem jamais precisar reimprimir as plaquinhas físicas.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onCreateBatch}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/60 flex items-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Lote</span>
            </button>

            <button
              onClick={onNavigatePlaques}
              className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Gerenciar Destinos</span>
              <ArrowRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Real Statistics Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-relief rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lotes Criados</span>
            <Layers className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {batches.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Lotes salvos e sincronizados no Firestore
          </p>
        </div>

        <div className="card-relief rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Plaquinhas Ativas</span>
            <QrCode className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {plaques.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Cada uma com identificador sequencial único
          </p>
        </div>

        <div className="card-relief rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Acessos aos QR Codes</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums">
            {totalClicks}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Total acumulado de redirecionamentos
          </p>
        </div>
      </div>

      {/* Official 8 Models Quick Preview */}
      <div className="card-relief rounded-3xl p-6 sm:p-8 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Galeria dos 8 Modelos Oficiais de Plaquinhas
            </h2>
            <p className="text-xs text-zinc-400">
              Formatadas rigorosamente no tamanho padrão 10 × 10 cm com área NFC e QR Code
            </p>
          </div>
          <button
            onClick={onCreateBatch}
            className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
          >
            Escolher Modelo e Gerar &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {models.map((mod) => (
            <div
              key={mod.id}
              className="rounded-xl overflow-hidden border border-white/10 bg-black/40 group hover:border-red-500/50 transition-all"
            >
              <div className="aspect-square w-full overflow-hidden bg-black">
                <img
                  src={mod.imageUrl}
                  alt={mod.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2 text-center bg-zinc-950">
                <span className="text-[11px] font-bold text-white block truncate">
                  Modelo #{mod.number}
                </span>
                <span className="text-[9px] text-zinc-400 block truncate">
                  10 × 10 cm
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Workflow Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Gere o Lote Físico</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Selecione a quantidade desejada e receba arquivos prontos para impressão em folha A4 ou pacote ZIP com PNGs em 300 DPI.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Aproxime ou Aponte</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Clientes aproximam o smartphone com NFC ou apontam a câmera para o QR Code, sendo direcionados ao nosso redirecionador ultra-rápido.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Mude o Destino Quando Quiser</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hoje aponte para o Instagram, amanhã para o WhatsApp ou Google Avaliações. A plaquinha física impressa continua exatamente a mesma!
          </p>
        </div>
      </div>
    </div>
  );
};
