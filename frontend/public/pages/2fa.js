import { Router } from "../services/Router.js";
import { makeAuthRequest } from "../services/utils.js";
import { getMe } from "../services/utils.js";

class TwoFactorAuth extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    async connectedCallback() {
        this.render();
        await this.init();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                    max-width: 300px;
                    margin: auto;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .otp-input {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .otp-input input {
                    width: 40px;
                    height: 40px;
                    text-align: center;
                    font-size: 20px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                #verifyButton {
                    width: 100%;
                    padding: 10px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #verifyButton:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                #message {
                    margin-top: 15px;
                    font-weight: bold;
                }
            </style>
            <div class="container">
                <h2>Two-Factor Authentication</h2>
                <p>Enter the 6-digit code sent to your email</p>
                <div class="otp-input" id="otpInputContainer"></div>
                <button id="verifyButton" disabled>Verify</button>
                <div id="message"></div>
            </div>
        `;
    }

    async init() {
        this.otpLength = 6;
        this.otpInputContainer = this.shadowRoot.getElementById('otpInputContainer');
        this.verifyButton = this.shadowRoot.getElementById('verifyButton');
        this.messageElement = this.shadowRoot.getElementById('message');

        this.createOTPInputs();
        // otpServer = await otpServer.json();
        // //console.log('otpServer', otpServer);

        this.addEventListeners();
    }

    createOTPInputs() {
        for (let i = 0; i < this.otpLength; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.setAttribute('data-index', i);
            input.addEventListener('input', this.handleInput.bind(this));
            input.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.otpInputContainer.appendChild(input);
        }

        this.otpInputContainer.firstChild.focus();
    }

    addEventListeners() {
        this.verifyButton.addEventListener('click', this.verifyOTP.bind(this));
    }

    handleInput(e) {
        const input = e.target;
        const value = input.value;

        if (!/^\d*$/.test(value)) {
            input.value = value.replace(/\D/g, '');// Remove non-numeric characters
            return;
        }

        if (value.length === 1) {
            const nextInput = input.nextElementSibling;
            if (nextInput) {
                nextInput.focus();
            }
        }

        this.checkOTPCompletion();
    }

    handleKeyDown(e) {
        const input = e.target;
        if (e.key === 'Backspace' && input.value === '') {
            const prevInput = input.previousElementSibling;
            if (prevInput) {
                prevInput.focus();
                prevInput.value = '';
            }
        }
    }

    checkOTPCompletion() {
        const inputs = this.otpInputContainer.querySelectorAll('input');
        const allFilled = Array.from(inputs).every(input => input.value !== '');
        const test = {
            "username": "berrim",
            "type": '2',
            "userScore": 4,
            "botScore": 5
        }

        this.verifyButton.disabled = !allFilled;
    }

    async verifyOTP() {
        const inputs = this.otpInputContainer.querySelectorAll('input');
        const enteredOTP = Array.from(inputs)
            .map(input => input.value)
            .join('');

        //console.log('userData', app.email, app.otp);
        this.generatedOTP = await fetch('/api/auth/verify-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: app.email,
                otp: enteredOTP,
                otp_token: app.otp//jwt
            })
        })

        this.generatedOTP = await this.generatedOTP.json();
        //console.log('this.generatedOTP===>', this.generatedOTP);

        if (this.generatedOTP.message === 'OTP verified successfully') {
            this.showMessage('OTP verified successfully', 'green');
            setTimeout(() => {
                Router.findRoute('/');
            }, 1000);
        } else {
            this.showMessage('Incorrect OTP. Please try again.', 'red');
        }
    }

    showMessage(text, color) {
        this.messageElement.textContent = text;
        this.messageElement.style.color = color;
    }

    disconnectedCallback() {
        this.verifyButton.removeEventListener('click', this.verifyOTP);
        app.root.innerHTML = '';
    }
}
export function attachDOM() {
    if (!app.email || !app.otp) {
        Router.findRoute('/');
        return;
    }
    const twoFactorAuth = document.createElement('two-factor-auth');
    app.root.innerHTML = '';
    app.root.appendChild(twoFactorAuth);
}
customElements.define('two-factor-auth', TwoFactorAuth);