import { Router } from '../services/Router.js';
import { makeAuthRequest } from '../services/utils.js';

class Search extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = '';
    }

    connectedCallback() {
        this.render();
    }

    async getAllUsers(user_or_email) {
        const response = await makeAuthRequest('/api/friends/search/', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_or_email })
        });
        const data = await response.json();
        if (response.ok) {
            //console.log('Search results:', data);
        } else {
            console.error(data);
        }
        return data;
    }

    render() {
        //console.log('Search component is rendered');

        let searchValue = document.getElementById('search');

        searchValue.addEventListener('keyup', async (e) => {
            let users = await this.getAllUsers(e.target.value);
            let searchResults = document.getElementById('search-results');
            searchResults.innerHTML = '';
            if (e.target.value.length > 0 && users.length > 0) {
                for (let user of users) {
                    //console.log(user);
                    let li = document.createElement('li');
                    let img = document.createElement('img');
                    let span = document.createElement('span');
                    img.src = user.avatar;
                    img.alt = `${user.username}'s avatar`;
                    img.classList.add('user-avatar');
                    span.textContent = user.username;
                    li.appendChild(img);
                    li.appendChild(span);
                    searchResults.appendChild(li);

                }
                searchResults.classList.add('show');
                let searchResultsItems = searchResults.querySelectorAll('li');
                searchResultsItems.forEach(li => {
                    li.addEventListener('click', async () => {
                        //console.log('User clicked:', li);
                        let username = li.querySelector('span').textContent;
                        //console.log('Username:', username);
                        Router.findRoute(`/profile/${username}`);
                    })
                })
            } else {
                searchResults.classList.remove('show');
            }
        });
    }
}

customElements.define('app-search', Search);