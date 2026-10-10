import { OfficialModel } from '../types';

export const OFFICIAL_MODELS: OfficialModel[] = [
  {
    id: 'model-1',
    number: 1,
    name: 'Modelo 01 — Titanium Black',
    description: 'Estilo executivo escuro com ícone NFC e contraste moderno',
    imageUrl: 'https://i.postimg.cc/VLSPDm7k/Design-sem-nome-1.jpg',
    qrZone: {
      x: 32.5,
      y: 41.5,
      size: 35.0,
      coverColor: '#0c0c0f',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 89.5,
      fontSize: 28,
      color: '#e50914',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-2',
    number: 2,
    name: 'Modelo 02 — Red Velvet Gradient',
    description: 'Gradiente vermelho vibrante com destaque visual de alto impacto',
    imageUrl: 'https://i.postimg.cc/3wFsdRwW/Design-sem-nome-3.jpg',
    qrZone: {
      x: 32.5,
      y: 42.0,
      size: 35.0,
      coverColor: '#120a0d',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 90.0,
      fontSize: 28,
      color: '#ffffff',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-3',
    number: 3,
    name: 'Modelo 03 — Dark Carbon Fiber',
    description: 'Textura premium escura com bordas elegantes e acabamento refinado',
    imageUrl: 'https://i.postimg.cc/HxSF9hXj/Design-sem-nome-5.jpg',
    qrZone: {
      x: 33.0,
      y: 40.5,
      size: 34.0,
      coverColor: '#0a0a0c',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 88.5,
      fontSize: 28,
      color: '#e50914',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-4',
    number: 4,
    name: 'Modelo 04 — Cyber Crimson',
    description: 'Linhas geométricas e destaques em vermelho rubi neon',
    imageUrl: 'https://i.postimg.cc/CKStTg4M/Design-sem-nome-7.jpg',
    qrZone: {
      x: 32.5,
      y: 43.0,
      size: 35.0,
      coverColor: '#0e0b10',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 91.0,
      fontSize: 28,
      color: '#ef4444',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-5',
    number: 5,
    name: 'Modelo 05 — Minimalist Obsidian',
    description: 'Visual minimalista monocromático com acento carmesim sutil',
    imageUrl: 'https://i.postimg.cc/43QDmd34/Design-sem-nome-2.jpg',
    qrZone: {
      x: 32.0,
      y: 41.0,
      size: 36.0,
      coverColor: '#0b0b0e',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 89.0,
      fontSize: 28,
      color: '#f87171',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-6',
    number: 6,
    name: 'Modelo 06 — Apex Industrial',
    description: 'Estrutura técnica balanceada para ambientes comerciais de alto fluxo',
    imageUrl: 'https://i.postimg.cc/MGq42SYj/Design-sem-nome-4.jpg',
    qrZone: {
      x: 32.5,
      y: 42.5,
      size: 35.0,
      coverColor: '#09090b',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 90.0,
      fontSize: 28,
      color: '#e50914',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-7',
    number: 7,
    name: 'Modelo 07 — Prestige Ruby Matrix',
    description: 'Grade suave e contraste elevado com máxima legibilidade óptica',
    imageUrl: 'https://i.postimg.cc/k5qZ3my5/Design-sem-nome-6.jpg',
    qrZone: {
      x: 33.0,
      y: 41.5,
      size: 34.0,
      coverColor: '#0d0d10',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 89.5,
      fontSize: 28,
      color: '#dc2626',
      align: 'center',
      prefix: 'Nº ',
    },
  },
  {
    id: 'model-8',
    number: 8,
    name: 'Modelo 08 — Elite Phantom Shield',
    description: 'Design premium de alta blindagem com selo de verificação visual',
    imageUrl: 'https://i.postimg.cc/0Nn49BtM/Design-sem-nome-8.jpg',
    qrZone: {
      x: 32.5,
      y: 42.0,
      size: 35.0,
      coverColor: '#08080a',
      coverPadding: 1.5,
    },
    numberZone: {
      x: 50.0,
      y: 90.5,
      fontSize: 28,
      color: '#ef4444',
      align: 'center',
      prefix: 'Nº ',
    },
  },
];

// Helper to retrieve custom calibrated model configuration from localStorage if overridden
const CALIBRATION_STORAGE_KEY = 'dinamico_pro_model_calibrations';

export function getCalibratedModels(): OfficialModel[] {
  try {
    const saved = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!saved) return OFFICIAL_MODELS;
    const customMap = JSON.parse(saved);
    return OFFICIAL_MODELS.map((model) => {
      if (customMap[model.id]) {
        return {
          ...model,
          qrZone: { ...model.qrZone, ...customMap[model.id].qrZone },
          numberZone: { ...model.numberZone, ...customMap[model.id].numberZone },
        };
      }
      return model;
    });
  } catch {
    return OFFICIAL_MODELS;
  }
}

export function saveModelCalibration(modelId: string, qrZone: any, numberZone: any) {
  try {
    const saved = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    const customMap = saved ? JSON.parse(saved) : {};
    customMap[modelId] = { qrZone, numberZone };
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(customMap));
  } catch (err) {
    console.error('Failed to save calibration:', err);
  }
}

export function resetModelCalibrations() {
  localStorage.removeItem(CALIBRATION_STORAGE_KEY);
}
