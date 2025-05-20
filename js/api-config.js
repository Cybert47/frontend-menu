// Configuración de la API para el proyecto
// Este archivo centraliza la configuración de la API para toda la aplicación

// URL base de la API - Cambia esto según tu configuración
const API_BASE_URL = "https://backend-menu-5aw2.onrender.com/"

// Endpoints de la API
const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}api/products/`,
  CATEGORIES: `${API_BASE_URL}api/categories/`,
  ORDERS: `${API_BASE_URL}api/orders/`,
  REGISTER: `${API_BASE_URL}api/register/`,
  LOGIN: `${API_BASE_URL}api/login/`,
}

// Función para obtener el token de autenticación del almacenamiento local
function getAuthToken() {
  return localStorage.getItem("authToken")
}

// Función para realizar solicitudes a la API
async function apiRequest(endpoint, method = "GET", data = null) {
  const headers = {
    "Content-Type": "application/json",
  }

  // Añadir token de autenticación si existe
  const token = getAuthToken()
  if (token) {
    headers["Authorization"] = `Token ${token}`
  }

  const config = {
    method,
    headers,
  }

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(endpoint, config)

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`)
    }

    // Para solicitudes DELETE, puede no haber contenido
    if (response.status === 204) {
      return { success: true }
    }

    return await response.json()
  } catch (error) {
    console.error("API request error:", error)
    throw error
  }
}

// Función para verificar la conexión con la API
async function testConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}api/categories`)
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    console.log("Conexión con la API establecida correctamente")
    return true
  } catch (error) {
    console.error("Error al conectar con la API:", error)
    return false
  }
}

export { API_ENDPOINTS, apiRequest, testConnection }
