import { create } from 'zustand';
import type { Layer, Proyek, Transform } from '../skema/proyek';
import { PROPERTI } from './keyframe';

function klon<T>(nilai: T): T {
  if (typeof structuredClone === 'function') return structuredClone(nilai);
  return JSON.parse(JSON.stringify(nilai)) as T;
}

interface Keadaan {
  proyek: Proyek | null;
  pilih: string | null;
  playhead: number;
  main: boolean;
  lali: Proyek[];
  depan: Proyek[];
}

interface Aksi {
  gantiProyek: (p: Proyek) => void;
  ubah: (fn: (draf: Proyek) => void) => void;
  undo: () => void;
  redo: () => void;
  setPlayhead: (t: number) => void;
  setMain: (b: boolean) => void;
  pilihLayer: (id: string | null) => void;
  tambahLayer: (l: Layer) => void;
  hapusLayer: (id: string) => void;
  ubahLayer: (id: string, fn: (l: Layer) => void) => void;
  ubahTransform: (id: string, p: Partial<Transform>) => void;
  tambahKeyframe: (id: string, t: number) => void;
  hapusKeyframe: (id: string, indeks: number) => void;
  gantiNama: (nama: string) => void;
}

export const useEditor = create<Keadaan & Aksi>((set, get) => ({
  proyek: null,
  pilih: null,
  playhead: 0,
  main: false,
  lali: [],
  depan: [],

  gantiProyek: (p) => set({ proyek: klon(p), pilih: p.layers[0]?.id ?? null, playhead: 0, main: false, lali: [], depan: [] }),

  ubah: (fn) =>
    set((s) => {
      if (!s.proyek) return {};
      const draf = klon(s.proyek);
      fn(draf);
      draf.diubah = Date.now();
      return { proyek: draf, lali: [...s.lali.slice(-49), s.proyek], depan: [] };
    }),

  undo: () =>
    set((s) => {
      if (s.lali.length === 0 || !s.proyek) return {};
      const sebelumnya = s.lali[s.lali.length - 1];
      return { proyek: sebelumnya, lali: s.lali.slice(0, -1), depan: [s.proyek, ...s.depan].slice(0, 50) };
    }),

  redo: () =>
    set((s) => {
      if (s.depan.length === 0 || !s.proyek) return {};
      const berikut = s.depan[0];
      return { proyek: berikut, depan: s.depan.slice(1), lali: [...s.lali, s.proyek].slice(-50) };
    }),

  setPlayhead: (t) => set((s) => ({ playhead: Math.max(0, Math.min(t, s.proyek?.durasi ?? 0)) })),
  setMain: (b) => set({ main: b }),
  pilihLayer: (id) => set({ pilih: id }),

  tambahLayer: (l) =>
    get().ubah((draf) => {
      draf.layers.push(l);
    }),

  hapusLayer: (id) =>
    set((s) => {
      if (!s.proyek) return {};
      const draf = klon(s.proyek);
      draf.layers = draf.layers.filter((l) => l.id !== id);
      return { proyek: draf, pilih: s.pilih === id ? null : s.pilih, lali: [...s.lali.slice(-49), s.proyek], depan: [] };
    }),

  ubahLayer: (id, fn) =>
    get().ubah((draf) => {
      const l = draf.layers.find((x) => x.id === id);
      if (l) fn(l);
    }),

  ubahTransform: (id, p) =>
    get().ubah((draf) => {
      const l = draf.layers.find((x) => x.id === id);
      if (!l) return;
      for (const k of Object.keys(p) as (keyof Transform)[]) {
        const v = p[k];
        if (typeof v === 'number') l.transform[k] = v;
      }
    }),

  tambahKeyframe: (id, t) =>
    get().ubah((draf) => {
      const l = draf.layers.find((x) => x.id === id);
      if (!l || l.kunci) return;
      const properti = Object.fromEntries(PROPERTI.map((p) => [p, l.transform[p]]));
      const ada = l.keyframes.find((k) => Math.abs(k.t - t) < 1 / 120);
      if (ada) ada.properti = { ...ada.properti, ...properti };
      else l.keyframes.push({ t, properti, easing: 'easeInOut' });
      l.keyframes.sort((a, b) => a.t - b.t);
    }),

  hapusKeyframe: (id, indeks) =>
    get().ubah((draf) => {
      const l = draf.layers.find((x) => x.id === id);
      if (!l) return;
      l.keyframes.splice(indeks, 1);
    }),

  gantiNama: (nama) =>
    get().ubah((draf) => {
      draf.nama = nama;
    }),
}));
