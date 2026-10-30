
import hashlib
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import swisseph as swe
from flask import Flask, jsonify, request, send_from_directory
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder


# --------------------------------------------------
# Flask setup
# --------------------------------------------------

app = Flask(__name__)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

geolocator = Nominatim(user_agent="cosmic_compass_app")
timezone_finder = TimezoneFinder()


# --------------------------------------------------
# Zodiac signs
# --------------------------------------------------

ZODIAC_SIGNS = [
    ("Aries", "♈"),
    ("Taurus", "♉"),
    ("Gemini", "♊"),
    ("Cancer", "♋"),
    ("Leo", "♌"),
    ("Virgo", "♍"),
    ("Libra", "♎"),
    ("Scorpio", "♏"),
    ("Sagittarius", "♐"),
    ("Capricorn", "♑"),
    ("Aquarius", "♒"),
    ("Pisces", "♓"),
]


def get_sign_from_longitude(longitude):
    """Convert a celestial longitude into a zodiac sign."""

    longitude = longitude % 360
    index = int(longitude // 30)

    sign, symbol = ZODIAC_SIGNS[index]

    return {
        "sign": sign,
        "symbol": symbol,
    }


def get_sun_sign(birth_date):
    """Calculate the approximate Western Sun sign from the birth date."""

    month = birth_date.month
    day = birth_date.day

    if (month == 3 and day >= 21) or (month == 4 and day <= 19):
        sign = ("Aries", "♈", "You are bold, energetic, and adventurous.")

    elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
        sign = ("Taurus", "♉", "You are patient, dependable, and determined.")

    elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
        sign = ("Gemini", "♊", "You are curious, adaptable, and expressive.")

    elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
        sign = ("Cancer", "♋", "You are caring, intuitive, and protective.")

    elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
        sign = ("Leo", "♌", "You are confident, creative, and warm-hearted.")

    elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
        sign = ("Virgo", "♍", "You are thoughtful, practical, and observant.")

    elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
        sign = ("Libra", "♎", "You value harmony, fairness, and connection.")

    elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
        sign = ("Scorpio", "♏", "You are passionate, determined, and perceptive.")

    elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
        sign = ("Sagittarius", "♐", "You are optimistic, independent, and adventurous.")

    elif (month == 12 and day >= 22) or (month == 1 and day <= 19):
        sign = ("Capricorn", "♑", "You are ambitious, disciplined, and responsible.")

    elif (month == 1 and day >= 20) or (month == 2 and day <= 18):
        sign = ("Aquarius", "♒", "You are original, independent, and imaginative.")

    else:
        sign = ("Pisces", "♓", "You are compassionate, creative, and intuitive.")

    return {
        "sign": sign[0],
        "symbol": sign[1],
        "message": sign[2],
    }


# --------------------------------------------------
# Birthplace lookup
# --------------------------------------------------

def get_birth_location(place):
    """Find birthplace coordinates and its time zone."""

    try:
        location = geolocator.geocode(place, timeout=15)

    except Exception as error:
        app.logger.warning("Birthplace lookup failed: %s", error)

        raise ValueError(
            "Could not look up the birthplace. Check your internet connection "
            "and enter a city and country, for example Bengaluru, India."
        ) from error

    if location is None:
        raise ValueError(
            "Birthplace not found. Please enter a city and country, "
            "for example Bengaluru, India."
        )

    latitude = location.latitude
    longitude = location.longitude

    timezone_name = timezone_finder.timezone_at(
        lat=latitude,
        lng=longitude,
    )

    if timezone_name is None:
        raise ValueError(
            "Could not determine the birthplace's time zone."
        )

    return latitude, longitude, timezone_name


# --------------------------------------------------
# Moon and Rising sign calculations
# --------------------------------------------------

def calculate_moon_and_rising(
    birth_date,
    birth_time,
    latitude,
    longitude,
    timezone_name,
):
    """
    Calculate Moon and Rising signs using Swiss Ephemeris.

    Uses local birth time, converts it to UTC, and calculates
    the astronomical positions for that moment.
    """

    # Convert local birth time to a timezone-aware datetime.
    try:
        local_timezone = ZoneInfo(timezone_name)

    except ZoneInfoNotFoundError as error:
        raise ValueError(
            "The time-zone database is missing. Run "
            "'python -m pip install tzdata' in your active virtual "
            "environment, then restart the server."
        ) from error

    local_datetime = datetime.combine(
        birth_date,
        birth_time,
    ).replace(tzinfo=local_timezone)

    utc_datetime = local_datetime.astimezone(timezone.utc)

    decimal_hour = (
        utc_datetime.hour
        + utc_datetime.minute / 60
        + utc_datetime.second / 3600
        + utc_datetime.microsecond / 3_600_000_000
    )

    # Julian day for the birth moment in UTC.
    julian_day = swe.julday(
        utc_datetime.year,
        utc_datetime.month,
        utc_datetime.day,
        decimal_hour,
    )

    # Calculate Moon position.
    # Indexing the result avoids unpacking the entire return value.
    moon_result = swe.calc_ut(
        julian_day,
        swe.MOON,
        swe.FLG_SWIEPH,
    )

    moon_data = moon_result[0]

    moon_sign = get_sign_from_longitude(
        moon_data[0]
    )

    # Calculate house cusps and angles.
    # Swiss Ephemeris returns a result containing the cusps
    # and the astronomical angles.
    houses_result = swe.houses_ex(
        julian_day,
        latitude,
        longitude,
        b"P",
    )

    house_angles = houses_result[1]

    # The first angle is the Ascendant (Rising sign).
    rising_longitude = house_angles[0]

    rising_sign = get_sign_from_longitude(
        rising_longitude
    )

    return moon_sign, rising_sign


# --------------------------------------------------
# Frontend routes
# --------------------------------------------------

@app.route("/")
def home():
    return send_from_directory(
        FRONTEND_DIR,
        "index.html",
    )


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(
        FRONTEND_DIR,
        filename,
    )


# --------------------------------------------------
# Sun-sign API
# --------------------------------------------------

@app.route("/api/zodiac", methods=["POST"])
def zodiac_api():
    data = request.get_json(silent=True) or {}

    birth_date_text = data.get("birth_date")

    if not birth_date_text:
        return jsonify({
            "error": "Please enter your date of birth."
        }), 400

    try:
        parsed_date = date.fromisoformat(birth_date_text)

    except (ValueError, TypeError):
        return jsonify({
            "error": "Please enter a valid birth date."
        }), 400

    if parsed_date > date.today():
        return jsonify({
            "error": "Birth date cannot be in the future."
        }), 400

    result = get_sun_sign(parsed_date)

    return jsonify({
        "sign": result["sign"],
        "symbol": result["symbol"],
        "message": result["message"],
        "birth_date": parsed_date.isoformat(),
    })


# --------------------------------------------------
# Daily horoscope data
# --------------------------------------------------

HOROSCOPES = {
    "Aries": {
        "horoscope": "Take initiative today, but pause before making important decisions.",
        "love": "Honest communication can help strengthen your connections.",
        "career": "Focus your energy on one important task at a time.",
        "lucky_number": 9,
        "lucky_colour": "Red",
    },
    "Taurus": {
        "horoscope": "A steady approach may help you feel more confident today.",
        "love": "Make time for meaningful conversations with people you care about.",
        "career": "Patience and careful planning can help you make progress.",
        "lucky_number": 6,
        "lucky_colour": "Green",
    },
    "Gemini": {
        "horoscope": "Stay curious and be open to learning something new.",
        "love": "A thoughtful message could brighten someone's day.",
        "career": "Sharing ideas and asking questions may help you solve a problem.",
        "lucky_number": 5,
        "lucky_colour": "Yellow",
    },
    "Cancer": {
        "horoscope": "Give yourself space to reflect and recharge.",
        "love": "Kindness and listening can make conversations more meaningful.",
        "career": "Trust your preparation and work through tasks calmly.",
        "lucky_number": 2,
        "lucky_colour": "Silver",
    },
    "Leo": {
        "horoscope": "Let your creativity shine while making room for others' ideas.",
        "love": "A little appreciation can bring warmth to your relationships.",
        "career": "Use your confidence to contribute constructively to a shared goal.",
        "lucky_number": 1,
        "lucky_colour": "Gold",
    },
    "Virgo": {
        "horoscope": "Small, practical steps can help you feel organised and focused.",
        "love": "Show you care through thoughtful words and actions.",
        "career": "Review the details, but remember that progress matters more than perfection.",
        "lucky_number": 5,
        "lucky_colour": "Navy Blue",
    },
    "Libra": {
        "horoscope": "Look for balance between your responsibilities and personal time.",
        "love": "A calm conversation may help clear up a misunderstanding.",
        "career": "Cooperation and fairness can make teamwork easier.",
        "lucky_number": 6,
        "lucky_colour": "Pink",
    },
    "Scorpio": {
        "horoscope": "Make time to understand your priorities before taking action.",
        "love": "Being open about your feelings may encourage deeper understanding.",
        "career": "Concentrate on meaningful work instead of unnecessary distractions.",
        "lucky_number": 8,
        "lucky_colour": "Maroon",
    },
    "Sagittarius": {
        "horoscope": "A fresh perspective may inspire you to explore a new idea.",
        "love": "Share your enthusiasm while making time to listen.",
        "career": "Learning a new skill could be a useful investment in yourself.",
        "lucky_number": 3,
        "lucky_colour": "Purple",
    },
    "Capricorn": {
        "horoscope": "Consistent effort can help you move towards your goals.",
        "love": "Make room for connection alongside your busy schedule.",
        "career": "Break a large task into manageable steps.",
        "lucky_number": 4,
        "lucky_colour": "Brown",
    },
    "Aquarius": {
        "horoscope": "Give yourself permission to think creatively and differently.",
        "love": "An open-minded conversation could help you see another perspective.",
        "career": "Consider an original approach to a familiar challenge.",
        "lucky_number": 7,
        "lucky_colour": "Turquoise",
    },
    "Pisces": {
        "horoscope": "A quiet moment may help you reconnect with your priorities.",
        "love": "Compassion and clear communication can support your connections.",
        "career": "Use your imagination while keeping your plans realistic.",
        "lucky_number": 7,
        "lucky_colour": "Sea Green",
    },
}


# --------------------------------------------------
# Daily horoscope API
# --------------------------------------------------

@app.route("/api/horoscope/<sign>", methods=["GET"])
def daily_horoscope(sign):
    sign = sign.title()

    if sign not in HOROSCOPES:
        return jsonify({
            "error": "Invalid zodiac sign."
        }), 400

    today = date.today().isoformat()

    seed = f"{today}-{sign}"

    variation = (
        int(
            hashlib.sha256(
                seed.encode("utf-8")
            ).hexdigest(),
            16,
        ) % 3
    )

    variations = [
        "Take a moment to recognise the progress you have made.",
        "Stay open to new perspectives and small opportunities.",
        "Give yourself time to reflect before choosing your next step.",
    ]

    base = HOROSCOPES[sign]

    return jsonify({
        "sign": sign,
        "date": today,
        "horoscope": base["horoscope"],
        "reflection": variations[variation],
        "love": base["love"],
        "career": base["career"],
        "lucky_number": base["lucky_number"],
        "lucky_colour": base["lucky_colour"],
    })


# --------------------------------------------------
# Birth-chart API
# --------------------------------------------------

@app.route("/api/birth-chart", methods=["POST"])
def birth_chart_api():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid request. Please submit your birth details."
        }), 400

    birth_date_text = data.get("birth_date")
    birth_time_text = data.get("birth_time")
    birthplace = data.get("birthplace")

    if not birth_date_text or not birth_time_text or not birthplace:
        return jsonify({
            "error": (
                "Please enter your birth date, birth time, and birthplace."
            )
        }), 400

    if not isinstance(birthplace, str) or not birthplace.strip():
        return jsonify({
            "error": "Please enter a valid birthplace."
        }), 400

    try:
        parsed_date = date.fromisoformat(
            birth_date_text
        )

        parsed_time = datetime.strptime(
            birth_time_text,
            "%H:%M",
        ).time()

        if parsed_date > date.today():
            return jsonify({
                "error": "Birth date cannot be in the future."
            }), 400

        clean_birthplace = birthplace.strip()

        latitude, longitude, timezone_name = get_birth_location(
            clean_birthplace
        )

        sun_result = get_sun_sign(parsed_date)

        moon_result, rising_result = calculate_moon_and_rising(
            parsed_date,
            parsed_time,
            latitude,
            longitude,
            timezone_name,
        )

        return jsonify({
            "success": True,
            "sun": {
                "sign": sun_result["sign"],
                "symbol": sun_result["symbol"],
                "message": sun_result["message"],
            },
            "moon": moon_result,
            "rising": rising_result,
            "birth_date": parsed_date.isoformat(),
            "birth_time": parsed_time.strftime("%H:%M"),
            "birthplace": clean_birthplace,
            "timezone": timezone_name,
        })

    except (ValueError, TypeError) as error:
        return jsonify({
            "error": str(error) or "Please check your birth details."
        }), 400

    except Exception:
        app.logger.exception(
            "Birth chart calculation failed"
        )

        return jsonify({
            "error": (
                "An unexpected error occurred while calculating your "
                "birth chart. Check the backend terminal for details."
            )
        }), 500


# --------------------------------------------------
# Run the server
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
