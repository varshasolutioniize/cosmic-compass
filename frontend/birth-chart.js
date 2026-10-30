const birthChartForm = document.getElementById("birth-chart-form");
const birthChartResults = document.getElementById("birth-chart-results");
const chartError = document.getElementById("chart-error");
const chartSubmitButton = document.getElementById("chart-submit-button");

const birthDateInput = document.getElementById("chart-birth-date");
const birthTimeInput = document.getElementById("chart-birth-time");
const birthplaceInput = document.getElementById("chart-birthplace");

// Prevent users from selecting a future birth date.
const today = new Date();

const todayString = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

birthDateInput.max = todayString;

birthChartForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  chartError.textContent = "";

  const birthDate = birthDateInput.value;
  const birthTime = birthTimeInput.value;
  const birthplace = birthplaceInput.value.trim();

  if (!birthDate || !birthTime || !birthplace) {
    chartError.textContent =
      "Please enter your birth date, birth time, and birthplace.";
    return;
  }

  chartSubmitButton.disabled = true;
  chartSubmitButton.textContent = "Calculating your birth chart...";

  try {
    // Send all three birth details to the Flask backend.
    const response = await fetch("/api/birth-chart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        birth_date: birthDate,
        birth_time: birthTime,
        birthplace: birthplace,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to calculate your birth chart.");
    }

    // Display the Sun sign.
    document.getElementById("chart-sun-icon").textContent = data.sun.symbol;

    document.getElementById("chart-sun-sign").textContent = data.sun.sign;

    // Display the Moon sign.
    document.getElementById("chart-moon-icon").textContent = data.moon.symbol;

    document.getElementById("chart-moon-sign").textContent = data.moon.sign;

    // Display the Rising sign.
    document.getElementById("chart-rising-icon").textContent =
      data.rising.symbol;

    document.getElementById("chart-rising-sign").textContent = data.rising.sign;

    // Display the entered birth details.
    document.getElementById("chart-result-date").textContent = data.birth_date;

    document.getElementById("chart-result-time").textContent = data.birth_time;

    document.getElementById("chart-result-place").textContent = data.birthplace;

    // Display the detected timezone if this element exists.
    const timezoneElement = document.getElementById("chart-result-timezone");

    if (timezoneElement) {
      timezoneElement.textContent = data.timezone;
    }

    // Show the completed birth chart.
    birthChartResults.hidden = false;

    birthChartResults.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    chartError.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    chartSubmitButton.disabled = false;
    chartSubmitButton.textContent = "Generate Birth Chart ✨";
  }
});
