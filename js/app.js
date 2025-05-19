// app.js - Clase principal de la aplicación
import { MenuManager } from "./MenuManager.js"
import { CartManager } from "./CartManager.js"
import { TeamManager } from "./TeamManager.js"
import { TEAM_DATA } from "./data.js"

class App {
  constructor() {
    this.menuManager = new MenuManager()
    this.cartManager = new CartManager()
    this.teamManager = new TeamManager(TEAM_DATA)
  }

  // AQUÍ SE UTILIZA ASYNC/AWAIT PARA INICIALIZAR LA APLICACIÓN
  // Esta función inicializa la aplicación de forma asíncrona
  async init() {
    // AQUÍ SE CARGA EL MENÚ DE FORMA ASÍNCRONA
    // Espera a que se carguen los datos del menú antes de continuar
    const menuLoaded = await this.menuManager.fetchData()

    // Renderizar equipo
    this.teamManager.render()

    // Configurar eventos
    this.menuManager.setupEventListeners(this.cartManager)
    this.cartManager.setupEventListeners()

    // Renderizar interfaz inicial
    if (menuLoaded) {
      this.menuManager.updateActiveCategory()
      this.menuManager.renderMenu()
    }

    this.cartManager.render()
  }
}

export { App }
