import { useState } from 'react';
import { useT } from '../intl';
import { PRESET_EKSPOR, type NamaPreset } from '../skema/proyek';
import { bacaSetelan, hapusSemuaProyek, simpanSetelan } from '../inti/penyimpanan';

export function Pengaturan() {
  const { bhs, setBhs, t } = useT();
  const [preset, setPreset] = useState<NamaPreset>(() => bacaSetelan().presetEkspor);
  const [pesan, setPesan] = useState<string | null>(null);

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
            Capacitor (MIT). Model AI tidak dibundel pada M1.
          </p>
        </section>
      </div>
    </div>
  );
}
