import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updatePlaqueDestination } from '../../services/buyerService';
import { sanitizeRedirectUrl } from '../../services/redirectService';
import { Plaque, OfficialModel } from '../../types';
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  MessageCircle,
  Instagram,
  MapPin,
  Star,
  Globe,
  Share2,
  RefreshCw,
} from 'lucide-react';

interface Props {
  plaque: Plaque | null;
  model?: OfficialModel;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const EditDestinationModal: React.FC<Props> = ({
  plaque,
  model,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // WhatsApp quick helper
  const [whatsNumber, setWhatsNumber] = useState('');
  const [whatsMsg, setWhatsMsg] = useState('');
  const [showWhatsHelper, setShowWhatsHelper] = useState(false);

  useEffect(() => {
    if (plaque) {
      setNewUrl(plaque.targetUrl);
      setFeedback(null);
      setShowWhatsHelper(false);
    }
  }, [plaque]);

  if (!isOpen || !plaque) return null;

  const handleApplyPreset = (prefix: string) => {
    setNewUrl(prefix);
    setShowWhatsHelper(false);
  };

  const handleBuildWhatsApp = () => {
    const cleanNum = whatsNumber.replace(/\D/g, '');
    if (!cleanNum) return;
    const encodedMsg = encodeURIComponent(whatsMsg);
    const link = `https://wa.me/${cleanNum}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
    setNewUrl(link);
    setShowWhatsHelper(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);

    const validated = sanitizeRedirectUrl(newUrl);
    if (!validated) {
      setFeedback({
        type: 'error',
        message: 'A URL de destino deve ser um endereço válido (ex: https://instagram.com/sua_loja).',
      });
      return;
    }

    setSaving(true);
    try {
      await updatePlaqueDestination(user.uid, plaque.id, plaque.publicId, validated);
      setFeedback({
        type: 'success',
        message: 'Destino atualizado com sucesso! O QR Code impresso permanece exatamente o mesmo.',
      });
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Falha ao salvar no Firestore: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const testLink = () => {
    const validated = sanitizeRedirectUrl(newUrl);
    if (validated) {
      window.open(validated, '_blank', 'noopener,noreferrer');
    } else {
      alert('Por favor digite uma URL válida para testar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-left my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-600/50 text-red-500">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Editar Destino do QR Code Dinâmico
            </h2>
            <p className="text-xs text-zinc-400">
              Plaquinha <strong className="text-red-400 font-mono">#{plaque.numberFormatted}</strong> · ID: <code className="text-zinc-300 font-mono text-[11px]">{plaque.publicId}</code>
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-red-950/40 text-red-300 border-red-600/50'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              URL de Destino Atual
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://wa.me/5511999999999 ou https://instagram.com/..."
                className="flex-1 px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={testLink}
                title="Testar URL no navegador"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Testar</span>
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Modelos Rápidos de Destino:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setShowWhatsHelper(!showWhatsHelper)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('https://instagram.com/')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('https://g.page/r/')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
              >
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Avaliação Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('https://maps.google.com/')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span>Google Maps</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Generator helper expandable */}
          {showWhatsHelper && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Gerador de Link WhatsApp Direto
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="DDD + Número (ex: 11999998888)"
                  value={whatsNumber}
                  onChange={(e) => setWhatsNumber(e.target.value)}
                  className="px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Mensagem inicial (opcional)"
                  value={whatsMsg}
                  onChange={(e) => setWhatsMsg(e.target.value)}
                  className="px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleBuildWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Aplicar Link do WhatsApp
              </button>
            </div>
          )}

          {/* Invariant guarantee banner */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-white font-semibold block mb-0.5">
              Garantia de Permanência do QR Code:
            </span>
            A alteração do destino é sincronizada em tempo real com o servidor de redirecionamento. O QR Code físico, o link gravado no chip NFC e o código <code className="text-red-400 font-mono">#{plaque.numberFormatted}</code> continuam funcionando perfeitamente sem precisar reimprimir.
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando no Firestore...</span>
                </>
              ) : (
                <span>Salvar Alteração de Destino</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
