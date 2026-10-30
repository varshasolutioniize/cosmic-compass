console.log("🌟 Cosmic Compass JavaScript is running!");
const birthForm = document.getElementById("birth-form");
const submitButton = document.getElementById("submit-button");

const resultTitle = document.getElementById("result-title");
const resultDescription = document.getElementById("result-description");

// Create the Cosmic Guide popup
const popup = document.createElement("div");

popup.id = "cosmic-popup";
popup.className = "cosmic-popup";
popup.setAttribute("aria-hidden", "true");

popup.innerHTML = `
    <div class="cosmic-popup-content"
         role="dialog"
         aria-modal="true"
         aria-labelledby="popup-title">

        <button type="button"
                class="popup-close"
                id="popup-close"
                aria-label="Close popup">&times;</button>

        <div class="popup-stars">✦ ✧ ✦</div>

        <div class="popup-symbol" id="popup-symbol">✧</div>

        <p class="popup-label">YOUR COSMIC GUIDE</p>

        <h2 id="popup-title">Your Zodiac Sign</h2>

        <p id="popup-message"></p>

        <div class="daily-horoscope">
            <h3>🌙 Your Daily Horoscope</h3>

            <p class="horoscope-date" id="horoscope-date">
                Your horoscope will appear here.
            </p>

            <p>
                <strong>Today's Guidance:</strong>
                <span id="horoscope-today"></span>
            </p>

            <p>
                <strong>Reflection:</strong>
                <span id="horoscope-reflection"></span>
            </p>

            <p>
                <strong>💖 Love:</strong>
                <span id="horoscope-love"></span>
            </p>

            <p>
                <strong>💼 Career:</strong>
                <span id="horoscope-career"></span>
            </p>

            <p>
                <strong>🍀 Lucky Number:</strong>
                <span id="horoscope-number"></span>
            </p>

            <p>
                <strong>🎨 Lucky Colour:</strong>
                <span id="horoscope-colour"></span>
            </p>
        </div>

        <div class="popup-details">
            <p>
                <strong>Birth date:</strong>
                <span id="popup-date"></span>
            </p>

            <p>
                <strong>Birth time:</strong>
                <span id="popup-time"></span>
            </p>

            <p>
                <strong>Birthplace:</strong>
                <span id="popup-place"></span>
            </p>
        </div>

        <button type="button"
                class="popup-done"
                id="popup-done">
            Continue Exploring ✨
        </button>

        <p class="popup-note">
            Astrology is for entertainment and personal reflection.
        </p>
    </div>
`;

document.body.appendChild(popup);

// Close the popup
function closePopup() {
  popup.classList.remove("show");
  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("popup-open");
}

// Close button events
document.getElementById("popup-close").addEventListener("click", closePopup);

document.getElementById("popup-done").addEventListener("click", closePopup);

// Close when clicking outside the popup
popup.addEventListener("click", function (event) {
  if (event.target === popup) {
    closePopup();
  }
});

// Close using the Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && popup.classList.contains("show")) {
    closePopup();
  }
});

// Handle the birth details form
birthForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const birthDate = document.getElementById("birth_date").value;
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
    // Request the zodiac sign from Flask
    const response = await fetch("/api/zodiac", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        birth_date: birthDate,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to calculate your zodiac sign.");
    }

    // Update the result card
    document.getElementById("zodiac-symbol").textContent = data.symbol;

    document.getElementById("result-label").textContent = "YOUR COSMIC GUIDE";

    resultTitle.textContent = data.sign;
    resultDescription.textContent = data.message;

    document.getElementById("result-date").textContent = birthDate;
    document.getElementById("result-time").textContent = birthTime;
    document.getElementById("result-place").textContent = birthplace;

    document.getElementById("result-details").hidden = false;

    // Populate the popup with zodiac information
    document.getElementById("popup-symbol").textContent = data.symbol;
    document.getElementById("popup-title").textContent = data.sign;
    document.getElementById("popup-message").textContent = data.message;

    document.getElementById("popup-date").textContent = birthDate;
    document.getElementById("popup-time").textContent = birthTime;
    document.getElementById("popup-place").textContent = birthplace;

    // Show the popup
    popup.classList.add("show");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("popup-open");

    document.getElementById("horoscope-date").textContent =
      "Loading your daily horoscope...";

    // Request the daily horoscope
    try {
      const horoscopeResponse = await fetch(
        `/api/horoscope/${encodeURIComponent(data.sign)}`,
      );

      const horoscope = await horoscopeResponse.json();

      if (!horoscopeResponse.ok) {
        throw new Error(horoscope.error || "Unable to load the horoscope.");
      }

      // Display the daily horoscope
      document.getElementById("horoscope-date").textContent =
        "Daily Horoscope · " + horoscope.date;

      document.getElementById("horoscope-today").textContent =
        horoscope.horoscope;

      document.getElementById("horoscope-reflection").textContent =
        horoscope.reflection;

      document.getElementById("horoscope-love").textContent = horoscope.love;

      document.getElementById("horoscope-career").textContent =
        horoscope.career;

      document.getElementById("horoscope-number").textContent =
        horoscope.lucky_number;

      document.getElementById("horoscope-colour").textContent =
        horoscope.lucky_colour;
    } catch (horoscopeError) {
      document.getElementById("horoscope-date").textContent =
        "Your daily horoscope is temporarily unavailable.";

      console.error("Horoscope error:", horoscopeError);
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
const form = document.querySelector("#birth-form");
const statusMessage = document.querySelector("#status");
const result = document.querySelector("#result");
const button = document.querySelector("#submit-button");

if (form && statusMessage && result && button) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    statusMessage.textContent = "✨ Calculating your birth chart...";
    result.hidden = true;
    button.disabled = true;

    const birthDetails = {
      birth_date: form.elements["birth_date"].value,
      birth_time: form.elements["birth_time"].value,
      birthplace: form.elements["birthplace"].value.trim(),
    };

    try {
      const response = await fetch("/api/birth-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(birthDetails),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to calculate your birth chart.");
      }

      const heading = document.createElement("h2");
      heading.textContent = "✨ Your Cosmic Birth Chart";

      const description = document.createElement("p");
      description.textContent = `${data.birth_date} at ${data.birth_time} — ${data.birthplace}`;

      const sun = document.createElement("div");
      sun.className = "chart-item";
      sun.innerHTML = "";

      const sunTitle = document.createElement("h3");
      sunTitle.textContent = `${data.sun.symbol} Sun Sign: ${data.sun.sign}`;

      const moonTitle = document.createElement("h3");
      moonTitle.textContent = `${data.moon.symbol} Moon Sign: ${data.moon.sign}`;

      const risingTitle = document.createElement("h3");
      risingTitle.textContent = `${data.rising.symbol} Rising Sign: ${data.rising.sign}`;

      const timezone = document.createElement("p");
      timezone.textContent = `Birthplace time zone: ${data.timezone}`;

      const note = document.createElement("p");
      note.textContent =
        "Your Sun sign represents your core identity, your Moon sign your emotional world, and your Rising sign your outward approach to life.";

      sun.replaceChildren(sunTitle, moonTitle, risingTitle, timezone, note);

      result.replaceChildren(heading, description, sun);
      result.hidden = false;
      statusMessage.textContent = "Your birth chart is ready! 🌟";
    } catch (error) {
      statusMessage.textContent =
        error.message || "Something went wrong. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
}
