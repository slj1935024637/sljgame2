export default class InputHandler {
  constructor(game) {
    this.game = game
    this.keys = {
      left: false,
      right: false,
      up: false,
      attack: false,
      rangedAttack: false
    }

    // Bind event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowLeft':
        this.keys.left = true
        break
      case 'ArrowRight':
        this.keys.right = true
        break
      case 'ArrowUp':
        this.keys.up = true
        break
      case ' ': // Space key
        this.keys.attack = true
        if (this.game.player) {
          this.game.player.meleeAttack()
        }
        break
      case 'a':
      case 'A':
        this.keys.rangedAttack = true
        if (this.game.player) {
          this.game.player.rangedAttack()
        }
        break
    }
  }

  handleKeyUp(event) {
    switch (event.key) {
      case 'ArrowLeft':
        this.keys.left = false
        break
      case 'ArrowRight':
        this.keys.right = false
        break
      case 'ArrowUp':
        this.keys.up = false
        break
      case ' ': // Space key
        this.keys.attack = false
        break
      case 'a':
      case 'A':
        this.keys.rangedAttack = false
        break
    }
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }
}
