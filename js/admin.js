// Punto de entrada para el panel de administración
import { API_ENDPOINTS, apiRequest } from "./api-config.js"
import { UI } from "./UI.js"

// Estados de pedidos
const ORDER_STATES = {
  PENDING: "pendiente",
  COMPLETED: "atendido",
}

class OrderManager {
  constructor() {
    this.orders = []
    this.currentFilter = "all" // all, pending, completed
    this.currentCustomerFilter = ""
    this.ordersContainer = document.getElementById("ordersList")
    this.filterButtons = document.querySelectorAll(".filter-btn")
    this.customerFilterInput = document.getElementById("customerFilter")

    this.init()
  }

  async init() {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem("authToken")
    if (!token) {
      // Redirigir a la página de autenticación si no hay token
      window.location.href = "auth.html"
      return
    }

    // Mostrar información del usuario
    const userInfo = document.getElementById("userInfo")
    const userName = document.getElementById("userName")

    if (userInfo && userName) {
      userInfo.style.display = "flex"
      userName.textContent = localStorage.getItem("userEmail") || "Usuario"
    }

    // Configurar eventos
    this.setupEventListeners()

    // Cargar pedidos
    this.loadOrders()
  }

  setupEventListeners() {
    // Filtros de estado
    if (this.filterButtons) {
      this.filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.currentFilter = button.dataset.filter
          this.updateActiveFilter()
          this.renderOrders()
        })
      })
    }

    // Filtro de cliente
    if (this.customerFilterInput) {
      this.customerFilterInput.addEventListener("input", (e) => {
        this.currentCustomerFilter = e.target.value.toLowerCase()
        this.renderOrders()
      })
    }

    // Delegación de eventos para los botones de acción en pedidos
    if (this.ordersContainer) {
      this.ordersContainer.addEventListener("click", async (e) => {
        const completeBtn = e.target.closest(".complete-order-btn")
        const viewDetailsBtn = e.target.closest(".view-details-btn")

        if (completeBtn) {
          const orderId = Number.parseInt(completeBtn.dataset.id)
          await this.completeOrder(orderId)
        } else if (viewDetailsBtn) {
          const orderId = Number.parseInt(viewDetailsBtn.dataset.id)
          this.showOrderDetails(orderId)
        }
      })
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // Eliminar token y datos de usuario
        localStorage.removeItem("authToken")
        localStorage.removeItem("userId")
        localStorage.removeItem("userEmail")

        UI.showNotification("Sesión cerrada correctamente")

        // Redirigir a la página de autenticación
        setTimeout(() => {
          window.location.href = "auth.html"
        }, 1000)
      })
    }
  }

  updateActiveFilter() {
    if (this.filterButtons) {
      this.filterButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.filter === this.currentFilter)
      })
    }
  }

  async loadOrders() {
    try {
      if (this.ordersContainer) {
        this.ordersContainer.innerHTML = '<p class="loading">Cargando pedidos...</p>'
      }

      // Obtener pedidos desde la API
      const orders = await apiRequest(API_ENDPOINTS.ORDERS)

      this.orders = orders
      this.renderOrders()
    } catch (error) {
      console.error("Error al cargar pedidos:", error)
      if (this.ordersContainer) {
        this.ordersContainer.innerHTML = '<p class="error">Error al cargar pedidos. Por favor, intente nuevamente.</p>'
      }
    }
  }

  renderOrders() {
    if (!this.ordersContainer) return

    // Filtrar pedidos según los criterios actuales
    let filteredOrders = [...this.orders]

    // Filtro por estado
    if (this.currentFilter === "pending") {
      filteredOrders = filteredOrders.filter((order) => order.status === ORDER_STATES.PENDING)
    } else if (this.currentFilter === "completed") {
      filteredOrders = filteredOrders.filter((order) => order.status === ORDER_STATES.COMPLETED)
    }

    // Filtro por cliente
    if (this.currentCustomerFilter) {
      filteredOrders = filteredOrders.filter((order) =>
        order.customer_name.toLowerCase().includes(this.currentCustomerFilter),
      )
    }

    if (filteredOrders.length === 0) {
      this.ordersContainer.innerHTML = '<p class="info">No hay pedidos que coincidan con los filtros seleccionados.</p>'
      return
    }

    this.ordersContainer.innerHTML = filteredOrders
      .map((order) => {
        const date = new Date(order.created_at).toLocaleString()
        const isPending = order.status === ORDER_STATES.PENDING

        return `
        <div class="order-card ${isPending ? "pending" : "completed"}">
          <div class="order-header">
            <h3>Pedido #${order.id}</h3>
            <span class="order-status ${isPending ? "pending" : "completed"}">
              ${isPending ? "Pendiente" : "Atendido"}
            </span>
          </div>
          <div class="order-info">
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            <p><strong>Teléfono:</strong> ${order.customer_phone}</p>
            <p><strong>Dirección:</strong> ${order.customer_address}</p>
            <p><strong>Total:</strong> $${Number(order.total_amount).toFixed(2)}</p>
            <p><strong>Fecha:</strong> ${date}</p>
          </div>
          <div class="order-actions">
            <button class="view-details-btn" data-id="${order.id}">Ver Detalles</button>
            ${isPending ? `<button class="complete-order-btn" data-id="${order.id}">Marcar como Atendido</button>` : ""}
          </div>
        </div>
      `
      })
      .join("")
  }

  async completeOrder(orderId) {
    try {
      // Actualizar estado del pedido en la API
      await apiRequest(`${API_ENDPOINTS.ORDERS}${orderId}/mark_completed/`, "PATCH")

      // Actualizar el pedido en la lista local
      const orderIndex = this.orders.findIndex((order) => order.id === orderId)
      if (orderIndex !== -1) {
        this.orders[orderIndex].status = ORDER_STATES.COMPLETED
      }

      this.renderOrders()
      UI.showNotification("Pedido marcado como atendido")
    } catch (error) {
      console.error("Error al actualizar pedido:", error)
      UI.showNotification("Error al actualizar el estado del pedido")
    }
  }

  async showOrderDetails(orderId) {
    try {
      // Obtener los detalles del pedido
      const order = this.orders.find((o) => o.id === orderId)
      if (!order) throw new Error("Pedido no encontrado")

      // Crear el modal de detalles
      const modal = document.createElement("div")
      modal.className = "order-details-modal"

      const modalContent = document.createElement("div")
      modalContent.className = "order-details-content"

      modalContent.innerHTML = `
        <h2>Detalles del Pedido #${orderId}</h2>
        <button class="close-details">&times;</button>
        
        <div class="order-customer-info">
          <h3>Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${order.customer_name}</p>
          <p><strong>Teléfono:</strong> ${order.customer_phone}</p>
          <p><strong>Dirección:</strong> ${order.customer_address}</p>
          <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Estado:</strong> ${order.status === ORDER_STATES.PENDING ? "Pendiente" : "Atendido"}</p>
        </div>
        
        <div class="order-items">
          <h3>Productos</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>$${Number(item.price).toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>Total</strong></td>
                <td><strong>$${Number(order.total_amount).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `

      modal.appendChild(modalContent)
      document.body.appendChild(modal)

      // Mostrar el modal con animación
      setTimeout(() => {
        modal.classList.add("active")
      }, 10)

      // Cerrar el modal
      const closeBtn = modal.querySelector(".close-details")
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active")
        setTimeout(() => {
          document.body.removeChild(modal)
        }, 300)
      })
    } catch (error) {
      console.error("Error al mostrar detalles del pedido:", error)
      UI.showNotification("Error al cargar los detalles del pedido")
    }
  }
}

// Inicializar el gestor de pedidos cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new OrderManager()
})
