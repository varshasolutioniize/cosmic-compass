from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import swisseph as swe
from flask import Flask, jsonify, request, send_from_directory
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__)
geolocator = Nominatim(user_agent="cosmic_compass_zodiac_app")
timezone_finder = TimezoneFinder()

SIGNS = [
    ("Aries", "♈"), ("Taurus", "♉"), ("Gemini", "♊"),
    ("Cancer", "♋"), ("Leo", "♌"), ("Virgo", "♍"),
    ("Libra", "♎"), ("Scorpio", "♏"), ("Sagittarius", "♐"),
    ("Capricorn", "♑"), ("Aquarius", "♒"), ("Pisces", "♓"),
]

SIGN_MESSAGES = {
    "Aries": "Your courage can help you begin something meaningful. Direct your energy with patience.",
    "Taurus": "Steady effort and comfort matter to you. Give yourself time to build what lasts.",
    "Gemini": "Curiosity and communication are your strengths. Make room for both learning and listening.",
    "Cancer": "Your sensitivity can help you care deeply. Remember to offer that same care to yourself.",
    "Leo": "Your warmth and creativity can inspire others. Let confidence and kindness work together.",
    "Virgo": "Your eye for detail can turn plans into progress. Remember that good enough can be enough.",
    "Libra": "You often seek balance and connection. Make choices that respect your own needs, too.",
    "Scorpio": "You may value depth and honesty. Use your determination thoughtfully and allow room for trust.",
    "Sagittarius": "Exploration can refresh your perspective. Keep your optimism grounded in practical steps.",
    "Capricorn": "Persistence helps you move toward long-term goals. Celebrate small milestones along the way.",
    "Aquarius": "Independent thinking helps you see new possibilities. Share your ideas while staying open to others.",
    "Pisces": "Imagination and empathy can guide you. Give your dreams structure and protect your boundaries.",
}

HOROSCOPES = {
    "Aries": ("Take one clear step toward a goal instead of trying to do everything at once.", "What deserves your energy today?", "Honest, gentle communication can bring you closer.", "Choose one priority and finish it.", 9, "Coral"),
    "Taurus": ("A calm pace can help you make a thoughtful decision.", "Where would a little patience help?", "A small act of care can mean a lot.", "Focus on steady progress over speed.", 6, "Green"),
    "Gemini": ("A useful conversation may give you a fresh perspective.", "What could you learn by asking one more question?", "Listen as carefully as you speak.", "Write down your ideas before choosing one.", 5, "Yellow"),
    "Cancer": ("Make space for both your responsibilities and your feelings.", "What would help you feel grounded?", "Kindness starts with honest, considerate words.", "Break a large task into smaller steps.", 2, "Silver"),
    "Leo": ("Share your ideas confidently while leaving room for others.", "How can you lead with warmth today?", "Appreciation can strengthen a connection.", "Let creativity support a practical plan.", 1, "Gold"),
    "Virgo": ("A simple plan can make a busy day feel more manageable.", "What can you simplify today?", "Avoid expecting perfection from yourself or others.", "Check the details, then move forward.", 4, "Navy"),
    "Libra": ("A balanced choice may be better than a perfect one.", "Which need have you been putting aside?", "Make room for fairness and direct communication.", "Clarify priorities before agreeing to more work.", 7, "Pink"),
    "Scorpio": ("Focus your determination on what you can influence.", "What is worth your attention right now?", "Trust grows through consistency and honesty.", "Protect time for concentrated work.", 8, "Burgundy"),
    "Sagittarius": ("A new idea can be useful when paired with a realistic next step.", "What would you like to explore?", "Share your hopes while staying curious about theirs.", "Choose a measurable next action.", 3, "Purple"),
    "Capricorn": ("Small, consistent efforts can build lasting progress.", "Which milestone would feel satisfying to reach?", "Make time for connection alongside commitments.", "Prioritize the task with the greatest impact.", 10, "Charcoal"),
    "Aquarius": ("An unconventional idea may be worth testing on a small scale.", "What assumption could you reconsider?", "Respect different perspectives without losing your own voice.", "Try a fresh approach to one routine task.", 11, "Turquoise"),
    "Pisces": ("A little quiet time can help you sort through competing thoughts.", "What is your intuition asking you to notice?", "Gentle honesty can make a conversation clearer.", "Turn an imaginative idea into one practical step.", 12, "Sea blue"),
}

def sign_from_longitude(longitude):
    index = int((float(longitude) % 360) // 30)
    sign, symbol = SIGNS[index]
    return {"sign": sign, "symbol": symbol}

def get_sun_sign(birth_date):
    month, day = birth_date.month, birth_date.day
    # Standard tropical zodiac date ranges; boundaries are approximate.
    ranges = [
        ((3, 21), (4, 19), "Aries"), ((4, 20), (5, 20), "Taurus"),
        ((5, 21), (6, 20), "Gemini"), ((6, 21), (7, 22), "Cancer"),
        ((7, 23), (8, 22), "Leo"), ((8, 23), (9, 22), "Virgo"),
        ((9, 23), (10, 22), "Libra"), ((10, 23), (11, 21), "Scorpio"),
        ((11, 22), (12, 21), "Sagittarius"), ((12, 22), (1, 19), "Capricorn"),
        ((1, 20), (2, 18), "Aquarius"), ((2, 19), (3, 20), "Pisces"),
    ]
    current = (month, day)
    for start, end, sign in ranges:
        if start <= end and start <= current <= end:
            return {"sign": sign, "symbol": dict(SIGNS)[sign], "message": SIGN_MESSAGES[sign]}
        if start > end and (current >= start or current <= end):
            return {"sign": sign, "symbol": dict(SIGNS)[sign], "message": SIGN_MESSAGES[sign]}
    sign = "Pisces"
    return {"sign": sign, "symbol": dict(SIGNS)[sign], "message": SIGN_MESSAGES[sign]}

def get_birth_location(place):
    """Resolve a place name to coordinates and a timezone."""
    try:
        location = geolocator.geocode(place, timeout=10)
    except Exception as exc:
        raise ValueError("Could not look up that birthplace. Check your internet connection and try again.") from exc
    if location is None:
        raise ValueError("Birthplace not found. Try a more specific place, such as 'Bengaluru, India'.")
    latitude, longitude = float(location.latitude), float(location.longitude)
    timezone_name = timezone_finder.timezone_at(lat=latitude, lng=longitude)
    print("DEBUG timezone_name:", repr(timezone_name))
    print("DEBUG latitude:", latitude)
    print("DEBUG longitude:", longitude)
    if not timezone_name:
        raise ValueError("Could not determine the timezone for that birthplace.")
    return latitude, longitude, timezone_name

def calculate_moon_and_rising(birth_date, birth_time, latitude, longitude, timezone_name):
    """Calculate approximate tropical Moon and Ascendant signs with Swiss Ephemeris."""
    print("DEBUG timezone_name:", repr(timezone_name))

    try:
        local_datetime = datetime.combine(birth_date, birth_time).replace(
            tzinfo=ZoneInfo(timezone_name)
        )
    except Exception as exc:
        print("TIMEZONE ERROR:", repr(exc))
        raise ValueError(
            f"Invalid timezone name: {timezone_name!r}. Details: {exc}"
        ) from exc

    utc_datetime = local_datetime.astimezone(timezone.utc)
    decimal_hour = (
        utc_datetime.hour
        + utc_datetime.minute / 60.0
        + utc_datetime.second / 3600.0
    )
    julian_day = swe.julday(
        utc_datetime.year, utc_datetime.month, utc_datetime.day, decimal_hour
    )

    moon_result = swe.calc_ut(julian_day, swe.MOON, swe.FLG_SWIEPH)
    # Swiss Ephemeris returns (planet_coordinates, return_flags).
    moon_coordinates = moon_result[0]
    moon = sign_from_longitude(moon_coordinates[0])

    # houses_ex returns (house_cusps, angle_points); Ascendant is angle_points[0].
    houses_result = swe.houses_ex(
        julian_day, float(latitude), float(longitude), b"P"
    )
    if not isinstance(houses_result, tuple) or len(houses_result) < 2:
        raise ValueError("The birth-chart house calculation did not return expected data.")
    angle_points = houses_result[1]
    rising = sign_from_longitude(angle_points[0])

    return moon, rising

    # Bright stars: name, right ascension (hours), declination (degrees), constellation
BRIGHT_STARS = [
    ("Sirius", 6.7525, -16.7161, "Canis Major"),
    ("Canopus", 6.3992, -52.6957, "Carina"),
    ("Arcturus", 14.2610, 19.1825, "Boötes"),
    ("Vega", 18.6156, 38.7837, "Lyra"),
    ("Capella", 5.2782, 45.9980, "Auriga"),
    ("Rigel", 5.2423, -8.2016, "Orion"),
    ("Procyon", 7.6550, 5.2250, "Canis Minor"),
    ("Betelgeuse", 5.9195, 7.4071, "Orion"),
    ("Altair", 19.8464, 8.8683, "Aquila"),
    ("Polaris", 2.5303, 89.2641, "Ursa Minor"),
    ("Spica", 13.4199, -11.1614, "Virgo"),
    ("Antares", 16.4901, -26.4320, "Scorpius"),
    ("Deneb", 20.6905, 45.2803, "Cygnus"),
    ("Regulus", 10.1395, 11.9672, "Leo"),
    ("Aldebaran", 4.5987, 16.5093, "Taurus"),
]


def get_moon_phase(julian_day):
    """Calculate the approximate Moon phase and illuminated fraction."""
    sun_result = swe.calc_ut(julian_day, swe.SUN)
    moon_result = swe.calc_ut(julian_day, swe.MOON)

    sun_longitude = sun_result[0][0]
    moon_longitude = moon_result[0][0]

    elongation = (moon_longitude - sun_longitude) % 360
    illumination = (1 - __import__("math").cos(
        __import__("math").radians(elongation)
    )) / 2

    if elongation < 22.5 or elongation >= 337.5:
        phase = "New Moon"
    elif elongation < 67.5:
        phase = "Waxing Crescent"
    elif elongation < 112.5:
        phase = "First Quarter"
    elif elongation < 157.5:
        phase = "Waxing Gibbous"
    elif elongation < 202.5:
        phase = "Full Moon"
    elif elongation < 247.5:
        phase = "Waning Gibbous"
    elif elongation < 292.5:
        phase = "Last Quarter"
    else:
        phase = "Waning Crescent"

    return {
        "phase": phase,
        "illumination_percent": round(illumination * 100, 1),
        "elongation_degrees": round(elongation, 2),
    }


def equatorial_to_horizontal(ra_hours, dec_degrees, latitude, longitude, julian_day):
    """Convert right ascension and declination to local altitude and azimuth."""
    import math

    lat = math.radians(latitude)
    dec = math.radians(dec_degrees)

    # Greenwich sidereal time plus the observer's longitude.
    local_sidereal_hours = (swe.sidtime(julian_day) + longitude / 15) % 24
    hour_angle_hours = (local_sidereal_hours - ra_hours + 12) % 24 - 12
    hour_angle = math.radians(hour_angle_hours * 15)

    sin_altitude = (
        math.sin(dec) * math.sin(lat)
        + math.cos(dec) * math.cos(lat) * math.cos(hour_angle)
    )
    altitude = math.degrees(math.asin(max(-1, min(1, sin_altitude))))

    azimuth = math.degrees(math.atan2(
        -math.sin(hour_angle) * math.cos(dec),
        math.sin(dec) * math.cos(lat)
        - math.cos(dec) * math.sin(lat) * math.cos(hour_angle)
    )) % 360

    return round(altitude, 2), round(azimuth, 2)


def calculate_birth_sky(birth_date, birth_time, latitude, longitude, timezone_name):
    """Return Moon phase, Moon position, and selected bright-star positions."""
    local_datetime = datetime.combine(
        birth_date, birth_time
    ).replace(tzinfo=ZoneInfo(timezone_name))

    utc_datetime = local_datetime.astimezone(timezone.utc)

    decimal_hour = (
        utc_datetime.hour
        + utc_datetime.minute / 60
        + utc_datetime.second / 3600
    )

    julian_day = swe.julday(
        utc_datetime.year,
        utc_datetime.month,
        utc_datetime.day,
        decimal_hour,
    )

    phase = get_moon_phase(julian_day)

    # Equatorial coordinates for the Moon.
    moon_result = swe.calc_ut(
        julian_day, swe.MOON, swe.FLG_SWIEPH | swe.FLG_EQUATORIAL
    )
    moon_coordinates = moon_result[0]
    moon_altitude, moon_azimuth = equatorial_to_horizontal(
        moon_coordinates[0] / 15,
        moon_coordinates[1],
        latitude,
        longitude,
        julian_day,
    )

    stars = []
    for name, ra, dec, constellation in BRIGHT_STARS:
        altitude, azimuth = equatorial_to_horizontal(
            ra, dec, latitude, longitude, julian_day
        )

        # Include stars above the local horizon.
        if altitude > 0:
            stars.append({
                "name": name,
                "constellation": constellation,
                "altitude": altitude,
                "azimuth": azimuth,
            })

    return {
        "moon_phase": phase,
        "moon_position": {
            "altitude": moon_altitude,
            "azimuth": moon_azimuth,
            "above_horizon": moon_altitude > 0,
        },
        "stars": stars,
        "coordinates": {
            "latitude": round(latitude, 4),
            "longitude": round(longitude, 4),
        },
        "calculation_time_utc": utc_datetime.isoformat(),
        "note": (
            "Star positions are calculated for the selected time and location. "
            "The star list contains selected bright stars, not every visible star."
        ),
    }

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.post("/api/zodiac")
def zodiac_api():
    data = request.get_json(silent=True) or {}
    try:
        birth_date = date.fromisoformat(data.get("birth_date", ""))
        if birth_date > date.today():
            raise ValueError("Birth date cannot be in the future.")
        return jsonify(get_sun_sign(birth_date))
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc) or "Please enter a valid birth date."}), 400

@app.get("/api/horoscope/<sign>")
def horoscope_api(sign):
    normalized = sign.strip().title()
    if normalized not in HOROSCOPES:
        return jsonify({"error": "Unknown zodiac sign."}), 404
    today = date.today().isoformat()
    today_text, reflection, love, career, lucky_number, lucky_colour = HOROSCOPES[normalized]
    # Daily choice is stable for a given sign and date.
    import hashlib
    seed = int(hashlib.sha256(f"{today}:{normalized}".encode()).hexdigest()[:8], 16)
    variants = [
        today_text,
        "Leave room for a useful surprise, and focus on what you can control.",
        "A thoughtful pause can help you choose your next step with confidence.",
    ]
    return jsonify({
        "sign": normalized, "date": today,
        "horoscope": variants[seed % len(variants)],
        "reflection": reflection, "love": love, "career": career,
        "lucky_number": lucky_number, "lucky_colour": lucky_colour,
    })

@app.post("/api/birth-chart")
def birth_chart_api():
    data = request.get_json(silent=True) or {}
    try:
        birth_date = date.fromisoformat(data.get("birth_date", ""))
        birth_time = datetime.strptime(data.get("birth_time", ""), "%H:%M").time()
        birthplace = (data.get("birthplace") or "").strip()
        if not birthplace:
            raise ValueError("Please enter your birthplace.")
        if birth_date > date.today():
            raise ValueError("Birth date cannot be in the future.")

        latitude, longitude, timezone_name = get_birth_location(birthplace)
        sun = get_sun_sign(birth_date)
        moon, rising = calculate_moon_and_rising(
            birth_date, birth_time, latitude, longitude, timezone_name
        )
        sky = calculate_birth_sky(
    birth_date, birth_time, latitude, longitude, timezone_name
      )

        return jsonify({
            "sun": sun, "moon": moon, "rising": rising,
            "birth_date": birth_date.isoformat(),
            "birth_time": birth_time.strftime("%H:%M"),
            "birthplace": birthplace,
            "timezone": timezone_name,
            "sky": sky,
        })
    except (ValueError, TypeError) as exc:
        app.logger.exception("Birth-chart request failed validation or calculation")
        return jsonify({"error": str(exc) or "Please check your birth details."}), 400
    except Exception as exc:
        app.logger.exception("Unexpected birth-chart calculation failure")
        return jsonify({"error": "The birth chart could not be calculated. Check the terminal for the detailed error."}), 500

if __name__ == "__main__":
    app.run(debug=True)
