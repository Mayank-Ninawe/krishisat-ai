import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// ── AUTH ─────────────────────────────────────────────
export const registerFarmer = async (data: {
  email: string; password: string; name: string
  village?: string; district?: string
}) => {
  const res = await api.post('/auth/register', data)
  return res.data
}

export const getFarmerProfile = async (uid: string) => {
  const res = await api.get(`/auth/farmer/${uid}`)
  return res.data
}

// ── SCANS ────────────────────────────────────────────
export const scanDisease = async (
  imageFile: File, cropType: string, fieldLocation: string
) => {
  const form = new FormData()
  form.append('image',         imageFile)
  form.append('cropType',      cropType)
  form.append('fieldLocation', fieldLocation)

  const res = await api.post('/scans', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const getScanHistory = async (limit = 20) => {
  const res = await api.get(`/scans/history?limit=${limit}`)
  return res.data
}

// ── FORECAST ─────────────────────────────────────────
export const getForecast = async (
  ndviSeries: number[], weather: object, districtId: number
) => {
  const res = await api.post('/forecast', {
    ndvi_series: ndviSeries, weather, district_id: districtId
  })
  return res.data
}

// ── DISTRICTS ────────────────────────────────────────
export const getDistricts = async () => {
  const res = await api.get('/districts')
  return res.data
}

export const getDistrictRisk = async (id: number) => {
  const res = await api.get(`/districts/${id}/risk`)
  return res.data
}
