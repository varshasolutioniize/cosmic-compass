COSMIC COMPASS - FIXED PROJECT FILES

Folder structure:
cosmic-compass-fixed/
  backend/app.py
  frontend/index.html
  frontend/script.js
  frontend/style.css
  frontend/birth-chart.html
  frontend/birth-chart.js
  requirements.txt

SETUP (Windows PowerShell):
1. Extract this ZIP.
2. Open the extracted cosmic-compass-fixed folder in VS Code.
3. Open Terminal > New Terminal.
4. Create and activate a virtual environment if needed:
   python -m venv .venv
   .venv\Scripts\Activate.ps1
5. Install packages:
   python -m pip install -r requirements.txt
6. Run:
   python backend/app.py
7. Open http://127.0.0.1:5000/
8. For the full birth chart, click Birth Chart or open:
   http://127.0.0.1:5000/birth-chart.html

NOTES:
- Internet access is needed for geocoding a birthplace.
- Enter a specific birthplace, e.g. Bengaluru, India.
- The birth time should be as accurate as possible for the Rising sign.
- Astrology results are for entertainment and personal reflection.
- If your existing virtual environment already has the required packages, you can use it rather than creating a new one.
