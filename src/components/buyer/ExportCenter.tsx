import React, { useState } from 'react';
import { Batch, Plaque, OfficialModel } from '../../types';
import { getCalibratedModels } from '../../lib/models';
import { exportBatchZip, exportBatchPdfA4 } from '../../lib/exporter';
import {
  FileDown,
  Printer,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FolderArchive,
  FileText,
} from 'lucide-react';

interface Props {
  batches: Batch[];
  plaques: Plaque[];
}

export const ExportCenter: React.FC<Props> = ({ batches, plaques }) => {
  const models = getCalibratedModels();
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches[0]?.id || ''
  );
  const [exporting, setExporting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const currentBatchPlaques = currentBatch
    ? plaques.filter((p) => p.batchId === currentBatch.id)
    : [];
  const currentModel: OfficialModel = currentBatch
    ? models.find((m) => m.id === currentBatch.modelId) || models[0]
    : models[0];

  const handleExportZip = async () => {
    if (!currentBatch || currentBatchPlaques.length === 0) return;
    setExporting(true);
    setProgressMsg('Iniciando empacotamento ZIP...');
    try {
      await exportBatchZip(
        currentBatchPlaques,
        currentModel,
        currentBatch.name,
        (curr, total) => {
          setProgressMsg(`Renderizando PNG ${curr} de ${total}...`);
        }
      );
      setProgressMsg('Download do ZIP concluído com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setTimeout(() => {
        setExporting(false);
        setProgressMsg(null);
      }, 2000);
    }
  };

  const handleExportPdf = async () => {
    if (!currentBatch || currentBatchPlaques.length === 0) return;
    setExporting(true);
    setProgressMsg('Montando páginas A4 (4 plaquinhas 10x10cm por folha)...');
    try {
      await exportBatchPdfA4(
        currentBatchPlaques,
        currentModel,
        currentBatch.name,
        (curr, total) => {
          setProgressMsg(`Inserindo plaquinha ${curr} de ${total} no PDF...`);
        }
      );
      setProgressMsg('Download do PDF A4 concluído com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setTimeout(() => {
        setExporting(false);
        setProgressMsg(null);
      }, 2000);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="card-relief rounded-2xl p-12 text-center my-8">
        <FolderArchive className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">
          Nenhum Lote Disponível para Exportação
        </h3>
        <p className="text-xs text-zinc-400">
          Crie um lote primeiro na aba "Visão Geral" para gerar arquivos para impressão e corte.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Selector */}
      <div className="card-relief rounded-2xl p-6 border border-white/5">
        <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
          Selecione o Lote para Exportar:
        </label>
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-red-500 cursor-pointer"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.quantity} plaquinhas · #{b.startNumber.toString().padStart(4, '0')} a #{b.endNumber.toString().padStart(4, '0')})
            </option>
          ))}
        </select>

        {currentBatch && (
          <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px]">Modelo Utilizado:</span>
              <span className="font-semibold text-white">{currentModel.name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Tamanho Físico:</span>
              <span className="font-semibold text-red-400">10 × 10 centímetros</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Plaquinhas Registradas:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {currentBatchPlaques.length} itens
              </span>
            </div>
          </div>
        )}
      </div>

      {progressMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-600/50 text-red-300 text-xs flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 animate-spin text-red-400 shrink-0" />
          <span>{progressMsg}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: PDF A4 */}
        <div className="card-relief rounded-2xl p-6 border border-white/5 flex flex-col justify-between hover:border-red-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 text-red-400 flex items-center justify-center mb-4">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              PDF A4 Pronto para Impressão
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Formato padronizado para gráficas e impressão profissional. Organiza 4 plaquinhas por folha (2 colunas × 2 linhas) de exatamente 10 × 10 cm, com guias discretas de corte.
            </p>
            <ul className="text-[11px] text-zinc-300 space-y-1 mb-6">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Página A4 de 210 × 297 mm</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exatamente 10 × 10 cm por plaquinha</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-páginas automáticas sem cortes</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={exporting || currentBatchPlaques.length === 0}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Baixar PDF A4 Imprimível</span>
          </button>
        </div>

        {/* Option 2: ZIP */}
        <div className="card-relief rounded-2xl p-6 border border-white/5 flex flex-col justify-between hover:border-red-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center mb-4">
              <FileDown className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Pacote ZIP com Todos os PNGs
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Exporta todas as plaquinhas do lote como arquivos PNG individuais em altíssima resolução (300 DPI), nomeados sequencialmente de forma organizada.
            </p>
            <ul className="text-[11px] text-zinc-300 space-y-1 mb-6">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nomenclatura DINAMICO-PRO-0001.png</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resolução 1200 × 1200 px (300 DPI)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ideal para recorte plotter ou sublimação</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportZip}
            disabled={exporting || currentBatchPlaques.length === 0}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-red-400" />
            <span>Baixar Pacote ZIP (.zip)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
