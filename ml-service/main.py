from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from predictor import predict_disease, predict_forecast
from satellite import fetch_ndvi, fetch_weather

# ── CUSTOM OPENAPI METADATA ───────────────────────────────
app = FastAPI(
    title          = "🌾 KrishiSat AI",
    description    = """
## Satellite-Based Crop Disease Early Warning System

**Two powerful AI models working together:**

| Model | Task | Accuracy |
|-------|------|----------|
| 🔬 EfficientNetB0 CNN | Crop Disease Detection | **91.75%** Top-1 |
| 📈 BiLSTM + Attention | 7-Day Risk Forecasting | **MAE: 0.065** |

### 📡 Data Sources
- **Sentinel-2** satellite imagery (10m resolution)
- **OpenWeatherMap** real-time weather data
- **71,717 training images** across 96 disease classes

### 🔗 Available Endpoints
- `/predict/disease` — Upload leaf image → get disease + confidence
- `/predict/forecast` — NDVI time-series → 7-day risk forecast  
- `/predict/full` — Full satellite pipeline (NDVI + weather + forecast)
- `/districts/sample` — Maharashtra sample districts

---
*Built for Deep Learning Laboratory Capstone — 2025-26*
    """,
    version        = "1.0.0",
    contact        = {
        "name" : "KrishiSat AI Team",
        "email": "krishisat@example.com"
    },
    license_info   = {
        "name": "MIT License"
    },
    docs_url       = None,    # Custom docs banayenge
    redoc_url      = "/redoc"
)

# ── CUSTOM SWAGGER UI ─────────────────────────────────────
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return HTMLResponse("""
<!DOCTYPE html>
<html lang="en">
<head>
  <title>KrishiSat AI — API Console</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    /* ╔═══════════════════════════════════════════════════════╗
       ║  KRISHISAT AI  —  OBSIDIAN DARK THEME  v2.0         ║
       ╚═══════════════════════════════════════════════════════╝ */

    :root {
      /* ── Surface layers ── */
      --s-0  : #04060b;
      --s-1  : #080c14;
      --s-2  : #0c1019;
      --s-3  : #10141e;
      --s-4  : #151a28;
      --s-5  : #1a2032;

      /* ── Borders ── */
      --b-1  : rgba(255,255,255,.04);
      --b-2  : rgba(255,255,255,.07);
      --b-3  : rgba(255,255,255,.10);
      --b-glow: rgba(52,211,153,.15);

      /* ── Brand palette ── */
      --accent  : #34d399;
      --accent-l: #6ee7b7;
      --accent-d: #059669;
      --accent-x: #047857;
      --cyan     : #22d3ee;
      --cyan-d   : #0891b2;
      --blue     : #60a5fa;
      --blue-d   : #2563eb;
      --violet   : #a78bfa;
      --amber    : #fbbf24;
      --rose     : #fb7185;
      --orange   : #fb923c;

      /* ── Text ── */
      --t-0  : #ffffff;
      --t-1  : #e8ecf4;
      --t-2  : #94a3b8;
      --t-3  : #64748b;
      --t-4  : #475569;

      /* ── Sizes ── */
      --r-xs : 6px;
      --r-sm : 8px;
      --r-md : 12px;
      --r-lg : 16px;
      --r-xl : 20px;
      --r-2xl: 24px;

      /* ── Shadows ── */
      --sh-sm  : 0 1px 2px rgba(0,0,0,.3);
      --sh-md  : 0 4px 16px rgba(0,0,0,.4);
      --sh-lg  : 0 8px 40px rgba(0,0,0,.5);
      --sh-glow: 0 0 30px rgba(52,211,153,.08);
      --sh-inset: inset 0 1px 0 rgba(255,255,255,.03);

      /* ── Gradients ── */
      --g-brand : linear-gradient(135deg, #34d399, #22d3ee);
      --g-brand2: linear-gradient(135deg, #059669, #0891b2);
      --g-glass : linear-gradient(180deg, rgba(255,255,255,.025) 0%, transparent 100%);
      --g-mesh  : radial-gradient(ellipse 60% 40% at 20% 0%, rgba(52,211,153,.04) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 40% at 80% 0%, rgba(34,211,238,.03) 0%, transparent 60%);
    }

    /* ── RESET ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

    body {
      font-family   : 'Inter', system-ui, -apple-system, sans-serif;
      background    : var(--s-0);
      background-image: var(--g-mesh);
      background-attachment: fixed;
      color         : var(--t-1);
      min-height    : 100vh;
      overflow-x    : hidden;
      line-height   : 1.5;
    }

    /* ── SCROLLBAR ── */
    ::-webkit-scrollbar       { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--s-4); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-d); }

    /* ════════════════════════════════════
       NAVIGATION BAR
    ════════════════════════════════════ */
    .nav {
      position   : sticky;
      top        : 0;
      z-index    : 500;
      height     : 56px;
      background : rgba(4,6,11,.78);
      backdrop-filter: blur(20px) saturate(1.6);
      -webkit-backdrop-filter: blur(20px) saturate(1.6);
      border-bottom: 1px solid var(--b-1);
      display    : flex;
      align-items: center;
      padding    : 0 clamp(16px, 3vw, 32px);
      gap        : 0;
    }

    .nav-brand {
      display    : flex;
      align-items: center;
      gap        : 10px;
      margin-right: 16px;
    }

    .nav-icon {
      width : 32px; height: 32px;
      border-radius: var(--r-sm);
      background: linear-gradient(135deg, rgba(52,211,153,.12), rgba(34,211,238,.12));
      border : 1px solid rgba(52,211,153,.2);
      display: grid; place-items: center;
      font-size: .95rem;
      box-shadow: 0 0 12px rgba(52,211,153,.1);
    }

    .nav-title {
      font-weight: 800;
      font-size  : .95rem;
      background : var(--g-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -.2px;
    }

    .nav-sep {
      width: 1px; height: 24px;
      background: var(--b-2);
      margin: 0 14px;
    }

    .nav-label {
      font-size: .72rem;
      color: var(--t-4);
      letter-spacing: .2px;
      font-weight: 500;
    }

    .nav-right {
      margin-left: auto;
      display: flex;
      gap: 7px;
      align-items: center;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: var(--r-xs);
      font-size: .66rem;
      font-weight: 600;
      letter-spacing: .15px;
      border: 1px solid;
    }
    .chip-g {
      background: rgba(52,211,153,.06);
      border-color: rgba(52,211,153,.18);
      color: var(--accent);
    }
    .chip-c {
      background: rgba(34,211,238,.06);
      border-color: rgba(34,211,238,.18);
      color: var(--cyan);
    }
    .chip-v {
      background: rgba(167,139,250,.06);
      border-color: rgba(167,139,250,.18);
      color: var(--violet);
    }

    .chip-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: currentColor;
      animation: blink 2.4s ease-in-out infinite;
    }
    @keyframes blink {
      0%,100% { opacity:1; }
      50%     { opacity:.3; }
    }

    /* ════════════════════════════════════
       HERO SECTION
    ════════════════════════════════════ */
    .hero-wrap {
      max-width: 1120px;
      margin: 0 auto;
      padding: 52px clamp(16px, 3vw, 36px) 44px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 40px;
      align-items: center;
    }

    .hero-left {}

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      font-size: .68rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .hero-tag-line {
      width: 28px; height: 1.5px;
      background: var(--g-brand);
      border-radius: 2px;
    }

    .hero-h1 {
      font-size: clamp(1.8rem, 3.5vw, 2.6rem);
      font-weight: 900;
      line-height: 1.12;
      letter-spacing: -1px;
      margin-bottom: 16px;
      color: var(--t-0);
    }
    .hero-h1 em {
      font-style: normal;
      background: var(--g-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-p {
      font-size: .88rem;
      color: var(--t-2);
      line-height: 1.8;
      max-width: 540px;
    }

    .hero-features {
      display: flex;
      gap: 24px;
      margin-top: 24px;
    }

    .hero-feat {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feat-icon {
      width: 28px; height: 28px;
      border-radius: var(--r-xs);
      display: grid; place-items: center;
      font-size: .75rem;
    }
    .feat-icon-g { background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.15); }
    .feat-icon-c { background: rgba(34,211,238,.1); border: 1px solid rgba(34,211,238,.15); }
    .feat-icon-v { background: rgba(167,139,250,.1); border: 1px solid rgba(167,139,250,.15); }

    .feat-text {
      font-size: .72rem;
      color: var(--t-3);
      font-weight: 500;
    }
    .feat-text strong {
      display: block;
      color: var(--t-1);
      font-weight: 700;
      font-size: .76rem;
    }

    /* ── Model Info Cards ── */
    .hero-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mcard {
      position: relative;
      background: var(--s-2);
      border: 1px solid var(--b-2);
      border-radius: var(--r-lg);
      padding: 20px 22px 18px;
      overflow: hidden;
      transition: border-color .25s, transform .2s, box-shadow .25s;
    }
    .mcard::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--g-glass);
      pointer-events: none;
    }
    .mcard:hover {
      border-color: var(--b-glow);
      transform: translateY(-2px);
      box-shadow: var(--sh-glow);
    }
    .mcard-bar {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 2px;
    }
    .mcard-bar-g { background: var(--g-brand); }
    .mcard-bar-c { background: linear-gradient(90deg, var(--cyan), var(--blue)); }

    .mcard-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .mcard-type {
      font-size: .6rem;
      font-weight: 700;
      color: var(--t-4);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .mcard-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: .62rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--r-xs);
    }
    .mcard-badge-g {
      background: rgba(52,211,153,.1);
      color: var(--accent);
      border: 1px solid rgba(52,211,153,.15);
    }
    .mcard-badge-c {
      background: rgba(34,211,238,.1);
      color: var(--cyan);
      border: 1px solid rgba(34,211,238,.15);
    }

    .mcard-name {
      font-size: .88rem;
      font-weight: 700;
      color: var(--t-0);
      margin-bottom: 8px;
      letter-spacing: -.2px;
    }

    .mcard-metric {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .mcard-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -.5px;
    }
    .mcard-val-g { color: var(--accent-l); }
    .mcard-val-c { color: var(--cyan); }
    .mcard-unit {
      font-size: .68rem;
      color: var(--t-4);
      font-weight: 500;
    }

    /* ════════════════════════════════════
       STATS BAR
    ════════════════════════════════════ */
    .stats-wrap {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 clamp(16px, 3vw, 36px) 48px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }

    .scard {
      background: var(--s-2);
      border: 1px solid var(--b-1);
      border-radius: var(--r-md);
      padding: 20px 12px 16px;
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: border-color .2s, box-shadow .2s, transform .2s;
    }
    .scard::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 1px;
      background: var(--g-brand);
      opacity: 0;
      transition: opacity .25s;
    }
    .scard:hover {
      border-color: var(--b-glow);
      box-shadow: var(--sh-glow);
      transform: translateY(-2px);
    }
    .scard:hover::before { opacity: 1; }

    .scard-icon {
      width: 36px; height: 36px;
      margin: 0 auto 10px;
      border-radius: var(--r-sm);
      display: grid; place-items: center;
      font-size: .9rem;
      background: rgba(52,211,153,.06);
      border: 1px solid rgba(52,211,153,.08);
    }

    .scard-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--t-0);
      letter-spacing: -.3px;
      margin-bottom: 4px;
    }
    .scard-lbl {
      font-size: .62rem;
      font-weight: 600;
      color: var(--t-4);
      text-transform: uppercase;
      letter-spacing: .6px;
    }

    /* ════════════════════════════════════
       API SECTION WRAPPER
    ════════════════════════════════════ */
    .api-wrap {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 clamp(16px, 3vw, 36px) 60px;
    }

    .api-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
    }
    .api-header-icon {
      width: 32px; height: 32px;
      border-radius: var(--r-sm);
      background: rgba(52,211,153,.08);
      border: 1px solid rgba(52,211,153,.12);
      display: grid; place-items: center;
      font-size: .82rem;
    }
    .api-header-text {
      font-size: .72rem;
      font-weight: 700;
      color: var(--t-3);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .api-header-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--b-2), transparent);
    }

    /* ════════════════════════════════════
       SWAGGER UI OVERRIDES — DEEP THEME
    ════════════════════════════════════ */

    /* ── Base ── */
    .swagger-ui {
      background : transparent !important;
      font-family: 'Inter', system-ui, sans-serif !important;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui *:not(code):not(pre):not(.microlight *) {
      font-family: 'Inter', system-ui, sans-serif !important;
    }
    .swagger-ui .wrapper { padding: 0 !important; }

    /* ── INFO BLOCK ── */
    .swagger-ui .info {
      background   : var(--s-2) !important;
      border       : 1px solid var(--b-2) !important;
      border-radius: var(--r-xl) !important;
      padding      : 32px 36px 28px !important;
      margin-bottom: 24px !important;
      box-shadow   : var(--sh-lg), var(--sh-inset) !important;
      position     : relative !important;
      overflow     : hidden !important;
    }
    .swagger-ui .info::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: var(--g-brand);
    }
    .swagger-ui .info::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--g-glass);
      pointer-events: none;
    }
    .swagger-ui .info hgroup,
    .swagger-ui .info .main {
      position: relative;
      z-index: 1;
    }
    .swagger-ui .info .title {
      font-size  : 1.3rem !important;
      font-weight: 800 !important;
      letter-spacing: -.4px !important;
      background : var(--g-brand) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
      margin-bottom: 16px !important;
      padding-bottom: 0 !important;
    }
    .swagger-ui .info .title small {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: .6rem !important;
      font-weight: 600 !important;
      background: rgba(52,211,153,.1) !important;
      color: var(--accent) !important;
      -webkit-text-fill-color: var(--accent) !important;
      padding: 3px 8px !important;
      border-radius: var(--r-xs) !important;
      border: 1px solid rgba(52,211,153,.15) !important;
      margin-left: 8px !important;
      vertical-align: middle !important;
      position: relative !important;
      top: -2px !important;
    }
    .swagger-ui .info .title small pre {
      display: inline !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: .6rem !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      color: inherit !important;
    }

    .swagger-ui .info p,
    .swagger-ui .info li {
      color      : var(--t-2) !important;
      font-size  : .82rem !important;
      line-height: 1.75 !important;
    }
    .swagger-ui .info h2 {
      font-size: .78rem !important;
      font-weight: 700 !important;
      color: var(--accent) !important;
      text-transform: uppercase !important;
      letter-spacing: .8px !important;
      margin: 24px 0 10px !important;
      padding-bottom: 6px !important;
      border-bottom: 1px solid var(--b-1) !important;
    }
    .swagger-ui .info strong {
      color: var(--t-1) !important;
      font-weight: 600 !important;
    }
    .swagger-ui .info a {
      color: var(--accent) !important;
      text-decoration: none !important;
      font-weight: 500 !important;
    }
    .swagger-ui .info a:hover {
      text-decoration: underline !important;
    }
    .swagger-ui .info hr {
      border: none !important;
      height: 1px !important;
      background: var(--b-1) !important;
      margin: 16px 0 !important;
    }

    /* ── Info tables ── */
    .swagger-ui .info table {
      width: 100% !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border: 1px solid var(--b-2) !important;
      border-radius: var(--r-md) !important;
      overflow: hidden !important;
      margin: 12px 0 !important;
    }
    .swagger-ui .info th {
      background: rgba(52,211,153,.04) !important;
      color: var(--accent) !important;
      font-size: .7rem !important;
      font-weight: 700 !important;
      letter-spacing: .5px !important;
      text-transform: uppercase !important;
      padding: 10px 18px !important;
      text-align: left !important;
      border-bottom: 1px solid var(--b-2) !important;
    }
    .swagger-ui .info td {
      padding: 10px 18px !important;
      color: var(--t-2) !important;
      font-size: .8rem !important;
      border-top: 1px solid var(--b-1) !important;
    }
    .swagger-ui .info tr:first-child td { border-top: none !important; }

    /* ── Info contact/license ── */
    .swagger-ui .info .info__contact,
    .swagger-ui .info .info__license {
      margin-top: 12px !important;
    }
    .swagger-ui .info .info__contact a,
    .swagger-ui .info .info__license a {
      color: var(--accent) !important;
      font-size: .78rem !important;
    }

    /* ── SERVER SELECTOR ── */
    .swagger-ui .scheme-container {
      background   : var(--s-2) !important;
      border       : 1px solid var(--b-2) !important;
      border-radius: var(--r-lg) !important;
      padding      : 14px 22px !important;
      margin-bottom: 18px !important;
      box-shadow   : var(--sh-sm) !important;
    }
    .swagger-ui .scheme-container label {
      color: var(--t-3) !important;
      font-size: .75rem !important;
      font-weight: 600 !important;
    }

    /* ── FILTER BAR ── */
    .swagger-ui .filter-container {
      margin-bottom: 20px !important;
    }
    .swagger-ui .filter-container input {
      width: 100% !important;
      background: var(--s-3) !important;
      border: 1px solid var(--b-2) !important;
      color: var(--t-1) !important;
      border-radius: var(--r-md) !important;
      padding: 11px 18px !important;
      font-size: .82rem !important;
      font-weight: 500 !important;
      transition: border-color .2s, box-shadow .2s !important;
    }
    .swagger-ui .filter-container input:focus {
      border-color: var(--accent-d) !important;
      box-shadow: 0 0 0 3px rgba(52,211,153,.08) !important;
      outline: none !important;
    }
    .swagger-ui .filter-container input::placeholder {
      color: var(--t-4) !important;
    }

    /* ── TAG HEADERS ── */
    .swagger-ui .opblock-tag-section {
      margin-bottom: 8px !important;
    }
    .swagger-ui .opblock-tag {
      font-size   : .82rem !important;
      font-weight : 700 !important;
      color       : var(--t-1) !important;
      letter-spacing: -.1px !important;
      border-bottom: 1px solid var(--b-1) !important;
      padding     : 16px 8px !important;
      margin-top  : 8px !important;
      transition  : background .2s, border-color .2s !important;
    }
    .swagger-ui .opblock-tag:hover {
      background: rgba(52,211,153,.02) !important;
      border-color: var(--b-glow) !important;
      border-radius: var(--r-sm) !important;
    }
    .swagger-ui .opblock-tag small {
      color: var(--t-4) !important;
      font-size: .72rem !important;
    }
    .swagger-ui .opblock-tag svg { fill: var(--t-4) !important; }

    /* ── OPERATION BLOCKS ── */
    .swagger-ui .opblock {
      border-radius : var(--r-lg) !important;
      margin-bottom : 10px !important;
      border        : 1px solid var(--b-1) !important;
      background    : var(--s-2) !important;
      box-shadow    : var(--sh-md), var(--sh-inset) !important;
      overflow      : hidden !important;
      transition    : border-color .25s, box-shadow .25s, transform .2s !important;
    }
    .swagger-ui .opblock:hover {
      border-color: var(--b-glow) !important;
      transform   : translateY(-1px) !important;
      box-shadow  : var(--sh-lg), 0 0 0 1px rgba(52,211,153,.06) !important;
    }

    /* GET  */
    .swagger-ui .opblock.opblock-get {
      border-left: 3px solid var(--accent-d) !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      background: linear-gradient(90deg, rgba(52,211,153,.04), transparent) !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background   : var(--accent-d) !important;
      color        : #fff !important;
      border-radius: var(--r-xs) !important;
      font-weight  : 800 !important;
      font-size    : .65rem !important;
      letter-spacing: .6px !important;
      min-width    : 58px !important;
      text-align   : center !important;
      padding      : 6px 0 !important;
      box-shadow   : 0 2px 8px rgba(5,150,105,.25) !important;
    }

    /* POST  */
    .swagger-ui .opblock.opblock-post {
      border-left: 3px solid var(--blue-d) !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      background: linear-gradient(90deg, rgba(37,99,235,.04), transparent) !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background   : var(--blue-d) !important;
      color        : #fff !important;
      border-radius: var(--r-xs) !important;
      font-weight  : 800 !important;
      font-size    : .65rem !important;
      letter-spacing: .6px !important;
      min-width    : 58px !important;
      text-align   : center !important;
      padding      : 6px 0 !important;
      box-shadow   : 0 2px 8px rgba(37,99,235,.25) !important;
    }

    /* PUT  */
    .swagger-ui .opblock.opblock-put {
      border-left: 3px solid var(--orange) !important;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary {
      background: linear-gradient(90deg, rgba(251,146,60,.04), transparent) !important;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: var(--orange) !important;
      color: #000 !important;
      border-radius: var(--r-xs) !important;
      font-weight: 800 !important;
      font-size: .65rem !important;
      min-width: 58px !important;
      text-align: center !important;
    }

    /* DELETE  */
    .swagger-ui .opblock.opblock-delete {
      border-left: 3px solid var(--rose) !important;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      background: linear-gradient(90deg, rgba(251,113,133,.04), transparent) !important;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: var(--rose) !important;
      color: #fff !important;
      border-radius: var(--r-xs) !important;
      font-weight: 800 !important;
      font-size: .65rem !important;
      min-width: 58px !important;
      text-align: center !important;
    }

    /* ── Summary row ── */
    .swagger-ui .opblock-summary {
      padding: 10px 16px !important;
    }
    .swagger-ui .opblock-summary-path {
      font-family  : 'JetBrains Mono', monospace !important;
      font-size    : .82rem !important;
      font-weight  : 500 !important;
      color        : var(--t-1) !important;
    }
    .swagger-ui .opblock-summary-description {
      color    : var(--t-3) !important;
      font-size: .75rem !important;
      font-weight: 500 !important;
    }
    .swagger-ui .opblock-summary svg {
      fill: var(--t-4) !important;
      transition: fill .2s !important;
    }
    .swagger-ui .opblock-summary:hover svg {
      fill: var(--t-2) !important;
    }

    /* ── Expanded body ── */
    .swagger-ui .opblock-body {
      background: var(--s-1) !important;
      border-top: 1px solid var(--b-1) !important;
    }

    /* ── Section headers (PARAMETERS, RESPONSES, etc.) ── */
    .swagger-ui .opblock-section-header {
      background : var(--s-3) !important;
      border-top : 1px solid var(--b-2) !important;
      border-bottom: 1px solid var(--b-1) !important;
      padding    : 10px 20px !important;
      min-height : auto !important;
    }
    .swagger-ui .opblock-section-header h4 {
      font-size: .7rem !important;
      font-weight: 700 !important;
      color: var(--t-2) !important;
      text-transform: uppercase !important;
      letter-spacing: .8px !important;
    }
    .swagger-ui .opblock-section-header label {
      font-size: .72rem !important;
      color: var(--t-3) !important;
    }
    .swagger-ui .opblock-section-header label select {
      font-size: .72rem !important;
    }

    /* ── Description inside expanded ── */
    .swagger-ui .opblock-description-wrapper,
    .swagger-ui .opblock-external-docs-wrapper {
      padding: 14px 20px !important;
    }
    .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .opblock-description-wrapper h4 {
      color: var(--t-2) !important;
      font-size: .8rem !important;
      line-height: 1.7 !important;
    }

    /* ── Params table ── */
    .swagger-ui .opblock-section .parameters-container {
      padding: 0 !important;
    }
    .swagger-ui .opblock .opblock-section table {
      margin: 0 !important;
    }
    .swagger-ui table thead tr th {
      color: var(--t-4) !important;
      font-size: .65rem !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: .8px !important;
      border-bottom: 1px solid var(--b-2) !important;
      padding: 10px 16px !important;
      background: var(--s-2) !important;
    }
    .swagger-ui table tbody tr td {
      padding: 12px 16px !important;
      color: var(--t-2) !important;
      font-size: .8rem !important;
      border-top: 1px solid var(--b-1) !important;
      vertical-align: top !important;
    }
    .swagger-ui table tbody tr {
      transition: background .15s !important;
    }
    .swagger-ui table tbody tr:hover {
      background: rgba(52,211,153,.015) !important;
    }
    .swagger-ui .parameter__name {
      font-family: 'JetBrains Mono', monospace !important;
      font-size  : .8rem !important;
      font-weight: 600 !important;
      color      : var(--t-0) !important;
    }
    .swagger-ui .parameter__name.required::after {
      color: var(--rose) !important;
      font-weight: 700 !important;
    }
    .swagger-ui .parameter__name.required span {
      color: var(--rose) !important;
    }
    .swagger-ui .parameter__in {
      color     : var(--t-4) !important;
      font-size : .62rem !important;
      font-style: italic !important;
    }
    .swagger-ui .parameter__type {
      font-family: 'JetBrains Mono', monospace !important;
      font-size  : .7rem !important;
      color      : var(--cyan) !important;
    }
    .swagger-ui .required {
      color: var(--amber) !important;
      font-size: .62rem !important;
    }

    /* "No parameters" message */
    .swagger-ui .opblock-section .parameters-col_description p {
      color: var(--t-3) !important;
      font-size: .78rem !important;
    }

    /* ── REQUEST BODY ── */
    .swagger-ui .opblock-section .body-param-options {
      padding: 8px 16px !important;
    }
    .swagger-ui .opblock-section .opblock-section-request-body h4 {
      font-size: .7rem !important;
      font-weight: 700 !important;
      color: var(--t-2) !important;
      text-transform: uppercase !important;
      letter-spacing: .8px !important;
    }

    /* ── INPUTS ── */
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=search],
    .swagger-ui input[type=email],
    .swagger-ui input[type=file],
    .swagger-ui textarea,
    .swagger-ui select {
      font-family  : 'Inter', sans-serif !important;
      background   : var(--s-0) !important;
      border       : 1px solid var(--b-2) !important;
      color        : var(--t-1) !important;
      border-radius: var(--r-sm) !important;
      padding      : 9px 14px !important;
      font-size    : .8rem !important;
      transition   : border-color .2s, box-shadow .2s !important;
    }
    .swagger-ui input:focus,
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: var(--accent-d) !important;
      outline     : none !important;
      box-shadow  : 0 0 0 3px rgba(52,211,153,.1) !important;
    }
    .swagger-ui textarea {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: .78rem !important;
      line-height: 1.6 !important;
      min-height: 120px !important;
    }

    /* select dropdown */
    .swagger-ui select {
      cursor: pointer !important;
    }
    .swagger-ui select option {
      background: var(--s-3) !important;
      color: var(--t-1) !important;
    }

    /* ── BUTTONS ── */
    .swagger-ui .btn {
      font-family: 'Inter', sans-serif !important;
      font-weight: 600 !important;
      border-radius: var(--r-sm) !important;
      cursor: pointer !important;
      transition: all .2s ease !important;
    }

    .swagger-ui .btn.try-out__btn {
      background: rgba(96,165,250,.08) !important;
      border    : 1px solid rgba(96,165,250,.22) !important;
      color     : var(--blue) !important;
      font-size : .75rem !important;
      padding   : 7px 18px !important;
      font-weight: 700 !important;
    }
    .swagger-ui .btn.try-out__btn:hover {
      background: rgba(96,165,250,.15) !important;
      border-color: rgba(96,165,250,.35) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(96,165,250,.15) !important;
    }

    .swagger-ui .btn.execute {
      background   : linear-gradient(135deg, var(--accent-d), #047857) !important;
      border       : none !important;
      color        : #fff !important;
      font-weight  : 800 !important;
      font-size    : .78rem !important;
      padding      : 9px 28px !important;
      letter-spacing: .3px !important;
      box-shadow   : 0 4px 18px rgba(5,150,105,.3) !important;
    }
    .swagger-ui .btn.execute:hover {
      background: linear-gradient(135deg, #047857, #065f46) !important;
      box-shadow: 0 6px 24px rgba(5,150,105,.4) !important;
      transform : translateY(-2px) !important;
    }

    .swagger-ui .btn.cancel {
      background: rgba(251,113,133,.06) !important;
      border    : 1px solid rgba(251,113,133,.2) !important;
      color     : var(--rose) !important;
      font-size : .75rem !important;
      padding   : 7px 18px !important;
    }
    .swagger-ui .btn.cancel:hover {
      background: rgba(251,113,133,.12) !important;
    }

    .swagger-ui .btn.authorize {
      background: rgba(167,139,250,.08) !important;
      border    : 1px solid rgba(167,139,250,.2) !important;
      color     : var(--violet) !important;
      font-size : .75rem !important;
    }

    /* ── RESPONSES SECTION ── */
    .swagger-ui .responses-wrapper {
      background: var(--s-1) !important;
    }
    .swagger-ui .responses-inner {
      padding: 16px 20px !important;
    }
    .swagger-ui .response-col_status {
      font-family: 'JetBrains Mono', monospace !important;
      font-size  : .78rem !important;
      font-weight: 700 !important;
    }
    .swagger-ui .response-col_status .response-undocumented {
      color: var(--t-3) !important;
      font-size: .72rem !important;
    }
    /* 2xx green */
    .swagger-ui .responses-table .response > td:first-child {
      color: var(--accent) !important;
    }
    .swagger-ui .response-col_description__inner p {
      color: var(--t-2) !important;
      font-size: .78rem !important;
    }
    .swagger-ui .response-col_links {
      color: var(--t-4) !important;
      font-size: .72rem !important;
    }

    /* media-type selector */
    .swagger-ui .response-controls {
      padding: 8px 0 !important;
    }

    /* ── CODE BLOCKS ── */
    .swagger-ui .highlight-code,
    .swagger-ui .microlight {
      font-family  : 'JetBrains Mono', monospace !important;
      background   : var(--s-0) !important;
      border       : 1px solid var(--b-2) !important;
      border-radius: var(--r-md) !important;
      padding      : 16px 20px !important;
      font-size    : .75rem !important;
      line-height  : 1.8 !important;
      color        : #e2e8f0 !important;
      overflow-x   : auto !important;
    }
    .swagger-ui .example-value-render pre {
      background   : var(--s-0) !important;
      border       : 1px solid var(--b-2) !important;
      border-radius: var(--r-md) !important;
    }

    /* Code tab selectors */
    .swagger-ui .tab li {
      font-size: .72rem !important;
      font-weight: 600 !important;
      color: var(--t-3) !important;
      padding: 6px 14px !important;
      cursor: pointer !important;
      border-bottom: 2px solid transparent !important;
      transition: color .2s, border-color .2s !important;
    }
    .swagger-ui .tab li:hover { color: var(--t-1) !important; }
    .swagger-ui .tab li.active {
      color: var(--accent) !important;
      border-bottom-color: var(--accent-d) !important;
    }
    .swagger-ui .tab li:first-of-type::after {
      color: var(--t-4) !important;
    }

    /* copy button */
    .swagger-ui .copy-to-clipboard {
      background   : var(--s-3) !important;
      border       : 1px solid var(--b-2) !important;
      border-radius: var(--r-xs) !important;
      right: 10px !important;
      top: 10px !important;
    }
    .swagger-ui .copy-to-clipboard button {
      background: transparent !important;
      color: var(--t-3) !important;
    }

    /* ── CURL ── */
    .swagger-ui .curl-command {
      background: var(--s-0) !important;
      border: 1px solid var(--b-2) !important;
      border-radius: var(--r-md) !important;
      padding: 16px 20px !important;
    }
    .swagger-ui .curl-command pre {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: .75rem !important;
      color: var(--t-2) !important;
    }

    /* Request duration */
    .swagger-ui .request-duration {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: .68rem !important;
      color: var(--accent-d) !important;
    }

    /* ── MODELS / SCHEMAS ── */
    .swagger-ui section.models {
      background   : var(--s-2) !important;
      border       : 1px solid var(--b-2) !important;
      border-radius: var(--r-xl) !important;
      margin-top   : 28px !important;
      overflow     : hidden !important;
      box-shadow   : var(--sh-md), var(--sh-inset) !important;
    }
    .swagger-ui section.models h4 {
      font-size: .72rem !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: .8px !important;
      color: var(--t-2) !important;
      padding: 16px 24px !important;
      margin: 0 !important;
      background: var(--s-3) !important;
      border-bottom: 1px solid var(--b-2) !important;
    }
    .swagger-ui section.models h4 svg {
      fill: var(--t-3) !important;
    }

    .swagger-ui section.models .model-box {
      margin: 0 !important;
      padding: 0 !important;
    }
    .swagger-ui .model-box {
      background: transparent !important;
    }

    .swagger-ui .model-container {
      background   : var(--s-1) !important;
      margin       : 8px 16px !important;
      border-radius: var(--r-md) !important;
      border       : 1px solid var(--b-1) !important;
      padding      : 14px 18px !important;
      transition   : border-color .2s !important;
    }
    .swagger-ui .model-container:hover {
      border-color: var(--b-glow) !important;
    }

    .swagger-ui .model-title {
      font-family: 'JetBrains Mono', monospace !important;
      font-size  : .82rem !important;
      font-weight: 600 !important;
      color      : var(--t-1) !important;
    }
    .swagger-ui .model {
      color     : var(--t-2) !important;
      font-size : .78rem !important;
    }
    .swagger-ui .model-toggle {
      cursor: pointer !important;
    }

    /* Schema property names */
    .swagger-ui .model .property {
      font-family: 'JetBrains Mono', monospace !important;
      color: var(--t-1) !important;
      font-weight: 600 !important;
    }
    .swagger-ui .prop-type {
      font-family: 'JetBrains Mono', monospace !important;
      color: var(--cyan) !important;
      font-size: .72rem !important;
      font-weight: 500 !important;
    }
    .swagger-ui .prop-format {
      color: var(--t-4) !important;
      font-size: .68rem !important;
    }

    /* ── Model title in the schemas list ── */
    .swagger-ui section.models .model-container > span > span:first-child,
    .swagger-ui .models-control {
      color: var(--t-1) !important;
    }

    /* Schema expand arrows */
    .swagger-ui .model-toggle::after,
    .swagger-ui .model-container .model-toggle {
      cursor: pointer !important;
    }

    /* ── LOADING SPINNER ── */
    .swagger-ui .loading-container .loading::after {
      border-color: var(--accent) transparent transparent !important;
    }

    /* ── MARKDOWN inside swagger ── */
    .swagger-ui .renderedMarkdown p {
      color: var(--t-2) !important;
      font-size: .8rem !important;
      line-height: 1.7 !important;
    }
    .swagger-ui .renderedMarkdown code,
    .swagger-ui .markdown code {
      font-family  : 'JetBrains Mono', monospace !important;
      background   : rgba(52,211,153,.06) !important;
      border       : 1px solid rgba(52,211,153,.1) !important;
      border-radius: 4px !important;
      padding      : 1.5px 6px !important;
      color        : var(--accent-l) !important;
      font-size    : .75rem !important;
    }
    .swagger-ui .renderedMarkdown ul,
    .swagger-ui .renderedMarkdown ol {
      padding-left: 18px !important;
    }
    .swagger-ui .renderedMarkdown li {
      color: var(--t-2) !important;
      font-size: .8rem !important;
      margin-bottom: 3px !important;
    }

    /* ── AUTHORIZATION MODAL ── */
    .swagger-ui .dialog-ux .modal-ux {
      background: var(--s-3) !important;
      border: 1px solid var(--b-2) !important;
      border-radius: var(--r-xl) !important;
      box-shadow: var(--sh-lg) !important;
    }
    .swagger-ui .dialog-ux .modal-ux-header {
      background: var(--s-4) !important;
      border-bottom: 1px solid var(--b-2) !important;
      border-radius: var(--r-xl) var(--r-xl) 0 0 !important;
    }
    .swagger-ui .dialog-ux .modal-ux-header h3 {
      color: var(--t-1) !important;
    }
    .swagger-ui .dialog-ux .modal-ux-content {
      background: var(--s-3) !important;
    }
    .swagger-ui .dialog-ux .modal-ux-content p {
      color: var(--t-2) !important;
    }

    /* ── MISC SWAGGER FIXES ── */
    .swagger-ui .no-margin { margin: 0 !important; }
    .swagger-ui .try-out { padding: 10px 20px !important; }
    .swagger-ui .try-out + .responses-wrapper { margin-top: 0 !important; }
    .swagger-ui .execute-wrapper {
      padding: 14px 20px !important;
    }
    .swagger-ui .btn-group { padding: 14px 20px !important; }
    .swagger-ui .download-contents {
      color: var(--accent) !important;
      font-size: .72rem !important;
      font-weight: 600 !important;
    }
    .swagger-ui .response-content-type {
      padding: 0 20px 10px !important;
    }
    .swagger-ui .response-content-type label {
      color: var(--t-3) !important;
      font-size: .72rem !important;
    }
    .swagger-ui .opblock-body pre {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: .75rem !important;
      color: var(--t-2) !important;
    }
    /* Live response header */
    .swagger-ui .live-responses-table .response-col_status {
      font-size: .8rem !important;
    }
    .swagger-ui .response-col_description h5 {
      font-size: .72rem !important;
      color: var(--t-3) !important;
      font-weight: 600 !important;
    }

    /* ════════════════════════════════════
       FOOTER
    ════════════════════════════════════ */
    .footer {
      max-width: 1120px;
      margin: 0 auto;
      padding: 28px clamp(16px, 3vw, 36px);
      border-top: 1px solid var(--b-1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: .7rem;
      color: var(--t-4);
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .footer-dot {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: var(--accent-d);
    }
    .footer a {
      color: var(--accent-d);
      text-decoration: none;
    }

    /* ════════════════════════════════════
       RESPONSIVE
    ════════════════════════════════════ */
    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr !important; }
      .hero-cards { flex-direction: row; }
      .hero-cards .mcard { flex: 1; }
      .stats { grid-template-columns: repeat(3, 1fr) !important; }
      .nav-right .chip:nth-child(n+3) { display: none; }
      .hero-features { flex-wrap: wrap; gap: 16px; }
    }
    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr) !important; }
      .hero-h1 { font-size: 1.5rem !important; }
      .hero-cards { flex-direction: column; }
      .nav-right .chip:nth-child(n+2) { display: none; }
      .footer { flex-direction: column; gap: 8px; text-align: center; }
    }
  </style>
</head>
<body>

<!-- ═══════════ NAVIGATION ═══════════ -->
<nav class="nav">
  <div class="nav-brand">
    <div class="nav-icon">🌾</div>
    <span class="nav-title">KrishiSat AI</span>
  </div>
  <div class="nav-sep"></div>
  <span class="nav-label">ML Service · API Console</span>
  <div class="nav-right">
    <span class="chip chip-g"><span class="chip-dot"></span> CNN 91.75%</span>
    <span class="chip chip-c"><span class="chip-dot"></span> LSTM MAE 0.065</span>
    <span class="chip chip-v">⚡ 5 Endpoints</span>
  </div>
</nav>

<!-- ═══════════ HERO ═══════════ -->
<section class="hero-wrap">
  <div class="hero">
    <div class="hero-left">
      <div class="hero-tag">
        <span class="hero-tag-line"></span>
        Satellite-Based Crop Intelligence
      </div>
      <h1 class="hero-h1">
        Early Warning System<br>for <em>Crop Diseases</em>
      </h1>
      <p class="hero-p">
        Two production-grade AI models for real-time crop disease detection
        and 7-day risk forecasting &mdash; powered by Sentinel-2 satellite
        imagery, EfficientNetB0 CNN, and BiLSTM with Attention.
      </p>
      <div class="hero-features">
        <div class="hero-feat">
          <div class="feat-icon feat-icon-g">📡</div>
          <div class="feat-text"><strong>Sentinel-2</strong>10m resolution</div>
        </div>
        <div class="hero-feat">
          <div class="feat-icon feat-icon-c">🧠</div>
          <div class="feat-text"><strong>Deep Learning</strong>CNN + BiLSTM</div>
        </div>
        <div class="hero-feat">
          <div class="feat-icon feat-icon-v">🗺️</div>
          <div class="feat-text"><strong>Maharashtra</strong>District-level</div>
        </div>
      </div>
    </div>
    <div class="hero-cards">
      <div class="mcard">
        <div class="mcard-bar mcard-bar-g"></div>
        <div class="mcard-head">
          <span class="mcard-type">Vision Model</span>
          <span class="mcard-badge mcard-badge-g">CNN</span>
        </div>
        <div class="mcard-name">EfficientNetB0</div>
        <div class="mcard-metric">
          <span class="mcard-val mcard-val-g">91.75%</span>
          <span class="mcard-unit">Top-1 Accuracy</span>
        </div>
      </div>
      <div class="mcard">
        <div class="mcard-bar mcard-bar-c"></div>
        <div class="mcard-head">
          <span class="mcard-type">Temporal Model</span>
          <span class="mcard-badge mcard-badge-c">RNN</span>
        </div>
        <div class="mcard-name">BiLSTM + Attention</div>
        <div class="mcard-metric">
          <span class="mcard-val mcard-val-c">0.065</span>
          <span class="mcard-unit">MAE Score</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════ STATS ═══════════ -->
<section class="stats-wrap">
  <div class="stats">
    <div class="scard">
      <div class="scard-icon">📊</div>
      <div class="scard-val">71,717</div>
      <div class="scard-lbl">Training Images</div>
    </div>
    <div class="scard">
      <div class="scard-icon">🦠</div>
      <div class="scard-val">96</div>
      <div class="scard-lbl">Disease Classes</div>
    </div>
    <div class="scard">
      <div class="scard-icon">🎯</div>
      <div class="scard-val">91.75%</div>
      <div class="scard-lbl">Top-1 Accuracy</div>
    </div>
    <div class="scard">
      <div class="scard-icon">🏆</div>
      <div class="scard-val">99.66%</div>
      <div class="scard-lbl">Top-5 Accuracy</div>
    </div>
    <div class="scard">
      <div class="scard-icon">📅</div>
      <div class="scard-val">7 Days</div>
      <div class="scard-lbl">Risk Forecast</div>
    </div>
    <div class="scard">
      <div class="scard-icon">🛰️</div>
      <div class="scard-val">10 m</div>
      <div class="scard-lbl">Sentinel-2 Res.</div>
    </div>
  </div>
</section>

<!-- ═══════════ API ENDPOINTS ═══════════ -->
<section class="api-wrap">
  <div class="api-header">
    <div class="api-header-icon">⚡</div>
    <span class="api-header-text">API Endpoints</span>
    <div class="api-header-line"></div>
  </div>
  <div id="swagger-ui"></div>
</section>

<!-- ═══════════ FOOTER ═══════════ -->
<footer class="footer">
  <div class="footer-left">
    <span>🌾 KrishiSat AI</span>
    <div class="footer-dot"></div>
    <span>Deep Learning Laboratory Capstone · 2025-26</span>
  </div>
  <span>EfficientNetB0 &amp; BiLSTM · FastAPI</span>
</footer>

<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url        : "/openapi.json",
    dom_id     : "#swagger-ui",
    presets    : [SwaggerUIBundle.presets.apis,
                  SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout     : "BaseLayout",
    deepLinking: true,
    displayRequestDuration : true,
    defaultModelsExpandDepth: 1,
    filter     : true,
    syntaxHighlight: { activated: true, theme: "monokai" }
  })
</script>
</body>
</html>
""")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── REQUEST MODELS ────────────────────────────────────────
class ForecastRequest(BaseModel):
    ndvi_series : List[float]
    weather     : dict
    district_id : Optional[int] = None

class SatelliteRequest(BaseModel):
    bbox        : List[float]
    lat         : float
    lon         : float
    district_id : Optional[int] = None

# ── ENDPOINTS ─────────────────────────────────────────────
@app.get("/", tags=["Status"])
def root():
    return {
        "service" : "KrishiSat AI — ML Service",
        "status"  : "running ✅",
        "version" : "1.0.0",
        "models"  : {
            "cnn"  : "EfficientNetB0 — 91.75% accuracy",
            "lstm" : "BiLSTM+Attention — MAE 0.065"
        }
    }

@app.get("/health", tags=["Status"])
def health():
    return {
        "status": "ok",
        "models": ["CNN", "LSTM"],
        "classes": 96
    }

@app.post("/predict/disease",
    tags=["Predictions"],
    summary="Crop Disease Detection",
    description="""
Upload a **leaf/crop image** → Get disease name, confidence score, risk level and recommendation.

**Supported crops:** Apple, Corn, Grape, Orange, Peach, Pepper, Potato, Rice, Soybean, Strawberry, Tomato, Wheat and more.

**Returns:** Top-5 predictions with confidence scores.
    """
)
async def disease_prediction(file: UploadFile = File(
    ..., description="Leaf or crop image (JPG/PNG)"
)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files accepted")
    image_bytes = await file.read()
    result      = predict_disease(image_bytes)
    return {"success": True, "data": result}

@app.post("/predict/forecast",
    tags=["Predictions"],
    summary="7-Day Disease Risk Forecast",
    description="""
Send **30 days of NDVI values + weather data** → Get 7-day disease risk forecast.

**NDVI range:** 0.0 (bare soil) to 1.0 (dense healthy vegetation)

**Risk levels:** LOW (< 0.35) | MEDIUM (0.35–0.65) | HIGH (> 0.65)
    """
)
def risk_forecast(request: ForecastRequest):
    if len(request.ndvi_series) < 7:
        raise HTTPException(400, "Minimum 7 days NDVI required")
    result = predict_forecast(request.ndvi_series, request.weather)
    return {"success": True, "district_id": request.district_id, "data": result}

@app.post("/predict/full",
    tags=["Predictions"],
    summary="Full Satellite Pipeline",
    description="""
**Complete automated pipeline:**

1. 📡 Fetch Sentinel-2 satellite imagery
2. 🌿 Calculate NDVI values
3. 🌤️ Get real-time weather data
4. 🤖 Run LSTM risk forecast

Just provide the **bounding box coordinates** of the district.
    """
)
def full_prediction(request: SatelliteRequest):
    ndvi_series = fetch_ndvi(request.bbox)
    weather     = fetch_weather(request.lat, request.lon)
    forecast    = predict_forecast(ndvi_series, weather)
    current_ndvi= ndvi_series[-1]
    ndvi_trend  = "declining" if ndvi_series[-1] < ndvi_series[-7] else "stable"
    return {
        "success"     : True,
        "district_id" : request.district_id,
        "current_ndvi": round(current_ndvi, 3),
        "ndvi_trend"  : ndvi_trend,
        "ndvi_series" : ndvi_series,
        "weather"     : weather,
        "forecast"    : forecast
    }

@app.get("/districts/sample",
    tags=["Districts"],
    summary="Maharashtra Sample Districts",
    description="Get sample Maharashtra districts with bounding box coordinates for testing."
)
def sample_districts():
    return {
        "districts": [
            {"id":1,"name":"Nashik", "bbox":[73.6,19.9,74.2,20.4],"lat":20.0,"lon":73.8,"crop":"Wheat, Onion"},
            {"id":2,"name":"Pune",   "bbox":[73.7,18.4,74.0,18.7],"lat":18.5,"lon":73.9,"crop":"Sugarcane"},
            {"id":3,"name":"Nagpur", "bbox":[78.9,21.0,79.3,21.3],"lat":21.1,"lon":79.1,"crop":"Orange, Soybean"},
            {"id":4,"name":"Solapur","bbox":[75.7,17.5,76.1,17.9],"lat":17.7,"lon":75.9,"crop":"Soybean, Jowar"},
            {"id":5,"name":"Amravati","bbox":[77.6,20.8,77.9,21.1],"lat":20.9,"lon":77.8,"crop":"Cotton, Soybean"}
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
