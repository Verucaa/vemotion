# VeMotion

Editor video Android (Capacitor + React + TypeScript) untuk membuat video pendek
vertikal. Versi M1: teks-ke-video, klip 9:16, **motion graphics AI**, timeline dengan
keyframe, ekspor MP4 di perangkat. Tanpa iklan, tanpa langganan, tanpa akun wajib.

## Fitur M1

- Proyek lokal dengan rasio 9:16, 16:9, 1:1, 4:5 dan fps 1–60.
- Timeline layer teks/gambar/video/**bentuk**, properti transform, keyframe
  linear/easeInOut/easeOut/easeIn/backOut.
- Latar warna solid atau gradien (dua warna + sudut).
- Alur **Teks ke video**: 4 gaya animasi (Pop, Ketik, Subtitle, Naik).
- Alur **Klip 9:16**: impor video galeri, atur titik mulai dan durasi, crop tengah.
- Alur **Motion AI**: storyboard dari ide teks memakai kunci API pengguna (Gemini,
  OpenAI, OpenRouter, DeepSeek, Anthropic, atau endpoint kompatibel OpenAI). Hasil
  berupa adegan teks + bentuk + palet, langsung menjadi proyek yang bisa diedit.
  Tersedia contoh offline tanpa kunci.
- Ekspor MP4 (H.264) memakai WebCodecs + `mp4-muxer`, preset 720p/1080p/1440p/2160p.
- Antarmuka Indonesia (default) dan Inggris, pengalih di Pengaturan.

Belum termasuk: audio, subtitle otomatis, model AI lokal, galeri/backend, impor
Alight Motion. Lihat `/root/hypemotion-spec/SPEC.md` untuk rencana lengkap.

## Jalankan di web

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

## Menyiapkan AI (BYOK)

1. Buka **Pengaturan → AI motion graphics**.
2. Pilih penyedia (Gemini default), isi model, alamat API, dan kunci API.
3. Tekan **Uji koneksi**. Setelan tersimpan otomatis di perangkat.
4. Buka **Motion AI** dari Beranda, tulis ide, pilih gaya/durasi/rasio, lalu
   **Buat storyboard**. Tekan **Buat proyek dan buka editor** untuk mengedit hasil.

Tanpa kunci, tombol **Coba contoh tanpa AI** tetap menghasilkan storyboard offline.
Kunci API tidak pernah dikirim ke server VeMotion karena tidak ada backend.

## Build Android

Prasyarat: JDK 21, Android SDK (platform 36, build-tools), Gradle dari wrapper.

```bash
npm run build
npx cap sync android
npx cap open android       # atau:
cd android && ./gradlew assembleDebug
```

APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`.

Proyek Android memakai `applicationId com.vemotion.editor`, `versionName 0.1.0`,
`minSdk 24`, `targetSdk 36`. Ikon peluncur masih ikon bawaan Capacitor; ganti di
`android/app/src/main/res/mipmap-*` sebelum rilis.

## Build otomatis (GitHub Actions)

Workflow `.github/workflows/android.yml` berjalan saat push ke `main`, pull request,
tag `v*`, atau manual dari tab Actions. Alur: `npm ci` -> build web -> JDK 21 ->
Android SDK 36 -> `cap sync` -> Gradle.

Hasil unduhan di halaman run (artifact):

- `vemotion-debug`: APK debug, selalu dibuat, ditandatangani debug key, bisa dipasang
  langsung untuk uji.
- `vemotion-release`: APK + AAB rilis, hanya dibuat bila keempat secret signing ada.

Secret yang perlu diisi di Settings -> Secrets and variables -> Actions:

| Secret | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | hasil `base64 -w0 rilis.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | password keystore |
| `ANDROID_KEY_ALIAS` | alias kunci |
| `ANDROID_KEY_PASSWORD` | password kunci |

Buat keystore sekali, simpan di tempat aman, jangan commit:

```bash
keytool -genkeypair -v -keystore rilis.jks -alias vemotion \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 rilis.jks
```

Rilis bertag memakai nama tag sebagai `versionName` (tanpa awalan `v`) dan nomor run
sebagai `versionCode`:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

Catatan: workflow menganggap root repo adalah folder ini (`/root/vemotion`). Jika
di-push sebagai subfolder, sesuaikan `working-directory` dan path artifact.

## Batasan M1 yang diketahui

- Audio belum diekspor. Video MP4 hanya berisi track video.
- Media video disimpan sebagai object URL sesi. Setelah aplikasi ditutup, impor
  ulang berkasnya. Gambar disimpan sebagai data URL dan ikut tersimpan.
- AI memakai kunci API pengguna yang disimpan sebagai teks biasa di `localStorage`.
  Permintaan dikirim langsung dari perangkat ke penyedia; tidak ada backend VeMotion.
  Jangan pakai kunci dengan akses akun penuh.
- AI hanya menyusun teks/gerak/palet. Tidak ada unggah media, pembuatan gambar, atau
  kloning suara.
- Ekspor bergantung pada dukungan `VideoEncoder` (WebView/Chrome modern). Jika
  tidak ada, aplikasi menampilkan pesan, bukan crash.
- Tombol unduh memakai unduhan browser; di Android native perlu ditambah
  penyimpanan ke galeri lewat plugin Filesystem/MediaStore pada iterasi berikut.
- Kuota `localStorage` (~5 MB) membatasi proyek dengan banyak gambar besar.

## Struktur

```
src/
  skema/proyek.ts      skema Zod, preset ekspor, pabrik proyek/layer/bentuk
  inti/                store (undo/redo), keyframe, render, ekspor, penyimpanan
  inti/ai/             skema storyboard, penyedia BYOK, generator proyek
  intl/                kamus id/en dan provider bahasa
  komponen/            Pratinjau, Timeline, PanelProperti
  halaman/             Beranda, Editor, TeksKeVideo, Klip, AI, Pengaturan
android/               proyek Capacitor (dibuat dengan cap add android)
```

## Lisensi pihak ketiga

Lihat `docs/LISENSI-PIHAK-KETIGA.md`.
