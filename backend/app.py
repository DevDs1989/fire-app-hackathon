import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def calculate_fire(monthly_income: float, monthly_expenses: float, return_rate: float = 0.05):
    fire_number = (monthly_expenses * 12) * 25
    years_to_fire = fire_number / (monthly_income * 12)
    result = f"FIRE Number: ${fire_number:,.2f}, Years to FIRE: {years_to_fire:.2f} years"
    print(result)
    return result

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200

@app.route("/api/fire", methods=["POST"])
def fire():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400
    try:
        monthly_income = float(data['monthly_income'])
        monthly_expenses = float(data['monthly_expenses'])
        return_rate = float(data.get('return_rate', 0.05))
    except:
        return jsonify({"error": "Invalid input"}), 400

    result = calculate_fire(monthly_income, monthly_expenses, return_rate)
    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(port=8080, debug=True)
