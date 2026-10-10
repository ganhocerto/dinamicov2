import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCalibratedModels } from '../../lib/models';
import { createBatchWithPlaques, getNextSequentialNumber } from '../../services/buyerService';
import { renderPlaqueToCanvas } from '../../lib/canvasRenderer';
import { OfficialModel, Plaque } from '../../types';
import {
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
  X,
  Check,
  Link2,
  RefreshCw,
  Hash,
  Eye,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: (batchId: string) => void;
}

export const CreateBatchModal: React.FC<Props> = ({ isOpen, onClose, onBatchCreated }) => {
  const { user } = useAuth();
  const models = getCalibratedModels();

  const [selectedModel, setSelectedModel] = useState<OfficialModel>(models[0]);
  const [quantity, setQuantity] = useState<number>(5);
  const [batchName, setBatchName] = useState<string>('');
  const [defaultTargetUrl, setDefaultTargetUrl] = useState<string>('https://instagram.com/');
  const [startSeq, setStartSeq] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live Canvas Preview
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderingPreview, setRenderingPreview] = useState(false);

  // Fetch next sequential number
  useEffect(() => {
    if (user && isOpen) {
      getNextSequentialNumber(user.uid).then((nextNum) => {
        setStartSeq(nextNum);
      });
    }
  }, [user, isOpen]);

  // Update live canvas preview when model changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setRenderingPreview(true);

    const dummyPlaque: Plaque = {
      id: 'preview',
      uid: user?.uid || 'preview',
      batchId: 'preview',
      sequentialNumber: startSeq,
      numberFormatted: startSeq.toString().padStart(4, '0'),
      publicId: 'dp_exemplo',
      targetUrl: defaultTargetUrl,
      modelId: selectedModel.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clicks: 0,
    };

    renderPlaqueToCanvas({
      model: selectedModel,
      plaque: dummyPlaque,
      canvasWidth: 600,
      canvasHeight: 600,
    })
      .then((canvas) => {
        if (!isMounted) return;
        const targetCanvas = previewCanvasRef.current;
        if (targetCanvas) {
          targetCanvas.width = 600;
          targetCanvas.height = 600;
          const ctx = targetCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 600, 600);
            ctx.drawImage(canvas, 0, 0);
          }
        }
      })
      .catch((err) => {
        console.warn('Canvas preview notice:', err);
      })
      .finally(() => {
        if (isMounted) setRenderingPreview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedModel, startSeq, defaultTargetUrl, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Usuário não autenticado.');
      return;
    }

    if (quantity < 1 || quantity > 300) {
      setError('A quantidade deve ser entre 1 e 300 plaquinhas por lote.');
      return;
    }

    setLoading(true);
    try {
      const res = await createBatchWithPlaques(
        user.uid,
        selectedModel.id,
        quantity,
        batchName,
        defaultTargetUrl
      );
      onBatchCreated(res.batch.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar o lote no banco.');
    } finally {
      setLoading(false);
    }
  };

  const endSeq = startSeq + quantity - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-8 text-left my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-6">
          <div className="p-2 rounded-xl bg-red-950/60 border border-red-600/50 text-red-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Criar Novo Lote de Plaquinhas
            </h2>
            <p className="text-xs text-zinc-400">
              Escolha o modelo oficial, a quantidade e gere os QR Codes dinâmicos exclusivos
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Step 1: Model Gallery */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">1</span>
                Selecione o Modelo Oficial (1 de 8)
              </label>
              <span className="text-xs text-red-400 font-semibold">
                {selectedModel.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1 rounded-xl border border-white/5 bg-black/40">
              {models.map((mod) => {
                const isSelected = mod.id === selectedModel.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModel(mod)}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/30'
                        : 'border-white/10 bg-zinc-900/40 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-black relative">
                      <img
                        src={mod.imageUrl}
                        alt={mod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 px-1 pb-1">
                      <span className="block text-[11px] font-bold text-white truncate">
                        Modelo #{mod.number}
                      </span>
                      <span className="block text-[10px] text-zinc-400 truncate">
                        {mod.name.split('—')[1]?.trim() || mod.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Quantity & Batch Name & Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Form Controls (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Quantidade de Plaquinhas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-sm font-bold text-white text-center focus:outline-none focus:border-red-500"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 20, 50, 100].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setQuantity(qty)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          quantity === qty
                            ? 'bg-red-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Numeração automática sequencial: <strong className="text-red-400 font-mono">#{startSeq.toString().padStart(4, '0')}</strong> até <strong className="text-red-400 font-mono">#{endSeq.toString().padStart(4, '0')}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nome do Lote (Opcional)
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder={`Ex: Lote Comercial Restaurante`}
                  className="w-full px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Destino Inicial dos QR Codes</span>
                </label>
                <input
                  type="text"
                  required
                  value={defaultTargetUrl}
                  onChange={(e) => setDefaultTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Você poderá alterar o destino de qualquer plaquinha a qualquer momento sem trocar o QR Code impresso!
                </p>
              </div>
            </div>

            {/* Live Canvas Preview (5 cols) */}
            <div className="md:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3 h-3 text-red-400" />
                  Prévia em Tempo Real
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">10x10 cm</span>
              </div>

              <div className="relative aspect-square w-full max-w-[240px] mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950 flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-contain"
                />
                {renderingPreview && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-zinc-400 gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                    <span>Renderizando...</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-zinc-500 mt-2">
                Amostra da 1ª plaquinha (<code className="text-zinc-300 font-mono">#{startSeq.toString().padStart(4, '0')}</code>) com substituição limpa do QR Code
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando Lote no Banco...</span>
                </>
              ) : (
                <>
                  <span>Gerar Lote ({quantity} Plaquinhas)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
