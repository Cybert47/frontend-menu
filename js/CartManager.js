//  - Gestor del carrito
import { API_ENDPOINTS, apiRequest } from "./api-config.js"
import { UI } from "./UI.js"

// Estados de pedidos
const ORDER_STATES = {
  PENDING: "pendiente",
  COMPLETED: "atendido",
}

class CartManager {
  constructor() {
    this.items = []
    this.modal = document.getElementById("cartModal")
    this.itemsContainer = document.querySelector(".cart-items")
    this.totalElement = document.getElementById("cartTotal")
    this.countElement = document.querySelector(".cart-count")
    this.toggleButton = document.querySelector(".cart-toggle")
    this.closeButton = document.querySelector(".close-cart")
    this.checkoutButton = document.getElementById("checkoutBtn")
    this.checkoutForm = document.getElementById("checkoutForm")

    this.loadFromStorage()
  }

  setupEventListeners() {
    this.toggleButton.addEventListener("click", () => this.toggle())
    this.closeButton.addEventListener("click", () => this.toggle())
    this.checkoutButton.addEventListener("click", () => this.showCheckoutForm())

    // Delegación de eventos para los botones del carrito
    this.itemsContainer.addEventListener("click", (event) => {
      const increaseBtn = event.target.closest(".quantity-btn.increase")
      const decreaseBtn = event.target.closest(".quantity-btn.decrease")
      const removeBtn = event.target.closest(".remove-item")

      if (increaseBtn) {
        this.updateQuantity(Number.parseInt(increaseBtn.dataset.id), 1)
      } else if (decreaseBtn) {
        this.updateQuantity(Number.parseInt(decreaseBtn.dataset.id), -1)
      } else if (removeBtn) {
        this.removeItem(Number.parseInt(removeBtn.dataset.id))
      }
    })

    // Eventos del formulario de checkout
    document.getElementById("cancelOrder")?.addEventListener("click", () => this.hideCheckoutForm())
    document.getElementById("orderForm")?.addEventListener("submit", (e) => this.submitOrder(e))
  }

  render() {
    this.itemsContainer.innerHTML =
      this.items.length === 0
        ? '<p class="empty-cart">Tu carrito está vacío</p>'
        : this.items
            .map(
              (item) => `
          <div class="cart-item">
              <img src="${item.image}" alt="${item.name}" >
              <div class="cart-item-details">
                  <h4>${item.name}</h4>
                  <p>$${Number(item.price).toFixed(2)} x ${item.quantity}</p>
              </div>
              <div class="quantity-controls">
                <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn increase" data-id="${item.id}">+</button>
              </div>
              <button class="remove-item" data-id="${item.id}">×</button>
          </div>
        `,
            )
            .join("")

    this.updateTotal()
  }

  updateTotal() {
    const total = this.calculateTotal()
    this.totalElement.textContent = `$${total.toFixed(2)}`
  }

  updateCount() {
    const count = this.items.reduce((total, item) => total + item.quantity, 0)
    this.countElement.textContent = count
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  addItem(item) {
    const existingItem = this.items.find((i) => i.id === item.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      this.items.push({ ...item, quantity: 1 })
    }

    this.update()
    UI.showNotification("Producto agregado al carrito")
  }

  updateQuantity(itemId, change) {
    const item = this.items.find((i) => i.id === itemId)
    if (item) {
      item.quantity += change
      if (item.quantity <= 0) {
        this.removeItem(itemId)
      } else {
        this.update()
      }
    }
  }

  removeItem(itemId) {
    this.items = this.items.filter((item) => item.id !== itemId)
    this.update()
  }

  update() {
    this.render()
    this.updateCount()
    this.saveToStorage()
  }

  saveToStorage() {
    localStorage.setItem("cart", JSON.stringify(this.items))
  }

  loadFromStorage() {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        this.items = JSON.parse(savedCart)
        this.updateCount()
      } catch (e) {
        console.error("Error al cargar el carrito:", e)
      }
    }
  }

  toggle() {
    this.modal.classList.toggle("active")
    this.hideCheckoutForm()
  }

  showCheckoutForm() {
    if (this.items.length === 0) {
      UI.showNotification("El carrito está vacío")
      return
    }

    if (!this.checkoutForm) {
      console.error("El elemento checkoutForm no existe en el DOM")
      UI.showNotification("Error al mostrar el formulario de checkout")
      return
    }

    this.modal.classList.remove("active")
    this.checkoutForm.classList.add("active")

    this.renderOrderSummary()
  }

  hideCheckoutForm() {
    if (this.checkoutForm) {
      this.checkoutForm.classList.remove("active")
    }
  }

  renderOrderSummary() {
    const orderSummary = document.getElementById("orderSummary")
    if (!orderSummary) {
      console.error("El elemento orderSummary no existe en el DOM")
      return
    }

    orderSummary.innerHTML = this.items
      .map(
        (item) => `
        <div class="summary-item">
          <span>${item.name} x ${item.quantity}</span>
          <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `,
      )
      .join("")

    const orderTotalSummary = document.getElementById("orderTotalSummary")
    if (orderTotalSummary) {
      orderTotalSummary.textContent = `$${this.calculateTotal().toFixed(2)}`
    }
  }

  async submitOrder(e) {
    e.preventDefault()

    const customerName = document.getElementById("customerName")?.value || ""
    const customerPhone = document.getElementById("customerPhone")?.value || ""
    const customerAddress = document.getElementById("customerAddress")?.value || ""

    if (!customerName || !customerPhone || !customerAddress) {
      UI.showNotification("Por favor complete todos los campos")
      return
    }

    // Preparar los datos del pedido
    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      total_amount: this.calculateTotal(),
      items: this.items.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    }

    try {
      let confirmButton = document.getElementById("confirmOrder")
      if (confirmButton) {
        confirmButton.textContent = "Enviando..."
        confirmButton.disabled = true
      }

      console.log("Enviando datos del pedido:", orderData)

      // Enviar el pedido a la API
      const response = await apiRequest(API_ENDPOINTS.ORDERS, "POST", orderData)

      UI.showNotification("¡Gracias por tu pedido! Será procesado en breve.")

      // Limpiar carrito y formulario
      this.items = []
      this.update()
      document.getElementById("orderForm")?.reset()
      this.hideCheckoutForm()

      confirmButton = document.getElementById("confirmOrder")
      if (confirmButton) {
        confirmButton.textContent = "Confirmar Pedido"
        confirmButton.disabled = false
      }
    } catch (error) {
      console.error("Error al enviar el pedido:", error)
      UI.showNotification("Error al procesar el pedido. Intente nuevamente.")

      const confirmButton = document.getElementById("confirmOrder")
      if (confirmButton) {
        confirmButton.textContent = "Confirmar Pedido"
        confirmButton.disabled = false
      }
    }
  }
}

export { CartManager }
