import React, { useState } from 'react';
import { Batch, Plaque, OfficialModel } from '../../types';
import { getCalibratedModels } from '../../lib/models';
import { exportBatchZip, exportBatchPdfA4 } from '../../lib/exporter';
import {
  Layers,
  FileDown,
  Printer,
  Calendar,
  Hash,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Props {
  batches: Batch[];
  plaques: Plaque[];
  onOpenBatchPlaques: (batchId: string) => void;
  onCreateNewBatch: () => void;
}

export const BatchesList: React.FC<Props> = ({
  batches,
  plaques,
  onOpenBatchPlaques,
  onCreateNewBatch,
}) => {
  const models = getCalibratedModels();
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const getModelForBatch = (modelId: string): OfficialModel => {
    return models.find((m) => m.id === modelId) || models[0];
  };

  const handleExportZip = async (batch: Batch) => {
    const batchPlaques = plaques.filter((p) => p.batchId === batch.id);
    if (batchPlaques.length === 0) {
      alert('Nenhuma plaquinha encontrada neste lote para exportar.');
      return;
    }
    const model = getModelForBatch(batch.modelId);

    setExportingId(batch.id);
    setProgressMsg('Iniciando empacotamento ZIP...');
    try {
      await exportBatchZip(batchPlaques, model, batch.name, (curr, total) => {
        setProgressMsg(`Renderizando PNG ${curr} de ${total}...`);
      });
      setProgressMsg('ZIP concluído!');
    } catch (err: any) {
      alert(`Erro na exportação: ${err.message}`);
    } finally {
      setTimeout(() => {
        setExportingId(null);
        setProgressMsg(null);
      }, 1500);
    }
  };

  const handleExportPdf = async (batch: Batch) => {
    const batchPlaques = plaques.filter((p) => p.batchId === batch.id);
    if (batchPlaques.length === 0) {
      alert('Nenhuma plaquinha encontrada neste lote para exportar.');
      return;
    }
    const model = getModelForBatch(batch.modelId);

    setExportingId(batch.id);
    setProgressMsg('Gerando PDF A4 (4 por folha)...');
    try {
      await exportBatchPdfA4(batchPlaques, model, batch.name, (curr, total) => {
        setProgressMsg(`Processando arte ${curr} de ${total}...`);
      });
      setProgressMsg('PDF pronto para impressão!');
    } catch (err: any) {
      alert(`Erro na exportação: ${err.message}`);
    } finally {
      setTimeout(() => {
        setExportingId(null);
        setProgressMsg(null);
      }, 1500);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="card-relief rounded-2xl p-12 text-center my-8">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-500">
          <Layers className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          Nenhum Lote Criado Ainda
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
          Comece criando seu primeiro lote de plaquinhas para gerar QR Codes dinâmicos com identificadores exclusivos.
        </p>
        <button
          onClick={onCreateNewBatch}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 cursor-pointer"
        >
          Criar Primeiro Lote
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progressMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-600/50 text-red-300 text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
          <span>{progressMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch) => {
          const model = getModelForBatch(batch.modelId);
          const batchPlaques = plaques.filter((p) => p.batchId === batch.id);
          const isExporting = exportingId === batch.id;

          return (
            <div
              key={batch.id}
              className="card-relief rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:border-red-500/30 transition-all group"
            >
              <div>
                {/* Batch Top Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                      <img
                        src={model.imageUrl}
                        alt={model.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-red-400 transition-colors">
                        {batch.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 block line-clamp-1">
                        {model.name}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300 shrink-0">
                    {batch.quantity} un
                  </span>
                </div>

                {/* Batch Meta info */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] mb-4">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Intervalo:</span>
                    <span className="font-mono font-bold text-red-400">
                      #{batch.startNumber.toString().padStart(4, '0')} - #{batch.endNumber.toString().padStart(4, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Data:</span>
                    <span className="font-mono text-zinc-300">
                      {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenBatchPlaques(batch.id)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Ver Plaquinhas</span>
                  <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExportZip(batch)}
                    disabled={isExporting}
                    title="Exportar lote completo em formato ZIP (arquivos PNG)"
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleExportPdf(batch)}
                    disabled={isExporting}
                    title="Exportar PDF A4 pronto para impressão (4 por folha)"
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
