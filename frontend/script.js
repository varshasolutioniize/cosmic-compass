const birthForm = document.getElementById("birth-form");
const submitButton = document.getElementById("submit-button");
const resultTitle = document.getElementById("result-title");
const resultDescription = document.getElementById("result-description");

const popup = document.createElement("div");
popup.id = "cosmic-popup";
popup.className = "cosmic-popup";
popup.setAttribute("aria-hidden", "true");
popup.innerHTML = `
  <div class="cosmic-popup-content" role="dialog" aria-modal="true" aria-labelledby="popup-title">
    <button type="button" class="popup-close" id="popup-close" aria-label="Close popup">&times;</button>
    <div class="popup-stars">✦ ✧ ✦</div>
    <div class="popup-symbol" id="popup-symbol">✧</div>
    <p class="popup-label">YOUR COSMIC GUIDE</p>
    <h2 id="popup-title">Your Zodiac Sign</h2>
    <p id="popup-message"></p>
    <div class="daily-horoscope">
      <h3>🌙 Your Daily Horoscope</h3>
      <p class="horoscope-date" id="horoscope-date">Your horoscope will appear here.</p>
      <p><strong>Today's Guidance:</strong> <span id="horoscope-today"></span></p>
      <p><strong>Reflection:</strong> <span id="horoscope-reflection"></span></p>
      <p><strong>💖 Love:</strong> <span id="horoscope-love"></span></p>
      <p><strong>💼 Career:</strong> <span id="horoscope-career"></span></p>
      <p><strong>🍀 Lucky Number:</strong> <span id="horoscope-number"></span></p>
      <p><strong>🎨 Lucky Colour:</strong> <span id="horoscope-colour"></span></p>
    </div>
    <div class="popup-details">
      <p><strong>Birth date:</strong> <span id="popup-date"></span></p>
      <p><strong>Birth time:</strong> <span id="popup-time"></span></p>
      <p><strong>Birthplace:</strong> <span id="popup-place"></span></p>
    </div>
    <button type="button" class="popup-done" id="popup-done">Continue Exploring ✨</button>
    <p class="popup-note">Astrology is for entertainment and personal reflection.</p>
  </div>`;
document.body.appendChild(popup);

function closePopup() {
  popup.classList.remove("show");
  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("popup-open");
}
document.getElementById("popup-close").addEventListener("click", closePopup);
document.getElementById("popup-done").addEventListener("click", closePopup);
popup.addEventListener("click", event => {
  if (event.target === popup) closePopup();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && popup.classList.contains("show")) closePopup();
});

if (birthForm) {
  const dateInput = document.getElementById("birth_date");
  dateInput.max = new Date().toISOString().slice(0, 10);

  birthForm.addEventListener("submit", async event => {
    event.preventDefault();
    const birthDate = dateInput.value;
    const birthTime = document.getElementById("birth_time").value;
    const birthplace = document.getElementById("birthplace").value.trim();

    if (!birthDate || !birthTime || !birthplace) {
      alert("Please enter your date, time, and place of birth.");
      return;
    }

    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Discovering...";
    resultTitle.textContent = "Reading the stars...";
    resultDescription.textContent = "Preparing your Cosmic Guide...";

    try {
      const response = await fetch("/api/zodiac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth_date: birthDate })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to calculate your zodiac sign.");

      document.getElementById("zodiac-symbol").textContent = data.symbol;
      document.getElementById("result-label").textContent = "YOUR COSMIC GUIDE";
      resultTitle.textContent = data.sign;
      resultDescription.textContent = data.message;
      document.getElementById("result-date").textContent = birthDate;
      document.getElementById("result-time").textContent = birthTime;
      document.getElementById("result-place").textContent = birthplace;
      document.getElementById("result-details").hidden = false;

      document.getElementById("popup-symbol").textContent = data.symbol;
      document.getElementById("popup-title").textContent = data.sign;
      document.getElementById("popup-message").textContent = data.message;
      document.getElementById("popup-date").textContent = birthDate;
      document.getElementById("popup-time").textContent = birthTime;
      document.getElementById("popup-place").textContent = birthplace;

      popup.classList.add("show");
      popup.setAttribute("aria-hidden", "false");
      document.body.classList.add("popup-open");

      document.getElementById("horoscope-date").textContent = "Loading your daily horoscope...";
      try {
        const horoscopeResponse = await fetch(`/api/horoscope/${encodeURIComponent(data.sign)}`);
        const horoscope = await horoscopeResponse.json();
        if (!horoscopeResponse.ok) throw new Error(horoscope.error || "Unable to load horoscope.");
        document.getElementById("horoscope-date").textContent = `Daily Horoscope · ${horoscope.date}`;
        document.getElementById("horoscope-today").textContent = horoscope.horoscope;
        document.getElementById("horoscope-reflection").textContent = horoscope.reflection;
        document.getElementById("horoscope-love").textContent = horoscope.love;
        document.getElementById("horoscope-career").textContent = horoscope.career;
        document.getElementById("horoscope-number").textContent = horoscope.lucky_number;
        document.getElementById("horoscope-colour").textContent = horoscope.lucky_colour;
      } catch (error) {
        document.getElementById("horoscope-date").textContent = "Your daily horoscope is temporarily unavailable.";
        console.error("Horoscope error:", error);
      }
      document.getElementById("popup-close").focus();
    } catch (error) {
      resultTitle.textContent = "Something went wrong";
      resultDescription.textContent = error.message;
      console.error("Cosmic Guide error:", error);
      alert("Unable to generate your Cosmic Guide: " + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Discover My Zodiac";
    }
  });
}
