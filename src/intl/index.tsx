import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { kamus, type Bahasa, type Kunci } from './terjemahan';
import { bacaSetelan, simpanSetelan } from '../inti/penyimpanan';

interface NilaiKonteks {
  bhs: Bahasa;
  setBhs: (b: Bahasa) => void;
  t: (k: Kunci, vars?: Record<string, string | number>) => string;
}

const Konteks = createContext<NilaiKonteks | null>(null);

export function PenyediaBahasa({ children }: { children: ReactNode }) {
  const [bhs, setBhsNilai] = useState<Bahasa>(() => bacaSetelan().bahasa);

  const setBhs = useCallback((b: Bahasa) => {
    setBhsNilai(b);
    simpanSetelan({ ...bacaSetelan(), bahasa: b });
    document.documentElement.lang = b;
  }, []);

  const t = useCallback(
    (k: Kunci, vars?: Record<string, string | number>) => {
      let teks: string = kamus[bhs][k] ?? kamus.id[k] ?? k;
      if (vars) for (const [nama, nilai] of Object.entries(vars)) teks = teks.replaceAll(`{${nama}}`, String(nilai));
      return teks;
    },
    [bhs],
  );

  const nilai = useMemo(() => ({ bhs, setBhs, t }), [bhs, setBhs, t]);
  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useT(): NilaiKonteks {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error('useT harus dipakai di dalam PenyediaBahasa');
  return nilai;
}
