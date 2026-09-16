// Synthetic audio source (no sourced track — no licensing question) feeding
// an AnalyserNode the visualizer reads every frame. Swap `createSource` for
// a real <audio>/MediaElementAudioSourceNode later without touching the
// visualizer at all — it only ever asks the engine for frequency data.

let audioCtx = null;
let analyser = null;
let sourceNodes = null;
let playing = false;

const FFT_SIZE = 256;

function buildSyntheticSource(ctx) {
  // A low sustained tone (stands in for a bass-heavy mix)...
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 82; // low E, roughly

  // Slow pitch/amplitude wobble so the visualizer has movement to react to
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 18;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  // ...plus filtered noise (stands in for cymbals/texture)
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 3000;

  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.18;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.05;

  osc.connect(oscGain);
  noise.connect(noiseFilter).connect(noiseGain);

  const merge = ctx.createGain();
  oscGain.connect(merge);
  noiseGain.connect(merge);

  return { merge, nodes: [osc, lfo, noise] };
}

export function initAudioEngine() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = FFT_SIZE;

  const { merge, nodes } = buildSyntheticSource(audioCtx);
  merge.connect(analyser);
  // Deliberately not connected to destination at full volume by default —
  // connect on play() so nothing sounds until the visitor opts in.
  sourceNodes = { merge, nodes };
}

export async function toggleAudio() {
  if (!audioCtx) initAudioEngine();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  if (!playing) {
    sourceNodes.nodes.forEach((n) => {
      try {
        n.start();
      } catch {
        /* already started */
      }
    });
    sourceNodes.merge.connect(audioCtx.destination);
    playing = true;
  } else {
    sourceNodes.merge.disconnect(audioCtx.destination);
    playing = false;
  }
  return playing;
}

export function stopAudio() {
  if (!playing || !sourceNodes) return false;
  sourceNodes.merge.disconnect(audioCtx.destination);
  playing = false;
  return playing;
}

export function isPlaying() {
  return playing;
}

/** Returns a fresh Uint8Array of frequency-bin data (0–255 per bin). */
export function getFrequencyData() {
  if (!analyser) return null;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}
