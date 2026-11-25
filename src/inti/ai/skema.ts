import { z } from 'zod';

export const ANIMASI_AI = ['naik', 'pop', 'geser', 'zoom', 'putar', 'ketik'] as const;
export type AnimasiAI = (typeof ANIMASI_AI)[number];

export const BENTUK_AI = ['tidak', 'bulat', 'kotak', 'garis'] as const;
export type BentukAI = (typeof BENTUK_AI)[number];

export const POSISI_AI = ['tengah', 'atas', 'bawah'] as const;
export type PosisiAI = (typeof POSISI_AI)[number];

export const SkemaPalet = z.object({
  latar: z.string().catch('#0b0f1a'),
  latar2: z.string().catch('#1b2440'),
  teks: z.string().catch('#ffffff'),
  aksen: z.string().catch('#7c5cff'),
});
export type Palet = z.infer<typeof SkemaPalet>;

export const PALET_DASAR: Palet = {
  latar: '#0b0f1a',
  latar2: '#1b2440',
  teks: '#ffffff',
  aksen: '#7c5cff',
};

export const SkemaAdegan = z.object({
  teks: z.string().min(1).max(120),
  subteks: z.string().max(160).optional().default(''),
  durasi: z.number().min(1).max(8).catch(3),
  animasi: z.enum(ANIMASI_AI).catch('naik'),
  bentuk: z.enum(BENTUK_AI).catch('bulat'),
  posisi: z.enum(POSISI_AI).catch('tengah'),
  aksen: z.string().optional(),
});
export type AdeganAI = z.infer<typeof SkemaAdegan>;

export const SkemaCerita = z.object({
  judul: z.string().min(1).max(60).catch('Motion AI'),
  gaya: z.string().max(40).optional().default('modern'),
  palet: SkemaPalet.default(PALET_DASAR),
  adegan: z.array(SkemaAdegan).min(1).max(12),
});
export type CeritaAI = z.infer<typeof SkemaCerita>;

export const SKEMA_GEMINI_CERITA = {
  type: 'OBJECT',
  properties: {
    judul: { type: 'STRING', description: 'Judul singkat proyek, maksimal 6 kata.' },
    gaya: { type: 'STRING', description: 'Nama gaya visual singkat, misalnya modern, retro, tegas.' },
    palet: {
      type: 'OBJECT',
      properties: {
        latar: { type: 'STRING', description: 'Warna latar gradien awal, format #rrggbb.' },
        latar2: { type: 'STRING', description: 'Warna latar gradien akhir, format #rrggbb.' },
        teks: { type: 'STRING', description: 'Warna teks utama, format #rrggbb, kontras dengan latar.' },
        aksen: { type: 'STRING', description: 'Warna aksen bentuk, format #rrggbb.' },
      },
      required: ['latar', 'latar2', 'teks', 'aksen'],
    },
    adegan: {
      type: 'ARRAY',
      description: '3 sampai 8 adegan berurutan. Satu ide per adegan.',
      minItems: 3,
      maxItems: 8,
      items: {
        type: 'OBJECT',
        properties: {
          teks: { type: 'STRING', description: 'Teks utama, 2 sampai 7 kata, tanpa tanda kutip.' },
          subteks: { type: 'STRING', description: 'Satu kalimat pendukung, boleh kosong.' },
          durasi: { type: 'NUMBER', description: 'Durasi adegan dalam detik, 1.5 sampai 6.' },
          animasi: { type: 'STRING', enum: [...ANIMASI_AI] },
          bentuk: { type: 'STRING', enum: [...BENTUK_AI] },
          posisi: { type: 'STRING', enum: [...POSISI_AI] },
          aksen: { type: 'STRING', description: 'Warna aksen khusus adegan, format #rrggbb, opsional.' },
        },
        required: ['teks', 'durasi', 'animasi', 'bentuk', 'posisi'],
      },
    },
  },
  required: ['judul', 'palet', 'adegan'],
} as const;

export const GAYA_AI = ['auto', 'tegas', 'lembut', 'retro', 'kinetik', 'minimal'] as const;
export type GayaAI = (typeof GAYA_AI)[number];
