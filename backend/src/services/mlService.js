const axios  = require('axios');
const FormData = require('form-data');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Disease prediction (image buffer)
const predictDisease = async (imageBuffer, mimeType) => {
  try {
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename   : 'crop.jpg',
      contentType: mimeType || 'image/jpeg'
    });

    const response = await axios.post(
      `${ML_BASE_URL}/predict/disease`,
      form,
      { headers: form.getHeaders(), timeout: 60000 }
    );
    return response.data;
  } catch (err) {
    console.error('ML predict/disease error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error('ML service is starting up, please try again in 1-2 minutes');
    }
    throw new Error(`ML prediction failed: ${err.response?.data?.detail || err.message}`);
  }
};

// 7-day risk forecast
const predictForecast = async (ndviSeries, weather, districtId) => {
  try {
    const response = await axios.post(
      `${ML_BASE_URL}/predict/forecast`,
      { ndvi_series: ndviSeries, weather, district_id: districtId },
      { timeout: 30000 }
    );
    return response.data;
  } catch (err) {
    console.error('ML predict/forecast error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error('ML service is starting up, please try again in 1-2 minutes');
    }
    throw new Error(`Forecast failed: ${err.response?.data?.detail || err.message}`);
  }
};

// Full satellite pipeline
const predictFull = async (bbox, lat, lon, districtId) => {
  try {
    const response = await axios.post(
      `${ML_BASE_URL}/predict/full`,
      { bbox, lat, lon, district_id: districtId },
      { timeout: 60000 }
    );
    return response.data;
  } catch (err) {
    console.error('ML predict/full error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error('ML service is starting up, please try again in 1-2 minutes');
    }
    throw new Error(`Satellite pipeline failed: ${err.response?.data?.detail || err.message}`);
  }
};

// Health check
const checkMLHealth = async () => {
  const response = await axios.get(`${ML_BASE_URL}/health`, { timeout: 5000 });
  return response.data;
};

module.exports = { predictDisease, predictForecast, predictFull, checkMLHealth };
