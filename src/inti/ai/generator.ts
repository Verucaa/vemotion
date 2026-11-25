import { ZodError } from 'zod';
import {
  layerBentuk,
  layerTeks,
  proyekBaru,
  type Easing,
  type Keyframe,
  type NamaRasio,
  type Proyek,
  type Transform,
} from '../../skema/proyek';
import {
  GAYA_AI,
  SkemaCerita,
  SKEMA_GEMINI_CERITA,
  type CeritaAI,
  type GayaAI,
} from './skema';
import { ekstrakJson, GalatAI, panggilTeks, type KonfigAI } from './penyedia';

export interface OpsiAI {
  rasio: NamaRasio;
  fps: number;
  gaya: GayaAI;
  durasiTarget: number;
  bahasa: 'id' | 'en';
}

const GAYA_DESKRIPSI: Record<GayaAI, string> = {
  auto: 'pilih gaya visual yang paling cocok dengan ide',
  tegas: 'kontras tinggi, huruf tebal besar, potongan cepat, warna berani',
  lembut: 'warna pastel, gerak halus, suasana tenang',
  retro: 'palet hangat, tekstur analog, tipografi klasik',
  kinetik: 'tipografi kinetik, gerak ritmis, tempo cepat',
  minimal: 'banyak ruang kosong, dua warna, satu aksen',
};

function sistemPrompt(bahasa: 'id' | 'en'): string {
  if (bahasa === 'en') {
    return [
      'You are a motion graphics director for short vertical video.',
      'Reply with JSON only, following the provided schema. No markdown, no commentary.',
      'Rules:',
      '- One idea per scene. Headline 2 to 7 words, no quotes, no emoji, no hashtags.',
      '- Subtext is one short supporting sentence, or an empty string.',
      '- Each scene lasts 1.5 to 6 seconds. Keep the total near the requested duration.',
      '- Colors must be hex #rrggbb. Text color must contrast with the background.',
      '- Vary animation, shape, and position between scenes. Keep a consistent palette.',
      '- Never mention brands, prices, or false claims. Do not write code.',
      '- This is motion graphics, not slides: short lines, strong rhythm, clear focal point.',
    ].join('\n');
  }
  return [
    'Kamu direktur motion graphics untuk video vertikal pendek.',
    'Balas hanya JSON sesuai skema. Tanpa markdown, tanpa penjelasan.',
    'Aturan:',
    '- Satu ide per adegan. Teks utama 2 sampai 7 kata, tanpa tanda kutip, tanpa emoji, tanpa tagar.',
    '- Subteks satu kalimat pendek pendukung, atau string kosong.',
    '- Tiap adegan 1,5 sampai 6 detik. Total mendekati durasi yang diminta.',
    '- Warna wajib hex #rrggbb. Warna teks harus kontras dengan latar.',
    '- Variasikan animasi, bentuk, dan posisi antar adegan. Palet tetap konsisten.',
    '- Jangan sebut merek, harga, atau klaim palsu. Jangan tulis kode.',
    '- Ini motion graphics, bukan slide: baris pendek, ritme kuat, satu fokus.',
  ].join('\n');
}

function penggunaPrompt(ide: string, opsi: OpsiAI): string {
  const jumlah = Math.max(3, Math.min(8, Math.round(opsi.durasiTarget / 3)));
  const bahasa = opsi.bahasa === 'en' ? 'English' : 'Bahasa Indonesia';
  return [
    `Ide: ${ide}`,
    `Target durasi: ${opsi.durasiTarget} detik, sekitar ${jumlah} adegan.`,
    `Rasio: ${opsi.rasio}.`,
    `Gaya: ${GAYA_DESKRIPSI[opsi.gaya]}.`,
    `Bahasa semua teks: ${bahasa}.`,
    'Buat storyboard motion graphics yang enak ditonton tanpa audio.',
    'Susun alur: pembuka menarik, isi singkat, penutup jelas.',
  ].join('\n');
}

export async function buatCeritaAI(konfig: KonfigAI, ide: string, opsi: OpsiAI): Promise<CeritaAI> {
  const bersih = ide.trim();
  if (!bersih) throw new GalatAI('kosong', 'Tulis dulu ide atau topiknya.');

  const teks = await panggilTeks(konfig, {
    sistem: sistemPrompt(opsi.bahasa),
    pengguna: penggunaPrompt(bersih, opsi),
    skemaGemini: SKEMA_GEMINI_CERITA,
    suhu: 0.9,
    maksToken: 4096,
  });

  try {
    return SkemaCerita.parse(ekstrakJson(teks));
  } catch (e) {
    if (e instanceof ZodError) {
      const pesan = e.issues[0]?.message ?? 'bentuk data tidak sesuai';
      throw new GalatAI('format', `Storyboard dari AI tidak sesuai skema (${pesan}). Coba lagi.`);
    }
    throw e;
  }
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function warna(nilai: string | undefined, cadangan: string): string {
  const t = (nilai ?? '').trim();
  if (!HEX.test(t)) return cadangan;
  if (t.length === 4) return '#' + t.slice(1).split('').map((c) => c + c).join('');
  return t.length === 9 ? t.slice(0, 7) : t;
}

function rgb(w: string): [number, number, number] | null {
  let isi = w.replace('#', '');
  if (isi.length === 3) isi = isi.split('').map((c) => c + c).join('');
  if (isi.length !== 6) return null;
  const n = Number.parseInt(isi, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminans(w: string): number {
  const c = rgb(w);
  if (!c) return 0;
  const lin = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function teksKontras(warnaTeks: string, latar: string): string {
  const a = luminans(warnaTeks);
  const b = luminans(latar);
  if (Math.abs(a - b) >= 0.28) return warnaTeks;
  return b > 0.45 ? '#0b0b0f' : '#ffffff';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function kf(t: number, properti: Partial<Transform>, easing: Easing = 'easeInOut'): Keyframe {
  return { t, properti, easing };
}

export function ceritaKeProyek(cerita: CeritaAI, opsi: Pick<OpsiAI, 'rasio' | 'fps'>): Proyek {
  const palet = cerita.palet;
  const latar = warna(palet.latar, '#0b0f1a');
  const latar2 = warna(palet.latar2, '#1b2440');
  const aksen = warna(palet.aksen, '#7c5cff');
  const warnaTeks = teksKontras(warna(palet.teks, '#ffffff'), latar);

  const durasiAdegan = cerita.adegan.map((a) => clamp(a.durasi, 1, 8));
  const jumlah = durasiAdegan.reduce((x, y) => x + y, 0);
  const faktor = jumlah > 60 ? 60 / jumlah : 1;
  const total = Math.max(2, jumlah * faktor);

  const proyek = proyekBaru(cerita.judul.trim() || 'Motion AI', opsi.rasio, opsi.fps, total);
  proyek.latar = latar;
  proyek.latarGradien = { dari: latar, ke: latar2, sudut: 135 };

  const W = proyek.lebar;
  const H = proyek.tinggi;
  const ukuranJudul = Math.round(clamp(Math.min(W, H) * 0.095, 40, 170));
  const ukuranSub = Math.round(clamp(ukuranJudul * 0.34, 20, 60));

  let awal = 0;
  cerita.adegan.forEach((adegan, i) => {
    const durasi = clamp(adegan.durasi, 1, 8) * faktor;
    const akhir = awal + durasi;
    const aksenAdegan = warna(adegan.aksen, aksen);
    const yBase =
      adegan.posisi === 'atas' ? -H * 0.16 : adegan.posisi === 'bawah' ? H * 0.16 : 0;

    if (adegan.bentuk !== 'tidak') {
      const xAksen = (i % 2 === 0 ? 1 : -1) * W * 0.27;
      if (adegan.bentuk === 'bulat') {
        const garis = Math.max(3, Math.round(W * 0.006));
        const cincin = layerBentuk('bulat', awal, durasi + 0.4, {
          isi: 'transparan',
          garisWarna: aksenAdegan,
          garisLebar: garis,
          lebar: Math.round(W * 0.62),
          tinggi: Math.round(W * 0.62),
        });
        cincin.nama = `Cincin ${i + 1}`;
        cincin.transform.x = Math.round(xAksen);
        cincin.transform.y = Math.round(-H * 0.06);
        cincin.transform.opacity = 0.85;
        cincin.keyframes = [
          kf(0, { skala: 0.6, rotasi: -30, opacity: 0 }, 'easeOut'),
          kf(Math.min(0.7, durasi * 0.4), { skala: 1, rotasi: -8, opacity: 0.85 }, 'easeOut'),
          kf(durasi, { skala: 1.08, rotasi: 18, opacity: 0.6 }, 'linear'),
        ];
        proyek.layers.push(cincin);
      } else if (adegan.bentuk === 'kotak') {
        const kotak = layerBentuk('kotak', awal, durasi + 0.4, {
          isi: aksenAdegan,
          radius: Math.round(W * 0.05),
          lebar: Math.round(W * 0.58),
          tinggi: Math.round(W * 0.58),
        });
        kotak.nama = `Blok ${i + 1}`;
        kotak.transform.x = Math.round(xAksen);
        kotak.transform.y = Math.round(H * 0.02);
        kotak.transform.opacity = 0.22;
        kotak.transform.rotasi = -12;
        kotak.keyframes = [
          kf(0, { skala: 0.7, rotasi: -22, opacity: 0 }, 'easeOut'),
          kf(Math.min(0.7, durasi * 0.4), { skala: 1, rotasi: -12, opacity: 0.22 }, 'easeOut'),
          kf(durasi, { skala: 1.06, rotasi: -4, opacity: 0.16 }, 'linear'),
        ];
        proyek.layers.push(kotak);
      } else {
        const garis = layerBentuk('garis', awal, durasi + 0.2, {
          isi: aksenAdegan,
          lebar: Math.round(W * 0.46),
          tinggi: Math.max(6, Math.round(H * 0.008)),
        });
        garis.nama = `Garis ${i + 1}`;
        garis.transform.y = Math.round(yBase + ukuranJudul * 0.95);
        garis.keyframes = [
          kf(0, { opacity: 0 }, 'easeOut'),
          kf(Math.min(0.5, durasi * 0.3), { opacity: 1 }, 'easeOut'),
          kf(Math.max(durasi - 0.3, 0.8), { opacity: 1 }, 'linear'),
          kf(durasi, { opacity: 0 }, 'linear'),
        ];
        proyek.layers.push(garis);
      }
    }

    const judul = layerTeks(adegan.teks.trim(), awal, durasi, {
      ukuran: ukuranJudul,
      warna: warnaTeks,
      font: 'system-ui',
      tebal: true,
      bayangan: true,
      animasi: adegan.animasi === 'ketik' ? 'ketik' : 'tidak',
      animasiDurasi: Math.min(1.8, durasi * 0.5),
    });
    judul.nama = `Teks ${i + 1}`;
    judul.transform.y = Math.round(yBase);

    const masuk = Math.min(0.65, durasi * 0.4);
    const kfs: Keyframe[] = [];
    switch (adegan.animasi) {
      case 'pop':
        kfs.push(kf(0, { skala: 0.55, opacity: 0 }, 'easeOut'));
        kfs.push(kf(masuk, { skala: 1, opacity: 1 }, 'backOut'));
        break;
      case 'geser':
        kfs.push(kf(0, { x: -W * 0.14, opacity: 0 }, 'easeOut'));
        kfs.push(kf(masuk, { x: 0, opacity: 1 }, 'easeOut'));
        break;
      case 'zoom':
        kfs.push(kf(0, { skala: 1.35, opacity: 0 }, 'easeOut'));
        kfs.push(kf(masuk, { skala: 1, opacity: 1 }, 'easeOut'));
        break;
      case 'putar':
        kfs.push(kf(0, { rotasi: -12, skala: 0.92, opacity: 0 }, 'easeOut'));
        kfs.push(kf(masuk, { rotasi: 0, skala: 1, opacity: 1 }, 'easeOut'));
        break;
      case 'ketik':
        kfs.push(kf(0, { opacity: 0 }, 'linear'));
        kfs.push(kf(Math.min(0.25, durasi * 0.2), { opacity: 1 }, 'linear'));
        break;
      default:
        kfs.push(kf(0, { y: yBase + H * 0.07, opacity: 0 }, 'easeOut'));
        kfs.push(kf(masuk, { y: yBase, opacity: 1 }, 'easeOut'));
    }
    if (durasi > 1.4) {
      kfs.push(kf(Math.max(durasi - 0.25, masuk + 0.1), { opacity: 1 }, 'linear'));
      kfs.push(kf(durasi, { opacity: 0 }, 'easeIn'));
    }
    judul.keyframes = kfs;
    proyek.layers.push(judul);

    const sub = (adegan.subteks ?? '').trim();
    if (sub) {
      const ySub = yBase + (adegan.posisi === 'bawah' ? -ukuranJudul * 1.1 : ukuranJudul * 1.15);
      const lapisSub = layerTeks(sub, awal, durasi, {
        ukuran: ukuranSub,
        warna: warnaTeks,
        font: 'system-ui',
        tebal: false,
        bayangan: true,
      });
      lapisSub.nama = `Sub ${i + 1}`;
      lapisSub.transform.y = Math.round(ySub);
      lapisSub.transform.opacity = 0.88;
      lapisSub.keyframes = [
        kf(0, { opacity: 0 }, 'easeOut'),
        kf(Math.min(0.7, durasi * 0.45), { opacity: 0.88 }, 'easeOut'),
        kf(Math.max(durasi - 0.3, 0.9), { opacity: 0.88 }, 'linear'),
        kf(durasi, { opacity: 0 }, 'easeIn'),
      ];
      proyek.layers.push(lapisSub);
    }

    awal = akhir;
  });

  return proyek;
}

const CONTOH_ID: Omit<CeritaAI, 'adegan'> & { adegan: { teks: string; subteks: string; animasi: 'naik' | 'pop' | 'geser' | 'zoom' | 'putar' | 'ketik'; bentuk: 'tidak' | 'bulat' | 'kotak' | 'garis'; posisi: 'tengah' | 'atas' | 'bawah'; durasi: number }[] } = {
  judul: 'Motion AI',
  gaya: 'modern',
  palet: { latar: '#0b0f1a', latar2: '#241b45', teks: '#ffffff', aksen: '#8b6cff' },
  adegan: [
    { teks: 'Mulai dari satu ide', subteks: 'Tulis topik, biarkan AI menyusun gerak.', animasi: 'naik', bentuk: 'bulat', posisi: 'tengah', durasi: 3 },
    { teks: 'Gerak tiap detik', subteks: 'Teks, bentuk, dan warna jadi satu ritme.', animasi: 'pop', bentuk: 'kotak', posisi: 'atas', durasi: 3 },
    { teks: 'Rapi dan cepat', subteks: 'Semua bisa diubah di timeline.', animasi: 'geser', bentuk: 'garis', posisi: 'bawah', durasi: 3 },
    { teks: 'Simpan. Bagikan.', subteks: 'Ekspor MP4 siap unggah.', animasi: 'zoom', bentuk: 'bulat', posisi: 'tengah', durasi: 3 },
  ],
};

const CONTOH_EN: typeof CONTOH_ID = {
  judul: 'Motion AI',
  gaya: 'modern',
  palet: { latar: '#0b0f1a', latar2: '#1b2440', teks: '#ffffff', aksen: '#7c5cff' },
  adegan: [
    { teks: 'Start with one idea', subteks: 'Type a topic and let AI shape the motion.', animasi: 'naik', bentuk: 'bulat', posisi: 'tengah', durasi: 3 },
    { teks: 'Motion every second', subteks: 'Type, shapes, and color in one rhythm.', animasi: 'pop', bentuk: 'kotak', posisi: 'atas', durasi: 3 },
    { teks: 'Clean and fast', subteks: 'Edit everything on the timeline.', animasi: 'geser', bentuk: 'garis', posisi: 'bawah', durasi: 3 },
    { teks: 'Save. Share.', subteks: 'Export MP4 ready to upload.', animasi: 'zoom', bentuk: 'bulat', posisi: 'tengah', durasi: 3 },
  ],
};

export function contohCerita(bahasa: 'id' | 'en'): CeritaAI {
  const dasar = bahasa === 'en' ? CONTOH_EN : CONTOH_ID;
  return SkemaCerita.parse({
    ...dasar,
    palet: { ...dasar.palet },
    adegan: dasar.adegan.map((a) => ({ ...a })),
  });
}

export function labelGaya(gaya: GayaAI): string {
  return GAYA_AI.includes(gaya) ? GAYA_DESKRIPSI[gaya] : GAYA_DESKRIPSI.auto;
}
