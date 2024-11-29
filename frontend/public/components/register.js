export class Register extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        document.title = 'Register';
    }

    render() {
        this.innerHTML = `
        <div class="registing" style="background-color: rgba(72, 95, 125, 0.6);">
            <img src="public/src/img/pingpong-logo.png" class="logo-log" style="margin: 10px;">
            <div class="registing">
                <div class="message"></div>
                    <input type="text_reg" id="username" name="username" placeholder="Username">
                    <input type="text_reg" id="fname" name="fname" placeholder="First Name">
                    <input type="text_reg" id="lname" name="lname" placeholder="Last Name">
                    <input type="email_reg" id="email" name="email" placeholder="Email">
                    <input type="password" id="pwd" name="pwd" placeholder="Password">
                    <div id="error" style="color: red; display: none;"></div>
                    <button type="submit" class="submit-button" id="submit_status">Submit</button>
                <div class="message" style="color: #fff;">You can also create an account with</div>
                <div class="button-logs">
                    <button class="btn1" type="button"></button>
                </div>
                <div class="close-register" id="close-register">Back to Login</div>
            </div>
            <div id="success-modal" class="modal hidden">
        <div class="modal-content">
            <span class="close-modal" id="close-modal">&times;</span>
            <p>You have successfully registered!</p>
        </div>
    </div>
            </div>
        `;
    }
}

export function attachDOM() {
    const page = document.createElement('register-page');
}

customElements.define('register-page', Register);