
const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-button");

const message = document.querySelector("#message");
const cityName = document.querySelector("#city-name");
const countryName = document.querySelector("#country-name");

const temperature = document.querySelector("#temperature");
const feelsLike = document.querySelector("#feels-like");
const weatherDescription = document.querySelector("#weather-description");
const weatherIcon = document.querySelector("#weather-icon");

const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const precipitation = document.querySelector("#precipitation");

const currentDate = document.querySelector("#current-date");
const hourlyList = document.querySelector("#hourly-list");
const forecastList = document.querySelector("#forecast-list");
const footerStatus = document.querySelector("#footer-status");

function getWeatherInfo(code, isDay = 1) {
    if (code === 0) {
        return {
            description: "Céu limpo",
            icon: isDay ? "☀️" : "🌙"
        };
    }

    if (code === 1) {
        return {
            description: "Predominantemente limpo",
            icon: isDay ? "🌤️" : "🌙"
        };
    }

    if (code === 2) {
        return {
            description: "Parcialmente nublado",
            icon: "⛅"
        };
    }

    if (code === 3) {
        return {
            description: "Nublado",
            icon: "☁️"
        };
    }

    if ([45, 48].includes(code)) {
        return {
            description: "Neblina",
            icon: "🌫️"
        };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return {
            description: "Garoa",
            icon: "🌦️"
        };
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return {
            description: "Chuva",
            icon: "🌧️"
        };
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return {
            description: "Neve",
            icon: "❄️"
        };
    }

    if ([95, 96, 99].includes(code)) {
        return {
            description: "Trovoada",
            icon: "⛈️"
        };
    }

    return {
        description: "Condição variável",
        icon: "🌡️"
    };
}

function formatHour(dateString) {
    const date = new Date(dateString);

    return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDay(dateString, index) {
    if (index === 0) {
        return "Hoje";
    }

    if (index === 1) {
        return "Amanhã";
    }

    const date = new Date(dateString + "T12:00:00");

    return date.toLocaleDateString("pt-BR", {
        weekday: "long"
    });
}

function showHourlyForecast(hourly, currentTime) {
    hourlyList.innerHTML = "";

    const startIndex = hourly.time.findIndex(
        time => time >= currentTime
    );

    const firstIndex = startIndex === -1 ? 0 : startIndex;

    for (let i = firstIndex; i < firstIndex + 5; i++) {
        if (i >= hourly.time.length) {
            break;
        }

        const info = getWeatherInfo(hourly.weather_code[i]);

        const hourItem = document.createElement("div");
        hourItem.className = "hour-item";

        const hour = document.createElement("span");
        hour.textContent = i === firstIndex
            ? "Agora"
            : formatHour(hourly.time[i]);

        const icon = document.createElement("span");
        icon.className = "hour-icon";
        icon.textContent = info.icon;

        const temp = document.createElement("strong");
        temp.textContent = Math.round(hourly.temperature_2m[i]) + "°";

        hourItem.append(hour, icon, temp);
        hourlyList.appendChild(hourItem);
    }
}

function showDailyForecast(daily) {
    forecastList.innerHTML = "";

    for (let i = 1; i < daily.time.length; i++) {
        const row = document.createElement("div");
        row.className = "forecast-row";

        const day = document.createElement("span");
        day.className = "day-name";
        day.textContent = formatDay(daily.time[i], i);

        const info = getWeatherInfo(daily.weather_code[i]);

        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.textContent = info.icon;

        const description = document.createElement("span");
        description.className = "forecast-description";
        description.textContent = info.description;

        const range = document.createElement("div");
        range.className = "temperature-range";

        const max = document.createElement("strong");
        max.textContent = Math.round(daily.temperature_2m_max[i]) + "°";

        const min = document.createElement("span");
        min.textContent = Math.round(daily.temperature_2m_min[i]) + "°";

        range.append(max, min);
        row.append(day, icon, description, range);

        forecastList.appendChild(row);
    }
}

async function searchCity(event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === "") {
        message.textContent = "Digite o nome de uma cidade.";
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Buscando...";
    message.textContent = "Consultando os dados meteorológicos...";
    footerStatus.textContent = "Atualizando informações...";

    try {
        const response = await fetch(
            "/api/weather?city=" + encodeURIComponent(city)
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Não foi possível consultar o clima.");
        }

        cityName.textContent = data.city;
        countryName.textContent = data.country || "Localização encontrada";

        temperature.textContent = Math.round(data.temperature);
        feelsLike.textContent = Math.round(data.feels_like) + "°C";

        humidity.textContent = data.humidity + "%";
        wind.textContent = data.wind + " km/h";
        precipitation.textContent = data.precipitation + " mm";

        const info = getWeatherInfo(data.weather_code, data.is_day);

        weatherDescription.textContent = info.description;
        weatherIcon.textContent = info.icon;

        currentDate.textContent = new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        showHourlyForecast(data.hourly, data.current_time);
        showDailyForecast(data.daily);

        message.textContent = "Dados meteorológicos atualizados com sucesso.";
        footerStatus.textContent = "Dados fornecidos pela Open-Meteo.";

    } catch (error) {
        message.textContent = error.message;
        footerStatus.textContent = "Não foi possível atualizar os dados.";
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Buscar";
    }
}

searchForm.addEventListener("submit", searchCity);

currentDate.textContent = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});

searchCity(new Event("submit"));
