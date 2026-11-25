import { useEffect, useRef } from 'react';
import type { Proyek } from '../skema/proyek';
import { gambarFrame, siapkanVideo, type Aset } from '../inti/render';

interface Props {
  proyek: Proyek;
  playhead: number;
  aset: Aset;
  main: boolean;
}

export function Pratinjau({ proyek, playhead, aset, main }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const kanvas = ref.current;
    const ctx = kanvas?.getContext('2d');
    if (!kanvas || !ctx) return;

    if (kanvas.width !== proyek.lebar || kanvas.height !== proyek.tinggi) {
      kanvas.width = proyek.lebar;
      kanvas.height = proyek.tinggi;
    }

    let batal = false;
    void (async () => {
      if (!main) await siapkanVideo(proyek, playhead, aset);
      if (batal) return;
      gambarFrame(ctx, proyek, playhead, aset);
    })();
    return () => {
      batal = true;
    };
  }, [proyek, playhead, aset, main]);

  return <canvas ref={ref} className="pratinjau" aria-label={proyek.nama} />;
}
