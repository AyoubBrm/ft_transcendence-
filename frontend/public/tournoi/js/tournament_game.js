import { Router } from "../../services/Router.js";
import { makeAuthRequest } from "../../services/utils.js";

await new Promise(r => setTimeout(r, 1000));
let breaker = 0;
document.head.innerHTML = ''
document.head.innerHTML = `
 <meta charset="UTF-8">
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Ping Pong Game</title>
 <link rel="stylesheet" href="../public/tournoi/css/tournament.css"></link>
 `

const tge = document.querySelector('tour-game-page')

tge.innerHTML = ''
tge.innerHTML = `
  <div id="header">
    <div id="score-board">
      <div>
        <span id="player1-name"></span> vs <span id="player2-name"></span>
      </div>
    <div id="timer">Time: <span id="timer-value">0:00</span></div>
      <div>
        <span id="score1">0</span> : <span id="score2">0</span>
      </div>

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

  <script type="module" src="../public/tournoi/js/game.js"></script>
`



// import { navigate } from "../../js/router.js";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const gameContainer = document.getElementById('game-container');
const countdownElement = document.querySelector('.countdown');
const player1NameElement = document.getElementById('player1-name');
const player2NameElement = document.getElementById('player2-name');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');
export let winner = null;


canvas.width = gameContainer.clientWidth;
canvas.height = gameContainer.clientHeight;


let current_state = { 'self_name': '...', 'other_name': '...', 'player1': '...', 'player2': '...', 'score1': 0, 'score2': 0, 'timer': '0:00' };
let last_state = { 'self_name': '...', 'other_name': '...', 'player1': '...', 'player2': '...', 'score1': 0, 'score2': 0, 'timer': '0:00' };


let game_end_locker = false;

let user_data = {
  'username': '...',
  'score': 0,
}



let playerId = null;
let roomId = null;
let opponentName = '...';
let playerName = '...';
let fps_ratio = 1;
let server_fps = 30;
let initGame = null;


// Game state received from server
let gameState = {
  ball_pos: { x: 400, y: 300 },
  racket1_pos: { x: 100, y: 230 },
  racket2_pos: { x: 700, y: 230 },
  score1: 0,
  score2: 0,
  ball_speed: 20,
  direction: { x: 1, y: 0 },
};

async function updateScore(user_data) {
	await fetch('/api/game/update-score', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		// body: JSON.stringify(current_state)
		body: JSON.stringify(user_data)
	})
}

async function finishGame(user_data) {
	await fetch('/api/game/complete-game', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(user_data)
  })
}

let test = 0;
export async function tour_game(user_token) {
  return new Promise((resolve, reject) => {


    //console.log('the fucking token: ', user_token)
    let roomName = 'group_01'; // This should be dynamic based on matchmaking or user selection
    let gameSocket = new WebSocket(`wss://${window.location.host}/ws/tournament_game/${roomName}/?token=${user_token}`);

    // WebSocket event handlers
    gameSocket.onopen = function () {
      //console.log('Connected to the game server.');
    };

    gameSocket.onmessage = function (e) {
      const data = JSON.parse(e.data);
      //console.log('Received data: ', data);
      if (data.type === 'init_state') {
        playerId = data.game_state.player_id;
        roomId = data.game_state.room_id;
        roomName = data.game_state.room_name;
        opponentName = data.game_state.opponent;
        gameState.racket1_pos = data.game_state.racket1_pos;
        gameState.racket2_pos = data.game_state.racket2_pos;
        gameState.ball_pos = data.game_state.ball_pos;
        gameState.score1 = data.game_state.score1;
        gameState.score2 = data.game_state.score2;
        playerName = data.game_state.player;
        gameState.ball_speed = data.game_state.ball_speed;
        //console.log('Ball speed: ', gameState.ball_speed);
        gameState.direction = data.game_state.direction;
        gameContainer.style.width = data.game_state.canvas_width + 'px';
        gameContainer.style.height = data.game_state.canvas_height + 'px';
        current_state.player1 = playerName;
        current_state.player2 = opponentName;
        current_state.score1 = gameState.score1;
        current_state.score2 = gameState.score2;
        if (playerId === 1) {
          user_data.username = playerName;
          current_state.self_name = playerName;
          current_state.other_name = opponentName;
        }
        else if (playerId === 2) {
          user_data.username = opponentName;
          current_state.self_name = opponentName;
          current_state.other_name = playerName;
        }
        resizeCanvas();
        // renderGame();
      }
      else if (data.type === 'countdown') {
        //console.log('Countdown: ', data.countdown);
        let dict = {
          '3': 'Ready',
          '2': 'Set',
          '1': 'Go!',
        };
        updateCountdown(dict[data.countdown]);

      }
      else if (data.type === 'game_state') {
        gameState = data.state;
        gameState.ball_speed = data.ball_speed;
        gameState.direction = data.direction;
        renderGame();
        const elapsedTime = data.state.elapsed_time;
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if ((current_state.score1 !== gameState.score1 ||
          current_state.score2 !== gameState.score2
        ) && opponentName !== 'waiting...' && !game_end_locker) {
          current_state.score1 = gameState.score1
          current_state.score2 = gameState.score2
          current_state.player1 = playerName;
          current_state.player2 = opponentName;
          current_state.timer = formattedTime;


          if (playerId === 1)
            user_data.score = current_state.score1;
          else
            user_data.score = current_state.score2

          //console.log('current state1: ', current_state)
          //console.log('user_data: ', user_data)
          /**
           * TOURNAMENT API CALL
           */
          //console.log('Tournament ID =========>', app.tournament_id);
          (async () => {
            user_data.tournament_id = app.tournament_id;
            await updateScore(user_data);
          })()
        }


        if (playerId === 1) {
          current_state.self_name = playerName;
          current_state.other_name = opponentName;
        }
        else if (playerId === 2) {
          current_state.self_name = opponentName;
          current_state.other_name = playerName;
        }

        (async () => {
         if (test === 0) {
           test++;
            initGame = await fetch('/api/game/init-game', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(current_state)
              // body: JSON.stringify(user_data)
            })
            game_id = await initGame.json();
            //console.log('game_id from front', game_id);
         }
        }) ()



        document.getElementById('timer-value').innerText = formattedTime;
      }
      else if (data.type === 'player_info') {
        opponentName = data.opponent;
        //console.log(`Opponent: ${opponentName}`);
      }
      else if (data.type === 'notification') {
        show_notification(data.message);
        if (data.message.indexOf('has disconnected.') != -1 && !game_end_locker) {
          game_end_locker = true;
          //console.log('current state: ', current_state)
          last_state = current_state;
          if (playerId === 1) {
            user_data.score = last_state.score1;
            last_state.self_name = playerName;
            last_state.other_name = opponentName;
          }
          else if (playerId === 2) {
            user_data.score = last_state.score2;
            last_state.self_name = opponentName;
            last_state.other_name = playerName
          }
          //console.log('last states: ', user_data);

          (async () => {
            gameSocket.send(JSON.stringify({
              'type': 'enemy_disconnected',
            }));
            /**
             * 
             * 
             * TOURNAMENT API CALL
             * 
             * 
             */
            await updateScore(user_data);
            await finishGame(user_data);

            breaker = true;
            setTimeout(function () {
              gameSocket.close();
              return;
            }, 1000)
          })();

        }
        // navigate('/')
      }
      else if (data.type === 'game_over' && !game_end_locker) {
        //console.log ('game over data : ', data)
        game_end_locker = true;
        show_notification(`${data.winner} wins the game!`);
        last_state = current_state;
        //console.log('winner: ', data.winner)
        if (playerId === 1) {
          last_state.self_name = playerName;
          last_state.other_name = opponentName;
          user_data.score = last_state.score1
        }
        else if (playerId === 2) {
          last_state.self_name = opponentName;
          last_state.other_name = playerName
          user_data.score = last_state.score2
        }
        //console.log('last states: ', user_data);
        //console.log('full data: ', last_state)
        /**
       * 
       * 
       * TOURNAMENT API CALL
       * 
       * 
       */
        updateScore(user_data);
        // winner = data.winner;
        breaker = 1;
        setTimeout(function () { }, 1000)
        gameSocket.close();
      }
      else if (data.type === 'broadcast_game_state') {
        gameState.ball_speed = data.game_state.ball_speed;
        gameState.direction = data.game_state.direction;
        server_fps = data.fps_ratio;
      }
      else if (data.type === 'moves') {
        if (playerId === 1)
          gameState.racket2_pos = data.racket2_pos;
        else if (playerId === 2)
          gameState.racket1_pos = data.racket1_pos;
      }
      else if (data.type === 'winner_winner_chicken_dinner') {
        // show_notification(`${data.winner} wins the game!`);
        //console.log('the champion chep is : ', data.champion)
        win = getElementById('champion');
        win.innerHTML = data.champion;

        /**
         * 
         * 
         * TOURNAMENT API CALL (CHAMPION final)
         * 
         * 
         */
        (async () => {
        await updateScore(user_data);
        await finishGame(user_data);
        })()
        // winner = data.winner;
        // breaker = 1;
        // gameSocket.close();
      }
    };

    gameSocket.onclose = function () {
      //console.log('Disconnected from the tournamet game server.');
    };

    // Sending player moves to the server
    function sendPlayerMove(direction) {
      //console.log('current positions: ', gameState.racket1_pos, gameState.racket2_pos)
      if (gameSocket.readyState === WebSocket.OPEN) {
        gameSocket.send(JSON.stringify({
          'type': 'player_move',
          'racket1_pos': gameState.racket1_pos,
          'racket2_pos': gameState.racket2_pos,
          'player_id': playerId,
        }));
      }
    }


    function show_notification(message) {
      const modal = document.getElementById('notification-modal');
      const modalMessage = document.getElementById('modal-message');
      const modalClose = document.getElementById('modal-close');

      modalMessage.textContent = message;
      modal.style.display = 'block';

      modalClose.onclick = function () {
        modal.style.display = 'none';
      };

      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      };
    }


    // Keyboard event listeners
    const keyPressed = {};
    const KEY_UP = 38; // Arrow Up
    const KEY_DOWN = 40; // Arrow Down
    let isMovingUp = false;
    let isMovingDown = false;
    const MOVE_SPEED = 10; // Adjust paddle speed here

    window.addEventListener('keydown', function (e) {
      if (e.keyCode === KEY_UP) {
        isMovingUp = true;
        // sendPlayerMove('up');
      }
      else if (e.keyCode === KEY_DOWN) {
        isMovingDown = true;
        // sendPlayerMove('down');
      }
    });

    window.addEventListener('keyup', function (e) {
      if (e.keyCode === KEY_UP) {
        isMovingUp = false;
      }
      else if (e.keyCode === KEY_DOWN) {
        isMovingDown = false;
      }
    });

    // Start the game loop
    function resizeCanvas() {
      canvas.width = gameContainer.clientWidth;
      canvas.height = gameContainer.clientHeight;
      renderGame();
    }

    window.addEventListener('resize', resizeCanvas);

    function drawRoundedRect(x, y, width, height, radius, fillColor) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }


    function renderGame() {
      // Clear the canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ff0000';
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Draw the net
      ctx.beginPath();
      ctx.setLineDash([20, 10]);
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the ball
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(gameState.ball_pos.x, gameState.ball_pos.y, 15, 0, 2 * Math.PI);
      ctx.fill();

      // Draw racket1
      let racket1_color = "#ff0000";
      drawRoundedRect(gameState.racket1_pos.x, gameState.racket1_pos.y, 20, 120, 10, racket1_color);

      // Draw racket2
      let racket2_color = "#ff0000";
      drawRoundedRect(gameState.racket2_pos.x, gameState.racket2_pos.y, 20, 120, 10, racket2_color);

      // Draw player names and scores

      if (player1NameElement) {
        player1NameElement.textContent = playerName;
      }
      if (player2NameElement) {
        player2NameElement.textContent = opponentName;
      }
      if (score1Element) {
        score1Element.textContent = gameState.score1;
      }
      if (score2Element) {
        score2Element.textContent = gameState.score2;
      }
    }

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    function fps_calculator() {
      const now = performance.now();
      frameCount++;

      const elapsedTime = now - lastTime;
      if (elapsedTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = now;
      }
      return fps;
    }



    function updatePaddlePosition() {
      if (playerId === 1) { // Player 1 controls racket1
        if (isMovingUp) {
          gameState.racket1_pos.y -= MOVE_SPEED;
          gameState.racket1_pos.y = Math.max(0, gameState.racket1_pos.y);
        }
        else if (isMovingDown) {
          gameState.racket1_pos.y += MOVE_SPEED;
          gameState.racket1_pos.y = Math.min(canvas.height - 120, gameState.racket1_pos.y);
        }
      }
      else if (playerId === 2) { // Player 2 controls racket2
        if (isMovingUp) {
          gameState.racket2_pos.y -= MOVE_SPEED;
          gameState.racket2_pos.y = Math.max(0, gameState.racket2_pos.y);
        }
        else if (isMovingDown) {
          gameState.racket2_pos.y += MOVE_SPEED;
          gameState.racket2_pos.y = Math.min(canvas.height - 120, gameState.racket2_pos.y);
        }
      }
      if (isMovingDown || isMovingUp) {
        sendPlayerMove(isMovingDown ? 'down' : 'up');

        //console.log("r1: ", gameState.racket1_pos, ", r2: ", gameState.racket2_pos)
      }
    }

    function updateBallPosition() {
      let current_fps = fps_calculator();
      fps_ratio = current_fps / server_fps;
      gameState.ball_pos.x += (gameState.ball_speed / fps_ratio) * gameState.direction.x;
      gameState.ball_pos.y += (gameState.ball_speed / fps_ratio) * gameState.direction.y;
      // //console.log('Ball speed ', gameState.ball_speed);
    }




    // Game loop
    function game_loop() {
      if (breaker) {
        resolve(winner);
        //console.log('Winner ==========> ', user_data);
        // updateScore(user_data);
        // finishGame(user_data);
        return;
      }
      if (isMovingDown || isMovingUp) {
        updatePaddlePosition();
      }
      updateBallPosition();
      renderGame();
      requestAnimationFrame(game_loop);
    }

    function updateCountdown(txt = '') {
      countdownElement.textContent = txt;
      countdownElement.style.animation = 'none';
      countdownElement.offsetHeight; // Trigger reflow
      countdownElement.style.animation = null;
    }

    {
      // if (!token)
      // {
      //   show_notification('You must login first!');
      //   Router.findRoute('/login');
      // }
      game_loop();
    }
  });
}