import { Router } from '../services/Router.js';

export function setupModal() {
    //console.log('Setting up modal');
    const playModal = document.getElementById('play-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    
    const online = document.getElementById('online-btn');
    online.addEventListener('click', () => Router.findRoute('/game/online'));

    const offline2D = document.getElementById('player-vs-computer-btn');
    offline2D.addEventListener('click', () => Router.findRoute('/game/offline'));

    const offline3D = document.getElementById('ping-pong-btn');
    offline3D.addEventListener('click', () => Router.findRoute('/game/3d'));

    const local_game = document.getElementById('local-btn');
    local_game.addEventListener('click', () => Router.findRoute('/game/localgame'));

    const tournament = document.getElementById('tournament-btn');
    tournament.addEventListener('click', () => Router.findRoute('/game/tournament'));
    closeModalBtn.addEventListener('click', () => {
        playModal.style.display = 'none';
    });
    document.querySelectorAll('.mode-button').forEach(button => {
        button.addEventListener('mouseover', function () {
            const imageContainer = document.getElementById('mode-image');
            const imageUrl = this.getAttribute('data-image');
            
            // Set the image's src to the data-image value
            imageContainer.src = imageUrl;
            
            // Make the image visible
            imageContainer.style.display = 'block';
        });
    
        button.addEventListener('mouseout', function () {
            const imageContainer = document.getElementById('mode-image');
            
            // Hide the image
            imageContainer.style.display = 'none';
        });
    });
    window.addEventListener('click', (event) => {
        if (event.target === playModal) {
            playModal.style.display = 'none';
        }
    });
}

export class Modals extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        setupModal()
    }

    render() {
        this.innerHTML = `
            <div class="modal" id="play-modal">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <div class="modal-body">
                        <div class="image-container">
                            <img id="mode-image" src="" alt="Game Mode Image" style="display:none;">
                        </div>
                        <div class="buttons-container">
                            <button class="mode-button" data-image="public/src/img/pingpong_playing.svg" id="online-btn">Play Online</button>
                            <button class="mode-button" data-image="public/src/img/local_play.jpg" id="local-btn">Play Local</button>
                            <button class="mode-button" data-image="public/src/img/pong.jpg" id="player-vs-computer-btn">Player vs Computer</button>
                            <button class="mode-button" data-image="public/src/img/tournament.jpg" id="tournament-btn">Tournament</button>
                            <button class="mode-button" data-image="public/src/img/3d_player.png" id="ping-pong-btn">3d ping pong game (beta)</button>
                                
                        </div>
                        <div class="dimention-select">
                            <!-- <button class="small-button" id="switch-1" data-state="on">Play in 2D</button> -->
                            <!-- <button class="small-button" id="switch-2" data-state="off">Play in 3D</button> -->
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}

customElements.define('app-modals', Modals);