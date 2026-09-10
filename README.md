# ✦ Articrare

<p align="center">
  <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80" alt="Articrare Banner" width="100%" style="border-radius: 12px; max-height: 380px; object-fit: cover;" />
</p>

<p align="center">
  <strong>Where sketches meet constructive eyes.</strong><br>
  An interactive, AI-powered platform for sketch artists to share raw studies, receive constructive community critique, and get automated vision analysis on their artwork.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/Google_Gemini-Vision_AI-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini Vision" />
  <img src="https://img.shields.io/badge/SQLite_%2F_PostgreSQL-Database-003B57?style=for-the-badge&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Railway-Deploy_Ready-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" alt="Railway" />
</p>

---

## 🌟 Features

### 🎨 1. Instant Sketch Upload & Live Preview
- Choose or drag-and-drop raw sketches (PNG, JPG, WEBP).
- Client-side image preview using HTML5 `FileReader` API before publishing.
- Tag artwork by medium (Pencil & Graphite, Charcoal, Ink & Line Art, Anime/Manga, Concept Art) and critique focus area.

### 🤖 2. Gemini AI Vision Critique
- Integrated with **Google Gemini Vision** (`gemini-1.5-flash`).
- The AI analyzes the actual visual pixels of the uploaded sketch.
- Delivers an intelligent **Rating (1-10)**, notes **Key Strengths** (e.g. gesture grounding, contour control), and gives targeted **Actionable Suggestions** (e.g. value depth, limb proportions).
- Intelligent fallback mode ensures the app runs smoothly even before API keys are configured.

### 👥 3. Community Feedback & 10-Star Ratings
- Dedicated critique feed for each artwork (`/sketch/<id>/`).
- Interactive **10-star rating picker** with real-time preview and community score averaging.
- Constructive critique comment system where fellow artists discuss techniques, brushstrokes, and improvements.

### 👤 4. Artist Profiles & Portfolio Hub
- Comprehensive artist profile page (`/profile/<username>/`).
- Displays artist statistics: total uploaded sketches, cumulative likes, and community average rating.
- Dedicated gallery showcasing each artist's individual progression over time.

### ⚡ 5. Production & Cloud Ready
- **WhiteNoise** for ultra-fast static file serving without external CDN dependencies.
- Automatic database switching: lightweight **SQLite** for local development, robust **PostgreSQL** in production.
- Pre-configured `Procfile`, `railway.toml`, and `.env` support.

---

## 🏗️ Architecture & Workflow

```
Artist (Browser)
   │
   ├── [1. Client Preview] ──► Instant HTML5 FileReader Preview
   │
   └── [2. Upload Form (POST)]
             │
             ├──► Django View (artwork/views.py)
             │        │
             │        ├──► Save Image File (`media/sketches/`)
             │        │
             │        ├──► AI Vision Service (`artwork/ai_critique.py`)
             │        │         │
             │        │         └──► Google Gemini Vision API
             │        │                  └──► Score, Strengths, Suggestions
             │        │
             │        └──► Persist Record to Database (SQLite / PostgreSQL)
             │
             └──► Render Live Gallery & Community Feed
```

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Django 5.2 (MVT Architecture) |
| **Frontend** | Semantic HTML5, Modern CSS3 (Dark Studio Theme), Vanilla JS |
| **Artificial Intelligence** | Google Gemini Vision API (`google-generativeai`) |
| **Database** | SQLite (Local Dev) / PostgreSQL (Production via `dj-database-url`) |
| **Asset & Media Handling** | Pillow (PIL), WhiteNoise, Django Media Engine |
| **Deployment** | Gunicorn WSGI, Railway / Render, Nixpacks |

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.10 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Manishrathore07/articrare.git
cd articrare
```

### 2. Create and Activate a Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables (Optional)
Copy the example environment file:
```bash
cp .env.example .env
```
Add your free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) inside `.env`:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Run Database Migrations
```bash
python manage.py migrate
```

### 6. (Optional) Seed Sample Artwork
```bash
python seed_data.py
```

### 7. Start the Development Server
```bash
python manage.py runserver 127.0.0.1:8080
```
Open **[http://127.0.0.1:8080/](http://127.0.0.1:8080/)** in your browser!

---

## 🌐 Deploying to Railway (One-Click)

1. Fork or push this repository to your GitHub account.
2. Sign in to **[Railway.app](https://railway.app)** using GitHub.
3. Click **New Project** → **Deploy from GitHub repo** → select **`articrare`**.
4. In your project, click **Add Service** → **Database** → **PostgreSQL**.
5. Go to your service's **Variables** tab and set:
   - `DEBUG` = `False`
   - `SECRET_KEY` = `your-secret-production-key`
   - `GEMINI_API_KEY` = `your_gemini_api_key`
6. Under **Settings** → **Networking**, click **Generate Domain**.

Your app is live with SSL at `https://your-domain.up.railway.app`!

---

## 📁 Project Structure

```
articrare/
├── artwork/                    # Main application package
│   ├── models.py               # Artwork & Comment models
│   ├── views.py                # Upload, Gallery, Auth, and Critique views
│   ├── urls.py                 # Route definitions
│   ├── ai_critique.py          # Gemini Vision integration service
│   └── migrations/             # Database migration history
├── config/                     # Django project configuration
│   ├── settings.py             # Dual-mode (Dev / Prod) settings
│   ├── urls.py                 # Root URL configuration
│   └── wsgi.py                 # Production WSGI entrypoint
├── templates/                  # Django HTML templates
│   ├── index.html              # Main feed & upload interface
│   ├── sketch_detail.html      # Individual critique & rating page
│   ├── profile.html            # Artist portfolio & stats
│   ├── login.html              # Artist login portal
│   └── register.html           # New artist registration
├── static/                     # Design system assets
│   ├── styles.css              # Dark-mode artist studio CSS
│   └── app.js                  # Dynamic client-side interactivity
├── media/                      # Uploaded artwork storage (local)
├── requirements.txt            # Python dependencies
├── Procfile                    # Railway / Heroku production command
├── railway.toml                # Railway deployment build config
└── README.md                   # Project documentation
```

---

## 🛣️ Roadmap

- [x] **Milestone 1**: Semantic UI & Client-Side Image Previews
- [x] **Milestone 2**: Full-Stack Django, SQLite, and Persistent Media Storage
- [x] **Milestone 3**: User Authentication & Artist Portfolios
- [x] **Milestone 4**: Interactive 10-Star Ratings & Written Critiques
- [x] **Milestone 5**: Google Gemini Vision AI Art Critique
- [x] **Milestone 6**: Production Architecture & Deployment Packaging
- [ ] **Milestone 7**: Community Leaderboards & Weekly Sketch Prompts

---

## 👨‍💻 Author

**Manish Kumar Rathore**
- GitHub: [@Manishrathore07](https://github.com/Manishrathore07)
- Email: manishkumarrathore0711@gmail.com

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
