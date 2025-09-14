
import axios from 'axios';

const API_URL = 'https://railway-yrlm.onrender.com/api';

const ML_API_URL = 'https://railway-ml-model.onrender.com/inspection-recommendation';


const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

/**
 * UDM: Receive a lot package at a depot
 * @param {object} data - { lotId, depotId, inspector, notes }
 */
export const receiveLot = (data) => {
  return api.post('/udm/receive', data);
};

/**
 * TMS: Install a product on the track
 * @param {object} data - { productId, trackLocation, gpsLocation, installedBy, notes }
 */
export const installProduct = (data) => {
  return api.post('/tms/install', data);
};

/**
 * INSPECTIONS: Create a new inspection report
 * @param {object} data - { productId, inspector, results, recommendation, gpsLocation, photos }
 */
export const postInspection = (data) => {
  return api.post('/inspections', data);
};

/**
 * PRODUCTS: Fetch a single product by its ID
 * @param {string} productId
 */
export const getProductById = (productId) => {
  return api.get(`/products/${productId}`);
};

/**
 * PRODUCTS: Fetch a list of products with optional filters
 * @param {object} params - e.g., { status: 'in_stock' }, { lotId: '...' }
 */
export const getProducts = (params) => {
  
  return api.get('/products', { params });
};

/**
 * MANUFACTURER: Create a new manufacturer
 * @param {object} data - { manufacturerId, name, contact, publicKey }
 */
export const createManufacturer = (data) => {
  return api.post('/manufacturer', data);
};

/**
 * MANUFACTURER: Create a new lot of products
 * @param {object} data - { manufacturerId, productType, quantity, warrantyMonths }
 */
export const createLot = (data) => {
  return api.post('/manufacturer/lots', data);
};

/**
 * MANUFACTURER: Get all lots created by a specific manufacturer
 * @param {string} manufacturerId
 */
export const getLotsByManufacturerId = (manufacturerId) => {
  return api.get(`/manufacturer/${manufacturerId}/lots`);
}

/**
/**
 * AI: Fetch a recommendation from the separate ML model
 * @param {object} results - { condition, voltage, vibration }
 */
export const getAiRecommendation = (results) => {

  return axios.post(ML_API_URL, results, { timeout: 20000 });
};

export const getAiProductInsights = (payload) => {
  const ML_PREDICT_URL = 'https://railway-ml-model.onrender.com/predict';
  return axios.post(ML_PREDICT_URL, payload, { timeout: 20000 });
}
export default api;

export const getAiPredictions = async (productId) => {
  try {
    const res = await fetch("https://railway-ml-model.onrender.com/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error("Failed to fetch AI predictions");
    const data = await res.json();
    return data.predictions || [];
  } catch (err) {
    console.error("AI Prediction Error:", err);
    return [];
  }
};