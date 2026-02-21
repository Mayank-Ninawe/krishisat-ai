const axios  = require('axios');
const FormData = require('form-data');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Disease prediction (image buffer)
const predictDisease = async (imageBuffer, mimeType) => {
  const form = new FormData();
  form.append('file', imageBuffer, {
    filename   : 'crop.jpg',
    contentType: mimeType || 'image/jpeg'
  });

  const response = await axios.post(
    `${ML_BASE_URL}/predict/disease`,
    form,
    { headers: form.getHeaders(), timeout: 30000 }
  );
  return response.data;
};

// 7-day risk forecast
const predictForecast = async (ndviSeries, weather, districtId) => {
  const response = await axios.post(
    `${ML_BASE_URL}/predict/forecast`,
    { ndvi_series: ndviSeries, weather, district_id: districtId },
    { timeout: 15000 }
  );
  return response.data;
};

// Full satellite pipeline
const predictFull = async (bbox, lat, lon, districtId) => {
  const response = await axios.post(
    `${ML_BASE_URL}/predict/full`,
    { bbox, lat, lon, district_id: districtId },
    { timeout: 30000 }
  );
  return response.data;
};

// Health check
const checkMLHealth = async () => {
  const response = await axios.get(`${ML_BASE_URL}/health`, { timeout: 5000 });
  return response.data;
};

module.exports = { predictDisease, predictForecast, predictFull, checkMLHealth };
