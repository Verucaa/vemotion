import { useRef } from 'react';
import type { Proyek } from '../skema/proyek';
import { useT } from '../intl';

interface Props {
  proyek: Proyek;
  playhead: number;
  onSeek: (t: number) => void;
  pilih: string | null;
  onPilih: (id: string) => void;
}

function tandaWaktu(durasi: number): number {
  if (durasi <= 10) return 1;
  if (durasi <= 30) return 2;
  if (durasi <= 60) return 5;
  return 10;
}

export function Timeline({ proyek, playhead, onSeek, pilih, onPilih }: Props) {
  const { t } = useT();
  const trekRef = useRef<HTMLDivElement>(null);
  const langkah = tandaWaktu(proyek.durasi);
  const jumlahTanda = Math.floor(proyek.durasi / langkah);

  function posisiKeWaktu(clientX: number): number {
    const el = trekRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const rasio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return rasio * proyek.durasi;
  }

  return (
    <div className="timeline">
      <div className="timeline-kepala">
        <span>{t('editor.layer')}</span>
        <span className="waktu">{playhead.toFixed(2)}s</span>
      </div>

      <div
        className="penggaris"
        ref={trekRef}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          onSeek(posisiKeWaktu(e.clientX));
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          onSeek(posisiKeWaktu(e.clientX));
        }}
      >
        {Array.from({ length: jumlahTanda + 1 }, (_, i) => (
          <span key={i} className="tanda" style={{ left: `${((i * langkah) / proyek.durasi) * 100}%` }}>
            {i * langkah}s
          </span>
        ))}
        <div className="playhead" style={{ left: `${(playhead / proyek.durasi) * 100}%` }} />
      </div>

      <div className="trek">
        {proyek.layers.map((l) => (
          <div key={l.id} className="baris-layer">
            <button
              type="button"
              className={`klip ${pilih === l.id ? 'aktif' : ''} ${l.tampil ? '' : 'sembunyi'}`}
              style={{
                left: `${(l.mulai / proyek.durasi) * 100}%`,
                width: `${Math.max(1.5, (l.durasi / proyek.durasi) * 100)}%`,
              }}
              onClick={() => onPilih(l.id)}
              title={l.nama}
            >
              <span>{l.nama}</span>
              {l.keyframes.map((k, i) => (
                <i
                  key={i}
                  className="berlian"
                  style={{ left: `${Math.min(98, (k.t / Math.max(l.durasi, 0.001)) * 100)}%` }}
                />
              ))}
            </button>
          </div>
        ))}
        {proyek.layers.length === 0 && <p className="petunjuk-kosong">{t('editor.pilihLayer')}</p>}
        <div className="playhead garis" style={{ left: `${(playhead / proyek.durasi) * 100}%` }} />
      </div>
    </div>
  );
}
