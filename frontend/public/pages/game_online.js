class Game_online extends HTMLElement {
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
      <link rel="stylesheet" href="../public/game/css/style.css">
      <link rel="icon" type="image/x-icon" href="public/game/images/140412.png">
    </head>
    <body>
      <div id="header">
        <div id="score-board">
          <!-- Player 1 Section -->
          <div id="player1">
            <img src="https://robohash.org/player1?set=set1&size=128x128" alt="Player 1 Avatar" class="player-icon">
            <span id="player1-name">Player 1</span>
            <span id="score1">0</span>
          </div>
    
          <!-- Timer Section -->
          <div id="timer">
            Time: <span id="timer-value">0:00</span>
          </div>
    
          <!-- Player 2 Section -->
          <div id="player2">
            <span id="score2">0</span>
            <span id="player2-name">Player 2</span>
            <img src="https://robohash.org/player2?set=set1&size=128x128" alt="Player 2 Avatar" class="player-icon">
          </div>
        </div>
      </div>        
    
      <div id="player-names">
        <span id="player1-name"></span>
        <span id="player2-name"></span>
      </div>
    
      <div id="waiting-overlay">
        <div id="waiting-text">Waiting for opponent...</div>
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
    
      <script type="module" src="public/game/js/game.js"></script>
    </body>
    </html>
    
      `
  }

  disconnectedCallback() {
    //console.log('Game_online disconnected');
    this.innerHTML = '';
  }
}

let cleanup = null;
export function attachDOM() {
  if (cleanup) {
    cleanup();
    //console.log('cleanup');
    cleanup = null;
  }
  document.body.style = '';
  app.root.innerHTML = '';
  import(`../game/js/game.js?t=${Date.now()}`).then(module => {
    cleanup = module.game_2d();
  })
  const page = document.createElement('game-online-page');
  app.root.appendChild(page);
}
customElements.define('game-online-page', Game_online);

