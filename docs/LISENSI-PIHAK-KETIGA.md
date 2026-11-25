# Lisensi pihak ketiga

Daftar dependensi runtime M1. Periksa ulang sebelum rilis publik.

| Paket | Versi | Lisensi | Catatan |
|---|---|---|---|
| react, react-dom | 19.x | MIT | UI |
| zustand | 5.x | MIT | State editor |
| zod | 4.x | MIT | Validasi skema proyek |
| mp4-muxer | 5.2.2 | MIT | Muxer MP4; hulu menyarankan migrasi ke Mediabunny (MPL-2.0) |
| @capacitor/core, app, filesystem, share, status-bar | 8.x | MIT | Jembatan native |
| vite, @vitejs/plugin-react | 8.x / 6.x | MIT | Build |
| typescript | 7.x | Apache-2.0 | Kompilasi |

Catatan:

- Tidak ada SDK iklan.
- Fitur Motion AI memanggil API penyedia pilihan pengguna (Gemini, OpenAI,
  OpenRouter, DeepSeek, Anthropic, atau endpoint kompatibel OpenAI) memakai kunci
  milik pengguna. Tidak ada backend VeMotion dan tidak ada model yang dibundel.
  Permintaan berisi ide teks pengguna; tinjau kebijakan privasi masing-masing
  penyedia sebelum rilis.
- Jika nanti memakai Whisper, MODNet, atau OpenVoice, tinjau lisensi bobot model
  sebelum distribusi.
- Aset ikon peluncur Android masih bawaan template Capacitor (MIT). Ganti dengan
  aset orisinal sebelum rilis.
- Jangan menyalin kode, aset, nama, atau ikon HypeMotion.
