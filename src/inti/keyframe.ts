import type { Layer, Transform } from '../skema/proyek';

export const PROPERTI = ['x', 'y', 'skala', 'rotasi', 'opacity'] as const;
export type NamaProperti = (typeof PROPERTI)[number];

function easing(x: number, jenis: 'linear' | 'easeInOut'): number {
  if (jenis === 'linear') return x;
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export function transformPada(layer: Layer, t: number): Transform {
  const hasil: Record<NamaProperti, number> = {
    x: layer.transform.x,
    y: layer.transform.y,
    skala: layer.transform.skala,
    rotasi: layer.transform.rotasi,
    opacity: layer.transform.opacity,
  };

  for (const p of PROPERTI) {
    const kfs = layer.keyframes.filter((k) => k.properti[p] !== undefined).sort((a, b) => a.t - b.t);
    if (kfs.length === 0) continue;
    const pertama = kfs[0];
    if (t <= pertama.t) {
      hasil[p] = pertama.properti[p] ?? hasil[p];
      continue;
    }
    const akhir = kfs[kfs.length - 1];
    if (t >= akhir.t) {
      hasil[p] = akhir.properti[p] ?? hasil[p];
      continue;
    }
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t || 1;
        const f = easing((t - a.t) / span, b.easing);
        const va = a.properti[p] ?? hasil[p];
        const vb = b.properti[p] ?? hasil[p];
        hasil[p] = va + (vb - va) * f;
        break;
      }
    }
  }

  return { ...hasil };
}

export function keyframePada(layer: Layer, t: number): boolean {
  return layer.keyframes.some((k) => Math.abs(k.t - t) < 1 / 120);
}
