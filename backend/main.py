import os
import json
import sqlite3
import httpx
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── Firebase init ──────────────────────────────────────────────────────────────
firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_cred_path)
    firebase_admin.initialize_app(cred)

# ── Config ─────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_URL     = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

app = FastAPI(title="NOMA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth dependency ────────────────────────────────────────────────────────────
async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Gemini helper ──────────────────────────────────────────────────────────────
async def call_gemini(system_prompt: str, user_message: str, max_tokens: int = 512) -> dict:
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": max_tokens,
            "responseMimeType": "application/json",
        },
    }
    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(3):
            res = await client.post(GEMINI_URL, json=payload)
            if res.status_code in (429, 503) and attempt < 2:
                import asyncio
                await asyncio.sleep((attempt + 1) * 2)
                continue
            if res.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Gemini error {res.status_code}")
            data = res.json()
            if "error" in data:
                raise HTTPException(status_code=502, detail=data["error"].get("message"))
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text.strip())
    raise HTTPException(status_code=502, detail="Gemini unavailable after retries")

# ── Endpoints ──────────────────────────────────────────────────────────────────

class BarcodeRequest(BaseModel):
    barcode: str

class FoodEstimateRequest(BaseModel):
    description: str

class RecipeRequest(BaseModel):
    ingredients: str
    cooking_method: str


DB_PATH = os.path.join(os.path.dirname(__file__), "noma_products.db")


def get_product_from_db(barcode: str):
    """Lookup a product in noma_products.db. Returns None if not found."""
    if not os.path.exists(DB_PATH):
        return None
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute("SELECT * FROM products WHERE barcode = ?", (barcode,))
        product = cur.fetchone()
        if not product:
            conn.close()
            return None
        pid = product["id"]

        cur.execute("SELECT * FROM nutrition_per_100g WHERE product_id = ?", (pid,))
        nutrition = cur.fetchone()

        cur.execute(
            "SELECT position, ingredient_name, additive_code, is_allergen "
            "FROM product_ingredients WHERE product_id = ? ORDER BY position",
            (pid,),
        )
        ingredients = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM product_grades WHERE product_id = ?", (pid,))
        grade_row = cur.fetchone()

        conn.close()

        result = {
            "barcode": product["barcode"],
            "name": product["name"],
            "brand": product["brand"],
            "category": product["category"],
            "package_size_g": product["package_size_g"],
            "serving_size_g": product["serving_size_g"],
            "servings_per_package": product["servings_per_package"],
            "mrp_inr": product["mrp_inr"],
            "source": "noma_db",
        }

        if nutrition:
            result["nutrition"] = {
                "calories_per_100g": nutrition["calories"],
                "protein_g": nutrition["protein_g"],
                "total_fat_g": nutrition["total_fat_g"],
                "saturated_fat_g": nutrition["saturated_fat_g"],
                "trans_fat_g": nutrition["trans_fat_g"],
                "carbs_g": nutrition["total_carbs_g"],
                "sugar_g": nutrition["sugar_g"],
                "added_sugar_g": nutrition["added_sugar_g"],
                "fiber_g": nutrition["dietary_fiber_g"],
                "sodium_mg": nutrition["sodium_mg"],
                "cholesterol_mg": nutrition["cholesterol_mg"],
                "calcium_mg": nutrition["calcium_mg"],
                "iron_mg": nutrition["iron_mg"],
                "vitamin_c_mg": nutrition["vitamin_c_mg"],
                "vitamin_d_mcg": nutrition["vitamin_d_mcg"],
            }

        result["ingredients"] = ingredients

        if grade_row:
            result["grade"] = {
                "overall_grade": grade_row["overall_grade"],
                "nutrition_score": grade_row["nutrition_score"],
                "ingredient_score": grade_row["ingredient_score"],
                "combined_score": grade_row["combined_score"],
                "nova_level": grade_row["nova_level"],
                "harmful_additives_count": grade_row["harmful_additives_count"],
                "very_harmful_count": grade_row["very_harmful_count"],
                "grade_reasons": json.loads(grade_row["grade_reasons"] or "[]"),
                "daily_sugar_pct": grade_row["daily_sugar_pct"],
                "daily_sodium_pct": grade_row["daily_sodium_pct"],
                "daily_trans_fat_pct": grade_row["daily_trans_fat_pct"],
            }

        return result
    except Exception as e:
        print(f"DB lookup error: {e}")
        return None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/product/{barcode}")
async def get_product(barcode: str, _user=Depends(verify_token)):
    """
    Lookup a product by barcode in the NOMA Indian products database.
    Returns full product info: nutrition, ingredients, MRP, package size, and grade.
    Grade is research-based (WHO/FSSAI/ICMR) considering nutrition + ingredient safety + NOVA level.
    """
    result = get_product_from_db(barcode)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found in NOMA database")
    return result


@app.post("/analyze-barcode")
async def analyze_barcode(req: BarcodeRequest, _user=Depends(verify_token)):
    system = (
        "You are a nutrition expert for an Indian food tracking app. "
        "The user will give you a product barcode. Search your knowledge for any product "
        "associated with that barcode and return its nutritional information. "
        "If you cannot identify the specific product, make your best guess based on typical Indian packaged foods. "
        "Return ONLY valid JSON, no markdown, no explanation. "
        'Return this exact format: {"name":"","brand":"","confidence":"low|medium|high","notes":"","nutrition":{"calories_per_100g":0,"protein_g":0,"fat_g":0,"carbs_g":0,"sugar_g":0,"sodium_mg":0,"fiber_g":0}}'
    )
    result = await call_gemini(system, f"Product barcode: {req.barcode}", max_tokens=512)
    return result


@app.post("/estimate-food")
async def estimate_food(req: FoodEstimateRequest, _user=Depends(verify_token)):
    system = (
        "You are a nutrition estimation expert. Given a food description, estimate the total nutritional content. "
        "Estimate for a typical single-person serving unless quantity is specified. "
        "Account for ALL items mentioned. Use Indian serving sizes for Indian food. "
        "Return ONLY valid JSON, no markdown. "
        'Return this exact format: {"items":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0}'
    )
    result = await call_gemini(system, f'Estimate nutrition for: "{req.description}"', max_tokens=200)
    return result


@app.post("/estimate-recipe")
async def estimate_recipe(req: RecipeRequest, _user=Depends(verify_token)):
    system = (
        "You are a nutrition expert. Given ingredients and a cooking method, estimate the total nutritional content PER SERVING. "
        "Consider how cooking methods affect nutrition (frying adds fat, boiling doesn't). "
        "Account for oil, butter, ghee used in cooking. Be accurate for Indian cooking styles. "
        "Return ONLY valid JSON, no markdown. "
        'Return this exact format: {"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"per_serving_note":""}'
    )
    user_msg = f"Ingredients:\n{req.ingredients}\n\nCooking Method:\n{req.cooking_method}"
    result = await call_gemini(system, user_msg, max_tokens=300)
    return result
