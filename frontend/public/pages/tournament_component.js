
// class TournamentComponent  extends HTMLElement {
//     constructor() {
//         super()
//     }

//     connectedCallback() {
//         this.render();
//     }

    
//     render() {
//         document.addEventListener("DOMContentLoaded", () => {
//             const playersInQueueContainer = document.querySelector(".player_in_queue");
//             const blocks_queue = 12; 
        
//             for (let i = 1; i <= blocks_queue; i++) {
//                 const playerSpan = document.createElement("span");
//                 playerSpan.classList.add("players_in");
//                 playersInQueueContainer.appendChild(playerSpan); 
//             }
        
//             const playersInQueue = document.querySelectorAll(".players_in");
//             let index = 0;
        
//             setInterval(() => {
//                 if (index === playersInQueue.length) {
//                     playersInQueue.forEach(player => player.classList.remove("active"));
//                     index = 0;
//                 }
        
//                 playersInQueue[index].classList.add("active");
//                 index++;
//             }, 200);
//         });
        
//         this.innerHTML = `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Ping Pong Tournament - 4 Players</title>
//             <link rel="stylesheet" href="public/tournoi/css/tournament.css">
//         </head>
//         <body>
//             <div class="tournament-frame">
//                 <h1>🏓 Ping Pong Tournament 🏓</h1>

//                 <div class="tournament-bracket">
//                     <div class="round">
//                         <div class="match">
//                             <div class="player1">...</div>
//                             <div class="player2">...</div>
//                         </div>
//                         <div class="match">
//                             <div class="player3">...</div>
//                             <div class="player4">...</div>
//                         </div>
//                     </div>

//                     <div class="round">
//                         <div class="match">
//                             <div class="winner1">...</div>
//                             <div class="winner2">...</div>
//                         </div>
//                     </div>

//                     <div class="round">
//                         <div class="match">
//                             <div class="winner_winner_chicken_dinner">Champion</div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="display_waiting">
//                     <div class="register-btn" id="register-id">
//                         <div class="Annancement">Waiting Player...</div>
//                         <div class="player_in_queue"></div>
//                     </div>
//                 </div>
//             </div>

//             <script src="public/tournoi/js/tournament.js"></script>
//         </body>
//         </html>
//         `
//     }
// }


// export function attachDOM() {
//     setTimeout(() => {
//         document.body.innerHTML = '';
//         document.body.setAttribute('style', '');
//         document.head.innerHTML = ''
//         const page = document.createElement('game-page');
//         document.body.appendChild(page);
//         import('../tournoi/js/tournament.js').then(module => { module.tournament(); })
//     }, 100)
// }
// customElements.define('game-page', TournamentComponent);

class TournamentComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupPlayersInQueue();
    }

    setupPlayersInQueue() {
        const playersInQueueContainer = this.querySelector(".player_in_queue");
        const blocks_queue = 12;

        for (let i = 1; i <= blocks_queue; i++) {
            const playerSpan = document.createElement("span");
            playerSpan.classList.add("players_in");
            playersInQueueContainer.appendChild(playerSpan);
        }

        const playersInQueue = this.querySelectorAll(".players_in");
        let index = 0;

        setInterval(() => {
            if (index === playersInQueue.length) {
                playersInQueue.forEach(player => player.classList.remove("active"));
                index = 0;
            }

            playersInQueue[index].classList.add("active");
            index++;
        }, 200);
    }

    render() {
        this.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ping Pong Tournament - 4 Players</title>
            <link rel="stylesheet" href="/public/tournoi/css/tournament.css">
        </head>
        <body>
            <div class="tournament-frame">
                <h1>🏓 Ping Pong Tournament 🏓</h1>

                <div class="tournament-bracket">
                    <div class="round">
                        <div class="match">
                            <div class="player1">...</div>
                            <div class="player2">...</div>
                        </div>
                        <div class="match">
                            <div class="player3">...</div>
                            <div class="player4">...</div>
                        </div>
                    </div>

                    <div class="round">
                        <div class="match">
                            <div class="winner1">...</div>
                            <div class="winner2">...</div>
                        </div>
                    </div>

                    <div class="round">
                        <div class="match">
                            <div class="winner_winner_chicken_dinner" id="champion" >Champion</div>
                        </div>
                    </div>
                </div>

                <div id= "waiter" class="display_waiting">
                    <div class="register-btn" id="register-id">
                        <div class="Annancement">Waiting Player...</div>
                        <div class="player_in_queue"></div>
                    </div>
                </div>
            </div>

            <script src="public/tournoi/js/tournament.js"></script>
        </body>
        </html>
        `;

    }
}

customElements.define('tour-game-page', TournamentComponent);

let cleanup = null;

export function attachDOM() {
    if (cleanup) {
        cleanup();
        //console.log('cleanup');
        cleanup = null;
    }
    document.body.style = '';
    app.root.innerHTML = '';
    import(`../tournoi/js/tournament.js?t=${Date.now()}`).then(module => {
        cleanup = module.tournament();
    }).catch(err => console.error('Error loading the tournament script:', err));
    const page = document.createElement('tour-game-page');
    app.root.appendChild(page);
}