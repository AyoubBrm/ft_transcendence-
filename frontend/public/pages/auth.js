import { Router } from '../services/Router.js'
import '../components/register.js'
import '../components/login.js'
import { makeAuthRequest } from '../services/utils.js'
import notifications from '../components/notifications.js'
import { getMe } from '../services/utils.js'

class Auth extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        const page = this.getAttribute('data-page');
        this.render(page);
    }

    cleanup() {
        if (handleRegisterKeyup) document.removeEventListener('keyup', handleRegisterKeyup);
        if (handleRegisterClick) document.querySelector('button.submit-button')?.removeEventListener('click', handleRegisterClick);
        if (handleLoginKeyup) document.removeEventListener('keyup', handleLoginKeyup);
        if (handleLoginClick) document.querySelector('button.submit-button')?.removeEventListener('click', handleLoginClick);
        app.root.innerHTML = '';
    }

    render(page) {
        const registerPage = document.createElement('register-page');
        const loginPage = document.createElement('login-page');
        //console.log(page);

        if (page === 'register') {
            // this.cleanup();
            this.appendChild(registerPage)
            register();
            Oauth42();
        }
        else {
            // this.cleanup();
            this.appendChild(loginPage)
            login();
            Oauth42();
        }

        document.addEventListener('click', async (event) => {
            if (event.target && event.target.id === 'open-register') {
                // this.cleanup();
                if (handleLoginKeyup) document.removeEventListener('keyup', handleLoginKeyup);
                if (handleLoginClick) document.querySelector('button.submit-button')?.removeEventListener('click', handleLoginClick);
                this.removeChild(loginPage)
                this.appendChild(registerPage)
                history.pushState(null, null, '/register');
                register();
                Oauth42();
            }

            if (event.target && event.target.id === 'close-register') {
                // this.cleanup();
                if (handleRegisterKeyup) document.removeEventListener('keyup', handleRegisterKeyup);
                if (handleRegisterClick) document.querySelector('button.submit-button')?.removeEventListener('click', handleRegisterClick);
                this.removeChild(registerPage)
                this.appendChild(loginPage)
                history.pushState(null, null, '/login');
                login();
                Oauth42();
            }
        });

        let urlParams = new URLSearchParams(window.location.search);
        //console.log('urlParams', urlParams);
        if (urlParams.has('error')) {
            notifications.notify(urlParams.get('error'), 'danger');
            window.history.replaceState(null, null, window.location.pathname);
        }
    }

    disconnectedCallback() {
        this.cleanup();
    }
}

export function attachDOM(page) {
    document.body.style = '';
    app.root.innerHTML = ''
    const authPage = document.createElement('auth-page');
    authPage.setAttribute('data-page', page);
    app.root.appendChild(authPage);
}

function Oauth42() {
    const button = document.querySelector('.btn1');

    button.addEventListener('click', async () => {
        let response = await fetch('/api/auth/oauth42-redirect/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        let data = await response.json();
        console.log(data);
        window.location.href = data.url;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Oauth42();
});

let handleRegisterKeyup;
let handleRegisterClick;
let handleLoginKeyup;
let handleLoginClick;

function register() {
    const btn = document.querySelector('button.submit-button');

    handleRegisterKeyup = (e) => {
        if (e.key === 'Enter') {
            btn.click();
        }
    };

    handleRegisterClick = async () => {
        const username = document.getElementById('username').value;
        const first_name = document.getElementById('fname').value;
        const last_name = document.getElementById('lname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('pwd').value;

        try {
            let response = await fetch('/api/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    password: password
                })
            })
            let data = await response.json()
            if (response.ok) {
                notifications.notify('Registration successful!', 'success');
                setTimeout(() => {
                    Router.findRoute('/login');
                }, 1000);
            } else {
                Object.keys(data).forEach((field) => {
                    data[field].forEach((errorMessage) => {
                        notifications.notify(`${field}: ${errorMessage}`, 'danger');
                    });
                });
            }
        } catch (e) {
            //console.log('Error during registration');
            notifications.notify('Error during registration', 'danger');
        }
    };
    document.addEventListener('keyup', handleRegisterKeyup);
    btn.addEventListener('click', handleRegisterClick);
}

function login() {
    const btn = document.querySelector('button.submit-button');
    handleLoginKeyup = (e) => {
        if (e.key === 'Enter') {
            btn.click();
        }
    };
    handleLoginClick = async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('pwd').value;

        try {
            let response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            const data = await response.json()
            //console.log('data', data);
            app.email = data.email;
            try {
                if (response.status === 403) {
                    await fetch('/api/auth/generate-otp/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: data.email
                        })
                    }).then(res => {
                        res.json().then(res => {
                            //console.log(res)
                            app.otp = res.otp_token;
                            //console.log('app.otp from auth.js', app.otp);
                        })
                    }).catch(e => {
                        //console.log('Error generating OTP', e);
                    })
                    Router.findRoute('/verify-otp');
                    return;
                }
                if (response.ok) {
                    //console.log('access', data.access);
                    //console.log('refresh', data.refresh);
                    // localStorage.setItem('access', data.access);
                    // localStorage.setItem('refresh', data.refresh);
                    notifications.notify('Login successful!', 'success');
                    Router.findRoute(`/`);
                } else {
                    //console.log(data.error);
                    notifications.notify(data.error, 'danger');
                }
            } catch (e) {
                //console.log('Error logging in', e);
            }
        } catch (e) {
            //console.log('Error logging in');
            // notifications.notify(data.error, 'danger');
        }
    };
    document.addEventListener('keyup', handleLoginKeyup);
    btn.addEventListener('click', handleLoginClick);
}

customElements.define('auth-page', Auth)
