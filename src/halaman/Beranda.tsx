import { useState } from 'react';
import { proyekBaru, type NamaRasio, type Proyek } from '../skema/proyek';
import { daftarProyek, hapusProyek } from '../inti/penyimpanan';
import { useT } from '../intl';

interface Props {
  onBuka: (p: Proyek) => void;
  onTeks: () => void;
  onKlip: () => void;
  onAi: () => void;
  onPengaturan: () => void;
}

export function Beranda({ onBuka, onTeks, onKlip, onAi, onPengaturan }: Props) {
  const { t } = useT();
  const [proyek, setProyek] = useState<Proyek[]>(() => daftarProyek());
  const [formBaru, setFormBaru] = useState(false);
  const [nama, setNama] = useState('Proyek baru');
  const [rasio, setRasio] = useState<NamaRasio>('9:16');
  const [fps, setFps] = useState(30);
  const [durasi, setDurasi] = useState(6);

  function segarkan() {
    setProyek(daftarProyek());
  }

  function buat() {
    const p = proyekBaru(nama.trim() || 'Proyek baru', rasio, fps, durasi);
    setFormBaru(false);
    onBuka(p);
  }

  return (
    <div className="layar">
      <header className="bilah">
        <h1>{t('app.nama')}</h1>
        <button type="button" className="ikon" onClick={onPengaturan} aria-label={t('nav.pengaturan')}>
          ⚙
        </button>
      </header>

      <div className="isi">
        <div className="aksi-cepat">
          <button type="button" className="kartu-aksi" onClick={() => setFormBaru(true)}>
            <strong>{t('beranda.baru')}</strong>
            <span>＋</span>
          </button>
          <button type="button" className="kartu-aksi" onClick={onTeks}>
            <strong>{t('beranda.teks')}</strong>
            <span>T</span>
          </button>
          <button type="button" className="kartu-aksi" onClick={onKlip}>
            <strong>{t('beranda.klip')}</strong>
            <span>9:16</span>
          </button>
          <button type="button" className="kartu-aksi" onClick={onAi}>
            <strong>{t('beranda.ai')}</strong>
            <span>✦</span>
          </button>
        </div>

        {formBaru && (
          <section className="kartu">
            <h2>{t('beranda.baru')}</h2>
            <label className="baris-angka">
              <span>{t('beranda.nama')}</span>
              <input value={nama} onChange={(e) => setNama(e.target.value)} />
            </label>
            <label className="baris-angka">
              <span>{t('beranda.rasio')}</span>
              <select value={rasio} onChange={(e) => setRasio(e.target.value as NamaRasio)}>
                <option value="9:16">9:16</option>
                <option value="16:9">16:9</option>
                <option value="1:1">1:1</option>
                <option value="4:5">4:5</option>
              </select>
            </label>
            <div className="dua-kolom">
              <label className="baris-angka">
                <span>{t('beranda.fps')}</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={fps}
                  onChange={(e) => setFps(Math.max(1, Math.min(60, Number(e.target.value) || 30)))}
                />
              </label>
              <label className="baris-angka">
                <span>{t('beranda.durasi')}</span>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={durasi}
                  onChange={(e) => setDurasi(Math.max(1, Math.min(600, Number(e.target.value) || 6)))}
                />
              </label>
            </div>
            <div className="dialog-aksi">
              <button type="button" className="tombol" onClick={() => setFormBaru(false)}>
                {t('umum.batal')}
              </button>
              <button type="button" className="tombol utama" onClick={buat}>
                {t('umum.buat')}
              </button>
            </div>
          </section>
        )}

        <h2>{t('beranda.judul')}</h2>
        {proyek.length === 0 && <p className="redup">{t('beranda.kosong')}</p>}
        <ul className="daftar-proyek">
          {proyek.map((p) => (
            <li key={p.id} className="baris-proyek">
              <button type="button" className="buka-proyek" onClick={() => onBuka(p)}>
                <strong>{p.nama}</strong>
                <span className="redup">
                  {p.lebar}×{p.tinggi} · {p.fps} fps · {p.durasi.toFixed(1)}s
                </span>
              </button>
              <button
                type="button"
                className="tautan bahaya"
                onClick={() => {
                  if (confirm(`${t('umum.hapus')} "${p.nama}"?`)) {
                    hapusProyek(p.id);
                    segarkan();
                  }
                }}
              >
                {t('umum.hapus')}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
