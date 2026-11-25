import type { Layer, Proyek } from '../skema/proyek';
import { transformPada } from './keyframe';

export interface Aset {
  gambar: Map<string, HTMLImageElement>;
  video: Map<string, HTMLVideoElement>;
}

export const ASET_KOSONG: Aset = { gambar: new Map(), video: new Map() };

export async function muatAset(proyek: Proyek): Promise<Aset> {
  const gambar = new Map<string, HTMLImageElement>();
  const video = new Map<string, HTMLVideoElement>();

  await Promise.all(
    proyek.layers.map(async (l) => {
      if (!l.sumber) return;
      if (l.tipe === 'gambar') {
        const img = new Image();
        img.decoding = 'async';
        img.src = l.sumber;
        await img.decode().catch(() => undefined);
        gambar.set(l.id, img);
      } else if (l.tipe === 'video') {
        const v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.crossOrigin = 'anonymous';
        v.src = l.sumber;
        await new Promise<void>((resolve) => {
          const selesai = () => {
            v.onloadeddata = null;
            v.onerror = null;
            resolve();
          };
          v.onloadeddata = selesai;
          v.onerror = selesai;
          v.load();
          setTimeout(selesai, 8000);
        });
        video.set(l.id, v);
      }
    }),
  );

  return { gambar, video };
}

function ukuranMedia(el: HTMLImageElement | HTMLVideoElement): { iw: number; ih: number } {
  if (el instanceof HTMLVideoElement) return { iw: el.videoWidth, ih: el.videoHeight };
  return { iw: el.naturalWidth, ih: el.naturalHeight };
}

function gambarMedia(
  ctx: CanvasRenderingContext2D,
  el: HTMLImageElement | HTMLVideoElement,
  lebar: number,
  tinggi: number,
  cocok: 'tutup' | 'muat',
): void {
  const { iw, ih } = ukuranMedia(el);
  if (!iw || !ih) return;
  const s = cocok === 'tutup' ? Math.max(lebar / iw, tinggi / ih) : Math.min(lebar / iw, tinggi / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
}

function pecahBaris(ctx: CanvasRenderingContext2D, isi: string, lebarMaks: number): string[] {
  const hasil: string[] = [];
  for (const paragraf of isi.split('\n')) {
    const kata = paragraf.split(/\s+/).filter(Boolean);
    if (kata.length === 0) {
      hasil.push('');
      continue;
    }
    let baris = '';
    for (const k of kata) {
      const coba = baris ? `${baris} ${k}` : k;
      if (baris && ctx.measureText(coba).width > lebarMaks) {
        hasil.push(baris);
        baris = k;
      } else {
        baris = coba;
      }
    }
    hasil.push(baris);
  }
  return hasil;
}

function gambarTeks(ctx: CanvasRenderingContext2D, layer: Layer, lebar: number, lokal: number): void {
  const teks = layer.teks;
  if (!teks || !teks.isi) return;

  let isi = teks.isi;
  if (teks.animasi === 'ketik' && teks.animasiDurasi > 0) {
    const maju = Math.max(0, Math.min(1, lokal / teks.animasiDurasi));
    isi = isi.slice(0, Math.ceil(isi.length * maju));
    if (!isi) return;
  }

  const gaya = `${teks.miring ? 'italic ' : ''}${teks.tebal ? 700 : 400}`;
  ctx.font = `${gaya} ${teks.ukuran}px ${teks.font}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = teks.align;

  const lebarMaks = lebar * 0.9;
  const baris = pecahBaris(ctx, isi, lebarMaks);
  const tinggiBaris = teks.ukuran * 1.22;
  const totalTinggi = baris.length * tinggiBaris;
  const x = teks.align === 'center' ? 0 : teks.align === 'left' ? -lebar * 0.45 : lebar * 0.45;

  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  baris.forEach((isiBaris, i) => {
    const y = -totalTinggi / 2 + tinggiBaris * (i + 0.5);
    if (teks.strokeLebar > 0) {
      ctx.strokeStyle = teks.strokeWarna;
      ctx.lineWidth = teks.strokeLebar;
      ctx.strokeText(isiBaris, x, y);
    }
    if (teks.bayangan) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = Math.max(4, teks.ukuran * 0.12);
      ctx.shadowOffsetY = Math.max(2, teks.ukuran * 0.05);
      ctx.fillStyle = teks.warna;
      ctx.fillText(isiBaris, x, y);
      ctx.restore();
    } else {
      ctx.fillStyle = teks.warna;
      ctx.fillText(isiBaris, x, y);
    }
  });
}

function gambarLayer(ctx: CanvasRenderingContext2D, proyek: Proyek, layer: Layer, t: number, aset: Aset): void {
  if (!layer.tampil) return;
  const lokal = t - layer.mulai;
  if (lokal < 0 || lokal > layer.durasi) return;

  const tr = transformPada(layer, lokal);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, tr.opacity));
  ctx.translate(proyek.lebar / 2 + tr.x, proyek.tinggi / 2 + tr.y);
  ctx.rotate((tr.rotasi * Math.PI) / 180);
  ctx.scale(tr.skala, tr.skala);

  if (layer.tipe === 'teks') {
    gambarTeks(ctx, layer, proyek.lebar, lokal);
  } else {
    const el =
      layer.tipe === 'gambar' ? aset.gambar.get(layer.id) : aset.video.get(layer.id);
    if (el) gambarMedia(ctx, el, proyek.lebar, proyek.tinggi, layer.cocok);
  }

  ctx.restore();
}

export function gambarFrame(
  ctx: CanvasRenderingContext2D,
  proyek: Proyek,
  t: number,
  aset: Aset,
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = proyek.latar;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  for (const layer of proyek.layers) gambarLayer(ctx, proyek, layer, t, aset);
}

function cariWaktu(v: HTMLVideoElement, target: number): Promise<void> {
  return new Promise((resolve) => {
    let selesai = false;
    const akhir = () => {
      if (selesai) return;
      selesai = true;
      v.removeEventListener('seeked', akhir);
      resolve();
    };
    v.addEventListener('seeked', akhir);
    try {
      v.currentTime = target;
    } catch {
      akhir();
    }
    setTimeout(akhir, 600);
  });
}

export async function siapkanVideo(proyek: Proyek, t: number, aset: Aset): Promise<void> {
  const tugas: Promise<void>[] = [];
  for (const layer of proyek.layers) {
    if (layer.tipe !== 'video' || !layer.sumber) continue;
    const v = aset.video.get(layer.id);
    if (!v || v.readyState < 1) continue;
    const lokal = Math.min(Math.max(t - layer.mulai, 0), Math.max(layer.durasi, 0.001));
    const durasi = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : layer.durasi;
    const target = Math.min((layer.potong + lokal) % durasi, Math.max(durasi - 0.05, 0));
    if (Math.abs(v.currentTime - target) > 0.04) tugas.push(cariWaktu(v, target));
  }
  if (tugas.length) await Promise.all(tugas);
}

export async function gambarFrameAsync(
  ctx: CanvasRenderingContext2D,
  proyek: Proyek,
  t: number,
  aset: Aset,
): Promise<void> {
  await siapkanVideo(proyek, t, aset);
  gambarFrame(ctx, proyek, t, aset);
}
