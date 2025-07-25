import os
import sqlite3
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS

# Load environment variables (optional, if using .env)
load_dotenv()

# SQLite DB file
DATABASE = os.path.join(os.path.dirname(__file__), 'savings.db')

# Create Flask app
app = Flask(__name__)
CORS(app)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.execute(
            '''CREATE TABLE IF NOT EXISTS savings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )'''
        )
        db.commit()

# ----------- FIRE calculation unchanged -----------

def calculate_fire(monthly_income: float, monthly_expenses: float, return_rate: float = 0.05):
    try:
        annual_expenses = monthly_expenses * 12
        fire_number = annual_expenses * 25
        yearly_savings = (monthly_income - monthly_expenses) * 12

        savings = 0
        years_to_fire = 0
        projections = []

        if yearly_savings <= 0:
            return {
                "fire_number": fire_number,
                "years_to_fire": None,
                "projections": [],
                "message": "Your savings rate is zero or negative. FIRE is not possible with current values.",
            }

        while savings < fire_number and years_to_fire < 100:
            savings = savings * (1 + return_rate) + yearly_savings
            years_to_fire += 1
            projections.append(
                {
                    "year": years_to_fire,
                    "savings": float(
                        Decimal(savings).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    ),
                }
            )

        return {
            "fire_number": float(Decimal(fire_number).quantize(Decimal("0.01"))),
            "years_to_fire": years_to_fire,
            "projections": projections,
        }
    except Exception as e:
        return {"error": f"Calculation error: {str(e)}"}

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200


@app.route("/api/savings", methods=["GET", "POST"])
def savings():
    db = get_db()

    if request.method == "GET":
        cur = db.execute("SELECT id, name, amount, created_at FROM savings ORDER BY created_at DESC")
        rows = cur.fetchall()
        entries = [{
            "id": row["id"],
            "name": row["name"],
            "amount": float(row["amount"]),
            "created_at": row["created_at"],
            "formatted": f"₹{row['amount']:,.2f}"
        } for row in rows]
        return jsonify({"entries": entries}), 200

    if request.method == "POST":
        data = request.get_json()
        if not data or "savings" not in data or not isinstance(data["savings"], list):
            return jsonify({"error": "Missing or invalid 'savings' in request"}), 400

        entries = data["savings"]
        for entry in entries:
            name = entry.get("name")
            amount = entry.get("amount")
            try:
                if not name or name.strip() == "":
                    raise ValueError("Missing name.")
                amount_decimal = Decimal(str(amount))
                if amount_decimal < 0:
                    raise ValueError("Amount cannot be negative.")
            except (InvalidOperation, ValueError, TypeError) as e:
                return jsonify({"error": f"Invalid entry: {e}"}), 400

            db.execute(
                "INSERT INTO savings (name, amount) VALUES (?, ?)",
                (name.strip(), float(amount_decimal))
            )
        db.commit()

        # Return all entries after POST
        cur = db.execute("SELECT id, name, amount, created_at FROM savings ORDER BY created_at DESC")
        rows = cur.fetchall()
        saved_entries = [{
            "id": row["id"],
            "name": row["name"],
            "amount": float(row["amount"]),
            "created_at": row["created_at"],
            "formatted": f"₹{row['amount']:,.2f}"
        } for row in rows]

        return jsonify({
            "message": "Savings recorded successfully.",
            "entries": saved_entries,
        }), 200

@app.route("/api/savings/<int:saving_id>", methods=["DELETE"])
def delete_saving(saving_id):
    db = get_db()
    cur = db.execute("SELECT id FROM savings WHERE id = ?", (saving_id,))
    row = cur.fetchone()
    if not row:
        return jsonify({"error": "Entry not found"}), 404

    db.execute("DELETE FROM savings WHERE id = ?", (saving_id,))
    db.commit()
    return jsonify({"message": f"Entry {saving_id} deleted successfully."}), 200
@app.route("/api/fire", methods=["POST"])
def fire():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        monthly_income = float(data["monthly_income"])
        monthly_expenses = float(data["monthly_expenses"])
        return_rate = float(data.get("return_rate", 0.05))
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Invalid input. Provide numeric values."}), 400

    result = calculate_fire(monthly_income, monthly_expenses, return_rate)
    return jsonify(result), 200

if __name__ == "__main__":
    init_db()
    app.run(port=8080, debug=True)