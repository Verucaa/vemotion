import type { ReactNode } from 'react';
import { useEditor } from '../inti/store';
import { useT } from '../intl';
import type { Kunci } from '../intl/terjemahan';
import type { Easing } from '../skema/proyek';

const EASING_KUNCI: Record<Easing, Kunci> = {
  linear: 'easing.linear',
  easeInOut: 'easing.easeInOut',
  easeOut: 'easing.easeOut',
  easeIn: 'easing.easeIn',
  backOut: 'easing.backOut',
};

function Angka({
  label,
  nilai,
  onUbah,
  langkah = 1,
  min,
  max,
}: {
  label: string;
  nilai: number;
  onUbah: (n: number) => void;
  langkah?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="baris-angka">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(nilai) ? Number(nilai.toFixed(2)) : 0}
        step={langkah}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onUbah(n);
        }}
      />
    </label>
  );
}

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section className="bagian">
      <h3>{judul}</h3>
      {children}
    </section>
  );
}

export function PanelProperti() {
  const { t } = useT();
  const proyek = useEditor((s) => s.proyek);
  const pilih = useEditor((s) => s.pilih);
  const playhead = useEditor((s) => s.playhead);
  const ubahLayer = useEditor((s) => s.ubahLayer);
  const ubahTransform = useEditor((s) => s.ubahTransform);
  const tambahKeyframe = useEditor((s) => s.tambahKeyframe);
  const hapusKeyframe = useEditor((s) => s.hapusKeyframe);
  const hapusLayer = useEditor((s) => s.hapusLayer);

  const layer = proyek?.layers.find((l) => l.id === pilih);
  if (!proyek || !layer) return <p className="petunjuk-kosong">{t('editor.pilihLayer')}</p>;

  const teks = layer.teks;
  const bentuk = layer.bentuk;

  return (
    <div className="properti">
      <Bagian judul={layer.nama}>
        <label className="baris-angka">
          <span>{t('editor.mulai')}</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={Number(layer.mulai.toFixed(2))}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) ubahLayer(layer.id, (l) => (l.mulai = Math.max(0, v)));
            }}
          />
        </label>
        <label className="baris-angka">
          <span>{t('editor.durasi')}</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={Number(layer.durasi.toFixed(2))}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) ubahLayer(layer.id, (l) => (l.durasi = Math.max(0.1, v)));
            }}
          />
        </label>
        <label className="baris-centang">
          <input
            type="checkbox"
            checked={layer.tampil}
            onChange={(e) => ubahLayer(layer.id, (l) => (l.tampil = e.target.checked))}
          />
          {t('editor.tampil')}
        </label>
      </Bagian>

      <Bagian judul={t('editor.properti')}>
        <div className="dua-kolom">
          <Angka label="X" nilai={layer.transform.x} onUbah={(n) => ubahTransform(layer.id, { x: n })} />
          <Angka label="Y" nilai={layer.transform.y} onUbah={(n) => ubahTransform(layer.id, { y: n })} />
        </div>
        <div className="dua-kolom">
          <Angka
            label={t('editor.skala')}
            nilai={layer.transform.skala}
            langkah={0.05}
            onUbah={(n) => ubahTransform(layer.id, { skala: n })}
          />
          <Angka
            label={`${t('editor.rotasi')}°`}
            nilai={layer.transform.rotasi}
            onUbah={(n) => ubahTransform(layer.id, { rotasi: n })}
          />
        </div>
        <Angka
          label={t('editor.opacity')}
          nilai={layer.transform.opacity}
          langkah={0.05}
          min={0}
          max={1}
          onUbah={(n) => ubahTransform(layer.id, { opacity: Math.max(0, Math.min(1, n)) })}
        />
      </Bagian>

      {teks && (
        <Bagian judul={t('editor.teks.isi')}>
          <textarea
            value={teks.isi}
            rows={3}
            onChange={(e) => ubahLayer(layer.id, (l) => l.teks && (l.teks.isi = e.target.value))}
          />
          <div className="dua-kolom">
            <Angka
              label={t('editor.teks.ukuran')}
              nilai={teks.ukuran}
              min={6}
              max={400}
              onUbah={(n) => ubahLayer(layer.id, (l) => l.teks && (l.teks.ukuran = Math.max(6, Math.min(400, n))))}
            />
            <label className="baris-angka">
              <span>{t('editor.teks.warna')}</span>
              <input
                type="color"
                value={teks.warna}
                onChange={(e) => ubahLayer(layer.id, (l) => l.teks && (l.teks.warna = e.target.value))}
              />
            </label>
          </div>
          <div className="dua-kolom">
            <label className="baris-centang">
              <input
                type="checkbox"
                checked={teks.tebal}
                onChange={(e) => ubahLayer(layer.id, (l) => l.teks && (l.teks.tebal = e.target.checked))}
              />
              {t('editor.teks.tebal')}
            </label>
            <label className="baris-centang">
              <input
                type="checkbox"
                checked={teks.miring}
                onChange={(e) => ubahLayer(layer.id, (l) => l.teks && (l.teks.miring = e.target.checked))}
              />
              {t('editor.teks.miring')}
            </label>
          </div>
          <Angka
            label={t('editor.teks.strokeLebar')}
            nilai={teks.strokeLebar}
            min={0}
            max={40}
            onUbah={(n) => ubahLayer(layer.id, (l) => l.teks && (l.teks.strokeLebar = Math.max(0, Math.min(40, n))))}
          />
          <label className="baris-centang">
            <input
              type="checkbox"
              checked={teks.bayangan}
              onChange={(e) => ubahLayer(layer.id, (l) => l.teks && (l.teks.bayangan = e.target.checked))}
            />
            {t('editor.teks.bayangan')}
          </label>
        </Bagian>
      )}

      {bentuk && (
        <Bagian judul={t('editor.bentuk')}>
          <label className="baris-angka">
            <span>{t('editor.bentuk.jenis')}</span>
            <select
              value={bentuk.bentuk}
              onChange={(e) =>
                ubahLayer(layer.id, (l) => {
                  if (l.bentuk) l.bentuk.bentuk = e.target.value as typeof l.bentuk.bentuk;
                })
              }
            >
              <option value="kotak">{t('editor.bentuk.kotak')}</option>
              <option value="bulat">{t('editor.bentuk.bulat')}</option>
              <option value="garis">{t('editor.bentuk.garis')}</option>
            </select>
          </label>
          <label className="baris-centang">
            <input
              type="checkbox"
              checked={bentuk.isi !== 'transparan'}
              onChange={(e) =>
                ubahLayer(layer.id, (l) => {
                  if (l.bentuk) l.bentuk.isi = e.target.checked ? '#7c5cff' : 'transparan';
                })
              }
            />
            {t('editor.bentuk.isi')}
          </label>
          <div className="dua-kolom">
            <label className="baris-angka">
              <span>{t('editor.teks.warna')}</span>
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(bentuk.isi) ? bentuk.isi : '#7c5cff'}
                disabled={bentuk.isi === 'transparan'}
                onChange={(e) => ubahLayer(layer.id, (l) => l.bentuk && (l.bentuk.isi = e.target.value))}
              />
            </label>
            <label className="baris-angka">
              <span>{t('editor.bentuk.garisWarna')}</span>
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(bentuk.garisWarna) ? bentuk.garisWarna : '#ffffff'}
                onChange={(e) =>
                  ubahLayer(layer.id, (l) => l.bentuk && (l.bentuk.garisWarna = e.target.value))
                }
              />
            </label>
          </div>
          <div className="dua-kolom">
            <Angka
              label={t('editor.bentuk.lebar')}
              nilai={bentuk.lebar}
              min={1}
              max={4000}
              onUbah={(n) => ubahLayer(layer.id, (l) => l.bentuk && (l.bentuk.lebar = Math.max(1, n)))}
            />
            <Angka
              label={t('editor.bentuk.tinggi')}
              nilai={bentuk.tinggi}
              min={1}
              max={4000}
              onUbah={(n) => ubahLayer(layer.id, (l) => l.bentuk && (l.bentuk.tinggi = Math.max(1, n)))}
            />
          </div>
          <div className="dua-kolom">
            <Angka
              label={t('editor.bentuk.radius')}
              nilai={bentuk.radius}
              min={0}
              max={600}
              onUbah={(n) => ubahLayer(layer.id, (l) => l.bentuk && (l.bentuk.radius = Math.max(0, n)))}
            />
            <Angka
              label={t('editor.bentuk.garisLebar')}
              nilai={bentuk.garisLebar}
              min={0}
              max={60}
              onUbah={(n) =>
                ubahLayer(layer.id, (l) => l.bentuk && (l.bentuk.garisLebar = Math.max(0, Math.min(60, n))))
              }
            />
          </div>
        </Bagian>
      )}

      {(layer.tipe === 'gambar' || layer.tipe === 'video') && (
        <Bagian judul={t('editor.cocok')}>
          <select
            value={layer.cocok}
            onChange={(e) => ubahLayer(layer.id, (l) => (l.cocok = e.target.value as 'tutup' | 'muat'))}
          >
            <option value="tutup">{t('editor.cocok.tutup')}</option>
            <option value="muat">{t('editor.cocok.muat')}</option>
          </select>
          {layer.sumber?.startsWith('blob:') && <p className="peringatan">{t('editor.media.hilang')}</p>}
        </Bagian>
      )}

      <Bagian judul={t('editor.keyframe')}>
        <button type="button" className="tombol" onClick={() => tambahKeyframe(layer.id, Math.max(0, playhead - layer.mulai))}>
          {t('editor.tambahKeyframe')}
        </button>
        <ul className="daftar-keyframe">
          {layer.keyframes.map((k, i) => (
            <li key={i}>
              <span>{k.t.toFixed(2)}s</span>
              <select
                value={k.easing}
                aria-label={t('editor.easing')}
                onChange={(e) =>
                  ubahLayer(layer.id, (l) => {
                    const kf = l.keyframes[i];
                    if (kf) kf.easing = e.target.value as Easing;
                  })
                }
              >
                {(Object.keys(EASING_KUNCI) as Easing[]).map((e) => (
                  <option key={e} value={e}>
                    {t(EASING_KUNCI[e])}
                  </option>
                ))}
              </select>
              <button type="button" className="tautan" onClick={() => hapusKeyframe(layer.id, i)}>
                {t('umum.hapus')}
              </button>
            </li>
          ))}
          {layer.keyframes.length === 0 && <li className="redup">—</li>}
        </ul>
      </Bagian>

      <button type="button" className="tombol bahaya" onClick={() => hapusLayer(layer.id)}>
        {t('editor.hapusLayer')}
      </button>
    </div>
  );
}
