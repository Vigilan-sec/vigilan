// URL de ton Backend FastAPI (souvent http://localhost:8000)
const API_BASE_URL = "http://localhost:8000";

// Récupération des statistiques d'alertes (FP2/FP3)
export async function fetchAlertStats() {
  const response = await fetch(`${API_BASE_URL}/alert-stats`);
  if (!response.ok) throw new Error("Erreur lors de la récupération des stats d'alertes");
  return response.json();
}

// Récupération du flux réseau (FP1/FP3)
export async function fetchFlowStats() {
  const response = await fetch(`${API_BASE_URL}/flow-stats`);
  if (!response.ok) throw new Error("Erreur lors de la récupération du flux réseau");
  return response.json();
}