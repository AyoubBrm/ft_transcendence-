import { makeAuthRequest } from "../services/utils.js";
import { getUserDataByID } from "../services/utils.js";
import notifications from "./../components/notifications.js";
import { front_inject_user } from "../components/chat.js"; 

class NotificationsProfile extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    async getAllNotifications() {
        const response = await makeAuthRequest('/api/friends/profile/', {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
        let data = await response.json();
        let pending = data.Profile.waiting;
        return pending;
    }

    async acceptFriendRequest(id) {
        const response = await makeAuthRequest('/api/friends/methods/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "status": "ACCEPT",
                "user_id": String(id)
            })
        })
        if (response.ok) {
            //console.log('Friend request accepted');
            return response;
        } else {
            //console.log('Error accepting friend request');
            throw new Error(response);
        }
    }

    async rejectFriendRequest(id) {
        const response = await makeAuthRequest('/api/friends/methods/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "status": "REJECT",
                "user_id": String(id)
            })
        })
        if (response.ok) {
            //console.log('Friend request rejected');
            return response;
        } else {
            //console.log('Error rejecting friend request');
            throw new Error(response);
        }
    }

    render() {
        //console.log('NotificationsProfile component is rendered');
        let notificationEl = document.querySelector('.notification-container');
        let notificationList = document.querySelector('.notifications-dashboard-container');

        notificationEl.addEventListener('click', async () => {
            let userNotifications = await this.getAllNotifications();
            notificationList.innerHTML = '';
            for (let i = 0; i < userNotifications.length; i++) {
                let notifEl = document.createElement('li');
                notifEl.classList.add('dropdown-item');
                let user = await getUserDataByID(userNotifications[i]);

                let img = document.createElement('img');
                let span = document.createElement('span');
                img.src = user.avatar;
                img.alt = `${user.username}'s avatar`;
                img.classList.add('user-avatar');
                span.textContent = user.username;
                span.classList.add('user-username');
                let requestBar = document.createElement('div');
                requestBar.classList.add('request-bar');
                let acceptButton = document.createElement('button');
                acceptButton.classList.add('accept');
                acceptButton.textContent = 'Accept';
                let declineButton = document.createElement('button');
                declineButton.classList.add('decline');
                declineButton.textContent = 'Decline';
                requestBar.appendChild(acceptButton);
                requestBar.appendChild(declineButton);
                notifEl.appendChild(img);
                notifEl.appendChild(span);
                notifEl.appendChild(requestBar);
                
                notifEl.querySelector('.accept').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    //console.log(`Accepted request from ${user.username}`);
                    try {
                        await this.acceptFriendRequest(user.id);
                        notifications.notify('Friend request accepted', 'success', 1000, notificationEl);
                        front_inject_user(user.username);
                        //hone
                        notifEl.remove();
                    } catch (e) {
                        console.error(e);
                    }
                });
                notifEl.querySelector('.decline').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        await this.rejectFriendRequest(user.id);
                        //console.log(`Declined request from ${user.username}`);
                        notifications.notify('Friend request declined', 'error', 1000, notificationEl);
                        notifEl.remove();
                    } catch (e) {
                        console.error(e);
                        notifications.notify('Error declining friend request', 'error', 1000, notificationEl);
                    }
                });
                notificationList.appendChild(notifEl);
            }
            document.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', async () => {
                    //console.log('User clicked:', li);
                    let username = li.querySelector('span').textContent;
                    //console.log('Username:', username);
                    app.router.findRoute(`/profile/${username}`);
                })
            })

            if (userNotifications.length === 0) {

                const existingMessage = notificationList.querySelector('.message');
                if (!existingMessage) {

                    // Create a new div element with the "message" class and set its text
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message'; // Add the "message" class
                    messageDiv.textContent = "No notifications found"; // Set the message text
                    messageDiv.style.textAlign = 'center';
                    notificationList.appendChild(messageDiv); // Append the new div to the notificationList

                }
                else {
                    // Remove any existing message div when notifications are shown
                    const existingMessage = notificationList.querySelector('.message');
                    if (existingMessage) {
                        existingMessage.remove();
                    }
                }
            }
            // Check if a message div already exists

            if (notificationList.classList.contains('show'))
                notificationList.classList.remove('show');
            else
                notificationList.classList.add('show');

        })

    }
}

customElements.define('app-notifications-profile', NotificationsProfile);