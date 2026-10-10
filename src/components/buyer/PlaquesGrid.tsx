import React, { useState, useEffect, useRef } from 'react';
import { Plaque, Batch, OfficialModel } from '../../types';
import { getCalibratedModels } from '../../lib/models';
import { exportSinglePlaquePng } from '../../lib/exporter';
import { renderPlaqueToCanvas } from '../../lib/canvasRenderer';
import {
  Search,
  Download,
  Link2,
  ExternalLink,
  Eye,
  RefreshCw,
  QrCode,
  X,
  Share2,
} from 'lucide-react';

interface Props {
  plaques: Plaque[];
  batches: Batch[];
  selectedBatchId?: string | null;
  onEditPlaque: (plaque: Plaque) => void;
}

// Mini preview canvas component for each plaque card
const PlaqueCardPreview: React.FC<{ plaque: Plaque; model: OfficialModel }> = ({
  plaque,
  model,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    renderPlaqueToCanvas({
      model,
      plaque,
      canvasWidth: 360,
      canvasHeight: 360,
    })
      .then((c) => {
        if (!mounted) return;
        const target = canvasRef.current;
        if (target) {
          target.width = 360;
          target.height = 360;
          const ctx = target.getContext('2d');
          if (ctx) {
            ctx.drawImage(c, 0, 0);
          }
          setLoaded(true);
        }
      })
      .catch((err) => {
        console.warn('Mini render error:', err);
      });

    return () => {
      mounted = false;
    };
  }, [plaque.id, plaque.targetUrl, model.id]);

  return (
    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 border border-white/5 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] text-zinc-500">
          <RefreshCw className="w-3 h-3 animate-spin text-red-500 mr-1" />
          <span>Carregando arte...</span>
        </div>
      )}
    </div>
  );
};

export const PlaquesGrid: React.FC<Props> = ({
  plaques,
  batches,
  selectedBatchId,
  onEditPlaque,
}) => {
  const models = getCalibratedModels();
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState<string>(selectedBatchId || 'all');
  const [previewModalPlaque, setPreviewModalPlaque] = useState<Plaque | null>(null);
  const [enlargedCanvasUrl, setEnlargedCanvasUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBatchId) {
      setFilterBatch(selectedBatchId);
    }
  }, [selectedBatchId]);

  const getModelForPlaque = (modelId: string): OfficialModel => {
    return models.find((m) => m.id === modelId) || models[0];
  };

  const filteredPlaques = plaques.filter((p) => {
    const matchesSearch =
      p.numberFormatted.includes(search) ||
      p.publicId.toLowerCase().includes(search.toLowerCase()) ||
      p.targetUrl.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = filterBatch === 'all' || p.batchId === filterBatch;
    return matchesSearch && matchesBatch;
  });

  const handleDownloadSingle = async (plaque: Plaque) => {
    const model = getModelForPlaque(plaque.modelId);
    setDownloadingId(plaque.id);
    try {
      await exportSinglePlaquePng(plaque, model);
    } catch (err: any) {
      alert(`Erro ao gerar PNG: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenEnlarged = async (plaque: Plaque) => {
    setPreviewModalPlaque(plaque);
    const model = getModelForPlaque(plaque.modelId);
    try {
      const c = await renderPlaqueToCanvas({
        model,
        plaque,
        canvasWidth: 800,
        canvasHeight: 800,
      });
      setEnlargedCanvasUrl(c.toDataURL('image/png'));
    } catch (err) {
      console.warn('Enlarged render notice:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-zinc-950/60 border border-white/10 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número (ex: 0001), ID ou link de destino..."
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Batch Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">Todos os Lotes ({plaques.length} plaquinhas)</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.quantity} un)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plaques Grid */}
      {filteredPlaques.length === 0 ? (
        <div className="card-relief rounded-2xl p-12 text-center">
          <QrCode className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">
            Nenhuma plaquinha encontrada com os critérios informados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlaques.map((plaque) => {
            const model = getModelForPlaque(plaque.modelId);
            const isDownloading = downloadingId === plaque.id;

            return (
              <div
                key={plaque.id}
                className="card-relief rounded-2xl p-4 border border-white/5 hover:border-red-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Plaque Card Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-red-500">
                      #{plaque.numberFormatted}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {plaque.publicId}
                    </span>
                  </div>

                  {/* Artwork Preview */}
                  <div className="mb-3">
                    <PlaqueCardPreview plaque={plaque} model={model} />
                  </div>

                  {/* Destination info */}
                  <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 text-[11px] space-y-1 mb-3">
                    <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                      <span>Destino Dinâmico:</span>
                      <span className="font-mono text-zinc-400">{plaque.clicks || 0} cliques</span>
                    </div>
                    <div className="text-zinc-200 font-mono text-[11px] truncate" title={plaque.targetUrl}>
                      {plaque.targetUrl}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onEditPlaque(plaque)}
                    className="flex-1 py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950/40"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Editar Destino</span>
                  </button>

                  <button
                    onClick={() => handleOpenEnlarged(plaque)}
                    title="Visualizar ampliada"
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(plaque)}
                    disabled={isDownloading}
                    title="Baixar PNG individual em alta resolução"
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce text-red-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged Inspection Modal */}
      {previewModalPlaque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl p-6 text-center">
            <button
              onClick={() => {
                setPreviewModalPlaque(null);
                setEnlargedCanvasUrl(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Plaquinha <span className="text-red-500 font-mono">#{previewModalPlaque.numberFormatted}</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Identificador público: <code className="text-zinc-200 font-mono">{previewModalPlaque.publicId}</code>
            </p>

            <div className="aspect-square w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center mb-4">
              {enlargedCanvasUrl ? (
                <img
                  src={enlargedCanvasUrl}
                  alt="Prévia ampliada"
                  className="w-full h-full object-contain"
                />
              ) : (
                <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  const p = previewModalPlaque;
                  setPreviewModalPlaque(null);
                  onEditPlaque(p);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                <span>Alterar Destino</span>
              </button>

              <button
                onClick={() => handleDownloadSingle(previewModalPlaque)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
