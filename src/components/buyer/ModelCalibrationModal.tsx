import React, { useState, useEffect, useRef } from 'react';
import { OfficialModel, Plaque } from '../../types';
import {
  OFFICIAL_MODELS,
  getCalibratedModels,
  saveModelCalibration,
  resetModelCalibrations,
} from '../../lib/models';
import { renderPlaqueToCanvas } from '../../lib/canvasRenderer';
import { Sliders, RefreshCw, Check, X, Undo } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelCalibrationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [models, setModels] = useState<OfficialModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('model-1');

  // Form states for active model
  const [qrX, setQrX] = useState<number>(32.5);
  const [qrY, setQrY] = useState<number>(41.5);
  const [qrSize, setQrSize] = useState<number>(35.0);
  const [coverColor, setCoverColor] = useState<string>('#0c0c0f');

  const [numX, setNumX] = useState<number>(50.0);
  const [numY, setNumY] = useState<number>(89.5);
  const [numSize, setNumSize] = useState<number>(28);
  const [numColor, setNumColor] = useState<string>('#e50914');
  const [numPrefix, setNumPrefix] = useState<string>('Nº ');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const list = getCalibratedModels();
      setModels(list);
      const m = list.find((item) => item.id === selectedModelId) || list[0];
      if (m) {
        setQrX(m.qrZone.x);
        setQrY(m.qrZone.y);
        setQrSize(m.qrZone.size);
        setCoverColor(m.qrZone.coverColor);
        setNumX(m.numberZone.x);
        setNumY(m.numberZone.y);
        setNumSize(m.numberZone.fontSize);
        setNumColor(m.numberZone.color);
        setNumPrefix(m.numberZone.prefix);
      }
    }
  }, [isOpen, selectedModelId]);

  // Live Canvas render
  useEffect(() => {
    if (!isOpen) return;

    const baseModel = models.find((m) => m.id === selectedModelId) || OFFICIAL_MODELS[0];
    const liveModel: OfficialModel = {
      ...baseModel,
      qrZone: {
        x: qrX,
        y: qrY,
        size: qrSize,
        coverColor,
        coverPadding: 1.5,
      },
      numberZone: {
        x: numX,
        y: numY,
        fontSize: numSize,
        color: numColor,
        align: 'center',
        prefix: numPrefix,
      },
    };

    const dummy: Plaque = {
      id: 'calib',
      uid: 'calib',
      batchId: 'calib',
      sequentialNumber: 1,
      numberFormatted: '0001',
      publicId: 'dp_calib1',
      targetUrl: 'https://dinamico.pro',
      modelId: liveModel.id,
      createdAt: '',
      updatedAt: '',
      clicks: 0,
    };

    renderPlaqueToCanvas({
      model: liveModel,
      plaque: dummy,
      canvasWidth: 500,
      canvasHeight: 500,
    }).then((c) => {
      const target = canvasRef.current;
      if (target) {
        target.width = 500;
        target.height = 500;
        const ctx = target.getContext('2d');
        if (ctx) ctx.drawImage(c, 0, 0);
      }
    });
  }, [qrX, qrY, qrSize, coverColor, numX, numY, numSize, numColor, numPrefix, selectedModelId, isOpen, models]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveModelCalibration(
      selectedModelId,
      { x: qrX, y: qrY, size: qrSize, coverColor, coverPadding: 1.5 },
      { x: numX, y: numY, fontSize: numSize, color: numColor, align: 'center', prefix: numPrefix }
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    resetModelCalibrations();
    const defaults = getCalibratedModels();
    setModels(defaults);
    const m = defaults.find((item) => item.id === selectedModelId) || defaults[0];
    if (m) {
      setQrX(m.qrZone.x);
      setQrY(m.qrZone.y);
      setQrSize(m.qrZone.size);
      setCoverColor(m.qrZone.coverColor);
      setNumX(m.numberZone.x);
      setNumY(m.numberZone.y);
      setNumSize(m.numberZone.fontSize);
      setNumColor(m.numberZone.color);
      setNumPrefix(m.numberZone.prefix);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-left my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-600/50 text-red-500">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Calibrador de Modelos e Coordenadas
            </h2>
            <p className="text-xs text-zinc-400">
              Ajuste fino milimétrico do QR Code e da numeração sequencial
            </p>
          </div>
        </div>

        {/* Model Selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-white/5">
          {OFFICIAL_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModelId(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedModelId === m.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400'
              }`}
            >
              Modelo #{m.number}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Controls Column (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* QR Position */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Área do QR Code Dinâmico
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Posição X (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qrX}
                    onChange={(e) => setQrX(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Posição Y (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qrY}
                    onChange={(e) => setQrY(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Tamanho (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qrSize}
                    onChange={(e) => setQrSize(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block text-[10px] mb-1">Cor do remendo de cobertura (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={coverColor}
                    onChange={(e) => setCoverColor(e.target.value)}
                    className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={coverColor}
                    onChange={(e) => setCoverColor(e.target.value)}
                    className="px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Number Position */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Numeração Sequencial
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Posição X (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={numX}
                    onChange={(e) => setNumX(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Posição Y (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={numY}
                    onChange={(e) => setNumY(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Tamanho Fonte (px)</label>
                  <input
                    type="number"
                    value={numSize}
                    onChange={(e) => setNumSize(parseInt(e.target.value) || 28)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Cor do Número</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={numColor}
                      onChange={(e) => setNumColor(e.target.value)}
                      className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={numColor}
                      onChange={(e) => setNumColor(e.target.value)}
                      className="px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 block text-[10px] mb-1">Prefixo</label>
                  <input
                    type="text"
                    value={numPrefix}
                    onChange={(e) => setNumPrefix(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
                <span>Restaurar Padrão Oficial</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{savedSuccess ? 'Salvo com Sucesso!' : 'Salvar Calibração'}</span>
              </button>
            </div>
          </div>

          {/* Live Preview Canvas (5 cols) */}
          <div className="md:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Visualização Calibrada (500x500)
            </span>
            <div className="aspect-square w-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950 flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">
              Qualquer alteração é imediatamente aplicada nas prévias, PNGs e impressões em PDF do lote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
