import { getMe } from '../services/utils.js';
import "../components/search.js";
import "../components/menu.js";
import "../pages/notifications-profile.js";

class Header extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        await this.render();
        await this.getHeaderHtml();
    }

    async getHeaderHtml() {
        const searchComponent = document.createElement('app-search');
        const menu = document.createElement('app-menu');
        const notificationsProfile = document.createElement('app-notifications-profile');
        this.appendChild(notificationsProfile);
        this.appendChild(menu);
        this.appendChild(searchComponent);

        let profile = document.querySelector('.profile');
        let userData = await getMe();
        profile.style.backgroundImage = `url(${userData.avatar})`;
        document.querySelector('.dashboard').innerHTML = `${userData.username}`;
        profile.addEventListener('click', e => {
            e.preventDefault();
            app.router.findRoute(`/profile/${userData.username}`);
        })
    }

    async render() {
        this.innerHTML = `
                <header>
                <div class="headline">
                    <div class="menu-bar left">
                        <div class="menu-icon" id="menu-icon">
                            <div class="menu-content">
                                <div class="menu_bnt home"></div>
                                <div class="menu_bnt avatar"></div>
                                <div class="menu_bnt setting"></div>
                                <div class="menu_bnt exit"></div>
                            </div>
                        </div>
                        <div style="width: 80px;"></div>
                        <div class="profile"></div>
                        <div class="message dashboard" style="font-size: 35px;"></div>
                        <div class="notification-container dropdown">
                            <ul class="dropdown-menu notifications-dashboard-container" aria-labelledby="notificationDropdown">
                            </ul>
                        </div>

                    </div>
                    <div class="menu-bar mid">
                        <div class="logo" onclick="app.router.findRoute('/')">
                            <img src="/public/src/img/pingpong-logo.png" alt="LOGO" class="logo-img">
                        </div>
                    </div>
                    <div class="menu-bar right">
                        <div class="search-bar" id="search-container">
                            <input type="search" id="search" placeholder="Search users..." />
                            <ul id="search-results"></ul>
                        </div>
                    </div>
                </div>
                </div>
            </header>
        `;
    }
}

customElements.define('header-component', Header);