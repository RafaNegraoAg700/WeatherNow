
from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/weather")
def get_weather():
    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({
            "error": "Digite o nome de uma cidade."
        }), 400

    try:
        # 1. Encontrar as coordenadas da cidade
        geo_url = "https://geocoding-api.open-meteo.com/v1/search"

        geo_response = requests.get(
            geo_url,
            params={
                "name": city,
                "count": 1,
                "language": "pt",
                "format": "json"
            },
            timeout=10
        )

        geo_response.raise_for_status()
        geo_data = geo_response.json()

        if not geo_data.get("results"):
            return jsonify({
                "error": "Cidade não encontrada. Tente outro nome."
            }), 404

        place = geo_data["results"][0]

        latitude = place["latitude"]
        longitude = place["longitude"]

        # 2. Consultar o clima atual e a previsão
        weather_url = "https://api.open-meteo.com/v1/forecast"

        weather_response = requests.get(
            weather_url,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "apparent_temperature,"
                    "is_day,"
                    "precipitation,"
                    "weather_code,"
                    "wind_speed_10m"
                ),
                "hourly": "temperature_2m,weather_code",
                "daily": (
                    "weather_code,"
                    "temperature_2m_max,"
                    "temperature_2m_min,"
                    "precipitation_probability_max"
                ),
                "forecast_days": 6,
                "timezone": "auto"
            },
            timeout=10
        )

        weather_response.raise_for_status()
        data = weather_response.json()

        current = data["current"]
        hourly = data["hourly"]
        daily = data["daily"]

        # 3. Retornar os dados para o JavaScript
        return jsonify({
            "city": place["name"],
            "country": place.get("country", ""),
            "temperature": current["temperature_2m"],
            "feels_like": current["apparent_temperature"],
            "humidity": current["relative_humidity_2m"],
            "wind": current["wind_speed_10m"],
            "precipitation": current["precipitation"],
            "current_time": current["time"],
            "is_day": current["is_day"],
            "weather_code": current["weather_code"],
            "hourly": hourly,
            "daily": daily
        })

    except requests.RequestException:
        return jsonify({
            "error": "Não foi possível consultar o clima. Tente novamente."
        }), 502

    except (KeyError, IndexError, TypeError, ValueError):
        return jsonify({
            "error": "A resposta do serviço meteorológico está inválida."
        }), 502


if __name__ == "__main__":
    app.run(debug=True)
