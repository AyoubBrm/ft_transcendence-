export class Login extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        document.title = 'Login';
    }

    render() {
        this.innerHTML = `
            <div class="login">
                <div class="log-contain">
                        <input type="text" id="username" name="username" placeholder="Username">
                        <input type="password" id="pwd" name="pwd" placeholder="Password">
                        <div id="error" style="color: red; display: none;"></div>
                        <button type="submit" class="submit-button">Connect</button>
                        <div class="line"></div>
                    <div class="Sign-in">
                        <div class="message">Not registered yet?</div>
                        <div class="Sign-in-button" id="open-register">Register</div> <!-- Button to open registration form -->
                    </div>
                    <div class="button-logs">
                        <button class="btn1" type="button"></button>
                    </div>
                </div>
            </div>
        `;
    }
}


export function attachDOM() {
    const page = document.createElement('login-page');
    document.appendChild(page);
}

customElements.define('login-page', Login);