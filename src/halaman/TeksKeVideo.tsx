import { useState } from 'react';
import {
  layerTeks,
  proyekBaru,
  type Keyframe,
  type Proyek,
  type Transform,
} from '../skema/proyek';
import { useT } from '../intl';

type Gaya = 'pop' | 'ketik' | 'subtitle' | 'naik';

function kf(t: number, properti: Partial<Transform>, easing: 'linear' | 'easeInOut' = 'easeInOut'): Keyframe {
  return { t, properti, easing };
}

function buatProyek(isi: string, gaya: Gaya, durasi: number): Proyek {
  const p = proyekBaru('Teks ke video', '9:16', 30, durasi);
  const l = layerTeks(isi, 0, durasi);
  l.nama = isi.slice(0, 24) || 'Teks';
  const teks = l.teks;
  if (!teks) return p;

  if (gaya === 'pop') {
    teks.ukuran = Math.round(p.lebar * 0.085);
    l.keyframes = [
      kf(Math.min(0.35, durasi * 0.1), { skala: 0.6, opacity: 0 }),
      kf(Math.min(0.6, durasi * 0.25), { skala: 1.06, opacity: 1 }),
      kf(Math.min(0.9, durasi * 0.4), { skala: 1 }),
    ];
  } else if (gaya === 'ketik') {
    teks.ukuran = Math.round(p.lebar * 0.07);
    teks.animasi = 'ketik';
    teks.animasiDurasi = Math.min(2.5, durasi * 0.7);
  } else if (gaya === 'subtitle') {
    teks.ukuran = Math.round(p.lebar * 0.045);
    teks.tebal = true;
    teks.strokeLebar = Math.max(2, Math.round(p.lebar * 0.004));
    l.transform.y = Math.round(p.tinggi * 0.32);
    l.keyframes = [kf(0, { opacity: 0 }), kf(Math.min(0.35, durasi * 0.15), { opacity: 1 })];
  } else {
    teks.ukuran = Math.round(p.lebar * 0.08);
    l.keyframes = [
      kf(0, { y: Math.round(p.tinggi * 0.1), opacity: 0 }),
      kf(Math.min(0.9, durasi * 0.4), { y: 0, opacity: 1 }),
    ];
  }

  p.layers.push(l);
  return p;
}

interface Props {
  onBuat: (p: Proyek) => void;
  onKembali: () => void;
}

export function TeksKeVideo({ onBuat, onKembali }: Props) {
  const { t } = useT();
  const [isi, setIsi] = useState('Halo, VeMotion!');
  const [gaya, setGaya] = useState<Gaya>('pop');
  const [durasi, setDurasi] = useState(5);

  const gayaOpsi: { nilai: Gaya; label: string }[] = [
    { nilai: 'pop', label: t('teks.gaya.pop') },
    { nilai: 'ketik', label: t('teks.gaya.ketik') },
    { nilai: 'subtitle', label: t('teks.gaya.subtitle') },
    { nilai: 'naik', label: t('teks.gaya.naik') },
  ];

  return (
    <div className="layar">
      <header className="bilah">
        <button type="button" className="ikon" onClick={onKembali} aria-label={t('umum.kembali')}>
          ←
        </button>
        <h1>{t('teks.judul')}</h1>
      </header>
      <div className="isi sempit">
        <label className="kolom">
          <span>{t('teks.isi')}</span>
          <textarea rows={4} value={isi} onChange={(e) => setIsi(e.target.value)} />
        </label>
        <label className="kolom">
          <span>{t('teks.gaya')}</span>
          <select value={gaya} onChange={(e) => setGaya(e.target.value as Gaya)}>
            {gayaOpsi.map((g) => (
              <option key={g.nilai} value={g.nilai}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="kolom">
          <span>{t('beranda.durasi')}</span>
          <input
            type="number"
            min={1}
            max={60}
            value={durasi}
            onChange={(e) => setDurasi(Math.max(1, Math.min(60, Number(e.target.value) || 5)))}
          />
        </label>
        <button
          type="button"
          className="tombol utama lebar"
          disabled={!isi.trim()}
          onClick={() => onBuat(buatProyek(isi.trim(), gaya, durasi))}
        >
          {t('teks.buat')}
        </button>
      </div>
    </div>
  );
}
