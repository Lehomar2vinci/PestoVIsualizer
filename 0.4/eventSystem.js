document.addEventListener("DOMContentLoaded", () => {
  const canvasContainer = document.getElementById("canvasContainer");
  const menuButton = document.getElementById("menuButton");
  const oscillatorButton = document.getElementById("oscillatorButton");
  const helpButton = document.getElementById("helpButton");
  const menu = document.getElementById("menu");
  const helpText = document.getElementById("helpText");
  const oscTypeSpinner = document.getElementById("oscTypeSpinner");
  const reverbToggle = document.getElementById("reverbToggle");
  const delayToggle = document.getElementById("delayToggle");

  canvasContainer.addEventListener("mouseenter", () => loop());
  canvasContainer.addEventListener("mouseleave", () => noLoop());
  canvasContainer.addEventListener("touchstart", () => loop());
  canvasContainer.addEventListener("touchend", () => noLoop());

  menuButton.addEventListener("click", () => toggleDisplay(menu));
  oscillatorButton.addEventListener("click", () => toggleOscillator());
  helpButton.addEventListener("click", () => toggleDisplay(helpText));

  oscTypeSpinner.addEventListener("change", (event) =>
    setOscType(event.target.value)
  );
  reverbToggle.addEventListener("click", () => toggleReverb());
  delayToggle.addEventListener("click", () => toggleDelay());
});

function toggleDisplay(element) {
  element.style.display = element.style.display === "block" ? "none" : "block";
}

function closeMenu() {
  document.getElementById("menu").style.display = "none";
}
