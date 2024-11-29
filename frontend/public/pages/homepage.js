import "../components/header.js";
import "../components/circleInteractions.js";
import "../components/modal.js";
import "../components/chat.js";
import "../components/settings.js"
import "../components/search.js";
import "../components/achivement.js"
import '../pages/notifications-profile.js';
import { getUserDataByID, makeAuthRequest } from "../services/utils.js";
import { getMe } from "../services/utils.js";

export class HomePage extends HTMLElement {
    
    constructor() {
        super();
    }

    async connectedCallback() {
        const headerComponent = document.createElement('header-component');
        this.appendChild(headerComponent);
        let profile = document.querySelector('.profile');
        let userData = await getMe();

        document.title = `Dashboard - ${userData.username}`;
        
        app.loggedUser = userData.username;
        //console.log('app.loggedUser', app.loggedUser);

        profile.style.backgroundImage = `url(${userData.avatar})`;
        document.querySelector('.message').innerHTML = `${userData.username}`;
        profile.addEventListener('click', e => {
            e.preventDefault();
            app.router.findRoute(`/profile/${userData.username}`);
        })
        const circlesComponent = document.createElement('app-circles');
        const modalsComponent = document.createElement('app-modals');
        const ChatComponent = document.createElement('app-chat');
        const SettingsComponent = document.createElement('app-settings');
        const achievements = document.createElement('app-achievements');
        this.appendChild(achievements);
        this.appendChild(SettingsComponent);
        this.appendChild(circlesComponent);
        this.appendChild(modalsComponent);
        this.appendChild(ChatComponent);

        const searchComponent = document.createElement('app-search');
        this.appendChild(searchComponent);



        app.first = true;
    }

    disconnectedCallback() {
        //console.log('disconnected');
        this.innerHTML = '';
    }
}

export async function attachDOM() {
    const page = document.createElement('home-page');
    app.root.innerHTML = ''
    app.root.appendChild(page);
}

customElements.define('home-page', HomePage)