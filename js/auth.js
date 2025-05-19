// Archivo para manejar la autenticación
import { API_ENDPOINTS, apiRequest } from "./api-config.js"
import { UI } from "./UI.js"

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const authTabs = document.querySelectorAll(".auth-tab")
  const authForms = document.querySelectorAll(".auth-form-container")
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  // Cambiar entre pestañas de inicio de sesión y registro
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remover clase active de todas las pestañas y formularios
      authTabs.forEach((t) => t.classList.remove("active"))
      authForms.forEach((f) => f.classList.remove("active"))

      // Añadir clase active a la pestaña seleccionada y su formulario correspondiente
      tab.classList.add("active")
      const formId = `${tab.dataset.tab}-form`
      document.getElementById(formId).classList.add("active")
    })
  })

  // Manejar inicio de sesión
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    if (!email || !password) {
      UI.showNotification("Por favor ingrese email y contraseña")
      return
    }

    try {
      const loginBtn = document.getElementById("loginBtn")
      loginBtn.textContent = "Iniciando sesión..."
      loginBtn.disabled = true

      const data = await apiRequest(API_ENDPOINTS.LOGIN, "POST", {
        username: email,
        password: password,
      })

      // Guardar token en localStorage
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userId", data.user_id)
      localStorage.setItem("userEmail", data.email)

      UI.showNotification("Inicio de sesión exitoso")

      // Redirigir al panel de administración
      setTimeout(() => {
        window.location.href = "admin.html"
      }, 1000)
    } catch (error) {
      console.error("Error de inicio de sesión:", error)
      UI.showNotification("Error de inicio de sesión: " + error.message)
    } finally {
      const loginBtn = document.getElementById("loginBtn")
      loginBtn.textContent = "Iniciar Sesión"
      loginBtn.disabled = false
    }
  })

  // Manejar registro de usuario
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("registerName").value
    const email = document.getElementById("registerEmail").value
    const password = document.getElementById("registerPassword").value
    const passwordConfirm = document.getElementById("registerPasswordConfirm").value

    if (!name || !email || !password || !passwordConfirm) {
      UI.showNotification("Por favor complete todos los campos")
      return
    }

    if (password !== passwordConfirm) {
      UI.showNotification("Las contraseñas no coinciden")
      return
    }

    try {
      const registerBtn = document.getElementById("registerBtn")
      registerBtn.textContent = "Registrando..."
      registerBtn.disabled = true

      // Registrar usuario en la API
      const data = await apiRequest(API_ENDPOINTS.REGISTER, "POST", {
        username: email,
        email: email,
        password: password,
        first_name: name,
      })

      UI.showNotification("Registro exitoso. Ahora puede iniciar sesión.")

      // Limpiar formulario
      registerForm.reset()

      // Cambiar a la pestaña de inicio de sesión
      authTabs[0].click()
    } catch (error) {
      console.error("Error de registro:", error)
      UI.showNotification("Error de registro: " + error.message)
    } finally {
      const registerBtn = document.getElementById("registerBtn")
      registerBtn.textContent = "Registrarse"
      registerBtn.disabled = false
    }
  })
})
