//  - Gestor del equipo
class TeamManager {
    constructor(data) {
      this.data = data
      this.container = document.querySelector(".team-grid")
    }
  
    render() {
      if (!this.container) return
  
      this.container.innerHTML = this.data
        .map(
          (member) => `
          <div class="team-member">
              <h3>${member.name}</h3>
              <p class="role">${member.role}</p>
              <p class="specialty">${member.specialty}</p>
          </div>
        `,
        )
        .join("")
    }
  }
  
  export { TeamManager }
  