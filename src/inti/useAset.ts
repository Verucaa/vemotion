import { useEffect, useState } from 'react';
import type { Proyek } from '../skema/proyek';
import { ASET_KOSONG, muatAset, type Aset } from './render';

export function useAset(proyek: Proyek | null): Aset {
  const [aset, setAset] = useState<Aset>(ASET_KOSONG);
  const kunci = proyek ? proyek.layers.map((l) => `${l.id}:${l.sumber ?? ''}`).join('|') : '';

  useEffect(() => {
    if (!proyek) {
      setAset(ASET_KOSONG);
      return;
    }
    let batal = false;
    void muatAset(proyek).then((hasil) => {
      if (!batal) setAset(hasil);
    });
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);

  return aset;
}
