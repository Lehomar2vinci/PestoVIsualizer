// ====== Thèmes / Gammes ======
const THEMES = {
    Aurora: { rings: ['#22d3ee', '#60a5fa', '#a78bfa'], bars: '#22d3ee' },
    Sunset: { rings: ['#fb7185', '#f59e0b', '#f472b6'], bars: '#fb923c' },
    Neon: { rings: ['#22c55e', '#06b6d4', '#f43f5e'], bars: '#22c55e' },
    Candy: { rings: ['#f472b6', '#a78bfa', '#60a5fa'], bars: '#a78bfa' },
    Ocean: { rings: ['#38bdf8', '#34d399', '#bef264'], bars: '#38bdf8' }
};
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = {
    "Major (Ionian)": [0, 2, 4, 5, 7, 9, 11],
    "Minor (Aeolian)": [0, 2, 3, 5, 7, 8, 10],
    "Pentatonic Major": [0, 2, 4, 7, 9],
    "Pentatonic Minor": [0, 3, 5, 7, 10],
    "Blues": [0, 3, 5, 6, 7, 10],
    "Chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};
const midiToFreq = n => 440 * Math.pow(2, (n - 69) / 12);

// ====== État & DOM ======
const STORE_KEY = 'osctoy.xy.v2';
const defaults = {
    theme: 'Aurora', visualIntensity: 0.9, simpleMode: 'off',
    xy: { quantize: 'on', mode: 'amp+bright', glide: 0.04 },
    oscType: 'sawtooth', voices: 4, detuneCents: 7,
    baseFreq: 220, baseAmp: 0.6, resonance: 0.7, volume: 0.8,
    reverb: true, delay: true,
    musical: { scale: 'Pentatonic Major', root: 9 },
    visual: { showSpectrum: 'on', showOscillo: 'on', showParticles: 'on' }
};
const state = Object.assign({}, defaults, load());
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { } }
function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {} } catch { return {} } }

const $ = id => document.getElementById(id);
const els = {
    container: $('canvasContainer'),
    gate: $('gate'), startBtn: $('startBtn'),
    info: $('info'), controls: $('controls'),
    menu: $('menu'), menuBtn: $('menuBtn'),
    powerBtn: $('powerBtn'), powerLabel: $('powerLabel'),
    helpBtn: $('helpBtn'), help: $('help'),
    padBoard: $('padBoard'), pads: Array.from(document.querySelectorAll('#padBoard .pad')),
    theme: $('theme'), visualIntensity: $('visualIntensity'), simpleMode: $('simpleMode'),
    oscType: $('oscType'), voices: $('voices'), volume: $('volume'),
    baseFreq: $('baseFreq'), baseAmp: $('baseAmp'),
    resonance: $('resonance'), detune: $('detune'),
    quantize: $('quantize'), xyMode: $('xyMode'), glide: $('glide'),
    scale: $('scale'), root: $('root'),
    reverbBtn: $('reverbBtn'), delayBtn: $('delayBtn'),
    showSpectrum: $('showSpectrum'), showOscillo: $('showOscillo'), showParticles: $('showParticles'),
    resetBtn: $('resetBtn')
};

// ====== App exposée ======
let isOn = false, started = false;
let audioCtx = null, voices = [], voiceCount = +state.voices;
let busGain = null, waveShaper = null, reverbNode = null, delayNode = null, delayFeedback = null, delayTone = null;
let compressor = null, masterGain = null, analyser = null;
let xyVoice = null;
let lastParams = { freq: 0, amp: 0, cutoff: 0, active: false };

window.App = {
    els, state,
    getTheme() { return THEMES[state.theme] || THEMES.Aurora; },
    startAudio, togglePower,
    xyDown, xyMove, xyUp,
    triggerNote, releaseAnyVoice,
    getSpectrum, getWaveform, getLastParams: () => lastParams,
    isOn: () => isOn
};

// ====== UI helpers ======
function setToggle(btn, on, label) { if (!btn) return; btn.classList.toggle('on', on); btn.classList.toggle('off', !on); btn.setAttribute('aria-pressed', String(on)); btn.textContent = `${label} ${on ? 'On' : 'Off'}`; }
function applyStateToUI() {
    if (els.theme.options.length === 0) { Object.keys(THEMES).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k; els.theme.appendChild(o); }); }
    if (els.scale.options.length === 0) { Object.keys(SCALES).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k; els.scale.appendChild(o); }); }
    if (els.root.options.length === 0) { for (let i = 0; i < 12; i++) { const o = document.createElement('option'); o.value = i; o.textContent = NOTES[i]; els.root.appendChild(o); } }

    els.theme.value = state.theme; els.visualIntensity.value = state.visualIntensity; els.simpleMode.value = state.simpleMode;
    els.quantize.value = state.xy.quantize; els.xyMode.value = state.xy.mode; els.glide.value = state.xy.glide;
    els.oscType.value = state.oscType; els.voices.value = state.voices; els.detune.value = state.detuneCents;
    els.baseFreq.value = state.baseFreq; els.baseAmp.value = state.baseAmp; els.resonance.value = state.resonance; els.volume.value = state.volume;
    els.scale.value = state.musical.scale; els.root.value = state.musical.root;
    setToggle(els.reverbBtn, state.reverb, 'Réverb'); setToggle(els.delayBtn, state.delay, 'Delay');
    els.showSpectrum.value = state.visual.showSpectrum; els.showOscillo.value = state.visual.showOscillo; els.showParticles.value = state.visual.showParticles;
}
function drawControlsText() {
    const hint = state.simpleMode === 'on'
        ? 'Clique “Activer le son”, puis utilise les pads · M = marche/arrêt · H = aide'
        : 'Glisse dans le canvas : X→Hauteur (quantifiable), Y→Amplitude/Brillance · Pads : clique ou A…K';
    els.controls.innerHTML = hint;
}
function updateHUD(freq = 0, ampVal = 0) { els.info.textContent = `Fréquence : ${freq.toFixed?.(1) ?? 0} Hz | Amplitude : ${ampVal.toFixed?.(3) ?? 0}`; }

// ====== Audio chain ======
function makeImpulse(ctx, seconds = 2, decay = 2) {
    const rate = ctx.sampleRate, length = rate * seconds, impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) { const data = impulse.getChannelData(ch); for (let i = 0; i < length; i++) { data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay); } }
    return impulse;
}
function makeCurve(amount = 1.5) { const k = amount * 50, n = 44100, curve = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return curve; }

function rebuildFX() {
    if (!audioCtx) return;
    try { busGain.disconnect(); } catch (_) { }
    let node = busGain;

    if (!waveShaper) waveShaper = audioCtx.createWaveShaper();
    waveShaper.curve = makeCurve(1.2); waveShaper.oversample = '2x';
    node.connect(waveShaper); node = waveShaper;

    if (state.reverb) { reverbNode = audioCtx.createConvolver(); reverbNode.buffer = makeImpulse(audioCtx, 2.2, 2.6); node.connect(reverbNode); node = reverbNode; } else reverbNode = null;

    if (state.delay) {
        delayNode = audioCtx.createDelay(5.0); delayNode.delayTime.value = 0.25;
        delayFeedback = audioCtx.createGain(); delayFeedback.gain.value = 0.35;
        delayTone = audioCtx.createBiquadFilter(); delayTone.type = 'lowpass'; delayTone.frequency.value = 2000;
        node.connect(delayNode); delayNode.connect(delayTone); delayTone.connect(delayFeedback); delayFeedback.connect(delayNode);
        node = delayNode;
    } else { delayNode = delayFeedback = delayTone = null; }

    if (!compressor) { compressor = audioCtx.createDynamicsCompressor(); compressor.threshold.value = -6; compressor.knee.value = 20; compressor.ratio.value = 12; }
    if (!masterGain) { masterGain = audioCtx.createGain(); masterGain.gain.value = isOn ? state.volume : 0; }
    if (!analyser) { analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.82; }

    node.connect(compressor); compressor.connect(masterGain); masterGain.connect(analyser); analyser.connect(audioCtx.destination);
}

// ====== Voice (supersaw douce) ======
class Voice {
    constructor() {
        this.mix = audioCtx.createGain();
        this.filter = audioCtx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.Q.value = state.resonance;
        this.amp = audioCtx.createGain();
        this.mix.connect(this.filter); this.filter.connect(this.amp); this.amp.connect(busGain);
        this.osc = []; this.setOscillators();
    }
    setOscillators() {
        this.osc.forEach(o => { try { o.stop(); o.disconnect(); } catch (_) { } }); this.osc = [];
        const cents = state.detuneCents, offs = [-cents, 0, +cents];
        for (const c of offs) { const o = audioCtx.createOscillator(); o.type = state.oscType; o.detune.value = c; o.connect(this.mix); o.start(); this.osc.push(o); }
    }
    setFreq(freq, glide = 0.04) { const now = audioCtx.currentTime; for (const o of this.osc) { o.frequency.cancelScheduledValues(now); o.frequency.setTargetAtTime(freq, now, Math.max(0.001, glide)); } }
    setCutoff(freq, gl = 0.02) { const now = audioCtx.currentTime, f = this.filter.frequency; f.cancelScheduledValues(now); f.setTargetAtTime(freq, now, gl); }
    setAmp(level, gl = 0.02) { const now = audioCtx.currentTime, g = this.amp.gain; g.cancelScheduledValues(now); g.setTargetAtTime(level, now, gl); }
    noteOn(freq, vel, cutoff) {
        this.setFreq(freq, 0.005); this.filter.Q.value = state.resonance;
        const peak = Math.min(1, state.baseAmp * vel);
        const now = audioCtx.currentTime, g = this.amp.gain;
        g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(peak, now + 0.01); g.linearRampToValueAtTime(peak * 0.85, now + 0.10);
        this.setCutoff(cutoff + 600, 0.015); this.setCutoff(cutoff, 0.06);
    }
    noteUpdate(freq, vel, cutoff, gl) { this.setFreq(freq, Math.max(0.001, gl)); this.setAmp(Math.min(1, state.baseAmp * vel), 0.02); this.setCutoff(cutoff, 0.04); }
    noteOff() { const now = audioCtx.currentTime, g = this.amp.gain; g.cancelScheduledValues(now); g.setTargetAtTime(0.0001, now, 0.12); }
}

// ====== Boot & power ======
async function startAudio() {
    if (started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext; audioCtx = new Ctx();
    busGain = audioCtx.createGain(); busGain.gain.value = 1;
    rebuildFX(); rebuildVoices();
    started = true; hideGate(); togglePower(true);

    // bip test
    const osc = audioCtx.createOscillator(), g = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.value = 440; g.gain.value = 0; osc.connect(g).connect(busGain); osc.start();
    const now = audioCtx.currentTime; g.gain.linearRampToValueAtTime(0.18, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22); osc.stop(now + 0.25);
}
function togglePower(on) {
    isOn = (on ?? !isOn);
    els.powerBtn?.classList.toggle('on', isOn); els.powerBtn?.classList.toggle('off', !isOn);
    els.powerBtn?.setAttribute('aria-pressed', String(isOn));
    if (els.powerLabel) els.powerLabel.textContent = isOn ? 'On' : 'Off';
    if (masterGain && audioCtx) masterGain.gain.linearRampToValueAtTime(isOn ? state.volume : 0, audioCtx.currentTime + 0.05);
}
function rebuildVoices() {
    voices.forEach(v => { try { v.amp.disconnect(); v.filter.disconnect(); v.mix.disconnect(); v.osc.forEach(o => { o.stop(); o.disconnect(); }); } catch (_) { } });
    voices = []; for (let i = 0; i < voiceCount; i++) voices.push(new Voice()); if (xyVoice) xyVoice = new Voice();
}

// ====== XY mapping ======
function hzFromX(x) {
    if (state.xy.quantize === 'on') {
        const scale = SCALES[state.musical.scale], root = +state.musical.root;
        const idx = Math.floor(x * scale.length), deg = scale[Math.max(0, Math.min(scale.length - 1, idx))];
        const midiBase = 69 + Math.round(12 * Math.log2(state.baseFreq / 440));
        const midi = midiBase + root + deg + 12 * Math.floor(x * 2);
        return midiToFreq(midi);
    } else {
        const min = state.baseFreq / 2, max = state.baseFreq * 4; return min * Math.pow(max / min, x);
    }
}
function paramsFromXY(x, y) {
    const amp = 0.06 + (1 - y) * 0.94;
    const bright = 300 + (1 - y) * 4200;
    let ampOut = state.baseAmp, cutoffOut = 1400;
    if (state.xy.mode === 'amp+bright') { ampOut = amp; cutoffOut = bright; }
    else if (state.xy.mode === 'amp') { ampOut = amp; }
    else if (state.xy.mode === 'bright') { cutoffOut = bright; }
    return { freq: hzFromX(x), amp: ampOut, cutoff: cutoffOut };
}
function setAccentFromFreq(freq) { const midi = 69 + 12 * Math.log2(freq / 440); const hue = ((Math.round(midi) % 12) / 12) * 360; document.documentElement.style.setProperty('--ring', `hsla(${hue}, 85%, 62%, .35)`); }

// ====== XY public API ======
function xyDown(x, y) { if (!started) return; if (!xyVoice) xyVoice = new Voice(); const p = paramsFromXY(x, y); xyVoice.noteOn(p.freq, p.amp, p.cutoff); lastParams = { ...p, active: true }; setAccentFromFreq(p.freq); updateHUD(p.freq, p.amp); }
function xyMove(x, y) { if (!started || !xyVoice) return; const p = paramsFromXY(x, y); xyVoice.noteUpdate(p.freq, p.amp, p.cutoff, state.xy.glide); lastParams = { ...p, active: true }; setAccentFromFreq(p.freq); updateHUD(p.freq, p.amp); }
function xyUp() { if (!started || !xyVoice) return; xyVoice.noteOff(); lastParams.active = false; }

// ====== Pads ======
let voiceIndex = 0;
function triggerNote(freq, vel = 0.9) { if (!started) return; const v = voices[voiceIndex++ % voices.length]; v.noteOn(freq, vel, 1600); setAccentFromFreq(freq); }
function releaseAnyVoice() { if (!started || !voices.length) return; const idx = (voiceIndex - 1 + voices.length) % voices.length; voices[idx].noteOff(); }
function padFreq(i) {
    const sc = SCALES[state.musical.scale], root = +state.musical.root; const deg = sc[i % sc.length], oct = Math.floor(i / sc.length);
    const midiBase = 69 + Math.round(12 * Math.log2(state.baseFreq / 440));
    return midiToFreq(midiBase + root + deg + 12 * oct);
}
function refreshPads() {
    els.pads.forEach((pad, i) => {
        const f = padFreq(i); const midi = Math.round(69 + 12 * Math.log2(f / 440)); pad.textContent = NOTES[(midi % 12 + 12) % 12];
        const t = THEMES[state.theme]; pad.style.setProperty('--c1', t.rings[i % t.rings.length]); pad.style.setProperty('--c2', t.rings[(i + 1) % t.rings.length]);
    });
}

// ====== Analyse ======
function getSpectrum() { if (!analyser) return []; const arr = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(arr); return Array.from(arr); }
function getWaveform() { if (!analyser) return []; const arr = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(arr); return Array.from(arr, v => (v - 128) / 128); }

// ====== Menu / Aide / Gate ======
function toggleMenu(show) { if (!els.menu) return; const willShow = show ?? (els.menu.style.display !== 'flex'); els.menu.style.display = willShow ? 'flex' : 'none'; els.menuBtn?.setAttribute('aria-expanded', String(willShow)); if (willShow) closeHelp(true); }
function openHelp() { if (!els.help) return; try { if (typeof els.help.showModal === 'function') { els.help.open ? els.help.close() : els.help.showModal(); } else { els.help.classList.toggle('open'); } } catch { els.help.classList.add('open'); } }
function closeHelp(force = false) { if (!els.help) return; try { if (typeof els.help.close === 'function' && (force || els.help.open)) els.help.close(); els.help.classList.remove('open'); } catch { } }
function hideGate() { if (els.gate) { els.gate.style.display = 'none'; els.gate.setAttribute('aria-hidden', 'true'); } }

// ====== Wiring UI ======
function wireUI() {
    applyStateToUI(); drawControlsText(); refreshPads();

    els.startBtn?.addEventListener('click', async () => { await startAudio(); hideGate(); });

    els.menuBtn?.addEventListener('click', () => toggleMenu());
    els.helpBtn?.addEventListener('click', () => openHelp());
    els.powerBtn?.addEventListener('click', async () => { if (!started) await startAudio(); hideGate(); togglePower(); });

    // Clavier global
    window.addEventListener('keydown', async (e) => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        if (k === 'm') { e.preventDefault(); if (!started) await startAudio(); hideGate(); togglePower(); }
        else if (k === 'h') { e.preventDefault(); openHelp(); }
        else if (e.key === 'Escape') { toggleMenu(false); closeHelp(true); }
    });

    // Sliders & selects
    els.theme.addEventListener('change', e => { state.theme = e.target.value; save(); refreshPads(); });
    els.visualIntensity.addEventListener('input', e => { state.visualIntensity = +e.target.value; save(); });
    els.simpleMode.addEventListener('change', e => { state.simpleMode = e.target.value; save(); drawControlsText(); });

    els.quantize.addEventListener('change', e => { state.xy.quantize = e.target.value; save(); });
    els.xyMode.addEventListener('change', e => { state.xy.mode = e.target.value; save(); });
    els.glide.addEventListener('input', e => { state.xy.glide = +e.target.value; save(); });

    els.oscType.addEventListener('change', e => { state.oscType = e.target.value; save(); voices.forEach(v => v.setOscillators()); if (xyVoice) xyVoice.setOscillators(); });
    els.voices.addEventListener('input', e => { state.voices = voiceCount = +e.target.value; save(); if (started) rebuildVoices(); });
    els.detune.addEventListener('input', e => { state.detuneCents = +e.target.value; save(); voices.forEach(v => v.setOscillators()); if (xyVoice) xyVoice.setOscillators(); });

    els.baseFreq.addEventListener('input', e => { state.baseFreq = +e.target.value; save(); refreshPads(); });
    els.baseAmp.addEventListener('input', e => { state.baseAmp = +e.target.value; save(); });
    els.resonance.addEventListener('input', e => { state.resonance = +e.target.value; save(); voices.forEach(v => v.filter.Q.value = state.resonance); if (xyVoice) xyVoice.filter.Q.value = state.resonance; });
    els.volume.addEventListener('input', e => { state.volume = +e.target.value; save(); if (masterGain && audioCtx) masterGain.gain.linearRampToValueAtTime(state.volume, audioCtx.currentTime + 0.03); });

    els.scale.addEventListener('change', e => { state.musical.scale = e.target.value; save(); refreshPads(); });
    els.root.addEventListener('change', e => { state.musical.root = +e.target.value; save(); refreshPads(); });

    els.reverbBtn.addEventListener('click', () => { state.reverb = !state.reverb; save(); setToggle(els.reverbBtn, state.reverb, 'Réverb'); if (started) rebuildFX(); });
    els.delayBtn.addEventListener('click', () => { state.delay = !state.delay; save(); setToggle(els.delayBtn, state.delay, 'Delay'); if (started) rebuildFX(); });

    els.showSpectrum.addEventListener('change', e => { state.visual.showSpectrum = e.target.value; save(); });
    els.showOscillo.addEventListener('change', e => { state.visual.showOscillo = e.target.value; save(); });
    els.showParticles.addEventListener('change', e => { state.visual.showParticles = e.target.value; save(); });

    els.resetBtn.addEventListener('click', () => { Object.assign(state, defaults); save(); applyStateToUI(); if (started) { rebuildFX(); rebuildVoices(); } refreshPads(); drawControlsText(); });

    // Pads
    els.pads.forEach(pad => {
        pad.addEventListener('pointerdown', async (e) => { e.preventDefault(); if (!started) await startAudio(); hideGate(); if (!isOn) togglePower(true); pad.classList.add('playing'); const i = +pad.dataset.i; triggerNote(padFreq(i), 0.9); });
        const end = () => { pad.classList.remove('playing'); releaseAnyVoice(); };
        pad.addEventListener('pointerup', end); pad.addEventListener('pointerleave', end);
    });

    // Démarrage si clic n’importe où
    window.addEventListener('pointerdown', () => { if (!started) startAudio().then(hideGate); }, { once: true });
}
wireUI();
