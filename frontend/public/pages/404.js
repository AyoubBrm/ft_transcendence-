class PageNotFound extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    render() {
        this.innerHTML = `
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Page Not Found</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: rgb(31, 31, 31);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                color: #333;
            }
    
            .container {
                text-align: center;
            }
    
            h1 {
                font-size: 6em;
                margin: 0;
                color: #ffc107;
            }
    
            p {
                font-size: 1.5em;
                margin: 20px 0;
                  color: #fff;
            }
    
            .go-home {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                text-decoration: none;
                background-color: #ff6b6b;
                color: white;
                font-size: 1.2em;
                border-radius: 5px;
                cursor: pointer;
            }
    
            a:hover {
                background-color: #ffc107;
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <h1>404</h1>
            <p>Oops! The page you're looking for doesn't exist.</p>
            <div class="go-home" onclick="app.router.findRoute('/');">Go Back Home</div>
        </div>
    </body>
        `
    }
}

export function attachDOM() {
    app.root.innerHTML = '';
    document.body.style = '';
    const page = document.createElement('notfound-page');
    app.root.appendChild(page);
}

customElements.define('notfound-page', PageNotFound);