import { useState } from 'react';
import type { Proyek } from './skema/proyek';
import { Beranda } from './halaman/Beranda';
import { Editor } from './halaman/Editor';
import { TeksKeVideo } from './halaman/TeksKeVideo';
import { Klip } from './halaman/Klip';
import { AI } from './halaman/AI';
import { Pengaturan } from './halaman/Pengaturan';

type Tampilan =
  | { nama: 'beranda' }
  | { nama: 'teks' }
  | { nama: 'klip' }
  | { nama: 'ai' }
  | { nama: 'pengaturan' }
  | { nama: 'editor'; proyek: Proyek };

export function App() {
  const [tampilan, setTampilan] = useState<Tampilan>({ nama: 'beranda' });

  switch (tampilan.nama) {
    case 'editor':
      return <Editor key={tampilan.proyek.id} awal={tampilan.proyek} onKeluar={() => setTampilan({ nama: 'beranda' })} />;
    case 'teks':
      return (
        <TeksKeVideo
          onKembali={() => setTampilan({ nama: 'beranda' })}
          onBuat={(p) => setTampilan({ nama: 'editor', proyek: p })}
        />
      );
    case 'klip':
      return (
        <Klip
          onKembali={() => setTampilan({ nama: 'beranda' })}
          onBuat={(p) => setTampilan({ nama: 'editor', proyek: p })}
        />
      );
    case 'ai':
      return (
        <AI
          onKembali={() => setTampilan({ nama: 'beranda' })}
          onBuat={(p) => setTampilan({ nama: 'editor', proyek: p })}
          onPengaturan={() => setTampilan({ nama: 'pengaturan' })}
        />
      );
    case 'pengaturan':
      return <Pengaturan />;
    default:
      return (
        <Beranda
          onBuka={(p) => setTampilan({ nama: 'editor', proyek: p })}
          onTeks={() => setTampilan({ nama: 'teks' })}
          onKlip={() => setTampilan({ nama: 'klip' })}
          onAi={() => setTampilan({ nama: 'ai' })}
          onPengaturan={() => setTampilan({ nama: 'pengaturan' })}
        />
      );
  }
}
