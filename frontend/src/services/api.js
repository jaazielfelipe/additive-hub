const API_URL = "http://localhost:3000";

export const api = {
  get: (endpoint) => fetch(`${API_URL}${endpoint}`).then(res => res.json()),
};