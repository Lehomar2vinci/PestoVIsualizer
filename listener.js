let fft, micInput;
let particles = [];
let baseHue = 0; // Base pour le changement de couleurs
let isParticlesEnabled = false;
let sensitivity = 2; // Sensibilité des fréquences
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
};
let currentPalette = palettes.default;

document.getElementById("startMicButton").addEventListener("click", () => {
  if (!micInput) {
    micInput = new p5.AudioIn();
    micInput.start();
    fft = new p5.FFT();
    fft.setInput(micInput);
    document.getElementById("startMicButton").style.display = "none";
  }
});



document.getElementById("sensitivity").addEventListener("input", (e) => {
  sensitivity = e.target.value;
});

document.getElementById("palette").addEventListener("change", (e) => {
  currentPalette = palettes[e.target.value];
});

document.getElementById("toggleParticles").addEventListener("click", () => {
  isParticlesEnabled = !isParticlesEnabled;
  document.getElementById("toggleParticles").textContent = isParticlesEnabled
    ? "Désactiver Particules"
    : "Activer Particules";
});

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("visualization");
  colorMode(HSB);
  noStroke();
}

function draw() {
  background(0, 0, 0, 25);

  if (micInput?.enabled) {
    fft.analyze();

    let energies = [
      fft.getEnergy("bass") * sensitivity,
      fft.getEnergy("lowMid") * sensitivity,
      fft.getEnergy("mid") * sensitivity,
      fft.getEnergy("highMid") * sensitivity,
      fft.getEnergy("treble") * sensitivity,
    ];

    // Dessiner les cercles concentriques
    energies.forEach((energy, i) => {
      let [r, g, b] = currentPalette[i % currentPalette.length];
      fill(r, g, b, map(energy, 0, 255, 50, 150));
      ellipse(width / 2, height / 2, map(energy, 0, 255, 100, 400));
    });

    // Ajouter des particules
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

    // Afficher et mettre à jour les particules
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].show();
      if (particles[i].finished()) {
        particles.splice(i, 1);
      }
    }
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = random(5, 15);
    this.alpha = 255;
  }

  finished() {
    return this.alpha < 0;
  }

  update() {
    this.x += random(-2, 2);
    this.y += random(-2, 2);
    this.alpha -= 5;
  }

  show() {
    noStroke();
    fill(...this.color, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
