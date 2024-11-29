class Game_Offline extends HTMLElement {
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
          <title>ping pong game</title>
          <link rel="stylesheet" href="../public/game/css/game_style_offline.css">
          <link rel="icon" type="image/x-icon" href="public/game/images/140412.png">
        </head>
        <body>
          <canvas id="canvas" width="600" height="400"></canvas>
          <script type="module" src="../public/game/js/game_offline.js"></script>
        </body>
        </html>
        `
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
    import(`../game/js/game_offline_local.js?t=${Date.now()}`).then(module => { 
        cleanup = module.game_2d_offline();
    })
    const page = document.createElement('offline-local-game-page');
    app.root.appendChild(page);
    //console.log('Gamee');
    
}
customElements.define('offline-local-game-page', Game_Offline);

