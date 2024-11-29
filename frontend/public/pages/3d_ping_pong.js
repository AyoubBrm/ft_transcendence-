
class Game_3d  extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta charset="UTF-8" />
            <title>Three.js - Hello cube</title>
            <link rel="stylesheet" href="../public/game/css/style_3d.css">
            <link rel="icon" type="image/x-icon" href="../public/game/images/140412.png">
            <script type="importmap">
            {
                "imports": {
                    "three": "https://cdn.jsdelivr.net/npm/three@v0.149.0/build/three.module.js",
                    "three/addons/": "https://cdn.jsdelivr.net/npm/three@v0.149.0/examples/jsm/"
                }
            }
            </script>
        </head>
        <body>
            <div id="threejs-container"></div>
            <script src="https://cdn.jsdelivr.net/npm/cannon/build/cannon.min.js"></script>
        	<script type="module" src="../public/game/js/game_3d.js"></script>
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
    import(`../game/js/game_3d.js?t=${Date.now()}`).then(module => {
        cleanup = module.game_3d();
    })
    const page = document.createElement('ping-pong-page');
    app.root.appendChild(page);
}
customElements.define('ping-pong-page', Game_3d);

