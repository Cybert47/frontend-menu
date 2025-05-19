// - Gestor del menú
import { API_ENDPOINTS, apiRequest, testConnection } from "./api-config.js"

// Configuración de categorías
const CATEGORIES = ["starters", "main", "drinks", "desserts"]
const DEFAULT_CATEGORY = "starters"

class MenuManager {
  constructor() {
    this.data = {}
    this.currentCategory = DEFAULT_CATEGORY
    this.menuSection = document.getElementById("menu")
    this.categoryButtons = document.querySelectorAll(".category-btn")

    // Inicializar estructura de categorías
    CATEGORIES.forEach((category) => {
      this.data[category] = []
    })
  }

  // AQUÍ SE UTILIZA FETCH Y ASYNC/AWAIT PARA CARGAR LOS PRODUCTOS DE FORMA ASÍNCRONA
  // Esta función hace una solicitud HTTP asíncrona para obtener los datos del menú desde la API
  async fetchData() {
    try {
      // Probar la conexión con la API
      const isConnected = await testConnection()
      if (!isConnected) {
        throw new Error("No se pudo establecer conexión con la API")
      }

      // Obtener productos desde la API
      const products = await apiRequest(API_ENDPOINTS.PRODUCTS)

      console.log("Datos recibidos:", products)

      if (products && Array.isArray(products)) {
        // Distribuye los productos en sus categorías correspondientes
        products.forEach((product) => {
          // Extraer la categoría del producto
          const categoryObj = product.category_name?.toLowerCase() || DEFAULT_CATEGORY
          let category

          // Mapear la categoría al slug correspondiente
          if (categoryObj === "entradas") category = "starters"
          else if (categoryObj === "platos principales") category = "main"
          else if (categoryObj === "bebidas") category = "drinks"
          else if (categoryObj === "postres") category = "desserts"
          else category = DEFAULT_CATEGORY

          // Asegurarse de que la categoría existe en nuestro objeto de datos
          if (this.data[category]) {
            this.data[category].push({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              image: product.image ,
            })
          }
        })

        // Verificar si hay productos en cada categoría después de la distribución
        console.log("Distribución de productos por categoría:", {
          starters: this.data.starters.length,
          main: this.data.main.length,
          drinks: this.data.drinks.length,
          desserts: this.data.desserts.length,
        })

        console.log("Menú cargado correctamente")
        return true
      } else {
        throw new Error("Formato de datos inesperado")
      }
    } catch (error) {
      console.error("Error al cargar el menú:", error)
      this.menuSection.innerHTML = '<p class="error">Error al cargar el menú. Por favor, intente nuevamente.</p>'
      return false
    }
  }

  renderMenu() {
    const category = this.currentCategory

    if (!this.data || Object.keys(this.data).length === 0) {
      this.menuSection.innerHTML = '<p class="loading">Cargando menú...</p>'
      return
    }

    if (!this.data[category] || this.data[category].length === 0) {
      this.menuSection.innerHTML = '<p class="info">No hay productos disponibles en esta categoría</p>'
      return
    }

    // Debug: Verifiquemos los datos que vamos a renderizar
    console.log(`Datos a renderizar en categoría ${category}:`, this.data[category])

    this.menuSection.innerHTML = this.data[category]
      .map((item) => {
        return `
          <div class="menu-item">
              <div class="menu-item-image">
                  <img src="${item.image}" alt="${item.name}" >
              </div>
              <div class="menu-item-info">
                  <h3>${item.name}</h3>
                  <p>${item.description}</p>
                  <div class="menu-item-footer">
                      <span class="price">$${isNaN(item.price) ? "0.00" : Number(item.price).toFixed(2)}</span>
                      <button class="add-to-cart-btn" 
                        data-id="${item.id}" 
                        data-name="${item.name}" 
                        data-price="${isNaN(item.price) ? 0 : item.price}" 
                        data-image="${item.image}">
                          Agregar al Carrito
                      </button>
                  </div>
              </div>
          </div>
        `
      })
      .join("")
  }

  updateActiveCategory() {
    this.categoryButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.category === this.currentCategory)
    })
  }

  setCategory(category) {
    this.currentCategory = category
    this.updateActiveCategory()
    this.renderMenu()
  }

  setupEventListeners(cartManager) {
    this.categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setCategory(button.dataset.category)
      })
    })

    // Delegación de eventos para los botones de agregar al carrito
    this.menuSection.addEventListener("click", (event) => {
      const button = event.target.closest(".add-to-cart-btn")
      if (button) {
        const item = {
          id: Number.parseInt(button.dataset.id),
          name: button.dataset.name,
          price: Number.parseFloat(button.dataset.price),
          image: button.dataset.image,
        }
        cartManager.addItem(item)
      }
    })
  }
}

export { MenuManager }
