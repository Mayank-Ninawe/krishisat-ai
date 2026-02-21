import axios from 'axios'
import { auth } from './firebase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

// Keep BACKEND as alias for compatibility
const BACKEND = API_BASE_URL

// Auth header helper
const authHeader = async () => {
  const user  = auth.currentUser
  if (!user) return {}
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

// ── AUTH ─────────────────────────────────────────────
export const registerFarmer = async (data: {
  email: string; password: string; name: string
  village?: string; district?: string
}) => {
  const res = await axios.post(`${BACKEND}/api/auth/register`, data)
  return res.data
}

export const getFarmerProfile = async (uid: string) => {
  const res = await axios.get(`${BACKEND}/api/auth/farmer/${uid}`)
  return res.data
}

// ── SCANS ────────────────────────────────────────────
export const scanDisease = async (
  imageFile: File, cropType: string, fieldLocation: string
) => {
  const headers = await authHeader()
  const form    = new FormData()
  form.append('image',         imageFile)
  form.append('cropType',      cropType)
  form.append('fieldLocation', fieldLocation)

  const res = await axios.post(`${BACKEND}/api/scans`, form, { headers })
  return res.data
}

export const getScanHistory = async (limit = 20) => {
  const headers = await authHeader()
  const res     = await axios.get(
    `${BACKEND}/api/scans/history?limit=${limit}`,
    { headers }
  )
  return res.data
}

// ── FORECAST ─────────────────────────────────────────
export const getForecast = async (
  ndviSeries: number[], weather: object, districtId: number
) => {
  const headers = await authHeader()
  const res = await axios.post(
    `${BACKEND}/api/forecast`,
    { ndvi_series: ndviSeries, weather, district_id: districtId },
    { headers }
  )
  return res.data
}

// ── DISTRICTS ────────────────────────────────────────
export const getDistricts = async () => {
  const res = await axios.get(`${BACKEND}/api/districts`)
  return res.data
}

export const getDistrictRisk = async (id: number) => {
  const res = await axios.get(`${BACKEND}/api/districts/${id}/risk`)
  return res.data
}
