// E.V.'s natural voice for anything that is not in her pre-recorded library (print job names, the other voices).
// It runs the open Kokoro-82M model on this device in a worker, so the 3D view stays smooth. The model (about 90 MB)
// downloads once from Hugging Face and is then kept in the browser's cache, so it also works offline.
import { KokoroTTS, env } from './vendor/kokoro/kokoro.web.js';

env.wasmPaths = new URL('./vendor/kokoro/', self.location.href).href;

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let tts = null, loading = null, queue = [], busy = false;

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

// one sentence at a time. Generating blocks this thread, so between sentences we hand control back for a moment;
// that lets a 'stop' (the line was interrupted) clear the queue before more work is wasted on it.
async function pump() {
  if (busy) return; busy = true;
  try { await load(); } catch (e) { queue.forEach(q => postMessage({ type: 'error', rid: q.rid, message: 'engine not loaded' })); queue = []; busy = false; return; }
  while (queue.length) {
    await new Promise(r => setTimeout(r, 0));
    const q = queue.shift(); if (!q) break;
    try {
      const out = await tts.generate(q.text, { voice: q.voice, speed: 1 });
      const data = out.audio;
      postMessage({ type: 'audio', rid: q.rid, rate: out.sampling_rate, data }, [data.buffer]);
    } catch (e) { postMessage({ type: 'error', rid: q.rid, message: String(e?.message || e) }); }
  }
  busy = false;
}

onmessage = e => {
  const m = e.data;
  if (m.type === 'load') load().catch(() => {});
  else if (m.type === 'gen') { queue.push(m); pump(); }
  else if (m.type === 'stop') queue = [];
};
