import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// Gemini Layout Analysis Assistant endpoint (Optional assistance for complex layouts)
app.post('/api/gemini/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      available: false,
      message: 'GEMINI_API_KEY tidak dikonfigurasi. Deteksi lokal CV tetap berfungsi 100%.',
    });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Data gambar tidak disediakan' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Analisis struktur tata letak halaman manga ini untuk pemotongan panel horizontal.
Tujuan: Memotong halaman manga menjadi panel-panel individual tanpa pernah merusak atau memotong gambar di tengah karakter atau balon percakapan.

Aturan Pemotongan:
1. Jika ada 3 panel horizontal rapi yang dipisahkan ruang putih (gutter) horizontal jelas -> laporkan 3 panel horizontal (2 garis potong).
2. Jika ada 2 panel horizontal rapi yang dipisahkan ruang putih (gutter) horizontal jelas -> laporkan 2 panel horizontal (1 garis potong).
3. Jika ada panel pendek berdampingan dalam satu baris (tidak sampai lebar penuh) -> JANGAN memotong vertikal. Gabungkan dalam 1 strip baris horizontal.
4. Jika tidak ada batas horizontal yang jelas, panel bertumpuk, garis miring/diagonal, atau jika pemotongan berisiko membelah karakter -> laporkan halaman harus utuh (rule 4, suggestedCutRatios: []).

PENTING:
- Garis potong (suggestedCutRatios) HARUS berada tepat di dalam ruang putih kosong (gutter) antar-panel!
- JANGAN PERNAH menaruh garis potong melintasi kepala, badan karakter, atau balon kata!
- suggestedCutRatios adalah array float posisi Y vertikal bernilai antara 0.15 dan 0.85 (misalnya [0.38, 0.65]).

Berikan output JSON:
{
  "rule": 1 | 2 | 3 | 4,
  "ruleName": string,
  "suggestedCutRatios": number[],
  "confidenceScore": number,
  "notes": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/png',
                data: imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let resultJson = {};
    try {
      resultJson = JSON.parse(text);
    } catch {
      resultJson = { raw: text };
    }

    return res.json({
      available: true,
      analysis: resultJson,
    });
  } catch (err: any) {
    console.error('Gemini analysis error:', err);
    return res.status(500).json({
      available: false,
      error: err.message || 'Terjadi kesalahan saat memanggil Gemini API',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${port}`);
  });
}

startServer();
