import { useEffect, useMemo, useRef, useState } from 'react';
import { RASIO, type NamaRasio, type Proyek } from '../skema/proyek';
import { bacaSetelan } from '../inti/penyimpanan';
import { useT } from '../intl';
import type { Kunci } from '../intl/terjemahan';
import { GalatAI } from '../inti/ai/penyedia';
import { buatCeritaAI, ceritaKeProyek, contohCerita } from '../inti/ai/generator';
import { GAYA_AI, type CeritaAI, type GayaAI } from '../inti/ai/skema';
import { ASET_KOSONG, gambarFrame } from '../inti/render';

const GAYA_KUNCI: Record<GayaAI, Kunci> = {
  auto: 'ai.gaya.auto',
  tegas: 'ai.gaya.tegas',
  lembut: 'ai.gaya.lembut',
  retro: 'ai.gaya.retro',
  kinetik: 'ai.gaya.kinetik',
  minimal: 'ai.gaya.minimal',
};

function PratinjauMini({ proyek }: { proyek: Proyek }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const kanvas = ref.current;
    const ctx = kanvas?.getContext('2d');
    if (!kanvas || !ctx) return;
    if (kanvas.width !== proyek.lebar || kanvas.height !== proyek.tinggi) {
      kanvas.width = proyek.lebar;
      kanvas.height = proyek.tinggi;
    }
    gambarFrame(ctx, proyek, Math.min(1.1, proyek.durasi * 0.35), ASET_KOSONG);
  }, [proyek]);

  return <canvas ref={ref} className="pratinjau mini" aria-label={proyek.nama} />;
}

interface Props {
  onKembali: () => void;
  onBuat: (p: Proyek) => void;
  onPengaturan: () => void;
}

export function AI({ onKembali, onBuat, onPengaturan }: Props) {
  const { bhs, t } = useT();
  const [ide, setIde] = useState('');
  const [gaya, setGaya] = useState<GayaAI>('auto');
  const [durasi, setDurasi] = useState(30);
  const [rasio, setRasio] = useState<NamaRasio>('9:16');
  const [hasil, setHasil] = useState<CeritaAI | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);

  const setelan = useMemo(() => bacaSetelan(), []);
  const adaKunci = setelan.ai.kunci.trim().length > 0;

  const proyek = useMemo(
    () => (hasil ? ceritaKeProyek(hasil, { rasio, fps: 30 }) : null),
    [hasil, rasio],
  );

  async function buat() {
    const bersih = ide.trim();
    if (!bersih || memuat) return;
    setMemuat(true);
    setGalat(null);
    setHasil(null);
    try {
      const cerita = await buatCeritaAI(setelan.ai, bersih, {
        rasio,
        fps: 30,
        gaya,
        durasiTarget: durasi,
        bahasa: bhs,
      });
      setHasil(cerita);
    } catch (e) {
      const pesan = e instanceof GalatAI || e instanceof Error ? e.message : 'unknown';
      setGalat(t('ai.galat', { pesan }));
    } finally {
      setMemuat(false);
    }
  }

  function pakaiContoh() {
    setGalat(null);
    setHasil(contohCerita(bhs));
  }

  return (
    <div className="layar">
      <header className="bilah">
        <button type="button" className="ikon" onClick={onKembali} aria-label={t('umum.kembali')}>
          ←
        </button>
        <h1>{t('ai.judul')}</h1>
      </header>

      <div className="isi sempit">
        {!adaKunci && (
          <div className="kartu info-ai">
            <p className="peringatan">{t('ai.butuhKunci')}</p>
            <p className="redup">{t('ai.tanpaKunci')}</p>
            <button type="button" className="tombol" onClick={onPengaturan}>
              {t('ai.kePengaturan')}
            </button>
          </div>
        )}

        <label className="kolom">
          <span>{t('ai.ide')}</span>
          <textarea
            rows={3}
            value={ide}
            placeholder={t('ai.ide.contoh')}
            onChange={(e) => setIde(e.target.value)}
          />
        </label>

        <div className="dua-kolom">
          <label className="kolom">
            <span>{t('ai.gaya')}</span>
            <select value={gaya} onChange={(e) => setGaya(e.target.value as GayaAI)}>
              {GAYA_AI.map((g) => (
                <option key={g} value={g}>
                  {t(GAYA_KUNCI[g])}
                </option>
              ))}
            </select>
          </label>
          <label className="kolom">
            <span>{t('ai.durasi')}</span>
            <select value={durasi} onChange={(e) => setDurasi(Number(e.target.value))}>
              {[15, 30, 45, 60].map((d) => (
                <option key={d} value={d}>
                  {t('ai.detik', { n: d })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="kolom">
          <span>{t('ai.rasio')}</span>
          <select value={rasio} onChange={(e) => setRasio(e.target.value as NamaRasio)}>
            {(Object.keys(RASIO) as NamaRasio[]).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="tombol utama lebar"
          disabled={!ide.trim() || memuat || !adaKunci}
          onClick={() => void buat()}
        >
          {memuat ? t('ai.proses') : t('ai.buat')}
        </button>
        <button type="button" className="tombol lebar" disabled={memuat} onClick={pakaiContoh}>
          {t('ai.contoh')}
        </button>

        {galat && <p className="galat">{galat}</p>}

        {hasil && proyek && (
          <section className="kartu">
            <h2>{hasil.judul}</h2>
            <p className="redup">
              {t('ai.adegan', { n: hasil.adegan.length })} · {proyek.durasi.toFixed(1)}s · {rasio}
            </p>

            <PratinjauMini proyek={proyek} />

            <div className="baris-palet">
              <span>{t('ai.palet')}</span>
              {[hasil.palet.latar, hasil.palet.latar2, hasil.palet.teks, hasil.palet.aksen].map(
                (w, i) => (
                  <i key={i} className="contoh-warna" style={{ background: w }} title={w} />
                ),
              )}
            </div>

            <ol className="daftar-adegan">
              {hasil.adegan.map((a, i) => (
                <li key={i}>
                  <div>
                    <strong>{a.teks}</strong>
                    {a.subteks && <span className="redup">{a.subteks}</span>}
                  </div>
                  <span className="redup">
                    {a.durasi.toFixed(1)}s · {a.animasi}
                  </span>
                </li>
              ))}
            </ol>

            <button type="button" className="tombol utama lebar" onClick={() => onBuat(proyek)}>
              {t('ai.bukaEditor')}
            </button>
            {adaKunci && (
              <button type="button" className="tombol lebar" disabled={memuat} onClick={() => void buat()}>
                {t('ai.ulang')}
              </button>
            )}
          </section>
        )}

        <p className="redup">{t('ai.info')}</p>
      </div>
    </div>
  );
}
