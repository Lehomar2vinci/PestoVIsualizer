// Visuel : sinusoïde, grille XY, spectre, particules
(function () {
    let cnv, particles = []; const MAX_PARTICLES = 260;
    let lastXY = { active: false, x: 0.5, y: 0.5 };

    const sketch = (p) => {
        p.setup = () => {
            const { clientWidth: w, clientHeight: h } = App.els.container;
            cnv = p.createCanvas(w, h); cnv.parent(App.els.container);
            p.noStroke(); p.frameRate(60);
            window.__p5inst = p;

            window.addEventListener('resize', () => {
                const { clientWidth: w, clientHeight: h } = App.els.container;
                p.resizeCanvas(w, h);
            });
        };

        function drawBackground(pct) {
            const colors = App.getTheme().rings;
            const t = p.millis() / 1000;
            p.background(13, 17, 23);
            for (let i = 0; i < 6; i++) {
                const r = (Math.sin(t * 0.9 + i * .7) + 1) / 2;
                const a = 140 - i * 18;
                const col = p.color(colors[i % colors.length]); col.setAlpha(a);
                p.fill(col);
                const w = p.width * (0.18 + r * 0.82) * (0.82 + 0.18 * pct);
                const h = p.height * (0.22 + (1 - r) * 0.78) * (0.82 + 0.18 * (1 - pct));
                p.ellipse(p.width / 2, p.height / 2, w, h);
            }
        }
        function drawGrid() {
            p.stroke(255, 255, 255, 32); p.strokeWeight(1);
            for (let i = 1; i < 4; i++) { const x = (p.width / 4) * i, y = (p.height / 4) * i; p.line(x, 0, x, p.height); p.line(0, y, p.width, y); }
            p.noStroke();
        }
        function drawSpectrum() {
            if (App.state.visual.showSpectrum !== 'on') return 0;
            const spec = App.getSpectrum();
            const barColor = p.color(App.getTheme().bars); barColor.setAlpha(220);
            const pad = 18, H = 110, Y = 12;
            p.fill(0, 0, 0, 110); p.rect(10, 10, p.width - 20, H + Y, 12);
            const sw = (p.width - 20 - pad) / Math.max(1, spec.length);
            p.noStroke(); p.fill(barColor);
            let avg = 0;
            for (let i = 0; i < spec.length; i++) {
                avg += spec[i];
                const h = p.map(spec[i], 0, 255, 0, H);
                p.rect(10 + pad / 2 + i * sw, 10 + H - h + Y / 2, sw * 0.7, h, 3);
            }
            return spec.length ? (avg / spec.length) / 255 : 0;
        }
        function drawOscillo() {
            if (App.state.visual.showOscillo !== 'on') return;
            const wave = App.getWaveform(); if (!wave.length) return;
            const g = p.drawingContext.createLinearGradient(20, 0, p.width - 20, 0);
            const [c1, c2, c3] = App.getTheme().rings; g.addColorStop(0, c1); g.addColorStop(.5, c2); g.addColorStop(1, c3);
            p.drawingContext.strokeStyle = g;
            p.noFill(); p.strokeWeight(2.2);
            p.beginShape();
            for (let i = 0; i < wave.length; i++) {
                const x = p.map(i, 0, wave.length - 1, 20, p.width - 20);
                const y = p.map(wave[i], -1, 1, p.height * 0.72, p.height * 0.28);
                p.vertex(x, y);
            }
            p.endShape();
        }
        function drawParticles() {
            if (App.state.visual.showParticles !== 'on') return;
            for (let i = particles.length - 1; i >= 0; i--) {
                const o = particles[i]; o.t += p.deltaTime / 1000; const k = o.t / o.life;
                if (k >= 1) { particles.splice(i, 1); continue; }
                o.x += o.vx; o.y += o.vy; o.vy += 0.03;
                const a = p.lerp(220, 0, k); const c = p.color(o.c); c.setAlpha(a);
                p.fill(c); p.circle(o.x, o.y, o.r * (1 - k) * 3.2);
            }
        }
        function crosshair() {
            if (!lastXY.active) return;
            const x = lastXY.x * p.width, y = lastXY.y * p.height;
            p.stroke(255, 255, 255, 60); p.strokeWeight(1);
            p.line(x, 0, x, p.height); p.line(0, y, p.width, y);
            p.noStroke();
            const lp = App.getLastParams();
            const label = `X→${Math.round(lp.freq)} Hz • Y→${lp.amp.toFixed(2)} amp · fc≈${Math.round(lp.cutoff)} Hz`;
            p.fill(0, 0, 0, 150); p.rect(x + 10, y - 30, p.textWidth(label) + 16, 24, 8);
            p.fill(255); p.textSize(12); p.text(label, x + 18, y - 13);
        }

        p.draw = () => {
            const lvl = drawSpectrum();
            const pct = p.constrain((lvl || 0) * (0.6 + App.state.visualIntensity * 0.6), 0, 1);
            drawBackground(pct); drawGrid(); drawOscillo(); drawParticles(); crosshair();
            const pulse = (pct * 0.6 + 0.08); const c = p.color(App.getTheme().rings[0]); c.setAlpha(90);
            p.noStroke(); p.fill(c); p.ellipse(p.width / 2, p.height / 2, p.width * pulse * 0.32, p.width * pulse * 0.32);
        };

        // === Interaction XY ===
        function clamp01(v) { return Math.max(0, Math.min(1, v)); }
        function handleDown() {
            App.startAudio(); if (!App.isOn()) App.togglePower(true);
            if (App.state.simpleMode === 'on') return;
            lastXY = { active: true, x: clamp01(p.mouseX / p.width), y: clamp01(p.mouseY / p.height) };
            App.xyDown(lastXY.x, lastXY.y); burst(lastXY.x, lastXY.y);
        }
        function handleMove() {
            if (!lastXY.active || App.state.simpleMode === 'on') return;
            lastXY = { active: true, x: clamp01(p.mouseX / p.width), y: clamp01(p.mouseY / p.height) };
            App.xyMove(lastXY.x, lastXY.y);
        }
        function handleUp() { if (App.state.simpleMode === 'on') return; lastXY.active = false; App.xyUp(); }

        function burst(x, y) {
            if (App.state.visual.showParticles !== 'on') return;
            const theme = App.getTheme(); const center = { x: x * p.width, y: y * p.height };
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: center.x, y: center.y, vx: p.random(-1.4, 1.4), vy: p.random(-2.0, -0.4),
                    life: p.random(0.6, 1.2), t: 0, r: p.random(2, 5), c: p.random(theme.rings)
                });
                if (particles.length > MAX_PARTICLES) particles.shift();
            }
        }
        p.mousePressed = p.touchStarted = handleDown;
        p.mouseDragged = p.touchMoved = handleMove;
        p.mouseReleased = p.touchEnded = handleUp;
    };

    new p5(sketch);
})();
