const birthChartForm = document.getElementById("birth-chart-form");
const birthChartResults = document.getElementById("birth-chart-results");
const chartError = document.getElementById("chart-error");
const chartSubmitButton = document.getElementById("chart-submit-button");
const birthDateInput = document.getElementById("chart-birth-date");

/* --------------------------------------------------
   1. ASTROLOGY INTERPRETATIONS
   -------------------------------------------------- */

const zodiacReadings = {
  aries: {
    element: "Fire",
    personality: "bold, energetic, independent, and action-oriented",
    emotions:
      "direct emotional expression and opportunities to act on feelings",
    relationships: "honesty, independence, enthusiasm, and shared adventures",
    career:
      "leadership, entrepreneurship, competitive environments, and active problem-solving",
    strengths:
      "courage, initiative, enthusiasm, and willingness to try new things",
    growth:
      "practising patience, listening carefully, and thinking before acting",
  },
  taurus: {
    element: "Earth",
    personality: "grounded, patient, dependable, and practical",
    emotions: "stability, familiarity, comfort, and dependable routines",
    relationships:
      "loyalty, trust, consistency, and affection shown through actions",
    career:
      "finance, design, administration, practical planning, and steady long-term projects",
    strengths: "persistence, reliability, patience, and practical judgment",
    growth: "remaining open to change and avoiding unnecessary stubbornness",
  },
  gemini: {
    element: "Air",
    personality: "curious, expressive, adaptable, and intellectually engaged",
    emotions: "conversation, mental stimulation, and freedom to explore ideas",
    relationships:
      "interesting conversations, humour, openness, and shared curiosity",
    career:
      "communication, writing, teaching, technology, marketing, and research",
    strengths:
      "quick learning, versatility, communication, and connecting ideas",
    growth:
      "building consistency, listening deeply, and completing important tasks",
  },
  cancer: {
    element: "Water",
    personality: "caring, intuitive, protective, and emotionally aware",
    emotions:
      "security, familiar surroundings, emotional trust, and close connections",
    relationships:
      "kindness, loyalty, emotional safety, and thoughtful communication",
    career:
      "caregiving, education, hospitality, community work, and supportive roles",
    strengths:
      "empathy, attentiveness, loyalty, and sensitivity to others' needs",
    growth: "setting healthy boundaries and expressing feelings directly",
  },
  leo: {
    element: "Fire",
    personality: "expressive, warm, creative, and confident",
    emotions: "appreciation, heartfelt expression, and meaningful recognition",
    relationships: "generosity, affection, loyalty, and mutual appreciation",
    career:
      "creative work, leadership, performance, communication, and team motivation",
    strengths: "creativity, generosity, confidence, and encouraging others",
    growth: "welcoming feedback, sharing attention, and practising humility",
  },
  virgo: {
    element: "Earth",
    personality: "observant, organised, analytical, and service-minded",
    emotions:
      "order, practical support, useful routines, and thoughtful solutions",
    relationships:
      "reliability, meaningful actions, consideration, and honest communication",
    career:
      "analysis, software development, healthcare, editing, research, and organisation",
    strengths:
      "attention to detail, problem-solving, preparation, and dependability",
    growth: "accepting imperfection and avoiding excessive self-criticism",
  },
  libra: {
    element: "Air",
    personality: "diplomatic, thoughtful, cooperative, and harmony-seeking",
    emotions:
      "peaceful surroundings, fairness, connection, and balanced interactions",
    relationships:
      "mutual respect, shared decisions, affection, and open communication",
    career:
      "design, mediation, law, public relations, collaboration, and client-facing work",
    strengths:
      "diplomacy, perspective-taking, cooperation, and aesthetic awareness",
    growth: "making decisions confidently and expressing personal preferences",
  },
  scorpio: {
    element: "Water",
    personality: "focused, private, determined, and drawn to deeper questions",
    emotions: "trust, honesty, privacy, and meaningful emotional connections",
    relationships:
      "loyalty, sincerity, emotional depth, and dependable commitment",
    career:
      "research, investigation, psychology, security, strategy, and complex problem-solving",
    strengths:
      "persistence, focus, resourcefulness, and willingness to investigate",
    growth:
      "building trust gradually, communicating openly, and letting go of grudges",
  },
  sagittarius: {
    element: "Fire",
    personality: "adventurous, optimistic, independent, and open-minded",
    emotions: "freedom, learning, exploration, and a sense of possibility",
    relationships:
      "honesty, humour, shared experiences, and room for independence",
    career:
      "education, travel, publishing, research, training, and international work",
    strengths: "enthusiasm, curiosity, broad thinking, and adaptability",
    growth:
      "following through on commitments and considering details before acting",
  },
  capricorn: {
    element: "Earth",
    personality: "disciplined, ambitious, responsible, and goal-oriented",
    emotions: "reliability, structure, competence, and steady progress",
    relationships:
      "commitment, consistency, mutual respect, and practical support",
    career:
      "management, business, finance, engineering, planning, and project leadership",
    strengths:
      "persistence, organisation, responsibility, and long-term planning",
    growth:
      "making room for rest, celebrating progress, and expressing vulnerability",
  },
  aquarius: {
    element: "Air",
    personality:
      "independent, inventive, thoughtful, and interested in new ideas",
    emotions:
      "intellectual connection, personal freedom, and meaningful friendships",
    relationships:
      "respect, stimulating conversations, shared ideals, and independence",
    career:
      "technology, innovation, science, social projects, and creative problem-solving",
    strengths:
      "original thinking, open-mindedness, independence, and seeing broader patterns",
    growth:
      "making emotional needs explicit and balancing independence with closeness",
  },
  pisces: {
    element: "Water",
    personality: "imaginative, compassionate, reflective, and creative",
    emotions:
      "empathy, peaceful surroundings, imagination, and emotional connection",
    relationships:
      "kindness, understanding, affection, and a sense of emotional closeness",
    career:
      "creative arts, writing, design, support roles, and imaginative projects",
    strengths:
      "compassion, creativity, intuition, and seeing different perspectives",
    growth:
      "setting boundaries, checking assumptions, and turning ideas into practical plans",
  },
};

/* --------------------------------------------------
   2. HELPER FUNCTIONS
   -------------------------------------------------- */

function getSignKey(sign) {
  if (typeof sign !== "string") {
    return null;
  }

  const normalized = sign.trim().toLowerCase();

  return (
    Object.keys(zodiacReadings).find((key) => normalized.includes(key)) || null
  );
}

function getReading(sign) {
  const key = getSignKey(sign);
  return key ? zodiacReadings[key] : null;
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function formatSignName(sign) {
  const key = getSignKey(sign);

  if (key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  return typeof sign === "string" && sign.trim() ? sign.trim() : "Unknown";
}

/* --------------------------------------------------
   3. DISPLAY PERSONALIZED INTERPRETATIONS
   -------------------------------------------------- */

function displayInterpretations(data) {
  const sun = getReading(data.sun?.sign);
  const moon = getReading(data.moon?.sign);
  const rising = getReading(data.rising?.sign);

  const sunName = formatSignName(data.sun?.sign);
  const moonName = formatSignName(data.moon?.sign);
  const risingName = formatSignName(data.rising?.sign);

  setText("sun-reading-title", `${sunName} Sun`);
  setText(
    "sun-reading",
    sun
      ? `Your Sun is in ${sunName}, associated with the ${sun.element} element. ` +
          `In traditional astrology, this placement is linked with a core personality that is ${sun.personality}. ` +
          `Possible strengths include ${sun.strengths}. A useful growth theme is ${sun.growth}.`
      : "A detailed Sun interpretation is not available for this sign.",
  );

  setText("moon-reading-title", `${moonName} Moon`);
  setText(
    "moon-reading",
    moon
      ? `Your Moon is in ${moonName}, associated with the ${moon.element} element. ` +
          `Traditional astrology connects this placement with emotional needs involving ${moon.emotions}. ` +
          `In close relationships, you may value ${moon.relationships}. ` +
          `A useful reflection point is ${moon.growth}.`
      : "A detailed Moon interpretation is not available for this sign.",
  );

  setText("rising-reading-title", `${risingName} Rising`);
  setText(
    "rising-reading",
    rising
      ? `Your Rising sign is ${risingName}, associated with the ${rising.element} element. ` +
          `In traditional astrology, this placement relates to first impressions and your approach to new situations. ` +
          `It is associated with qualities such as being ${rising.personality}. ` +
          `You might reflect on how to use ${rising.strengths} while working on ${rising.growth}.`
      : "A detailed Rising interpretation is not available for this sign.",
  );

  if (sun && moon && rising) {
    setText(
      "personality-interpretation",
      `Your ${sunName} Sun, ${moonName} Moon, and ${risingName} Rising combine three different astrological themes. ` +
        `Your Sun is associated with being ${sun.personality}. ` +
        `Your Moon highlights emotional needs involving ${moon.emotions}. ` +
        `Your Rising sign adds a style associated with being ${rising.personality}. ` +
        `Use these themes for self-reflection rather than as fixed descriptions of who you are.`,
    );

    setText(
      "love-interpretation",
      `In traditional astrology, ${sunName} is associated with ${sun.relationships}. ` +
        `Your ${moonName} Moon adds themes of ${moon.emotions}, while ${risingName} Rising is associated with ${rising.relationships}. ` +
        `Honest communication, mutual respect, and understanding matter more than zodiac compatibility alone.`,
    );

    setText(
      "career-interpretation",
      `Your ${sunName} Sun is associated with themes such as ${sun.career}. ` +
        `Your ${moonName} Moon adds an emphasis on ${moon.strengths}, while your ${risingName} Rising is associated with ${rising.strengths}. ` +
        `Consider these ideas alongside your actual interests, skills, experience, and career goals.`,
    );

    setText(
      "growth-interpretation",
      `Astrology associates your ${sunName} Sun with strengths such as ${sun.strengths}. ` +
        `Your ${moonName} Moon highlights ${moon.strengths}, while your ${risingName} Rising is associated with ${rising.strengths}. ` +
        `Potential reflection themes include ${sun.growth}; ${moon.growth}; and ${rising.growth}.`,
    );
  } else {
    setText(
      "personality-interpretation",
      "One or more signs could not be matched to the interpretation library.",
    );

    setText(
      "love-interpretation",
      "Relationship interpretations are unavailable until all three signs are identified.",
    );

    setText(
      "career-interpretation",
      "Career interpretations are unavailable until all three signs are identified.",
    );

    setText(
      "growth-interpretation",
      "Growth interpretations are unavailable until all three signs are identified.",
    );
  }
}

/* --------------------------------------------------
   4. INITIAL PAGE SETUP
   -------------------------------------------------- */

if (birthDateInput) {
  const today = new Date();

  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  birthDateInput.max = localToday;
}

/* --------------------------------------------------
   5. SUBMIT BIRTH DETAILS AND FETCH THE CHART
   -------------------------------------------------- */

if (birthChartForm) {
  birthChartForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (chartError) {
      chartError.textContent = "";
    }

    if (birthChartResults) {
      birthChartResults.hidden = true;
    }

    const birthTimeInput = document.getElementById("chart-birth-time");
    const birthplaceInput = document.getElementById("chart-birthplace");

    const birthDate = birthDateInput?.value;
    const birthTime = birthTimeInput?.value;
    const birthplace = birthplaceInput?.value.trim();

    if (!birthDate || !birthTime || !birthplace) {
      if (chartError) {
        chartError.textContent =
          "Please enter your date, time, and place of birth.";
      }
      return;
    }

    if (birthDateInput.max && birthDate > birthDateInput.max) {
      if (chartError) {
        chartError.textContent = "Your birth date cannot be in the future.";
      }
      return;
    }

    if (chartSubmitButton) {
      chartSubmitButton.disabled = true;
      chartSubmitButton.textContent = "Calculating your chart...";
    }

    try {
      const response = await fetch("/api/birth-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          birthplace,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response. Please check the Flask terminal.",
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to calculate your birth chart.");
      }

      if (!data.sun?.sign || !data.moon?.sign || !data.rising?.sign) {
        throw new Error(
          "The server response is missing one or more zodiac signs.",
        );
      }

      // Display the main zodiac cards.
      setText("chart-sun-icon", data.sun.symbol || "☀");
      setText("chart-sun-sign", data.sun.sign);

      setText("chart-moon-icon", data.moon.symbol || "☾");
      setText("chart-moon-sign", data.moon.sign);

      setText("chart-rising-icon", data.rising.symbol || "✧");
      setText("chart-rising-sign", data.rising.sign);

      // Display birth details.
      setText("chart-result-date", data.birth_date || birthDate);
      setText("chart-result-time", data.birth_time || birthTime);
      setText("chart-result-place", data.birthplace || birthplace);
      setText("chart-result-timezone", data.timezone || "Not provided");

      // Display personalized interpretations.
      displayInterpretations(data);

      // Draw the sky map when the backend provides sky data.
      if (data.sky) {
        displayBirthSky(data.sky);
      } else {
        console.warn(
          "Birth chart received, but the response does not contain sky data.",
        );
      }

      // Reveal the completed results.
      if (birthChartResults) {
        birthChartResults.hidden = false;

        birthChartResults.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (error) {
      if (chartError) {
        chartError.textContent =
          error.message || "Something went wrong. Please try again.";
      }

      console.error("Birth chart error:", error);
    } finally {
      if (chartSubmitButton) {
        chartSubmitButton.disabled = false;
        chartSubmitButton.textContent = "Calculate My Birth Chart ✨";
      }
    }
  });
}

/* --------------------------------------------------
   6. DRAW THE BIRTH SKY MAP
   -------------------------------------------------- */

function displayBirthSky(sky) {
  const canvas = document.getElementById("birth-sky-canvas");
  const status = document.getElementById("sky-map-status");
  const moonPhase = document.getElementById("sky-moon-phase");
  const moonDetails = document.getElementById("sky-moon-details");

  if (!canvas) {
    console.warn("Birth Sky Map canvas not found in birth-chart.html");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.warn("Unable to create the sky-map drawing context.");
    return;
  }

  const width = canvas.clientWidth || 700;
  const height = 360;

  // Set the canvas drawing dimensions.
  canvas.width = width;
  canvas.height = height;

  // Draw the night-sky background.
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  gradient.addColorStop(0, "#100d2b");
  gradient.addColorStop(1, "#301653");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw decorative background stars.
  ctx.fillStyle = "rgba(255, 231, 163, 0.3)";

  for (let i = 0; i < 70; i++) {
    const x = (i * 137.508) % width;
    const y = (i * 73.317) % height;

    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw selected bright stars returned by the backend.
  const stars = Array.isArray(sky.stars) ? sky.stars : [];

  stars.forEach((star) => {
    const azimuth = Number(star.azimuth);
    const altitude = Number(star.altitude);

    if (!Number.isFinite(azimuth) || !Number.isFinite(altitude)) {
      return;
    }

    const x = (azimuth / 360) * width;
    const y = height - (altitude / 90) * height;

    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);

    ctx.fillStyle = "#ffe7a3";
    ctx.fill();

    ctx.font = "12px Arial";
    ctx.fillStyle = "#fff4d2";
    ctx.fillText(star.name || "Star", x + 5, y - 5);
  });

  // Draw the Moon when it is above the horizon.
  const moon = sky.moon_position;

  if (moon && moon.above_horizon) {
    const azimuth = Number(moon.azimuth);
    const altitude = Number(moon.altitude);

    if (Number.isFinite(azimuth) && Number.isFinite(altitude)) {
      const x = (azimuth / 360) * width;
      const y = height - (altitude / 90) * height;

      ctx.save();

      ctx.shadowColor = "#fff0b5";
      ctx.shadowBlur = 22;

      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);

      ctx.fillStyle = "#fff0b5";
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "#fff0b5";
      ctx.font = "13px Arial";
      ctx.fillText("Moon", x + 18, y);
    }
  }

  // Display the Moon's phase and illumination.
  if (moonPhase && sky.moon_phase) {
    moonPhase.textContent =
      `${sky.moon_phase.phase} — ` +
      `${sky.moon_phase.illumination_percent}% illuminated`;
  }

  // Display the Moon's position.
  if (moonDetails && moon) {
    moonDetails.textContent =
      `Moon altitude: ${moon.altitude}° | ` +
      `Azimuth: ${moon.azimuth}° | ` +
      (moon.above_horizon
        ? "The Moon is above the horizon."
        : "The Moon is below the horizon.");
  }

  // Display the birth details used for the chart.
  const dateElement = document.getElementById("sky-birth-date");
  const timeElement = document.getElementById("sky-birth-time");
  const placeElement = document.getElementById("sky-birth-place");

  const birthDate = document.getElementById("chart-result-date")?.textContent;

  const birthTime = document.getElementById("chart-result-time")?.textContent;

  const birthPlace = document.getElementById("chart-result-place")?.textContent;

  if (dateElement) {
    dateElement.textContent = birthDate || "—";
  }

  if (timeElement) {
    timeElement.textContent = birthTime || "—";
  }

  if (placeElement) {
    placeElement.textContent = birthPlace || "—";
  }

  if (status) {
    status.textContent = `Showing ${stars.length} selected bright stars for the calculated birth sky.`;
  }
}
