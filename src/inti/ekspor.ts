import type { Proyek } from '../skema/proyek';
import { gambarFrameAsync, muatAset } from './render';

export interface OpsiEkspor {
  sisiPendek: number;
  fps: number;
  bitrate: number;
  onProgres?: (selesai: number, total: number) => void;
  sinyal?: AbortSignal;
}

export interface UkuranEkspor {
  lebar: number;
  tinggi: number;
}

function genap(n: number): number {
  return Math.max(16, Math.round(n / 2) * 2);
}

export function hitungUkuran(proyek: Proyek, sisiPendek: number): UkuranEkspor {
  const sisiAsli = Math.min(proyek.lebar, proyek.tinggi);
  const skala = sisiPendek / sisiAsli;
  const lebar = Math.min(3840, genap(proyek.lebar * skala));
  const tinggi = Math.min(3840, genap(proyek.tinggi * skala));
  return { lebar, tinggi };
}

export function dukungEkspor(): boolean {
  return typeof VideoEncoder !== 'undefined';
}

function tungguAntrean(enc: VideoEncoder): Promise<void> {
  return new Promise((resolve) => {
    const cek = () => {
      if (enc.encodeQueueSize <= 2) resolve();
      else setTimeout(cek, 8);
    };
    setTimeout(cek, 4);
  });
}

export class EksporTidakDidukung extends Error {
  constructor() {
    super('TIDAK_DIDUKUNG');
    this.name = 'EksporTidakDidukung';
  }
}

export async function eksporMp4(proyek: Proyek, opsi: OpsiEkspor): Promise<Blob> {
  if (!dukungEkspor()) throw new EksporTidakDidukung();

  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const { lebar, tinggi } = hitungUkuran(proyek, opsi.sisiPendek);
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: lebar, height: tinggi },
    fastStart: 'in-memory',
  });

  let galat: unknown = null;
  const enc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      galat = e;
    },
  });

  const kandidat = ['avc1.42001f', 'avc1.4d0028', 'avc1.640028'];
  let kodek = kandidat[0];
  for (const c of kandidat) {
    try {
      const cek = await VideoEncoder.isConfigSupported({
        codec: c,
        width: lebar,
        height: tinggi,
        bitrate: opsi.bitrate,
        framerate: opsi.fps,
      });
      if (cek.supported) {
        kodek = c;
        break;
      }
    } catch {
      // coba kandidat berikutnya
    }
  }

  enc.configure({ codec: kodek, width: lebar, height: tinggi, bitrate: opsi.bitrate, framerate: opsi.fps });

  const kanvas = document.createElement('canvas');
  kanvas.width = lebar;
  kanvas.height = tinggi;
  const ctx = kanvas.getContext('2d');
  if (!ctx) throw new Error('KANVAS_GAGAL');

  const aset = await muatAset(proyek);
  const total = Math.max(1, Math.ceil(proyek.durasi * opsi.fps));
  const skala = lebar / proyek.lebar;
  const jedaKunci = Math.max(1, opsi.fps * 2);

  try {
    for (let i = 0; i < total; i++) {
      if (opsi.sinyal?.aborted) throw new Error('DIBATALKAN');
      if (galat) throw galat;

      const t = i / opsi.fps;
      ctx.save();
      ctx.setTransform(skala, 0, 0, skala, 0, 0);
      await gambarFrameAsync(ctx, proyek, t, aset);
      ctx.restore();

      const frame = new VideoFrame(kanvas, {
        timestamp: Math.round(t * 1_000_000),
        duration: Math.round(1_000_000 / opsi.fps),
      });
      enc.encode(frame, { keyFrame: i % jedaKunci === 0 });
      frame.close();

      opsi.onProgres?.(i + 1, total);
      if (enc.encodeQueueSize > 6) await tungguAntrean(enc);
    }

    await enc.flush();
    if (galat) throw galat;
    muxer.finalize();
  } finally {
    if (enc.state !== 'closed') enc.close();
  }

  return new Blob([target.buffer], { type: 'video/mp4' });
}
