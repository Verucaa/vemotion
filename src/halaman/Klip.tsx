import { useRef, useState } from 'react';
import { layerMedia, proyekBaru, type Proyek } from '../skema/proyek';
import { useT } from '../intl';

interface Props {
  onBuat: (p: Proyek) => void;
  onKembali: () => void;
}

export function Klip({ onBuat, onKembali }: Props) {
  const { t } = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [nama, setNama] = useState('klip.mp4');
  const [durasiAsli, setDurasiAsli] = useState(0);
  const [mulai, setMulai] = useState(0);
  const [durasi, setDurasi] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);

  const durasiMaks = Math.max(0, durasiAsli - mulai);
  const durasiAkhir = Math.max(0.5, Math.min(durasi, durasiMaks || 5));

  function pilihBerkas(berkas: File) {
    if (url) URL.revokeObjectURL(url);
    const objek = URL.createObjectURL(berkas);
    setUrl(objek);
    setNama(berkas.name);
    setMulai(0);
    setDurasiAsli(0);
    setDurasi(5);
  }

  return (
    <div className="layar">
      <header className="bilah">
        <button type="button" className="ikon" onClick={onKembali} aria-label={t('umum.kembali')}>
          ←
        </button>
        <h1>{t('klip.judul')}</h1>
      </header>
      <div className="isi sempit">
        <p className="redup">{t('klip.petunjuk')}</p>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pilihBerkas(f);
            e.target.value = '';
          }}
        />

        {url && (
          <div className="bingkai-klip">
            <video
              ref={videoRef}
              src={url}
              muted
              playsInline
              controls
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                setDurasiAsli(Number.isFinite(d) ? d : 0);
                setDurasi(Math.max(0.5, Math.min(5, d || 5)));
              }}
            />
          </div>
        )}

        {url && (
          <>
            <label className="kolom">
              <span>{t('klip.mulai')}</span>
              <input
                type="number"
                min={0}
                max={Math.max(0, durasiAsli - 0.5)}
                step={0.1}
                value={Number(mulai.toFixed(2))}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value) || 0);
                  setMulai(Math.min(v, Math.max(0, durasiAsli - 0.5)));
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
              />
            </label>
            <label className="kolom">
              <span>{t('klip.durasi')}</span>
              <input
                type="number"
                min={0.5}
                max={Math.max(0.5, durasiMaks || 60)}
                step={0.1}
                value={Number(durasiAkhir.toFixed(2))}
                onChange={(e) => setDurasi(Math.max(0.5, Number(e.target.value) || 5))}
              />
            </label>
            <button
              type="button"
              className="tombol utama lebar"
              onClick={() => {
                const p = proyekBaru(`Klip ${nama.replace(/\.[^.]+$/, '')}`, '9:16', 30, durasiAkhir);
                p.layers.push(layerMedia('video', nama, url, durasiAkhir, mulai));
                onBuat(p);
              }}
            >
              {t('klip.buat')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
