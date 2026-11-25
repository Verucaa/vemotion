export const ID_PENYEDIA = [
  'gemini',
  'openai',
  'openrouter',
  'deepseek',
  'anthropic',
  'custom',
] as const;
export type IdPenyedia = (typeof ID_PENYEDIA)[number];

export interface KonfigAI {
  penyedia: IdPenyedia;
  model: string;
  kunci: string;
  alamat: string;
}

export interface InfoPenyedia {
  nama: string;
  model: string;
  alamat: string;
  tautan?: string;
  catatan: string;
}

export const PENYEDIA: Record<IdPenyedia, InfoPenyedia> = {
  gemini: {
    nama: 'Google Gemini',
    model: 'gemini-2.5-flash',
    alamat: 'https://generativelanguage.googleapis.com',
    tautan: 'https://aistudio.google.com/apikey',
    catatan: 'Kunci gratis dari Google AI Studio. Kualitas JSON paling stabil.',
  },
  openai: {
    nama: 'OpenAI',
    model: 'gpt-4o-mini',
    alamat: 'https://api.openai.com/v1',
    tautan: 'https://platform.openai.com/api-keys',
    catatan: 'Butuh saldo API. Model murah cukup untuk storyboard.',
  },
  openrouter: {
    nama: 'OpenRouter',
    model: 'google/gemini-2.5-flash',
    alamat: 'https://openrouter.ai/api/v1',
    tautan: 'https://openrouter.ai/keys',
    catatan: 'Satu kunci untuk banyak model. Bisa pilih model apa pun.',
  },
  deepseek: {
    nama: 'DeepSeek',
    model: 'deepseek-chat',
    alamat: 'https://api.deepseek.com',
    tautan: 'https://platform.deepseek.com/api_keys',
    catatan: 'Murah dan cepat. Kualitas bahasa Indonesia memadai.',
  },
  anthropic: {
    nama: 'Anthropic Claude',
    model: 'claude-sonnet-4-5',
    alamat: 'https://api.anthropic.com',
    tautan: 'https://console.anthropic.com/settings/keys',
    catatan: 'Diminta langsung dari browser. Akun harus mengizinkan akses browser.',
  },
  custom: {
    nama: 'OpenAI-compatible',
    model: '',
    alamat: '',
    catatan: 'Untuk server sendiri: LM Studio, Ollama, vLLM, atau gateway lain.',
  },
};

export const KONFIG_AI_KOSONG: KonfigAI = {
  penyedia: 'gemini',
  model: PENYEDIA.gemini.model,
  kunci: '',
  alamat: PENYEDIA.gemini.alamat,
};

export type KodeGalatAI = 'kunci' | 'kuota' | 'jaringan' | 'format' | 'penyedia' | 'kosong';

export class GalatAI extends Error {
  kode: KodeGalatAI;

  constructor(kode: KodeGalatAI, pesan: string) {
    super(pesan);
    this.name = 'GalatAI';
    this.kode = kode;
  }
}

interface Permintaan {
  sistem: string;
  pengguna: string;
  skemaGemini?: unknown;
  suhu?: number;
  maksToken?: number;
}

function alamatDasar(konfig: KonfigAI): string {
  const alamat = (konfig.alamat || PENYEDIA[konfig.penyedia].alamat).trim();
  if (!alamat) throw new GalatAI('penyedia', 'Alamat API belum diisi.');
  return alamat.replace(/\/+$/, '');
}

function pesanDariBadan(teks: string): string {
  if (!teks) return '';
  try {
    const data = JSON.parse(teks) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
  } catch {
    // bukan JSON
  }
  return teks.slice(0, 240);
}

function galatHttp(status: number, badan: string): GalatAI {
  const pesan = pesanDariBadan(badan) || `HTTP ${status}`;
  if (status === 401 || status === 403) {
    return new GalatAI('kunci', `Kunci API ditolak. Periksa kembali. (${pesan})`);
  }
  if (status === 404) {
    return new GalatAI('penyedia', `Model atau alamat tidak ditemukan. (${pesan})`);
  }
  if (status === 429) {
    return new GalatAI('kuota', `Kuota atau batas laju tercapai. Coba lagi nanti. (${pesan})`);
  }
  return new GalatAI('penyedia', `Penyedia menolak permintaan. (${pesan})`);
}

async function minta(url: string, init: RequestInit): Promise<Response> {
  const kontrol = new AbortController();
  const jam = setTimeout(() => kontrol.abort(), 90_000);
  try {
    return await fetch(url, { ...init, signal: kontrol.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new GalatAI('jaringan', 'Waktu habis. Koneksi ke penyedia terlalu lama.');
    }
    throw new GalatAI('jaringan', 'Tidak bisa menghubungi penyedia. Periksa internet atau alamat API.');
  } finally {
    clearTimeout(jam);
  }
}

async function mintaGemini(konfig: KonfigAI, req: Permintaan): Promise<string> {
  const dasar = alamatDasar(konfig);
  const akar = /\/v1beta$/.test(dasar) ? dasar : `${dasar}/v1beta`;
  const url = `${akar}/models/${encodeURIComponent(konfig.model)}:generateContent?key=${encodeURIComponent(konfig.kunci)}`;
  const generationConfig: Record<string, unknown> = {
    temperature: req.suhu ?? 0.9,
    maxOutputTokens: req.maksToken ?? 4096,
    responseMimeType: 'application/json',
  };
  if (req.skemaGemini) generationConfig.responseSchema = req.skemaGemini;

  const res = await minta(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.sistem }] },
      contents: [{ role: 'user', parts: [{ text: req.pengguna }] }],
      generationConfig,
      safetySettings: [
        'HARM_CATEGORY_HARASSMENT',
        'HARM_CATEGORY_HATE_SPEECH',
        'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'HARM_CATEGORY_DANGEROUS_CONTENT',
      ].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
    }),
  });

  const badan = await res.text();
  if (!res.ok) throw galatHttp(res.status, badan);

  let data: {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
    promptFeedback?: { blockReason?: string };
  };
  try {
    data = JSON.parse(badan);
  } catch {
    throw new GalatAI('format', 'Balasan penyedia bukan JSON.');
  }

  const bagian = data.candidates?.[0]?.content?.parts ?? [];
  const teks = bagian.map((p) => p.text ?? '').join('').trim();
  if (!teks) {
    const blok = data.promptFeedback?.blockReason;
    throw new GalatAI('penyedia', blok ? `Permintaan diblokir: ${blok}.` : 'Penyedia mengembalikan balasan kosong.');
  }
  return teks;
}

async function mintaOpenAI(
  konfig: KonfigAI,
  req: Permintaan,
  pakaiFormatJson: boolean,
): Promise<{ res: Response; badan: string }> {
  const dasar = alamatDasar(konfig);
  const url = /\/v\d+$/.test(dasar) ? `${dasar}/chat/completions` : `${dasar}/v1/chat/completions`;
  const isi: Record<string, unknown> = {
    model: konfig.model,
    messages: [
      { role: 'system', content: req.sistem },
      { role: 'user', content: req.pengguna },
    ],
    temperature: req.suhu ?? 0.9,
    max_tokens: req.maksToken ?? 4096,
  };
  if (pakaiFormatJson) isi.response_format = { type: 'json_object' };

  const res = await minta(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${konfig.kunci}`,
    },
    body: JSON.stringify(isi),
  });
  const badan = await res.text();
  return { res, badan };
}

function bacaOpenAI(badan: string): string {
  let data: { choices?: { message?: { content?: string | { type?: string; text?: string }[] } }[] };
  try {
    data = JSON.parse(badan);
  } catch {
    throw new GalatAI('format', 'Balasan penyedia bukan JSON.');
  }
  const isi = data.choices?.[0]?.message?.content;
  let teks = '';
  if (typeof isi === 'string') teks = isi;
  else if (Array.isArray(isi)) teks = isi.map((b) => b.text ?? '').join('');
  teks = teks.trim();
  if (!teks) throw new GalatAI('kosong', 'Penyedia mengembalikan balasan kosong.');
  return teks;
}

async function mintaAnthropic(konfig: KonfigAI, req: Permintaan): Promise<string> {
  const dasar = alamatDasar(konfig);
  const url = /\/v\d+$/.test(dasar) ? `${dasar}/messages` : `${dasar}/v1/messages`;
  const res = await minta(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': konfig.kunci,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: konfig.model,
      max_tokens: req.maksToken ?? 4096,
      temperature: req.suhu ?? 0.9,
      system: req.sistem,
      messages: [{ role: 'user', content: req.pengguna }],
    }),
  });

  const badan = await res.text();
  if (!res.ok) throw galatHttp(res.status, badan);

  let data: { content?: { type?: string; text?: string }[] };
  try {
    data = JSON.parse(badan);
  } catch {
    throw new GalatAI('format', 'Balasan penyedia bukan JSON.');
  }
  const teks = (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
  if (!teks) throw new GalatAI('kosong', 'Penyedia mengembalikan balasan kosong.');
  return teks;
}

export async function panggilTeks(konfig: KonfigAI, req: Permintaan): Promise<string> {
  if (!konfig.kunci.trim()) throw new GalatAI('kunci', 'Kunci API belum diisi. Buka Pengaturan lalu isi kunci.');
  if (!konfig.model.trim()) throw new GalatAI('penyedia', 'Nama model belum diisi.');

  if (konfig.penyedia === 'gemini') return mintaGemini(konfig, req);
  if (konfig.penyedia === 'anthropic') return mintaAnthropic(konfig, req);

  const pertama = await mintaOpenAI(konfig, req, true);
  if (pertama.res.ok) return bacaOpenAI(pertama.badan);
  if (pertama.res.status === 400 && /response_format/i.test(pertama.badan)) {
    const kedua = await mintaOpenAI(konfig, req, false);
    if (kedua.res.ok) return bacaOpenAI(kedua.badan);
    throw galatHttp(kedua.res.status, kedua.badan);
  }
  throw galatHttp(pertama.res.status, pertama.badan);
}

export function ekstrakJson(teks: string): unknown {
  let isi = teks.trim();
  if (isi.startsWith('```')) {
    isi = isi.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
  }
  const awal = isi.indexOf('{');
  const akhir = isi.lastIndexOf('}');
  if (awal < 0 || akhir <= awal) {
    throw new GalatAI('format', 'Balasan AI tidak berisi JSON. Coba lagi.');
  }
  try {
    return JSON.parse(isi.slice(awal, akhir + 1));
  } catch {
    throw new GalatAI('format', 'JSON dari AI tidak valid. Coba lagi.');
  }
}

export async function ujiKoneksi(konfig: KonfigAI): Promise<void> {
  const teks = await panggilTeks(konfig, {
    sistem: 'Jawab hanya dengan JSON valid tanpa penjelasan.',
    pengguna: 'Balas dengan {"ok":true}.',
    suhu: 0,
    maksToken: 32,
  });
  const data = ekstrakJson(teks) as { ok?: boolean };
  if (data.ok !== true) throw new GalatAI('format', 'Balasan uji tidak dikenali. Koneksi mungkin tetap bekerja.');
}
