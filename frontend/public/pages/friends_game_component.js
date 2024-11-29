class Game_Friends extends HTMLElement {
    constructor() {
      super()
    }
  
    connectedCallback() {
      this.render();
    }
  
    render() {
      this.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ping Pong Game</title>
          <link rel="stylesheet" href="../public/game/css/friends_game.css">
          <link rel="icon" type="image/x-icon" href="public/game/images/140412.png">
        </head>
        <body>
        <div id="header">
          <div id="score-board">
            <span id="score1">0</span>
            <div id="timer">Time: <span id="timer-value">0:00</span></div>
            <span id="score2">0</span>
        </div>
        <div id="player-names">
            <span id="player1-name">Player 1</span>
            <span id="player2-name">Player 2</span>
        </div>
        </div>
    
            <div id="waiting-overlay">
            <div id="waiting-text">Waiting for peer...</div>
                <div id="waiting-bar">
              <div id="waiting-progress"></div>
            </div>
          </div>
  
  
  
          <div id="game-container">
            <canvas id="canvas"></canvas>
          </div>
  
          <div id="notification-modal" class="modal">
            <div class="modal-content">
              <span id="modal-close" class="close">&times;</span>
              <p id="modal-message"></p>
            </div>
  
          </div>
          <div class="countdown"></div>
  
          <script type="module" src="public/game/js/friends_game.js"></script>
        </body>
        </html>
        `
    }
  }
  

let cleanup = null;

export function attachDOM() {
  if (cleanup) {
    cleanup();
    //console.log ('cleanup')
    cleanup = null;
  }
  document.body.style = '';
  app.root.innerHTML = '';
  import(`../game/js/friends_game.js?t=${Date.now()}`).then(module => {
    cleanup = module.game_2d();
  })
  const page = document.createElement('friends-game-page');
  app.root.appendChild(page);
}

customElements.define('friends-game-page', Game_Friends);

