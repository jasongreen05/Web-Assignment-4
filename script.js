
const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const WX = 'https://api.open-meteo.com/v1/forecast';


const form = document.querySelector('#search-form');
const input = document.querySelector('#city');
const searchBtn = document.querySelector('#search-btn');
const statusEl = document.querySelector('#status');
const weatherEl = document.querySelector('#weather');
const placeEl = document.querySelector('#place');
const iconEl = document.querySelector('#icon');
const tempEl = document.querySelector('#temp');
const conditionsEl = document.querySelector('#conditions');
const feelsEl = document.querySelector('#feels');
const humidityEl = document.querySelector('#humidity');
const windEl = document.querySelector('#wind');

async function getJSON(url) {
  const response = await fetch(url); 
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}


async function loadWeather(city) {

  const q = new URLSearchParams({ name: city, count: 1 });
  const geo = await getJSON(`${GEO}?${q}`);
  if (!geo.results?.length) throw new Error('not-found');

  const { latitude, longitude, name } = geo.results[0];
  const p = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
  });
  return { name, ...(await getJSON(`${WX}?${p}`)) };
}

function getConditions(code) {
  if (code === 0) return { icon: '☀️', text: 'Clear sky' };
  if (code <= 2) return { icon: '⛅', text: 'Partly cloudy' };
  if (code === 3) return { icon: '☁️', text: 'Overcast' };
  if (code <= 48) return { icon: '🌫️', text: 'Fog' };
  if (code <= 57) return { icon: '🌦️', text: 'Drizzle' };
  if (code <= 67) return { icon: '🌧️', text: 'Rain' };
  if (code <= 77) return { icon: '❄️', text: 'Snow' };
  if (code <= 82) return { icon: '🌧️', text: 'Rain showers' };
  if (code <= 86) return { icon: '🌨️', text: 'Snow showers' };
  return { icon: '⛈️', text: 'Thunderstorm' };
}

function renderWeather(data) {
  const { name, current } = data;
  const { icon, text } = getConditions(current.weather_code);

  placeEl.textContent = name;
  iconEl.textContent = icon;
  tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  conditionsEl.textContent = text;
  feelsEl.textContent = `Feels like ${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `Humidity ${current.relative_humidity_2m}%`;
  windEl.textContent = `Wind ${current.wind_speed_10m} km/h`;
}


function setStatus(state, message = '') {
  statusEl.dataset.state = state;
  statusEl.textContent = message;
  searchBtn.disabled = state === 'loading';
}


function friendly(err) {
  if (err.message === 'not-found') return 'City not found. Check the spelling and try again.';
  if (err.message === 'HTTP 429') return 'Too many requests. Wait a minute and try again.';
  return "Couldn't reach the weather server. Check your connection and try again.";
}


async function onSearch(e) {
  e.preventDefault(); // stop the page from reloading
  const city = input.value.trim();

  if (!city) {
    setStatus('error', 'Please type a city name.');
    return;
  }

  weatherEl.classList.add('hidden');
  setStatus('loading', `Loading ${city}…`);
  try {
    const data = await loadWeather(city);
    renderWeather(data);
    weatherEl.classList.remove('hidden');
    setStatus('success');
  } catch (err) {
    setStatus('error', friendly(err));
  }
}

form.addEventListener('submit', onSearch);