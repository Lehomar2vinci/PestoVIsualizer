<<<<<<< Updated upstream
let fft, micInput;
const particles = [];
let baseHue = 0; // Base for changing background colors
let isParticlesEnabled = false;
let sensitivity = 2; // Frequency sensitivity

// Available color palettes
const palettes = {
  default: [
    [255, 50, 50],
    [50, 255, 50],
    [50, 50, 255],
  ],
  warm: [
    [255, 100, 0],
    [255, 50, 50],
    [255, 200, 0],
  ],
  cool: [
    [50, 200, 255],
    [100, 150, 255],
    [200, 50, 255],
  ],
  neon: [
    [57, 255, 20],
    [0, 255, 255],
    [255, 0, 255],
  ],
};
let currentPalette = palettes.default;

// Initialize microphone and FFT when the user clicks start
function startMic() {
  if (!micInput) {
    micInput = new p5.AudioIn();
    micInput.start();
    fft = new p5.FFT();
    fft.setInput(micInput);
    document.getElementById("startMicButton").style.display = "none";
  }
}

document.getElementById("startMicButton").addEventListener("click", startMic);

document.getElementById("sensitivity").addEventListener("input", (e) => {
  sensitivity = Number(e.target.value);
});
=======
/* listener.js — version corrigée (anti-doublons, unlockAudio)
   Fonctionne avec listener.html + p5/p5.js et p5/p5.sound.js (dossier "p5").
   Améliorations conservées : auto-gain, lissage FFT, beat basses, particules,
   mémorisation, réduction anim, raccourcis, ton de test, messages d’état. */

(() => {
  // ========================= Helpers statut & sécurité =========================
  const $ = (sel) => document.querySelector(sel);
  const ui = {
    startBtn: $('#startMicButton'),
    stopBtn: $('#stopAudioButton'),
    playPauseBtn: $('#playPauseButton'),
    toggleParticlesBtn: $('#toggleParticles'),
    sens: $('#sensitivity'),
    palette: $('#palette'),
    reduceMotionChk: $('#reduceMotion'),
    fileInput: $('#fileInput'),
    startToneBtn: $('#startToneButton'),
    statusEl: $('#status'),
  };
  function setStatus(msg) { if (ui.statusEl) ui.statusEl.textContent = msg || ''; }

  function checkSecureContext() {
    const ok = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!ok) {
      setStatus("⚠️ Le micro exige https/localhost. Servez la page via Live Server ou http(s), pas en file://");
    }
    return ok;
  }

  // ========================= Déverrouillage audio (remplace userStartAudio) =========================
  async function unlockAudio() {
    try {
      // Si p5.sound est chargé, getAudioContext existe
      let ctx = (typeof window.getAudioContext === 'function') ? window.getAudioContext() : null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return; // vieux navigateur ?
        // Évite de créer plusieurs contextes si déjà fourni par p5
        ctx = new AC();
      }
      if (ctx && ctx.state !== 'running') {
        await ctx.resume();
      }
    } catch (e) {
      console.warn('unlockAudio failed:', e);
    }
  }

  // ========================= État global =========================
  let fft, micInput, soundFile, osc;
  let particles = [];
  let isParticlesEnabled = true;
  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let sensitivity = 5;
  let currentPalette;

  const MAX_PARTICLES = 700;
  const SMOOTHING = 0.9;
  const SPECTRUM_BINS = 1024;
  const BG_FADE = 22;
>>>>>>> Stashed changes

  const palettes = {
    default: [[255, 50, 50], [50, 255, 50], [50, 50, 255]],
    warm: [[255, 100, 0], [255, 50, 50], [255, 200, 0]],
    cool: [[50, 200, 255], [100, 150, 255], [200, 50, 255]],
  };

  // ========================= Stockage réglages =========================
  const settingsKey = 'listener-settings-v2';
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      sensitivity = Number(s.sensitivity ?? 5);
      isParticlesEnabled = Boolean(s.isParticlesEnabled ?? true);
      reduceMotion = Boolean(s.reduceMotion ?? reduceMotion);
      currentPalette = palettes[s.palette] || palettes.default;
      return { palette: s.palette || 'default' };
    } catch {
      currentPalette = palettes.default;
      return { palette: 'default' };
    }
  }
  function saveSettings(extra = {}) {
    const existing = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    localStorage.setItem(settingsKey, JSON.stringify({
      ...existing,
      sensitivity,
      isParticlesEnabled,
      reduceMotion,
      palette: Object.entries(palettes).find(([, v]) => v === currentPalette)?.[0] || 'default',
      ...extra,
    }));
  }

<<<<<<< Updated upstream
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("visualization");
  colorMode(HSB); // 0-255 range for hue, saturation and brightness
  noStroke();
}

function draw() {
  // Animated background hue for a playful effect
  baseHue = (baseHue + 0.5) % 255;
  background(baseHue, 100, 40, 25);
=======
  // ========================= Audio helpers =========================
  function ensureFFT() {
    if (!fft) {
      if (!window.p5 || typeof p5.FFT !== 'function') {
        setStatus("❌ p5.FFT indisponible. Vérifiez que p5.sound est bien chargé après p5.");
        return;
      }
      fft = new p5.FFT(SMOOTHING, SPECTRUM_BINS);
    }
  }
  function stopMic() { if (micInput && micInput.enabled) micInput.stop(); }
  function stopSoundFile() { if (soundFile) soundFile.stop(); }
  function stopTestTone() {
    if (osc) { osc.stop(); osc.dispose?.(); osc = null; }
  }
  function soundLibReady() {
    return !!(window.p5 && typeof p5.AudioIn === 'function' && typeof p5.FFT === 'function');
  }

  // ========================= Auto-gain & Beat =========================
  let envAvg = 30;
  const envRise = 0.15;
  const envFall = 0.02;
  function autoGain(v) {
    const alpha = v > envAvg ? envRise : envFall;
    envAvg = envAvg * (1 - alpha) + v * alpha;
    const target = Math.max(20, envAvg);
    return target > 0 ? (v * (140 / target)) : v;
  }

  let beatAvg = 40;
  let lastBeat = 0;
  const beatThresh = 1.35;
  const beatCooldownMs = 140;
  function detectBeat(bassEnergy) {
    const now = performance.now();
    const alpha = bassEnergy > beatAvg ? 0.18 : 0.04;
    beatAvg = beatAvg * (1 - alpha) + bassEnergy * alpha;
    const isBeat = bassEnergy > beatAvg * beatThresh && (now - lastBeat) > beatCooldownMs;
    if (isBeat) lastBeat = now;
    return isBeat;
  }

  // ========================= Particules =========================
  class Particle {
    constructor(x, y, color, boost = 1) {
      this.x = x; this.y = y;
      const angle = random(TWO_PI);
      const speed = random(0.2, 2.2) * boost;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = random(4, 12) * (0.6 + boost * 0.4);
      this.alpha = 255;
      this.life = random(700, 1500);
      this.born = millis();
      this.color = color;
    }
    finished() { return this.alpha <= 0; }
    update() {
      this.vx *= 0.996; this.vy *= 0.996;
      this.x += this.vx; this.y += this.vy;
      const age = millis() - this.born;
      const k = constrain(1 - age / this.life, 0, 1);
      this.alpha = 255 * k;
    }
    show() {
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], this.alpha);
      ellipse(this.x, this.y, this.size);
    }
  }

  // ========================= p5 Sketch =========================
  function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('visualization');
    colorMode(RGB, 255);
    noStroke();
    frameRate(60);
    window.__p5canvasCreated = true;
  }
  window.setup = setup;

  function draw() {
    background(0, 0, 0, BG_FADE);
    const active = (micInput?.enabled || soundFile?.isPlaying() || !!osc) ?? false;

    if (!active || !fft) {
      // Message doux si aucune source
      push();
      noStroke();
      fill(255, 255, 255, 12);
      textAlign(CENTER, CENTER);
      textSize(16);
      text('Choisissez une source audio (Micro, Fichier, ou Ton de test).', width / 2, height / 2);
      pop();
      return;
    }
>>>>>>> Stashed changes

    fft.analyze();
    const rawEnergies = {
      bass: fft.getEnergy('bass'),
      lowMid: fft.getEnergy('lowMid'),
      mid: fft.getEnergy('mid'),
      highMid: fft.getEnergy('highMid'),
      treble: fft.getEnergy('treble'),
    };

<<<<<<< Updated upstream
    const energies = [
      fft.getEnergy("bass") * sensitivity,
      fft.getEnergy("lowMid") * sensitivity,
      fft.getEnergy("mid") * sensitivity,
      fft.getEnergy("highMid") * sensitivity,
      fft.getEnergy("treble") * sensitivity,
    ];

    // Drawing concentric circles
    energies.forEach((energy, i) => {
      const [r, g, b] = currentPalette[i % currentPalette.length];
      fill(r, g, b, map(energy, 0, 255, 50, 150));
      ellipse(width / 2, height / 2, map(energy, 0, 255, 100, 400));
    });

    // Adding particles
    if (isParticlesEnabled) {
      energies.forEach((energy, i) => {
        if (energy > 200) {
          particles.push(
            new Particle(
              random(width),
              random(height),
              currentPalette[i % currentPalette.length]
            )
          );
        }
      });
    }

    // Draw and update particles
=======
    const energies = Object.fromEntries(
      Object.entries(rawEnergies).map(([k, v]) => [k, autoGain(v) * (sensitivity / 5)])
    );

    const arr = Object.values(energies);
    const maxE = Math.max(1, ...arr);
    const norm = arr.map((e) => (e / maxE) * 255);

    // Cercles
    norm.forEach((energy, i) => {
      const [r, g, b] = currentPalette[i % currentPalette.length];
      fill(r, g, b, map(energy, 0, 255, 40, 170));
      const d = map(energy, 0, 255, width * 0.05, Math.min(width, height) * 0.92);
      ellipse(width / 2, height / 2, d);
    });

    // Particules
    if (isParticlesEnabled && !reduceMotion) {
      const beat = detectBeat(energies.bass);
      const boost = beat ? 1.9 : 1.0;
      norm.forEach((energy, i) => {
        const emit = Math.floor(map(constrain(energy, 0, 255), 0, 255, 0, beat ? 6 : 3));
        for (let k = 0; k < emit; k++) {
          particles.push(new Particle(
            random(width * 0.2, width * 0.8),
            random(height * 0.2, height * 0.8),
            currentPalette[i % currentPalette.length],
            boost
          ));
        }
      });
    }
    
>>>>>>> Stashed changes
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(); p.show();
      if (p.finished()) particles.splice(i, 1);
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
  }
  window.draw = draw;

  function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  window.windowResized = windowResized;

  // ========================= Ton de test =========================
  async function startTestTone() {
    try {
      stopMic(); stopSoundFile(); stopTestTone();
      await unlockAudio();
      if (!soundLibReady()) {
        setStatus("❌ p5.sound absent. Vérifiez l’inclusion de p5.sound.js après p5.js.");
        return;
      }
      ensureFFT();
      osc = new p5.Oscillator('sawtooth');
      osc.freq(110);
      osc.amp(0.18, 0.05);
      osc.start();
      fft.setInput(osc);
      setStatus("🔊 Ton de test actif (Stop pour couper).");
      ui.stopBtn.disabled = false;
      ui.playPauseBtn.disabled = true;
    } catch (e) {
      console.error(e);
      setStatus("❌ Échec ton de test (autoplay/permissions?).");
    }
  }

  // ========================= App & UI =========================
  function startApp() {
    checkSecureContext();
    setStatus("Prêt. Utilisez le micro, chargez un fichier, ou démarrez le ton de test.");

    const { palette } = loadSettings();
    ui.sens.value = String(sensitivity);
    ui.palette.value = palette;
    ui.toggleParticlesBtn.textContent = isParticlesEnabled ? 'Désactiver Particules' : 'Activer Particules';
    ui.toggleParticlesBtn.setAttribute('aria-pressed', String(isParticlesEnabled));
    ui.reduceMotionChk.checked = reduceMotion;

    // Sensibilité
    ui.sens.addEventListener('input', (e) => { sensitivity = Number(e.target.value); saveSettings(); });

    // Palette
    ui.palette.addEventListener('change', (e) => {
      const key = e.target.value;
      currentPalette = palettes[key] || palettes.default;
      saveSettings({ palette: key });
    });

    // Particules
    ui.toggleParticlesBtn.addEventListener('click', () => {
      isParticlesEnabled = !isParticlesEnabled;
      ui.toggleParticlesBtn.textContent = isParticlesEnabled ? 'Désactiver Particules' : 'Activer Particules';
      ui.toggleParticlesBtn.setAttribute('aria-pressed', String(isParticlesEnabled));
      saveSettings();
    });

    // Réduction animations
    ui.reduceMotionChk.addEventListener('change', (e) => { reduceMotion = e.target.checked; saveSettings(); });

    // Micro
    ui.startBtn.addEventListener('click', async () => {
      try {
        if (!soundLibReady()) {
          setStatus("❌ p5.sound absent. Vérifiez l’inclusion de p5.sound.js après p5.js.");
          alert("p5.sound non chargé — vérifiez vos <script>.");
          return;
        }
        stopSoundFile(); stopTestTone();
        if (!micInput) micInput = new p5.AudioIn();
        await unlockAudio();
        await new Promise((res, rej) => micInput.start(() => res(), (e) => rej(e)));
        ensureFFT();
        if (!fft) return;
        fft.setInput(micInput);
        ui.startBtn.disabled = true;
        ui.stopBtn.disabled = false;
        ui.playPauseBtn.disabled = !soundFile;
        setStatus("🎤 Micro actif.");
      } catch (err) {
        console.error(err);
        setStatus("❌ Micro indisponible. Permissions Firefox (cadenas), contexte sécurisé (localhost/https), onglet non privé.");
        alert("Impossible d'accéder au micro. Vérifiez les permissions du navigateur.");
      }
    });

    // Fichier audio
    ui.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      setStatus("Chargement du fichier…");
      stopMic(); stopTestTone();
      await unlockAudio();
      const url = URL.createObjectURL(file);
      if (!soundLibReady()) {
        setStatus("❌ p5.sound absent. Vérifiez l’inclusion de p5.sound.js après p5.js.");
        return;
      }
      loadSound(
        url,
        (sf) => {
          soundFile = sf;
          ensureFFT();
          if (!fft) return;
          fft.setInput(soundFile);
          ui.playPauseBtn.disabled = false;
          ui.stopBtn.disabled = false;
          ui.playPauseBtn.textContent = 'Lire';
          setStatus(`✅ Fichier prêt : ${file.name} — cliquez sur “Lire”.`);
        },
        (err) => {
          console.error(err);
          setStatus("❌ Échec du chargement du fichier (format/cors?). Essayez MP3/WAV/OGG.");
          alert("Échec du chargement du fichier audio.");
        }
      );
    });

    // Play/Pause
    ui.playPauseBtn.addEventListener('click', () => {
      if (!soundFile) return;
      if (soundFile.isPlaying()) {
        soundFile.pause();
        ui.playPauseBtn.textContent = 'Lire';
        setStatus("⏸️ Pause.");
      } else {
        soundFile.play();
        ui.playPauseBtn.textContent = 'Pause';
        setStatus("▶️ Lecture.");
      }
    });

    // Stop
    ui.stopBtn.addEventListener('click', () => {
      stopMic(); stopSoundFile(); stopTestTone();
      ui.startBtn.disabled = false;
      ui.stopBtn.disabled = true;
      ui.playPauseBtn.disabled = !soundFile;
      setStatus("⏹️ Arrêt. Choisissez une source (micro, fichier ou ton de test).");
    });

    // Ton de test
    ui.startToneBtn?.addEventListener('click', startTestTone);

    // Visibilité onglet → réduire anim
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        reduceMotion = true;
        ui.reduceMotionChk.checked = true;
        saveSettings();
      }
    });

    // Raccourcis
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'f' || ev.key === 'F') {
        const el = document.documentElement;
        if (!document.fullscreenElement) el.requestFullscreen?.();
        else document.exitFullscreen?.();
      } else if (ev.key === 's' || ev.key === 'S') {
        try { saveCanvas('visualizer', 'png'); } catch { }
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const { palette } = loadSettings();
    currentPalette = currentPalette || palettes[palette] || palettes.default;
    startApp();
  });
})();
