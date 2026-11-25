import { z } from 'zod';

export const SkemaTransform = z.object({
  x: z.number(),
  y: z.number(),
  skala: z.number(),
  rotasi: z.number(),
  opacity: z.number().min(0).max(1),
});
export type Transform = z.infer<typeof SkemaTransform>;

export const TRANSFORM_DASAR: Transform = { x: 0, y: 0, skala: 1, rotasi: 0, opacity: 1 };

export const SkemaKeyframe = z.object({
  t: z.number().min(0),
  properti: SkemaTransform.partial(),
  easing: z.enum(['linear', 'easeInOut']).default('linear'),
});
export type Keyframe = z.infer<typeof SkemaKeyframe>;

export const SkemaTeks = z.object({
  isi: z.string(),
  font: z.string(),
  ukuran: z.number().min(6).max(400),
  warna: z.string(),
  align: z.enum(['left', 'center', 'right']),
  tebal: z.boolean(),
  miring: z.boolean(),
  strokeWarna: z.string(),
  strokeLebar: z.number().min(0).max(40),
  bayangan: z.boolean(),
  animasi: z.enum(['tidak', 'ketik']).default('tidak'),
  animasiDurasi: z.number().min(0).max(30).default(1),
});
export type Teks = z.infer<typeof SkemaTeks>;

export const TEKS_DASAR: Teks = {
  isi: 'Teks baru',
  font: 'system-ui',
  ukuran: 64,
  warna: '#ffffff',
  align: 'center',
  tebal: true,
  miring: false,
  strokeWarna: '#000000',
  strokeLebar: 0,
  bayangan: true,
  animasi: 'tidak',
  animasiDurasi: 1,
};

export const SkemaLayer = z.object({
  id: z.string(),
  tipe: z.enum(['teks', 'gambar', 'video']),
  nama: z.string(),
  mulai: z.number().min(0),
  durasi: z.number().positive(),
  tampil: z.boolean(),
  kunci: z.boolean(),
  transform: SkemaTransform,
  keyframes: z.array(SkemaKeyframe),
  teks: SkemaTeks.optional(),
  sumber: z.string().optional(),
  potong: z.number().min(0).default(0),
  cocok: z.enum(['tutup', 'muat']).default('tutup'),
});
export type Layer = z.infer<typeof SkemaLayer>;

export const SkemaProyek = z.object({
  version: z.literal(1),
  id: z.string(),
  nama: z.string(),
  lebar: z.number().int().min(16).max(3840),
  tinggi: z.number().int().min(16).max(3840),
  fps: z.number().int().min(1).max(60),
  durasi: z.number().min(0.1).max(600),
  latar: z.string(),
  layers: z.array(SkemaLayer),
  dibuat: z.number(),
  diubah: z.number(),
});
export type Proyek = z.infer<typeof SkemaProyek>;

export const PRESET_EKSPOR = {
  hemat: { label: 'Hemat', sisiPendek: 720, fps: 30, bitrate: 4_000_000 },
  seimbang: { label: 'Seimbang', sisiPendek: 1080, fps: 30, bitrate: 8_000_000 },
  tinggi: { label: 'Kualitas tinggi', sisiPendek: 1080, fps: 60, bitrate: 14_000_000 },
  maksima: { label: 'Maksima', sisiPendek: 2160, fps: 60, bitrate: 24_000_000 },
} as const;
export type NamaPreset = keyof typeof PRESET_EKSPOR;

export const RASIO = {
  '9:16': { lebar: 1080, tinggi: 1920 },
  '16:9': { lebar: 1920, tinggi: 1080 },
  '1:1': { lebar: 1080, tinggi: 1080 },
  '4:5': { lebar: 1080, tinggi: 1350 },
} as const;
export type NamaRasio = keyof typeof RASIO;

export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function proyekBaru(nama: string, rasio: NamaRasio = '9:16', fps = 30, durasi = 6): Proyek {
  const r = RASIO[rasio];
  const now = Date.now();
  return {
    version: 1,
    id: uid(),
    nama,
    lebar: r.lebar,
    tinggi: r.tinggi,
    fps,
    durasi,
    latar: '#111114',
    layers: [],
    dibuat: now,
    diubah: now,
  };
}

export function layerTeks(isi: string, mulai = 0, durasi = 4, teks: Partial<Teks> = {}): Layer {
  return {
    id: uid(),
    tipe: 'teks',
    nama: isi.slice(0, 24) || 'Teks',
    mulai,
    durasi,
    tampil: true,
    kunci: false,
    transform: { ...TRANSFORM_DASAR },
    keyframes: [],
    teks: { ...TEKS_DASAR, ...teks, isi },
    potong: 0,
    cocok: 'tutup',
  };
}

export function layerMedia(
  tipe: 'gambar' | 'video',
  nama: string,
  sumber: string,
  durasi: number,
  potong = 0,
): Layer {
  return {
    id: uid(),
    tipe,
    nama,
    mulai: 0,
    durasi,
    tampil: true,
    kunci: false,
    transform: { ...TRANSFORM_DASAR },
    keyframes: [],
    sumber,
    potong,
    cocok: 'tutup',
  };
}
