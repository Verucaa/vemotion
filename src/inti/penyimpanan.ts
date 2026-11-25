import { type Proyek, SkemaProyek, type NamaPreset } from '../skema/proyek';

const KUNCI_PROYEK = 'vemotion.proyek';
const KUNCI_SETELAN = 'vemotion.setelan';

export interface Setelan {
  bahasa: 'id' | 'en';
  presetEkspor: NamaPreset;
}

export const SETELAN_AWAL: Setelan = { bahasa: 'id', presetEkspor: 'hemat' };

function bacaJson<T>(kunci: string, cadangan: T): T {
  try {
    const mentah = localStorage.getItem(kunci);
    if (!mentah) return cadangan;
    return JSON.parse(mentah) as T;
  } catch {
    return cadangan;
  }
}

function tulisJson(kunci: string, nilai: unknown): void {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // Penyimpanan penuh atau mode privat: abaikan, data sesi tetap ada di memori.
  }
}

export function daftarProyek(): Proyek[] {
  const mentah = bacaJson<unknown[]>(KUNCI_PROYEK, []);
  const hasil: Proyek[] = [];
  if (!Array.isArray(mentah)) return hasil;
  for (const item of mentah) {
    const cek = SkemaProyek.safeParse(item);
    if (cek.success) hasil.push(cek.data);
  }
  return hasil.sort((a, b) => b.diubah - a.diubah);
}

export function simpanProyek(proyek: Proyek): void {
  const semua = daftarProyek().filter((p) => p.id !== proyek.id);
  semua.push(proyek);
  tulisJson(KUNCI_PROYEK, semua);
}

export function hapusProyek(id: string): void {
  tulisJson(KUNCI_PROYEK, daftarProyek().filter((p) => p.id !== id));
}

export function hapusSemuaProyek(): void {
  tulisJson(KUNCI_PROYEK, []);
}

export function bacaSetelan(): Setelan {
  const s = bacaJson<Partial<Setelan>>(KUNCI_SETELAN, {});
  return {
    bahasa: s.bahasa === 'en' ? 'en' : 'id',
    presetEkspor: (s.presetEkspor ?? SETELAN_AWAL.presetEkspor) as NamaPreset,
  };
}

export function simpanSetelan(setelan: Setelan): void {
  tulisJson(KUNCI_SETELAN, setelan);
}
