//  Punto de entrada de la aplicación
import { App } from "./app.js"
import { testConnection } from "./api-config.js"

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  // Probar la conexión con la API
  console.log("Probando conexión con la API...")
  const isConnected = await testConnection()

  if (!isConnected) {
    console.error("No se pudo establecer conexión con la API. Verifica la configuración.")
  }

  // Inicializar la aplicación
  const app = new App()
  app.init()
})
