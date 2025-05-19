//  - Utilidades para la interfaz de usuario
class UI {
    static showNotification(message) {
      const notification = document.createElement("div")
      notification.className = "notification"
      notification.textContent = message
      document.body.appendChild(notification)
  
      setTimeout(() => {
        notification.classList.add("show")
        setTimeout(() => {
          notification.classList.remove("show")
          setTimeout(() => notification.remove(), 300)
        }, 2000)
      }, 100)
    }
  }
  
  export { UI }
  