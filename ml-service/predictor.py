import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import json
from pathlib import Path
import io

# ── CONFIG ────────────────────────────────────────────────
MODEL_DIR   = Path("./models")
IMG_SIZE    = 224
device      = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── LOAD CLASS NAMES ──────────────────────────────────────
with open(MODEL_DIR / "class_names.json") as f:
    CLASS_NAMES = json.load(f)
NUM_CLASSES = len(CLASS_NAMES)

# ── CNN MODEL ─────────────────────────────────────────────
def load_cnn():
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(512, NUM_CLASSES)
    )
    model.load_state_dict(
        torch.load(MODEL_DIR / "best_model.pth", map_location=device, weights_only=True)
    )
    model.eval()
    return model.to(device)

# ── LSTM MODEL ────────────────────────────────────────────
class CropRiskLSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=5, hidden_size=128,
            num_layers=2, batch_first=True,
            dropout=0.3, bidirectional=True
        )
        self.attention = nn.Sequential(
            nn.Linear(256, 64), nn.Tanh(),
            nn.Linear(64, 1),   nn.Softmax(dim=1)
        )
        self.fc = nn.Sequential(
            nn.Linear(256, 128), nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),  nn.ReLU(),
            nn.Linear(64, 7),    nn.Sigmoid()
        )
    def forward(self, x):
        out, _       = self.lstm(x)
        attn         = self.attention(out)
        context      = (attn * out).sum(dim=1)
        return self.fc(context)

def load_lstm():
    model = CropRiskLSTM()
    model.load_state_dict(
        torch.load(MODEL_DIR / "lstm_model.pth", map_location=device, weights_only=True)
    )
    model.eval()
    return model.to(device)

# ── LOAD BOTH MODELS AT STARTUP ───────────────────────────
print("Loading models...")
cnn_model  = load_cnn()
lstm_model = load_lstm()
print(f"✅ CNN  loaded → {NUM_CLASSES} classes")
print(f"✅ LSTM loaded → 7-day forecaster")

# ── IMAGE TRANSFORM ───────────────────────────────────────
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ── RISK LEVEL HELPER ─────────────────────────────────────
def get_risk_level(score: float) -> str:
    if score >= 0.65:   return "HIGH"
    if score >= 0.35:   return "MEDIUM"
    return "LOW"

def get_recommendation(disease: str, risk: str) -> str:
    recs = {
        "rust"     : "Spray Mancozeb 75% WP @ 2g/L. Avoid overhead irrigation.",
        "blight"   : "Apply Copper Oxychloride 50% WP @ 3g/L.",
        "blast"    : "Use Tricyclazole 75% WP @ 0.6g/L.",
        "spot"     : "Apply Chlorothalonil 75% WP @ 2g/L.",
        "mildew"   : "Spray Sulfur 80% WP @ 2.5g/L.",
        "healthy"  : "No action needed. Continue regular monitoring.",
        "default"  : "Consult your local KVK (Krishi Vigyan Kendra)."
    }
    disease_lower = disease.lower()
    for key, rec in recs.items():
        if key in disease_lower:
            return rec
    return recs["default"]

# ── PREDICT DISEASE FROM IMAGE ────────────────────────────
def predict_disease(image_bytes: bytes) -> dict:
    img    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(device)
    
    with torch.no_grad():
        output = cnn_model(tensor)
        probs  = torch.softmax(output, dim=1)
        top5   = torch.topk(probs, 5)
    
    top5_results = []
    for i in range(5):
        idx  = top5.indices[0][i].item()
        conf = top5.values[0][i].item() * 100
        top5_results.append({
            "disease"   : CLASS_NAMES[idx],
            "confidence": round(conf, 2)
        })
    
    top_disease = top5_results[0]["disease"]
    top_conf    = top5_results[0]["confidence"]
    risk_score  = top_conf / 100 if "healthy" not in top_disease.lower() else 0.05
    risk_level  = get_risk_level(risk_score)
    
    return {
        "disease"       : top_disease,
        "confidence"    : top_conf,
        "risk_level"    : risk_level,
        "risk_score"    : round(risk_score, 3),
        "recommendation": get_recommendation(top_disease, risk_level),
        "top5"          : top5_results
    }

# ── PREDICT 7-DAY RISK FROM NDVI SERIES ──────────────────
def predict_forecast(ndvi_series: list, weather: dict) -> dict:
    """
    ndvi_series : list of 30 floats (daily NDVI)
    weather     : {"temp": float, "humidity": float,
                   "rainfall": float, "day_of_year": int}
    """
    import datetime
    day_of_year = weather.get(
        "day_of_year",
        datetime.datetime.now().timetuple().tm_yday
    )
    
    sequence = []
    for i, ndvi in enumerate(ndvi_series[-30:]):   # Last 30 days
        sequence.append([
            float(ndvi),
            (float(weather.get("temp", 28)) - 15) / 25,
            float(weather.get("humidity", 0.6)) / 100,
            float(weather.get("rainfall", 0)) / 50,
            ((day_of_year + i) % 365) / 365
        ])
    
    # Pad if less than 30 days
    while len(sequence) < 30:
        sequence.insert(0, sequence[0])
    
    tensor = torch.FloatTensor([sequence]).to(device)
    
    with torch.no_grad():
        risk_scores = lstm_model(tensor)[0].cpu().numpy()
    
    forecast = []
    for day_idx, score in enumerate(risk_scores):
        forecast.append({
            "day"        : day_idx + 1,
            "risk_score" : round(float(score), 3),
            "risk_level" : get_risk_level(float(score))
        })
    
    max_risk   = max(r["risk_score"] for r in forecast)
    peak_day   = max(forecast, key=lambda x: x["risk_score"])["day"]
    
    return {
        "forecast"       : forecast,
        "max_risk_score" : round(max_risk, 3),
        "max_risk_level" : get_risk_level(max_risk),
        "peak_risk_day"  : peak_day,
        "recommendation" : get_recommendation("disease", get_risk_level(max_risk))
    }
