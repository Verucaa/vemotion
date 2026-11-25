import { useEffect, useRef, useState } from 'react';
import type { NamaPreset, Proyek } from '../skema/proyek';
import { PRESET_EKSPOR, layerMedia, layerTeks } from '../skema/proyek';
import { useEditor } from '../inti/store';
import { useAset } from '../inti/useAset';
import { useT } from '../intl';
import { bacaSetelan, simpanProyek } from '../inti/penyimpanan';
import { EksporTidakDidukung, dukungEkspor, eksporMp4, hitungUkuran } from '../inti/ekspor';
import { Pratinjau } from '../komponen/Pratinjau';
import { Timeline } from '../komponen/Timeline';
import { PanelProperti } from '../komponen/PanelProperti';

interface Props {
  awal: Proyek;
  onKeluar: () => void;
}

function sisaDurasi(proyek: Proyek, playhead: number): { mulai: number; durasi: number } {
  const mulai = Math.max(0, Math.min(playhead, proyek.durasi - 0.5));
  return { mulai, durasi: Math.max(0.5, Math.min(4, proyek.durasi - mulai)) };
}

export function Editor({ awal, onKeluar }: Props) {
  const { t } = useT();
  const proyek = useEditor((s) => s.proyek);
  const pilih = useEditor((s) => s.pilih);
  const playhead = useEditor((s) => s.playhead);
  const main = useEditor((s) => s.main);
  const lali = useEditor((s) => s.lali);
  const depan = useEditor((s) => s.depan);
  const setPlayhead = useEditor((s) => s.setPlayhead);
  const setMain = useEditor((s) => s.setMain);
  const pilihLayer = useEditor((s) => s.pilihLayer);
  const tambahLayer = useEditor((s) => s.tambahLayer);
  const gantiNama = useEditor((s) => s.gantiNama);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);

  const aset = useAset(proyek);
  const [nama, setNama] = useState(awal.nama);
  const [dialogEkspor, setDialogEkspor] = useState(false);
  const [preset, setPreset] = useState<NamaPreset>(() => bacaSetelan().presetEkspor);
  const [progres, setProgres] = useState<{ n: number; total: number } | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const berkasGambar = useRef<HTMLInputElement>(null);
  const berkasVideo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    useEditor.getState().gantiProyek(awal);
  }, [awal]);

  useEffect(() => {
    if (!proyek) return;
    const id = setTimeout(() => simpanProyek(proyek), 400);
    return () => clearTimeout(id);
  }, [proyek]);

  useEffect(() => {
    if (!main || !proyek) return;
    let raf = 0;
    let terakhir = performance.now();
    let t = playhead;
    const langkah = (sekarang: number) => {
      const dt = (sekarang - terakhir) / 1000;
      terakhir = sekarang;
      t += dt;
      if (t >= proyek.durasi) {
        setPlayhead(proyek.durasi);
        setMain(false);
        return;
      }
      setPlayhead(t);
      raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main, proyek?.durasi]);

  if (!proyek) return null;

  const terpilih = proyek.layers.find((l) => l.id === pilih) ?? null;

  function tambahTeks() {
    if (!proyek) return;
    const { mulai, durasi } = sisaDurasi(proyek, playhead);
    tambahLayer(layerTeks('Teks baru', mulai, durasi));
  }

  async function imporBerkas(berkas: File, tipe: 'gambar' | 'video') {
    if (!proyek) return;
    const { mulai, durasi } = sisaDurasi(proyek, playhead);
    if (tipe === 'gambar') {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(berkas);
      });
      const layer = layerMedia('gambar', berkas.name, dataUrl, durasi);
      layer.mulai = mulai;
      tambahLayer(layer);
    } else {
      const objek = URL.createObjectURL(berkas);
      const layer = layerMedia('video', berkas.name, objek, Math.max(1, Math.min(durasi, 10)));
      layer.mulai = mulai;
      tambahLayer(layer);
    }
  }

  async function jalankanEkspor() {
    if (!proyek) return;
    setGalat(null);
    setUrl(null);
    const p = PRESET_EKSPOR[preset];
    if (!dukungEkspor()) {
      setGalat(t('ekspor.tidakDidukung'));
      return;
    }
    try {
      const blob = await eksporMp4(proyek, {
        sisiPendek: p.sisiPendek,
        fps: p.fps,
        bitrate: p.bitrate,
        onProgres: (n, total) => setProgres({ n, total }),
      });
      setProgres(null);
      setUrl(URL.createObjectURL(blob));
    } catch (e) {
      setProgres(null);
      if (e instanceof EksporTidakDidukung) setGalat(t('ekspor.tidakDidukung'));
      else if ((e as Error).message === 'DIBATALKAN') setGalat(t('umum.batal'));
      else setGalat(t('ekspor.gagal', { pesan: (e as Error)?.message ?? 'unknown' }));
    }
  }

  const ukuran = hitungUkuran(proyek, PRESET_EKSPOR[preset].sisiPendek);

  return (
    <div className="layar-editor">
      <header className="bilah">
        <button type="button" className="ikon" onClick={onKeluar} aria-label={t('umum.kembali')}>
          ←
        </button>
        <input
          className="nama-proyek"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          onBlur={() => gantiNama(nama.trim() || proyek.nama)}
          aria-label={t('beranda.nama')}
        />
        <button type="button" className="ikon" disabled={lali.length === 0} onClick={undo} title="Undo">
          ↶
        </button>
        <button type="button" className="ikon" disabled={depan.length === 0} onClick={redo} title="Redo">
          ↷
        </button>
        <button type="button" className="tombol utama" onClick={() => setDialogEkspor(true)}>
          {t('editor.ekspor')}
        </button>
      </header>

      <div className="area-editor">
        <div className="panggung">
          <Pratinjau proyek={proyek} playhead={playhead} aset={aset} main={main} />
          <div className="kontrol-main">
            <button type="button" className="ikon" onClick={() => setMain(!main)}>
              {main ? '⏸' : '▶'}
            </button>
            <input
              type="range"
              min={0}
              max={proyek.durasi}
              step={1 / proyek.fps}
              value={playhead}
              onChange={(e) => setPlayhead(Number(e.target.value))}
            />
            <span className="waktu">
              {playhead.toFixed(1)} / {proyek.durasi.toFixed(1)}s
            </span>
          </div>
        </div>
        <aside className="sisi">
          <PanelProperti />
        </aside>
      </div>

      <Timeline proyek={proyek} playhead={playhead} onSeek={setPlayhead} pilih={pilih} onPilih={pilihLayer} />

      <div className="baris-tambah">
        <button type="button" className="tombol" onClick={tambahTeks}>
          {t('editor.tambahTeks')}
        </button>
        <button type="button" className="tombol" onClick={() => berkasGambar.current?.click()}>
          {t('editor.tambahGambar')}
        </button>
        <button type="button" className="tombol" onClick={() => berkasVideo.current?.click()}>
          {t('editor.tambahVideo')}
        </button>
        <input
          ref={berkasGambar}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void imporBerkas(f, 'gambar');
            e.target.value = '';
          }}
        />
        <input
          ref={berkasVideo}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void imporBerkas(f, 'video');
            e.target.value = '';
          }}
        />
      </div>

      {terpilih && terpilih.sumber?.startsWith('blob:') && (
        <p className="peringatan">{t('editor.media.hilang')}</p>
      )}

      {dialogEkspor && (
        <div className="dialog-latar" onClick={() => !progres && setDialogEkspor(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>{t('ekspor.judul')}</h2>
            <label className="baris-angka">
              <span>{t('ekspor.preset')}</span>
              <select value={preset} onChange={(e) => setPreset(e.target.value as NamaPreset)} disabled={!!progres}>
                {(Object.keys(PRESET_EKSPOR) as NamaPreset[]).map((k) => (
                  <option key={k} value={k}>
                    {PRESET_EKSPOR[k].label} — {PRESET_EKSPOR[k].sisiPendek}p
                  </option>
                ))}
              </select>
            </label>
            <p className="redup">
              {ukuran.lebar}×{ukuran.tinggi} · {PRESET_EKSPOR[preset].fps} fps
            </p>
            <p className="redup">{t('ekspor.catatan')}</p>

            {progres && (
              <>
                <p>{t('ekspor.progres', { n: progres.n, total: progres.total })}</p>
                <div className="bar-progres">
                  <div style={{ width: `${(progres.n / progres.total) * 100}%` }} />
                </div>
              </>
            )}

            {galat && <p className="galat">{galat}</p>}
            {url && (
              <a className="tombol utama" href={url} download={`${nama || 'vemotion'}.mp4`}>
                {t('ekspor.unduh')}
              </a>
            )}

            <div className="dialog-aksi">
              <button type="button" className="tombol" onClick={() => setDialogEkspor(false)} disabled={!!progres}>
                {t('umum.tutup')}
              </button>
              <button type="button" className="tombol utama" onClick={() => void jalankanEkspor()} disabled={!!progres}>
                {t('ekspor.mulai')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
