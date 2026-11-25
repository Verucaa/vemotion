import { useState } from 'react';
import { useT } from '../intl';
import { PRESET_EKSPOR, type NamaPreset } from '../skema/proyek';
import { bacaSetelan, hapusSemuaProyek, simpanSetelan } from '../inti/penyimpanan';
import {
  GalatAI,
  ID_PENYEDIA,
  PENYEDIA,
  ujiKoneksi,
  type IdPenyedia,
  type KonfigAI,
} from '../inti/ai/penyedia';

type StatusUji = { jenis: 'memuat' } | { jenis: 'ok' } | { jenis: 'galat'; pesan: string };

export function Pengaturan() {
  const { bhs, setBhs, t } = useT();
  const [preset, setPreset] = useState<NamaPreset>(() => bacaSetelan().presetEkspor);
  const [ai, setAi] = useState<KonfigAI>(() => bacaSetelan().ai);
  const [pesan, setPesan] = useState<string | null>(null);
  const [uji, setUji] = useState<StatusUji | null>(null);

  function ubahAI(p: Partial<KonfigAI>) {
    setAi((lama) => {
      const baru = { ...lama, ...p };
      simpanSetelan({ ...bacaSetelan(), ai: baru });
      return baru;
    });
    setPesan(t('pengaturan.tersimpan'));
    setUji(null);
  }

  function gantiPenyedia(id: IdPenyedia) {
    const info = PENYEDIA[id];
    ubahAI({ penyedia: id, model: info.model, alamat: info.alamat });
  }

  async function cekKoneksi() {
    setUji({ jenis: 'memuat' });
    try {
      await ujiKoneksi(ai);
      setUji({ jenis: 'ok' });
    } catch (e) {
      const pesanGalat = e instanceof GalatAI || e instanceof Error ? e.message : 'unknown';
      setUji({ jenis: 'galat', pesan: pesanGalat });
    }
  }

  const info = PENYEDIA[ai.penyedia];

  return (
    <div className="layar">
      <header className="bilah">
        <h1>{t('pengaturan.judul')}</h1>
      </header>
      <div className="isi sempit">
        <label className="kolom">
          <span>{t('pengaturan.bahasa')}</span>
          <select value={bhs} onChange={(e) => setBhs(e.target.value === 'en' ? 'en' : 'id')}>
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="kolom">
          <span>{t('pengaturan.preset')}</span>
          <select
            value={preset}
            onChange={(e) => {
              const nilai = e.target.value as NamaPreset;
              setPreset(nilai);
              simpanSetelan({ ...bacaSetelan(), presetEkspor: nilai });
              setPesan(t('pengaturan.tersimpan'));
            }}
          >
            {(Object.keys(PRESET_EKSPOR) as NamaPreset[]).map((k) => (
              <option key={k} value={k}>
                {PRESET_EKSPOR[k].label} — {PRESET_EKSPOR[k].sisiPendek}p / {PRESET_EKSPOR[k].fps}fps
              </option>
            ))}
          </select>
        </label>

        <section className="kartu">
          <h2>{t('pengaturan.ai')}</h2>

          <label className="kolom">
            <span>{t('pengaturan.ai.penyedia')}</span>
            <select value={ai.penyedia} onChange={(e) => gantiPenyedia(e.target.value as IdPenyedia)}>
              {ID_PENYEDIA.map((id) => (
                <option key={id} value={id}>
                  {PENYEDIA[id].nama}
                </option>
              ))}
            </select>
          </label>
          <p className="redup">{info.catatan}</p>

          <label className="kolom">
            <span>{t('pengaturan.ai.model')}</span>
            <input
              value={ai.model}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => ubahAI({ model: e.target.value })}
            />
          </label>

          <label className="kolom">
            <span>{t('pengaturan.ai.alamat')}</span>
            <input
              value={ai.alamat}
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
              onChange={(e) => ubahAI({ alamat: e.target.value })}
            />
          </label>

          <label className="kolom">
            <span>{t('pengaturan.ai.kunci')}</span>
            <input
              type="password"
              value={ai.kunci}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => ubahAI({ kunci: e.target.value })}
            />
          </label>

          <div className="dialog-aksi">
            {info.tautan && (
              <a className="tombol" href={info.tautan} target="_blank" rel="noreferrer">
                {t('pengaturan.ai.tautan')}
              </a>
            )}
            <button
              type="button"
              className="tombol"
              disabled={uji?.jenis === 'memuat'}
              onClick={() => void cekKoneksi()}
            >
              {uji?.jenis === 'memuat' ? t('pengaturan.ai.menguji') : t('pengaturan.ai.uji')}
            </button>
          </div>

          {uji?.jenis === 'ok' && <p className="redup">{t('pengaturan.ai.ok')}</p>}
          {uji?.jenis === 'galat' && <p className="galat">{t('pengaturan.ai.gagal', { pesan: uji.pesan })}</p>}

          <p className="peringatan">{t('pengaturan.ai.peringatan')}</p>
        </section>

        {pesan && <p className="redup">{pesan}</p>}

        <button
          type="button"
          className="tombol bahaya lebar"
          onClick={() => {
            if (confirm(t('pengaturan.hapusData.tanya'))) {
              hapusSemuaProyek();
              setPesan(t('beranda.dihapus'));
            }
          }}
        >
          {t('pengaturan.hapusData')}
        </button>

        <section className="kartu">
          <h2>{t('pengaturan.tentang')}</h2>
          <p>
            {t('app.nama')} · {t('pengaturan.versi')} 0.1.0
          </p>
          <p className="redup">
            {t('pengaturan.lisensi')}: React (MIT), Vite (MIT), Zod (MIT), Zustand (MIT), mp4-muxer (MIT),
            Capacitor (MIT). AI memakai API pihak ketiga dengan kunci milik pengguna.
          </p>
        </section>
      </div>
    </div>
  );
}
