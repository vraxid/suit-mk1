// E.V.'s natural voice: the open Kokoro-82M model, running on this device in a worker so the 3D view stays smooth.
// The model (about 90 MB) downloads once from Hugging Face and is then kept in the browser's cache, so it works offline.
import { KokoroTTS, env } from './vendor/kokoro/kokoro.web.js';

env.wasmPaths = new URL('./vendor/kokoro/', self.location.href).href;

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let tts = null, loading = null, current = 0;

function load() {
  if (loading) return loading;
  const files = {};
  loading = KokoroTTS.from_pretrained(MODEL, {
    dtype: 'q8', device: 'wasm',
    progress_callback: p => {
      if (p.status !== 'progress' || !p.total) return;
      files[p.file] = [p.loaded, p.total];
      const v = Object.values(files), loaded = v.reduce((a, b) => a + b[0], 0), total = v.reduce((a, b) => a + b[1], 0);
      postMessage({ type: 'progress', loaded, total });
    },
  }).then(m => { tts = m; postMessage({ type: 'ready' }); return m; })
    .catch(e => { loading = null; postMessage({ type: 'error', message: String(e?.message || e) }); throw e; });
  return loading;
}

// speak one line: split into sentences and send each back as soon as it is ready, so she starts talking quickly
async function speak({ id, text, voice, speed }) {
  current = id;
  try { await load(); } catch (e) { return; }
  const parts = text.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) || [text];
  for (let i = 0; i < parts.length; i++) {
    if (current !== id) return;                      // a newer line interrupted this one
    try {
      const out = await tts.generate(parts[i], { voice, speed });
      if (current !== id) return;
      const data = out.audio;
      postMessage({ type: 'audio', id, i, last: i === parts.length - 1, rate: out.sampling_rate, data }, [data.buffer]);
    } catch (e) { postMessage({ type: 'error', id, message: String(e?.message || e) }); return; }
  }
}

onmessage = e => {
  const m = e.data;
  if (m.type === 'load') load().catch(() => {});
  else if (m.type === 'speak') speak(m);
  else if (m.type === 'stop') current = -1;
};
