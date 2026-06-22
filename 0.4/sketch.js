// // FIRST VERSION

// let osc, fft;

// function setup() {
//     let cnv = createCanvas(800, 600);
//     cnv.parent("canvasContainer");
//     osc = new p5.Oscillator("sine");
//     fft = new p5.FFT();
//     osc.start();
//     osc.amp(0.5, 1); // Amp à 0.5, sur 1 seconde
// }

// function draw() {
//     let freq = map(mouseX, 0, width, 100, 500);
//     osc.freq(freq);

//     let amp = map(mouseY, 0, height, 1, 0);
//     osc.amp(amp);

//     let degradation = map(mouseX + mouseY, 0, width + height, 0, 255);
//     background(degradation, 100, 255 - degradation, 25);

//     let waveform = fft.waveform();
//     noFill();
//     stroke(255 - degradation, degradation, 100);
//     strokeWeight(2);
//     beginShape();
//     for (let i = 0; i < waveform.length; i++) {
//         let x = map(i, 0, waveform.length, 0, width);
//         let y = map(waveform[i], -1, 1, 0, height);
//         vertex(x, y);
//     }
//     endShape();

//   // Mise à jour du texte d'information
//     document.getElementById("infoText").textContent = `Fréquence: ${freq.toFixed(
//     2)} Hz | Amplitude: ${amp.toFixed(2)}`;

//   // Appliquer l'effet de glitch si l'amplitude est élevée
//     if (amp > 0.8) {
//     applyGlitchEffect();
//     }
// }

// function applyGlitchEffect() {
//     loadPixels();
//     for (let y = 0; y < height; y++) {
//         for (let x = 0; x < width; x++) {
//             if (random() < 0.1) {
//         // Probabilité de glitch sur chaque pixel
//                 let index = (x + y * width) * 4;
//                 let offset = int(random(-10, 10)) * 4;
//                 pixels[index] = pixels[index + offset];
//                 pixels[index + 1] = pixels[index + 1 + offset];
//                 pixels[index + 2] = pixels[index + 2 + offset];
//                 }
//             }
//         }
//     updatePixels();
// }

// function mousePressed() {
//     if (osc.started) {
//         osc.stop();
//     } else {
//         osc.start();
//     }
// }


////// 2ND VERSION :

// let osc, fft;
// let reverb, delay;
// let reverbOn = true;
// let delayOn = true;
// let oscOn = false;
// let bgColor;
// let glitch = false;

// function setup() {
//   const cnv = createCanvas(windowWidth, windowHeight);
//   cnv.parent("canvasContainer");

//   userStartAudio().then(() => {
//     osc = new p5.Oscillator("sine");
//     osc.start();
//     osc.amp(0);

//     fft = new p5.FFT();

//     reverb = new p5.Reverb();
//     reverb.process(osc, 3, 2);

//     delay = new p5.Delay();
//     delay.process(osc, 0.12, 0.7, 2300);
//   });

//   bgColor = color(0, 0, 0);
//   updateControlsText();
// }

// function draw() {
//   background(bgColor);

//   if (oscOn) {
//     drawVisualMode();
//   }
// }

// function drawVisualMode() {
//   const freq = map(mouseX || (touches[0]?.x ?? width / 2), 0, width, 100, 500);
//   if (osc) osc.freq(freq);

//   const amp = map(mouseY || (touches[0]?.y ?? height / 2), 0, height, 1, 0);
//   if (osc) osc.amp(amp);

//   const colorRatio = map(freq, 100, 500, 0, 255);
//   bgColor = color(colorRatio, 100, 255 - colorRatio);

//   const waveform = fft.waveform();
//   noFill();
//   stroke(255 - colorRatio, colorRatio, 100);
//   strokeWeight(2);
//   beginShape();
//   for (let i = 0; i < waveform.length; i++) {
//     const x = map(i, 0, waveform.length, 0, width);
//     const y = map(waveform[i], -1, 1, 0, height);
//     vertex(x, y);
//   }
//   endShape();

//   if (amp > 0.8 && !glitch) {
//     applyGlitchEffect();
//     glitch = true;
//   } else if (amp <= 0.8) {
//     glitch = false;
//   }

//   updateInfoText(freq, amp);
// }

// function applyGlitchEffect() {
//   loadPixels();
//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       if (random() < 0.1) {
//         const index = (x + y * width) * 4;
//         const offset = int(random(-10, 10)) * 4;
//         pixels[index] = pixels[index + offset];
//         pixels[index + 1] = pixels[index + 1 + offset];
//         pixels[index + 2] = pixels[index + 2 + offset];
//       }
//     }
//   }
//   updatePixels();
// }

// function mousePressed() {
//   if (oscOn && osc) {
//     osc.amp(0.5, 0.05);
//   }
// }

// function mouseReleased() {
//   if (oscOn && osc) {
//     osc.amp(0, 0.5);
//   }
// }

// function keyPressed() {
//   switch (key.toUpperCase()) {
//     case "M":
//       toggleOscillator();
//       break;
//     case "A":
//       setOscType("sine");
//       break;
//     case "S":
//       setOscType("triangle");
//       break;
//     case "D":
//       setOscType("sawtooth");
//       break;
//     case "F":
//       setOscType("square");
//       break;
//     case "R":
//       toggleReverb();
//       break;
//     case "L":
//       toggleDelay();
//       break;
//   }
// }

// function toggleOscillator() {
//   oscOn = !oscOn;
//   console.log("Oscillator is now: " + (oscOn ? "On" : "Off"));
//   const oscStatus = document.getElementById("oscillatorButton");
//   oscStatus.textContent = oscOn ? "On" : "Off";
//   oscStatus.classList.toggle("on", oscOn);
//   oscStatus.classList.toggle("off", !oscOn);
//   if (oscOn) {
//     osc.amp(0.5, 0.05);
//   } else {
//     osc.amp(0, 0.5);
//   }
//   updateControlsText();
// }

// function toggleReverb() {
//   reverbOn = !reverbOn;
//   const reverbStatus = document.getElementById("reverbToggle");
//   if (reverbOn) {
//     reverb.disconnect();
//     reverb = new p5.Reverb();
//     reverb.process(osc, 3, 2);
//     reverbStatus.value = "on";
//     console.log("Reverb On");
//   } else {
//     reverb.disconnect();
//     reverbStatus.value = "off";
//     console.log("Reverb Off");
//   }
//   updateControlsText();
// }

// function toggleDelay() {
//   delayOn = !delayOn;
//   const delayStatus = document.getElementById("delayToggle");
//   if (delayOn) {
//     delay.disconnect();
//     delay = new p5.Delay();
//     delay.process(osc, 0.12, 0.7, 2300);
//     delayStatus.value = "on";
//     console.log("Delay On");
//   } else {
//     delay.disconnect();
//     delayStatus.value = "off";
//     console.log("Delay Off");
//   }
//   updateControlsText();
// }

// function setOscType(type) {
//   if (osc) osc.setType(type);
//   console.log("Oscillator type set to: " + type);
// }

// function updateInfoText(freq, amp) {
//   const infoText = document.getElementById("infoText");
//   infoText.textContent = `Fréquence : ${nf(freq, 1, 2)} Hz | Amplitude : ${nf(
//     amp,
//     1,
//     2
//   )}`;
// }

// function updateControlsText() {
//   const controlsText = document.getElementById("controlsText");
//   controlsText.innerHTML = `
//         <!-- Appuyez sur 'M' pour activer/désactiver l'oscillateur. <br> -->
//         Oscillater : ${oscOn ? "On" : "Off"} <br>
//         Type : ${
//           osc?.getType().charAt(0).toUpperCase() + osc?.getType().slice(1)
//         } <br>
//         Reverb : ${reverbOn ? "On" : "Off"} | Delay : ${delayOn ? "On" : "Off"}
//     `;
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }


//  3RD VERSION :

let osc, fft, reverb, delay;
let reverbOn = true;
let delayOn = true;
let oscOn = false;
let bgColor;
let baseFreq = 440;
let baseAmp = 0.5;
let volume = 0.5; // Initial volume

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvasContainer");

  userStartAudio().then(() => {
    osc = new p5.Oscillator("sine");
    osc.start();
    osc.amp(0); // Initialize with zero amplitude

    fft = new p5.FFT();

    reverb = new p5.Reverb();
    reverb.process(osc, 3, 2);

    delay = new p5.Delay();
    delay.process(osc, 0.12, 0.7, 2300);
  });

  bgColor = color(0, 0, 0);
  updateControlsText();
}

function draw() {
  background(bgColor);

  if (oscOn) {
    drawVisualMode();
  }
}

function drawVisualMode() {
  const freq = map(mouseX, 0, width, 100, 500) + parseFloat(baseFreq);
  const amp = map(mouseY, 0, height, 1, 0) * parseFloat(baseAmp);

  if (osc) {
    osc.freq(freq);
    osc.amp(amp * volume);
  }

  const colorRatioX = map(mouseX, 0, width, 0, 255);
  const colorRatioY = map(mouseY, 0, height, 0, 255);
  bgColor = color(colorRatioX, 100, colorRatioY);

  const waveform = fft.waveform();
  noFill();
  stroke(255 - colorRatioX, colorRatioX, 100);
  strokeWeight(2);
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    const x = map(i, 0, waveform.length, 0, width);
    const y = map(waveform[i], -1, 1, 0, height);
    vertex(x, y);
  }
  endShape();

  updateInfoText(freq, amp);
}

function mousePressed() {
  if (oscOn && osc) {
    osc.amp(0.5 * volume, 0.05); // Apply volume multiplier
  }
}

function mouseReleased() {
  if (oscOn && osc) {
    osc.amp(0, 0.5);
  }
}

function keyPressed() {
  switch (key.toUpperCase()) {
    case "M":
      toggleOscillator();
      break;
    case "A":
      setOscType("sine");
      break;
    case "S":
      setOscType("triangle");
      break;
    case "D":
      setOscType("sawtooth");
      break;
    case "F":
      setOscType("square");
      break;
    case "R":
      toggleReverb();
      break;
    case "L":
      toggleDelay();
      break;
  }
}

function toggleOscillator() {
  oscOn = !oscOn;
  const oscStatus = document.getElementById("oscillatorButton");
  oscStatus.textContent = oscOn ? "On" : "Off";
  oscStatus.classList.toggle("on", oscOn);
  oscStatus.classList.toggle("off", !oscOn);
  if (oscOn) {
    osc.amp(0.5 * volume, 0.05); // Apply volume multiplier
  } else {
    osc.amp(0, 0.5);
  }
  updateControlsText();
}

function setOscType(type) {
  osc.setType(type);
  updateControlsText();
}

function toggleReverb() {
  reverbOn = !reverbOn;
  const reverbToggle = document.getElementById("reverbToggle");
  reverbToggle.textContent = reverbOn ? "On" : "Off";
  reverbToggle.classList.toggle("on", reverbOn);
  reverbToggle.classList.toggle("off", !reverbOn);
  if (reverbOn) {
    reverb = new p5.Reverb();
    reverb.process(osc, 3, 2);
  } else {
    reverb.disconnect();
  }
  updateControlsText();
}

function toggleDelay() {
  delayOn = !delayOn;
  const delayToggle = document.getElementById("delayToggle");
  delayToggle.textContent = delayOn ? "On" : "Off";
  delayToggle.classList.toggle("on", delayOn);
  delayToggle.classList.toggle("off", !delayOn);
  if (delayOn) {
    delay = new p5.Delay();
    delay.process(osc, 0.12, 0.7, 2300);
  } else {
    delay.disconnect();
  }
  updateControlsText();
}

function updateInfoText(freq, amp) {
  const infoText = document.getElementById("infoText");
  infoText.textContent = `Fréquence : ${nf(freq, 1, 2)} Hz | Amplitude : ${nf(
    amp,
    1,
    2
  )}`;
}

function updateControlsText() {
  const controlsText = document.getElementById("controlsText");
  controlsText.innerHTML = `
        Oscillateur : ${oscOn ? "On" : "Off"} <br>
        Type : ${
          osc?.getType().charAt(0).toUpperCase() + osc?.getType().slice(1)
        } <br>
        Réverbération : ${reverbOn ? "On" : "Off"} | Délai : ${
    delayOn ? "On" : "Off"
  }
    `;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

document.getElementById("volumeSlider").addEventListener("input", (event) => {
  volume = event.target.value;
  if (oscOn && osc) {
    osc.amp(baseAmp * volume); // Update amplitude with volume
  }
});

document.getElementById("baseFreqSlider").addEventListener("input", (event) => {
  baseFreq = event.target.value;
});

document.getElementById("baseAmpSlider").addEventListener("input", (event) => {
  baseAmp = event.target.value;
  if (oscOn && osc) {
    osc.amp(baseAmp * volume); // Update amplitude with base amplitude and volume
  }
});
