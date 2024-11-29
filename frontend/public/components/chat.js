// import { getwebsocket } from "../services/Router.js";
import { Router } from "../services/Router.js";

import { makeAuthRequest } from "../services/utils.js";

// var chatSocket = getwebsocket()
let chatSocket = null;
let friend_list = null;
let self_user = null;

makeAuthRequest('/api/auth/me', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	credentials: 'include',
}).then(async res => {
    res = await res.json();
    //console.log("from me", res);
    self_user = res.username;
})

// /api/friends/ufriends/

makeAuthRequest('/api/friends/ufriends/', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
}).then(async res => {
    res = await res.json();
    //console.log(res['Friends']);
    friend_list = res['Friends'];
})

function front_receive_message(user, message)
{
    const chatMessages = document.getElementById(`chatMessages-${user}`);
    if (chatMessages)
    {   
        const newMessage = document.createElement('div');
        newMessage.classList.add('chat-message-guest');
        newMessage.textContent = message;
        chatMessages.appendChild(newMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}


function front_remove_user(user)
{
    const messengerList = document.querySelector('.messanger-list');
    if (document.querySelector(`#${user}`))
    {
        //console.log('removing user :', user);
        messengerList.removeChild(document.querySelector(`#${user}`));
    }
}

function remove_online_dot(user)
{
    const ue = document.querySelector(`#${user} .friend-profile-status`)
    if (ue)
        ue.style.backgroundColor = '#a30000';
}

export function front_inject_user(user)
{
    makeAuthRequest(`/api/auth/user/${user}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(async res => {
        res = await res.json();
        //console.log(res);
        let avatar = res.avatar;
        //console.log('avatar :', avatar);
        const messengerList = document.querySelector('.messanger-list');
        const chat = document.getElementById('chat');
        if (!document.querySelector(`#${user}`))
        {
            //console.log('injecting user : ', user);
            messengerList.insertAdjacentHTML('beforeend', `
                    <div class="friend-profile" id="${user}" style="background-image: url(${avatar}); background-size: cover; background-position: center center;" >
                        <div class="friend-profile-status" ></div>
                    </div>
                `);
            const ue = document.querySelector(`#${user} .friend-profile-status`)
            //ue.style.backgroundColor = '#00b100';
            if (!document.querySelector(`#${user}-chat`)) {
                const chat = document.getElementById('chat');
                const div = document.createElement('div');
                const chatform = `
            
                <span class="chat-border" style="display:none" id="${user}-chat">
                    <span class="chat-topic" id="${user}-topic">
                        <span class="message" id="user1" style="color: rgb(38, 38, 38); font-size: 20px; position: absolute;top: -6px; left: 20px;">${user}</span>
                    </span>
                    <span class="chat-close-btn" id="${user}-btn" style="position: absolute; top: 6px; right: 10px; transform: scale(0.7);">&times;</span>
                    <div class="chat-message" id="chatMessages-${user}"></div>
    
                    <div class="chat-under">
                        <span class="import">
                            <input type="text" id="textInput-${user}" placeholder="type here ..." required>
                        </span>
                        <span class="playWith" id="play-with-${user}"></span>
                        <button class="send" id="send-${user}" ></button>
                    </div>
                </span>
                <div class="play-with-moba" id="play-with-${user}-window">
                    <div class="play-with-moba-bar">
                        <div class="message-notif">You are invited to Play with ${user}</div>
                        <div class="profile-pic-play-with"></div>
                        <div class="requeat-play-with">
                            <span class="request accepted" id="${user}-acp">ACCEPT</span>
                            <span class="request rejected" id="${user}-rjt">REJECT</span>
                        </div>
                    </div>
                </div>
            `;
    
                div.innerHTML = chatform;
                chat.appendChild(div);
                const chat_messanger_user = document.querySelector(`#${user}-chat`);
                const chat_messanger_user_close_btn = document.querySelector(`#${user}-btn`);
    
                chat_messanger_user_close_btn.addEventListener('click', function () {
                    chat_messanger_user.classList.remove('active');
                    chat_messanger_user.style.display = 'none';
                });
                document.querySelectorAll('.friend-profile').forEach(friendProfile => {
                    friendProfile.addEventListener('click', (event) => {
                      // Get the user ID from the clicked element's ID
                      const userId = event.target.id;
                  
                      // Find the corresponding chat element
                      const chatElement = document.getElementById(`${userId}-chat`);
                      if (chatElement) {
                        // Set its display to "flex"
                        chatElement.style.display = "flex";
                      }
                    });
                  });
                document.querySelector(`#${user}-topic`).addEventListener('click', e => {
                    chat_messanger_user.classList.toggle('active');
                    chat_messanger_user.classList.remove('recu'); 
                });
                function sendMessage() {
                    const messageText = document.getElementById(`textInput-${user}`).value;
    
                    if (messageText.trim() !== ""){
                        const newMessage = document.createElement('div');
                        newMessage.classList.add('chat-message-user');
                        newMessage.textContent = messageText;
                        chatSocket.send(JSON.stringify({
                            'type': 'send_message',
                            'message': messageText,
                            'user': user
                        }));
                        const chatMessages = document.getElementById(`chatMessages-${user}`);
                        chatMessages.appendChild(newMessage);
    
                        document.getElementById(`textInput-${user}`).value = '';
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
    
                document.getElementById(`textInput-${user}`).addEventListener('keypress', function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        sendMessage();
                    }
                });
                const playWithWindow = document.getElementById(`play-with-${user}-window`);
                document.getElementById(`play-with-${user}`).addEventListener('click', function () {
                    //console.log("Invite triggered");
                    let playwith = document.getElementById(`play-with-${user}`);
                    playwith.style.backgroundColor = '#dc3545';
                    chatSocket.send(JSON.stringify({
                        'type': 'game_invite',
                        'from': self_user,
                        'to': user
                    }));
                    //playWithWindow.style.display = 'flex';
                });


                document.getElementById(`${user}-rjt`).addEventListener('click', function () {
                    chatSocket.send(JSON.stringify({
                        'type': 'reject_game_invite',
                        'from': self_user,
                        'to': user
                    }));
                    playWithWindow.style.display = 'none';
                });

                document.getElementById(`${user}-acp`).addEventListener('click', function () {
                    chatSocket.send(JSON.stringify({
                        'type': 'accept_game_invite',
                        'from': self_user,
                        'to': user,
                        'chat_id': user
                    }));
                    playWithWindow.style.display = 'none';
                    chatSocket.close();
                    Router.findRoute(`/game/friends`);
                });


                document.getElementById(`send-${user}`).addEventListener('click', function (event) {
                    sendMessage();
                });
            }
            else { document.querySelector(`#${user}-chat`).style.display = 'flex' }
    
            // if (profile_messanger)
            //     profile_messanger.addEventListener('click', function () {
            //         chat_messanger_user.style.display = 'flex';
            //     });
        }    
    })
}

function front_inject_friends(user, every_online_user)
{
    makeAuthRequest(`/api/auth/user/${user}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(async res => {
        res = await res.json();
        //console.log(res);
        let avatar = res.avatar;
        //console.log('avatar :', avatar);
        const chat = document.getElementById('chat');
        let messengerList = document.querySelector('.messanger-list');
        for (let i = 0; i < 5; i++) {
            //console.log('waiting for the list to be ready');
            setTimeout(() => {
                messengerList = document.querySelector('.messanger-list');
            }, 1000);
        }
        if (!document.querySelector(`#${user}`))
        {
            //console.log('injecting user : ', user);
            messengerList.insertAdjacentHTML('beforeend', `
                    <div class="friend-profile" id="${user}" style="background-image: url(${avatar}); background-size: cover; background-position: center center;" >
                        <div class="friend-profile-status" ></div>
                    </div>
                `);
            if (every_online_user.includes(user))
            {
                const ue = document.querySelector(`#${user} .friend-profile-status`)
                ue.style.backgroundColor = '#00b100';
            }
            if (!document.querySelector(`#${user}-chat`)) {
                const chat = document.getElementById('chat');
                const div = document.createElement('div');
                const chatform = `
            
                <span class="chat-border" style="display:none" id="${user}-chat">
                    <span class="chat-topic" id="${user}-topic">
                        <span class="message" id="user1" style="color: rgb(38, 38, 38); font-size: 20px; position: absolute;top: -6px; left: 20px;">${user}</span>
                    </span>
                    <span class="chat-close-btn" id="${user}-btn" style="position: absolute; top: 6px; right: 10px; transform: scale(0.7);">&times;</span>
                    <div class="chat-message" id="chatMessages-${user}"></div>
    
                    <div class="chat-under">
                        <span class="import">
                            <input type="text" id="textInput-${user}" placeholder="type here ..." required>
                        </span>
                        <span class="playWith" id="play-with-${user}"></span>
                        <button class="send" id="send-${user}" ></button>
                    </div>
                </span>
                <div class="play-with-moba" id="play-with-${user}-window">
                    <div class="play-with-moba-bar">
                        <div class="message-notif">You are invited to Play with ${user}</div>
                        <div class="profile-pic-play-with" style="background-image: url(${avatar}); background-size: cover; background-position: center center;"></div>
                        <div class="requeat-play-with">
                            <span class="request accepted" id="${user}-acp">ACCEPT</span>
                            <span class="request rejected" id="${user}-rjt">REJECT</span>
                        </div>
                    </div>
                </div>
            `;
    
                div.innerHTML = chatform;
                chat.appendChild(div);
                const pppw = document.querySelector(`#play-with-${user}`);
                pppw.style.backgroundColor = '#00b100';
                const chat_messanger_user = document.querySelector(`#${user}-chat`);
                const chat_messanger_user_close_btn = document.querySelector(`#${user}-btn`);
    
                chat_messanger_user_close_btn.addEventListener('click', function () {
                    chat_messanger_user.classList.remove('active');
                    chat_messanger_user.style.display = 'none';
                });
                document.querySelectorAll('.friend-profile').forEach(friendProfile => {
                    friendProfile.addEventListener('click', (event) => {
                      // Get the user ID from the clicked element's ID
                      const userId = event.target.id;
                  
                      // Find the corresponding chat element
                      const chatElement = document.getElementById(`${userId}-chat`);
                      if (chatElement) {
                        // Set its display to "flex"
                        chatElement.style.display = "flex";
                      }
                    });
                  });
                document.querySelector(`#${user}-topic`).addEventListener('click', e => {
                    chat_messanger_user.classList.toggle('active');
                    chat_messanger_user.classList.remove('recu'); 
                });
                function sendMessage() {
                    const messageText = document.getElementById(`textInput-${user}`).value;
    
                    if (messageText.trim() !== ""){
                        const newMessage = document.createElement('div');
                        newMessage.classList.add('chat-message-user');
                        newMessage.textContent = messageText;
                        chatSocket.send(JSON.stringify({
                            'type': 'send_message',
                            'message': messageText,
                            'user': user
                        }));
                        const chatMessages = document.getElementById(`chatMessages-${user}`);
                        chatMessages.appendChild(newMessage);
    
                        document.getElementById(`textInput-${user}`).value = '';
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
    
                document.getElementById(`textInput-${user}`).addEventListener('keypress', function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        sendMessage();
                    }
                });
                const playWithWindow = document.getElementById(`play-with-${user}-window`);
                document.getElementById(`play-with-${user}`).addEventListener('click', function () {
                    //console.log("Invite triggered");
                    let playwith = document.getElementById(`play-with-${user}`);
                    playwith.style.backgroundColor = '#dc3545';
                    chatSocket.send(JSON.stringify({
                        'type': 'game_invite',
                        'from': self_user,
                        'to': user
                    }));
                    //playWithWindow.style.display = 'flex';
                });


                document.getElementById(`${user}-rjt`).addEventListener('click', function () {
                    chatSocket.send(JSON.stringify({
                        'type': 'reject_game_invite',
                        'from': self_user,
                        'to': user
                    }));
                    playWithWindow.style.display = 'none';
                });

                document.getElementById(`${user}-acp`).addEventListener('click', function () {
                    chatSocket.send(JSON.stringify({
                        'type': 'accept_game_invite',
                        'from': self_user,
                        'to': user,
                        'chat_id': user
                    }));
                    playWithWindow.style.display = 'none';
                    chatSocket.close();
                    Router.findRoute(`/game/friends`);
                });


                document.getElementById(`send-${user}`).addEventListener('click', function (event) {
                    sendMessage();
                });
            }
            else { document.querySelector(`#${user}-chat`).style.display = 'flex' }
        }
        else if (every_online_user.includes(user) && document.querySelector(`#${user}`))
        {
            const ue = document.querySelector(`#${user} .friend-profile-status`)
            //if (ue)
                ue.style.backgroundColor = '#00b100';
        }
    })
}
export function setupChat() {
    const profile_messanger = document.querySelector('.friend-profile');
    const friends = document.querySelector('.messanger-list');
    const sms = document.querySelector('.messanger');
    const sms_icon = document.querySelector('.messanger-icon');
    const chat_messanger_user = document.querySelector('.chat-border');
    sms_icon.addEventListener('click', function () {
        sms.classList.toggle('active');
        sms_icon.classList.toggle('active');
    });

    friends.addEventListener('click', function (e) {
        const UserDATA = e.target.closest('.friend-profile')
        if (UserDATA) {
            //console.log("im here");
    
        };
    });
}

export class Chat extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        setupChat();
        socket_impel();
    }

    render() {
        this.innerHTML = `
        <div class="messanger">
        <div class="messanger-icon">
            <img src="/public/src/img/sms.png">
        </div>
        <div class="messanger-list">

        </div>
    </div>
    <div class="sms" id="chat"></div>
        `
    }
}

export function socket_impel() {
    chatSocket = new WebSocket('wss://' + window.location.host + '/ws/chat/');

    chatSocket.onopen = function(e) {
        //console.log('WebSocket connection established!');
    }

    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        //console.log(data);

        if (data.type === 'broadcast')
        {
            let users = data.users;
            setTimeout(() => {
                //console.log('broadcasting message');
                //console.log("online users: ", users);
                //console.log("friend list : ", friend_list);
                //console.log("me : ", self_user);
                for (let i = 0; i < friend_list.length; i++) {
                    front_inject_friends(friend_list[i], users);
                }
            }, 200);
        }
        else if (data.type === 'remove_user') {
            //console.log('removing user :', data.user);
            //front_remove_user(data.user);
            remove_online_dot(data.user);
        }
        else if (data.type === 'send_message') {
            let msn_lst = document.querySelector('.friend-profile');
            if (!msn_lst) {
                //console.log('ana hona');
                (async () => {
                    for (let i = 0; i < 5; i++) {
                        msn_lst = document.querySelector('.friend-profile');
                        if (msn_lst)
                            break;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    //console.log('now the list is ready');
                    //console.log(data);
                })().then(() => {
                    front_inject_user(data.user);
                    front_receive_message(data.user, data.message);
                    const chat_messanger_user = document.querySelector(`#${data.user}-chat`);
                    if (chat_messanger_user && !chat_messanger_user.classList.contains('active'))
                        chat_messanger_user.classList.toggle('recu');
                    chat_messanger_user.style.display = 'flex';
                });
            } else {
                //console.log('receiving message');
                let user = data.user;
                let message = data.message;
                //console.log(user);
                //console.log(message);
                front_inject_user(user);
                front_receive_message(user, message);
                const chat_messanger_user = document.querySelector(`#${user}-chat`);
                if (chat_messanger_user && !chat_messanger_user.classList.contains('active'))
                    chat_messanger_user.classList.toggle('recu');
                chat_messanger_user.style.display = 'flex';
            }
        }
        else if (data.type === 'game_invite')
        {
            const playWithWindow = document.getElementById(`play-with-${data.from}-window`);
            playWithWindow.style.display = 'flex';
        }
        else if (data.type === 'reject_game_invite') {
            let newDiv = null;
            setTimeout(() => {
                //console.log(`${data.from} rejected your invitation`);
                const chatMessage = document.getElementById(`chatMessages-${data.from}`);
                const newDiv = document.createElement('div');
                newDiv.className = 'alert-chat';
                newDiv.textContent = `${data.from} rejected your invitation`;
                chatMessage.appendChild(newDiv);
                setTimeout(() => {
                    //console.log('removing alert');
                    newDiv.remove();
                }, 3000); 
            }, 1000);
            

            const playwith = document.getElementById(`play-with-${data.from}`);
            playwith.style.backgroundColor = '#00b100';
        }
        else if (data.type === 'accept_game_invite')
        {
            //console.log (`${data.from} accepted your invitation`);
            chatSocket.close();
            Router.findRoute(`/game/friends`);
        }
    }
}
customElements.define('app-chat', Chat)