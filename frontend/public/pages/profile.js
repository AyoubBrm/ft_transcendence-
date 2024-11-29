import notifications from '../components/notifications.js';
import { Router } from '../services/Router.js'
import { makeAuthRequest, sleep } from '../services/utils.js'
import { getMe } from '../services/utils.js'
import { getUserDataByID } from '../services/utils.js'
import '../components/header.js';
import "../components/chat.js";
import { socket_impel } from '../components/chat.js';

let data_2d = [];
let data_3d = [];
let added_games = [];

class Profile extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const headerComponent = document.createElement('header-component');
        const chatComponent = document.createElement('app-chat');
        const username = this.getAttribute('username');
        let me = await getMe();
        let userData = await getUserData(username);
        if (!userData) {
            return;
        }
        await this.checkIfBlocked(userData, me);
        await this.render(username, userData);
        await this.checkIfWaitingOrFriends(userData, me);
        await this.checkIfAlreadyBlocked(userData, me);
        await this.getProfileHtml(userData, username);
        this.appendChild(headerComponent);
        this.appendChild(chatComponent);
        await this.offline_games(me, userData);
        await this.checkFriendsStatus(userData);
        await this.renderProfile(userData, me);
        await this.displayRank(me, userData);
        document.title = `Profile - ${userData.username}`;

        //socket_impel();
    }

    async offline_games(me, other) {
        let response = await makeAuthRequest(`/api/auth/getGameBoot?username=${me.username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        response = await response.json();
        if (response.games && me.username !== other.username)
            return;
        const games = response.games;
        for (let i = 0; i < games.length; i++) {
            if (games[i].type === '2')
            {
                if (!data_2d.includes(games[i]))
                    data_2d.push(games[i])

            }
            else if (games[i].type === '3')
            {
                // check in games[i] is in data_3d
                if (!data_3d.includes(games[i]))
                    data_3d.push(games[i])
            }
        }
        //console.log('2d games :: ', data_2d)
        //console.log('3d games :: ', data_3d)
        //console.log('waiting for a front for it');
        for (let i = 0; i < data_3d.length; i++) {
            if (added_games.includes(data_3d[i]))
                continue;
            added_games.push(data_3d[i]);
            // getting avatar of the user
            let gameStatus = data_3d[i];
            let newdiv = document.createElement('div');
            newdiv.className = "history-bar";
            newdiv.innerHTML = `
            <div class="history-bar">
            <span class="my_profile_bar" style="border: 2px solid rgb(66, 193, 38);">
                <img src="${me.avatar}" style="object-fit: cover; width: 95px; height: 95px; border-radius: 50%;">
            </span>
            <span class="score_bar" style="background-color: ${gameStatus.isWinner ? '#13bc204f': '#db0e0e63'};">
                <span class="score_main">${gameStatus.userScore}</span>
                <span class="status">
                    <div style="text-align: center; font-size: 18px; color: rgb(255, 170, 1);">3D GAME</div>
                    <div style="text-align: center;"> WIN</div>
                </span>
                <span class="score_guest">${gameStatus.botScore}</span>
            </span>
            <span class="challenger_bar" style="border: 2px solid rgb(193, 38, 38);">
                <img src="/public/game/images/bot3d.png" style="object-fit: cover; width: 95px; height: 95px; border-radius: 50%;">
            </span>
        </div>    `
            document.querySelector('.HISTORYdata').appendChild(newdiv);
        }

        for (let i = 0; i < data_2d.length; i++) {
            if (added_games.includes(data_2d[i]))
                continue;
            added_games.push(data_2d[i]);
            // getting avatar of the user
            let gameStatus = data_2d[i];
            let newdiv = document.createElement('div');
            newdiv.className = "history-bar";
            newdiv.innerHTML = `
            <div class="history-bar">
            <span class="my_profile_bar" style="border: 2px solid rgb(66, 193, 38);">
                <img src="${me.avatar}" style="object-fit: cover; width: 95px; height: 95px; border-radius: 50%;">
            </span>
            <span class="score_bar" style="background-color: ${gameStatus.isWinner ? '#13bc204f': '#db0e0e63'};">
                <span class="score_main">${gameStatus.userScore}</span>
                <span class="status">
                    <div style="text-align: center; font-size: 18px; color: rgb(255, 170, 1);">2D GAME</div>
                    <div style="text-align: center;"> WIN</div>
                </span>
                <span class="score_guest">${gameStatus.botScore}</span>
            </span>
            <span class="challenger_bar" style="border: 2px solid rgb(193, 38, 38);">
                <img src="/public/game/images/bot2d.png" style="object-fit: cover; width: 95px; height: 95px; border-radius: 50%;">
            </span>
        </div>    `
            document.querySelector('.HISTORYdata').appendChild(newdiv);
        }
    }

    async displayRank(me, userData) {
        let response = await makeAuthRequest('/api/game/rank/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        response = await response.json();
        document.querySelector('.RANKYdata').innerHTML = '';
        for (let i = 0; i < response.length; i++) {
            document.querySelector('.RANKYdata').innerHTML += `
            <div class="rank_bar" id="${response[i].username}">
                <div class="rank_number ">${i + 1}</div>
                <div class="rank_info" id="index_${i + 1}">
                    <div class="rank_profile"></div>
                    <div class="rank_name">${response[i].username}</div>
                </div>
                <div class="rank_wins">
                    <div class="icons_wins"></div>
                    <div class="numbers_wins">${response[i].score}</div>
                </div>
            </div>
        
        `;
            if (response[i].username == userData.username) {
                document.getElementById(`index_${i + 1}`).style.backgroundColor = "#ffbb00a0";
                document.querySelector('.user_exp').style.width = `${response[i].exp % 100}%`;
                //console.log ("current player xp : ", response[i].exp);
                if ((response[i].exp % 100) >= 5)
                    document.querySelector('.user_exp').style.opacity = 100;
                document.getElementById(`userLevel`).innerHTML = "Level " + response[i].level;
                document.getElementById(`experienceCount`).innerHTML = `${response[i].exp % 100}%`;
                //console.log("HIHIHIHI", document.getElementById(`experienceCount`));
                if (response[i].achivements >= 5) {
                    document.querySelector('.medal.brounz').style.backgroundColor = "#ffbb00a0";
                }
                if (response[i].achivements >= 10) {
                    document.querySelector('.medal.silver').style.backgroundColor = "#ffbb00a0";
                }
                if (response[i].achivements >= 20) {
                    document.querySelector('.medal.gold').style.backgroundColor = "#ffbb00a0";
                }
            }
        }
        let ranks = document.querySelectorAll('.RANKYdata');
        ranks.forEach(rank => {
            rank.addEventListener('click', e => {
                let username = e.target.parentElement.querySelector('.rank_name').textContent;
                app.router.findRoute(`/profile/${username}`);
            })
        })
    }


    async getProfileHtml(userData, username) {
        const avatar = document.querySelector('.profile-photo');
        app.root.profilePicture = avatar.style.backgroundImage = `url(${userData.avatar})`;

        const pendingListButton = document.getElementById('pending_list');
        const blockListButton = document.getElementById('block_list');
        const shareProfileButton = document.getElementById('share_profil');
        const pendingModal = document.getElementById('pendingModal');
        const blockModal = document.getElementById('blockModal');
        const closeModalButtons = document.querySelectorAll('.close_modal');

        const cata = document.querySelectorAll('.btn_static_click');
        const hisBar = document.querySelector('.HISTORYdata');
        const rankBar = document.querySelector('.RANKYdata');
        const achBar = document.querySelector('.ACHIVEMENTSdata');

        cata.forEach(button => {
            button.addEventListener('click', function () {
                // Remove 'active' class from all buttons
                cata.forEach(btn => btn.classList.remove('active'));

                // Add 'active' class to the clicked button
                button.classList.add('active');

                // Hide all sections
                hisBar.classList.remove('active');
                rankBar.classList.remove('active');
                achBar.classList.remove('active');

                // Show the relevant section based on the clicked button
                if (button.id === 'history_bar') {
                    hisBar.classList.add('active');
                } else if (button.id === 'achivements_bar') {
                    achBar.classList.add('active');
                } else if (button.id === 'rank_bar') {
                    rankBar.classList.add('active');
                }
            });
        });
        const add_remove = document.querySelector('.request_list.adding_friend');

        add_remove.addEventListener('click', function () {
            add_remove.classList.add('active');
        });

        // pendingListButton.addEventListener('click', function () {
        //     pendingModal.style.display = 'flex';
        // });

        blockListButton.addEventListener('click', function () {
            blockModal.style.display = 'flex';
        });

        closeModalButtons.forEach(closeButton => {
            closeButton.addEventListener('click', function () {
                pendingModal.style.display = 'none';
                blockModal.style.display = 'none';
            });
        });

        window.addEventListener('click', function (event) {
            if (event.target === pendingModal) {
                pendingModal.style.display = 'none';
            }
            if (event.target === blockModal) {
                blockModal.style.display = 'none';
            }
        });

        shareProfileButton.addEventListener('click', function () {
            let profileUrl = `http://localhost/profile/${username}`;
            navigator.clipboard.writeText(profileUrl);
            let shareProfile = document.querySelector('.profile-status');
            notifications.notify('Profile URL copied to clipboard', 'success', 1000, shareProfile);
        });

        // await getLevel();
    }

    async renderScore(data) {
        if (!data.games) {
            return `
                <span class="message" style="font-size: 20px;">No Online Games found, Go PLAY!</span><hr>
            `
        }
        function displayMatchHistory(username, currentGame) {
            let matchResult;
            if (username === currentGame.player_a) {
                matchResult = winOrLose(currentGame.score_a, currentGame.score_b);
                return {
                    'avatar': currentGame.avatar_a,
                    'score': currentGame.score_a,
                    'opponent': currentGame.player_b,
                    'opponent_avatar': currentGame.avatar_b,
                    'opponent_score': currentGame.score_b,
                    'status': matchResult.status,
                    'color': matchResult.color
                }
            }
            matchResult = winOrLose(currentGame.score_b, currentGame.score_a);
            return {
                'avatar': currentGame.avatar_b,
                'score': currentGame.score_b,
                'opponent': currentGame.player_a,
                'opponent_avatar': currentGame.avatar_a,
                'opponent_score': currentGame.score_a,
                'status': matchResult.status,
                'color': matchResult.color
            }
        }
        function winOrLose(score_a, score_b) {
            if (score_a > score_b) {
                return {
                    status: 'WIN',
                    color: 'green'
                }
            } else if (score_a === score_b) {
                return {
                    status: 'DRAW',
                    color: 'orange'
                }
            }
            return {
                status: 'LOSS',
                color: 'brown'
            }
        }
        for (let i = 0; i < data.games.length; i++) {
            let gameStatus = displayMatchHistory(data.username, data.games[i]);
            this.innerHTML += `
                <div class="history-bar">
                    <span class="my_profile_bar" style="border: 2px solid rgb(66, 193, 38);">
                        <img src="${gameStatus.avatar}" style="object-fit: cover; width: 95px; height: 95px; border-radius: 50%;">
                    </span>
                    <span class="score_bar" style="background-color: ${gameStatus.color};">
                        <span class="score_main">${gameStatus.score}</span>
                        <span class="status">${gameStatus.status}</span>
                        <span class="score_guest">${gameStatus.opponent_score}</span>
                    </span>
                    <span class="challenger_bar" style="border: 2px solid rgb(193, 38, 38);">
                        <img src="${gameStatus.opponent_avatar}" style="object-fit: cover; width: 95px; height: 95px; border-radius: 50%;">
                    </span>
                </div>
            `
        }
        return this.innerHTML;
    }

    async getUserStats(userData) {
        //console.log('************************************', userData);
        if (userData.games && userData.username === userData.games[0].player_a) {
            return {
                'wins': userData.games.filter(game => game.score_a > game.score_b).length,
                'loses': userData.games.filter(game => game.score_a < game.score_b).length,
                'draws': userData.games.filter(game => game.score_a === game.score_b).length,
                'score': userData.games.reduce((acc, game) => acc + game.score_a, 0),
            }
        } else if (userData.games && userData.username === userData.games[0].player_b) {
            return {
                'wins': userData.games.filter(game => game.score_b > game.score_a).length,
                'loses': userData.games.filter(game => game.score_b < game.score_a).length,
                'draws': userData.games.filter(game => game.score_b === game.score_a).length,
                'score': userData.games.reduce((acc, game) => acc + game.score_b, 0),
            }
        }
        //console.log('2************************************', userData);
        return {
            'wins': 0,
            'loses': 0,
            'draws': 0,
            'score': 0,
        }
    }

    async getPendingRequests(userData) {
        let response = await makeAuthRequest('/api/friends/profile/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        let data = await response.json();
        return data.Profile.waiting
    }

    async getBlockedUsers(userData) {
        try {
            let response = await makeAuthRequest('/api/friends/profile/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            let data = await response.json();
            return data.Profile.block
        } catch (e) {
            //console.log(e);
            throw e;
        }
    }

    async getAllFriends(me, userData) {
        try {
            let response = await makeAuthRequest('/api/friends/profile/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            let data = await response.json();
            return data.Profile.friends
        } catch (e) {
            //console.log(e);
            throw e;
        }
    }

    async checkFriendsStatus(userData) {
        const addFriendButton = document.getElementById('add_friend');
        const pendingListButton = document.getElementById('pending_list');
        const blockListButton = document.getElementById('block_list');
        const blockModal = document.querySelector('.block_modal_content');
        const pendingModal = document.getElementById('pendingModal')
        const modalContent = document.querySelector('.modal_content');
        const blockButton = document.getElementById('block_that');

        const blockModal2 = document.getElementById('blockModal');

        async function displayFriends(modalContent) {
            if (friends.length) {
                modalContent.innerHTML += '<span class="message" style="width: 100%; font-size: 20px;">Friends</span>';
            }
            for (let i = 0; i < friends.length; i++) {
                let friend = await getUserDataByID(friends[i]);
                let friendEl = document.createElement('div');
                friendEl.classList.add('fr_request_list');
                friendEl.id = friends[i];
                friendEl.style.maxWidth = '100%';
                friendEl.innerHTML = `
                    <span class="fr_id">
                        <span class="fr_avatar" style="background-image: url(${friend.avatar})"></span>
                        <span class="fr_name">${friend.username}</span>
                    </span>
                    <span class="requesting">
                        <span class="remove_fr">Remove</span>
                    </span>
                `
                modalContent.appendChild(friendEl);
            }
            const removeButtons = document.querySelectorAll('.remove_fr');
            removeButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    let friend = button.parentElement.parentElement;
                    let friendID = friend.id;
                    makeAuthRequest('/api/friends/methods/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            "status": "UNFRIEND",
                            "user_id": friendID
                        })
                    }).then(async res => {
                        if (res.ok) {
                            notifications.notify('Friend removed', 'success', 1500, modalContent);
                            modalContent.removeChild(friend);
                        }
                    }).catch(err => {
                        //console.log(err);
                        notifications.notify('Error removing friend', 'error', 1000, modalContent);
                    })
                })
            })
        }

        let pendings = [];
        let blocked = [];
        let friends = [];
        try {
            pendingListButton.addEventListener('click', async () => {
                let pendingRequests = await this.getPendingRequests(userData);
                friends = await this.getAllFriends(userData);
                if (!pendingRequests.length) {
                    pendingModal.style.display = 'flex';
                    modalContent.style.margin = 'auto';
                    modalContent.style.textAlign = 'center';
                    modalContent.innerHTML = '<span class="message">No pending requests</span><hr>';
                    modalContent.firstChild.style.width = '100%';
                    modalContent.firstChild.style.fontSize = '20px';

                    await displayFriends(modalContent);
                    return;
                }
                modalContent.innerHTML = '';
                pendingModal.style.display = 'flex';
                for (let i = 0; i < pendingRequests.length; i++) {
                    pendings = await getUserDataByID(pendingRequests[i]);
                    let pendingList = document.createElement('div');
                    pendingList.classList.add('fr_request_list');
                    pendingList.id = pendings.id;
                    pendingList.style.maxWidth = '100%';
                    pendingList.innerHTML = `
                        <span class="fr_id">
                            <span class="fr_avatar" style="background-image: url(${pendings.avatar})"></span>
                            <span class="fr_name">${pendings.username}</span>
                        </span>
                        <span class="requesting">
                            <span class="accept_fr">Accept</span>
                            <span class="reject_fr">Reject</span>
                        </span>
                    `
                    modalContent.appendChild(pendingList);
                }
                await displayFriends(modalContent);
                const acceptButtons = document.querySelectorAll('.accept_fr');
                const rejectButtons = document.querySelectorAll('.reject_fr');
                acceptButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        let pendingUser = button.parentElement.parentElement;
                        let pendingID = button.parentElement.parentElement.id;
                        makeAuthRequest('/api/friends/methods/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                "status": "ACCEPT",
                                "user_id": pendingID
                            })
                        }).then(async res => {
                            if (res.ok) {
                                notifications.notify('Friend request accepted', 'success', 1500, modalContent);
                                pendingUser.style.display = 'none';
                            }
                        }).catch(err => {
                            //console.log(err);
                            notifications.notify('Error accepting friend request', 'error', 1000, modalContent);
                        })
                    })
                })
                rejectButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        let pendingUser = button.parentElement.parentElement;
                        let pendingID = button.parentElement.parentElement.id;
                        makeAuthRequest('/api/friends/methods/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                "status": "REJECT",
                                "user_id": pendingID
                            })
                        }).then(async res => {
                            if (res.ok) {
                                notifications.notify('Friend request rejected', 'success', 1500, modalContent);
                                pendingUser.style.display = 'none';
                            }
                        }).catch(err => {
                            //console.log(err);
                            notifications.notify('Error rejecting friend request', 'error', 1000, modalContent);
                        })
                    })
                })
            });
        } catch (err) {
            //console.log(err);
            notifications.notify('Error checking friends status', 'error', 1000, addFriendButton);
            throw err;
        }

        try {
            blockListButton.addEventListener('click', async () => {
                blocked = await this.getBlockedUsers(userData);
                if (!blocked.length) {
                    blockModal.style.display = 'flex';
                    blockModal.style.textAlign = 'center';
                    blockModal.innerHTML = '<span class="message">No blocked users</span>';
                    blockModal.style.margin = 'auto';
                    blockModal.firstChild.style.width = '100%';
                    blockModal.firstChild.style.fontSize = '20px';
                    return;
                }
                if (blocked.includes(userData.id)) {
                    blockButton.style.display = 'none';
                    addFriendButton.style.display = 'none';
                }
                // blockModal.style.display = 'flex';
                blockModal.innerHTML = '';
                for (let i = 0; i < blocked.length; i++) {
                    let blockedUser = await getUserDataByID(blocked[i]);
                    let blockedUserEl = document.createElement('div');
                    blockedUserEl.classList.add('fr_request_list');
                    blockedUserEl.id = blocked[i];
                    blockedUserEl.style.maxWidth = '100%';
                    blockedUserEl.innerHTML = `
                        <span class="fr_id">
                            <span class="fr_avatar" style="background-image: url(${blockedUser.avatar})"></span>
                            <span class="fr_name">${blockedUser.username}</span>
                        </span>
                        <span class="requesting">
                            <span class="unblock_fr">Unblock</span>
                        </span>
                    `
                    blockModal.appendChild(blockedUserEl);
                }
                const unblockButtons = document.querySelectorAll('.unblock_fr');
                unblockButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        let blockedUser = button.parentElement.parentElement;
                        let blockedID = button.parentElement.parentElement.id;
                        makeAuthRequest('/api/friends/methods/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                "status": "UNBLOCK",
                                "user_id": blockedID
                            })
                        }).then(async res => {
                            if (res.ok) {
                                notifications.notify('User unblocked', 'success', 1500, blockModal);
                                blockedUser.style.display = 'none';
                            }
                        }).catch(err => {
                            //console.log(err);
                            notifications.notify('Error unblocking user', 'error', 1000, blockModal);
                        })
                    })
                })
            })
        } catch (err) {
            //console.log(err);
            notifications.notify('Error checking blocked users', 'error', 1000, addFriendButton);
            throw err;
        }
    }

    async addFriend(userData) {
        const addFriendButton = document.getElementById('add_friend');
        let notif = document.querySelector('.profile-status');
        addFriendButton.addEventListener('click', async () => {
            const response = await makeAuthRequest('/api/friends/methods/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "status": "ADD",
                    "user_id": String(userData.id)
                })
            })
            const data = await response.json();
            if (response.ok) {
                notifications.notify(data.message, 'success', 1000, notif);
                // addFriendButton.style.display = 'none';
                addFriendButton.classList.add('active');
                await sleep(1000);
                app.router.findRoute(`/profile/${userData.username}`);
            } else {
                //console.log(data);
                notifications.notify(data.error, 'error', 1000, notif);
            }
        });
    }

    async acceptFriendRequest(userData) {
        const addFriendButton = document.getElementById('add_friend');
        let notif = document.querySelector('.profile-status');
        addFriendButton.addEventListener('click', async () => {
            makeAuthRequest('/api/friends/methods/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "status": "ACCEPT",
                    "user_id": String(userData.id)
                })
            }).then(async res => {
                if (res.ok) {
                    notifications.notify('Friend request accepted', 'success', 1500, notif);
                    // addFriendButton.style.display = 'none';
                }
            })
        });
    }

    async blockUser(userData) {
        const blockUserButton = document.getElementById('block_that');
        let notif = document.querySelector('.profile-status');
        blockUserButton.addEventListener('click', async () => {
            makeAuthRequest('/api/friends/methods/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "status": "BLOCK",
                    "user_id": String(userData.id)
                })
            }).then(async res => {
                if (res.ok) {
                    notifications.notify('User blocked', 'success', 1500, notif);
                    blockUserButton.style.display = 'none';
                }
            })
        });
    }

    async rejectFriendRequest(userData) {
        const addFriendButton = document.getElementById('add_friend');
        let notif = document.querySelector('.profile-status');
        addFriendButton.addEventListener('click', async () => {
            makeAuthRequest('/api/friends/methods/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "status": "REJECT",
                    "user_id": String(userData.id)
                })
            }).then(async res => {
                if (res.ok) {
                    notifications.notify('Friend request rejected', 'success', 1500, notif);
                    addFriendButton.style.display = 'none';
                }
            })
        });
    }

    async checkIfAlreadyBlocked(userData, me) {
        const blockUserButton = document.getElementById('block_that');
        const addFriendButton = document.getElementById('add_friend');
        try {
            let response = await makeAuthRequest('/api/friends/profile/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            let data = await response.json();
            if (data.Profile.block.includes(userData.id)) {
                blockUserButton.style.display = 'none';
                addFriendButton.style.display = 'none';
            }
        } catch (e) {
            //console.log(e);
        }
    }

    async checkIfAlreadyFriends(userData, me) {
        const addFriendButton = document.getElementById('add_friend');
        try {
            let response = await makeAuthRequest('/api/friends/profile/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            let data = await response.json();
            if (data.Profile.friends.includes(userData.id)) {
                addFriendButton.style.display = 'none';
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    async checkIfWaitingOrFriends(userData, me) {
        const addFriendButton = document.getElementById('add_friend');
        try {
            let response = await makeAuthRequest('/api/friends/find/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "user_id": String(userData.id)
                })
            })
            let data = await response.json();
            if (data.status === 'Waiting' || data.status === 'Friend') {
                // addFriendButton.style.display = 'none';
                addFriendButton.classList.add('active');
            }
        } catch (e) {
            //console.log(e);
            notifications.notify('Error checking friend status', 'error', 1000, addFriendButton);
        }
    }

    async checkIfBlocked(userData, me) {
        let isBlockingMe = await makeAuthRequest('/api/friends/find/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "user_id": String(userData.id)
            })
        })
        isBlockingMe = await isBlockingMe.json();
        if (isBlockingMe.status === 'Block') {
            Router.findRoute('/404');
            return;
        }

    }

    async cancelFriendRequest(userData) {
        const addFriendButton = document.getElementById('add_friend');
        addFriendButton.addEventListener('click', async () => {
            let response = await makeAuthRequest('/api/friends/methods/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "status": "CANCEL",
                    "user_id": String(userData.id)
                })
            })
            if (response.ok) {
                notifications.notify('Friend request cancelled', 'success', 1000, addFriendButton);
                addFriendButton.classList.remove('active');
                await sleep(1000);
                app.router.findRoute(`/profile/${userData.username}`);
            } else {
                notifications.notify('Error cancelling friend request', 'error', 1000, addFriendButton);
            }
        });
    }

    async renderProfile(userData, me) {
        const addFriendButton = document.getElementById('add_friend');
        const blockUserButton = document.getElementById('block_that');
        const pendingListButton = document.getElementById('pending_list');

        const blockListButton = document.getElementById('block_list');
        if (me.username === userData.username) {
            addFriendButton.style.display = 'none';
            blockUserButton.style.display = 'none';
        } else { // If the user is not the owner of the profile
            blockListButton.style.display = 'none';
            pendingListButton.style.display = 'none';
            await this.checkFriendsStatus(userData);
            //console.log(addFriendButton.classList);

            if (!addFriendButton.classList.contains('active')) {
                //console.log('Not active');
                await this.addFriend(userData);
            } else {
                // await this.rejectFriendRequest(userData);
                // //console.log('Canceled!');
                await this.checkIfAlreadyFriends(userData, me);
                await this.cancelFriendRequest(userData);
                // addFriendButton.classList.remove('active');
            }
            await this.blockUser(userData);
        }
    }


    async render(username, userData) {
        try {
            //console.log(userData);
            let userStats = await this.getUserStats(userData);
            // let data = await this.displayRank();
            this.innerHTML = `
            <div class="dashbord-main">
                    <div class="image"></div>
                    <div class="right-side-dashbord">
                        <div class="profile-avatar">
                            <div class="pingpong-avatar-bar">
                                <div class="profile-photo"></div>
                            </div>
                            <div class="profile-status">
                                <div class="gird_status">
                                    <div class="grid-item " style="font-size:25px; color: #ffc800;">Wins</div>
                                    <div class="grid-item ">${userStats.wins}</div>
                                    <div class="grid-item " style="font-size:25px; color: #ffc800;">Lose</div>
                                    <div class="grid-item ">${userStats.loses}</div>
                                    <div class="grid-item " style="font-size:25px; color: #ffc800;">Draws</div>
                                    <div class="grid-item ">${userStats.draws}</div>
                                    <div class="grid-item " style="font-size:25px; color: #ffc800;">Score</div>
                                    <div class="grid-item ">${userStats.score}</div>
                                </div>
                            </div>
                            <div class="tools_profile">
                            <span style="display:contents
                            ">
                                <span class="request_list pending_list" id="pending_list"></span>
                                <span class="request_list block_list" id="block_list"></span>
                            </span>
                            <span style="display:contents">
                                <span class="request_list adding_friend" id="add_friend"></span>
                                <span class="request_list block_user" id="block_that"></span>
                            </span>
                            <span class="request_list share_profile" id="share_profil"></span>
                            </div>
                        </div>
                    </div>
                    <div class="left-side-dashbord">
                        <div class="profile-dashbord">
                            <div class="username-profile-dashbord">${userData.username}</div><hr>
                            <div class="expbar-profile-dashbord" style="position:relative;">
                                <span class="user_exp" id="userExperienceBar" style="display:flex; justify-content: flex-end;">
                                <span class="Experience" id="experienceCount"></span>
                                </span>
                            <span class="level" style="position:absolute; top: 50%; transform: translateY(-50%);left: 10px"> <span id="userLevel"></span> </span>
                            </div>
                        </div>
                        <div class="match-history-bar">
                            <div class="btn_static">
                                <span class="btn_static_click active" id="history_bar">HISTORY</span>
                                <span class="btn_static_click" id="achivements_bar">ACHIVEMENTS</span>
                                <span class="btn_static_click" id="rank_bar">RANK</span>
                            </div>
                            <div class="HISTORYdata active">
                                ${await this.renderScore(userData)}
                            </div>
                            <div class="ACHIVEMENTSdata">
                                <div class="medal_achivement_bar 5win">
                                    <div class="medal brounz"></div>
                                    <div class="title">WIN 5 Games</div>
                                </div>
                                <div class="medal_achivement_bar 10win">
                                    <div class="medal silver"></div>
                                    <div class="title">WIN 10 Games</div>
                                </div>
                                <div class="medal_achivement_bar 20win">
                                    <div class="medal gold"></div>
                                    <div class="title">WIN 20 Games</div>
                                </div>
                            </div>
                            <div class="RANKYdata">
                            </div>
                        </div>
                    </div>
                    <div class="pending_friends_modal" id="pendingModal">
                        <div class="modal_content">
                            <span class="close_modal">&times;</span>
                        </div>
                        </div>
                    </div>
                    <div class="Block_modal" id="blockModal">
                        <div class="block_modal_content">
                            <span class="close_modal">&times;</span>
                        </div>
                    </div>
                </div>
            `
        } catch (e) {
            //console.log(e);
            app.router.findRoute('404');
        }
    }
}

export function attachDOM({ username }) {
    app.root.innerHTML = '';
    document.body.style = '';
    const page = document.createElement('profile-page');
    page.setAttribute('username', username);
    app.root.appendChild(page);
}

async function getLevel() {
    const x = window.location.pathname.split('/');
    if (x.length != 3) return;
    const username = x[2];

    let res = await makeAuthRequest(`/api/auth/get-level?username=${username}`, {
        method: "GET",
        credentials: "include"
    })
    if (res.status != 200) {
        alert("Error")
        return;
    }
    res = await res.json();
    //console.log(res);
    const userExperienceBar = document.getElementById("userExperienceBar");
    const experienceCount = document.getElementById("experienceCount");
    const userXp = res.userXp;
    const maxXp = 100;
    const userLevel = (userXp / maxXp) * 100;
    //console.log(userLevel + "%")
    userExperienceBar.style.width = `${userLevel}%`
    experienceCount.textContent = `${userLevel}%`

    document.getElementById("userLevel").textContent = res.userLevel;
}

async function getUserData(username) {
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: username })
    }
    let response = await makeAuthRequest('/api/auth/user/', options)

    if (!response.ok) {
        const error = await response.text();
        if (error) {
            app.router.findRoute('/404');
            return null;
        }
        //console.log(error);
    }
    const data = await response.json();

    options.method = 'POST';
    options.body = JSON.stringify({ username: data.username });
    response = await makeAuthRequest('/api/game/get-games', options)
    let games = await response.json();
    // //console.log(games);
    data.games = games.games
    //console.log('data', data);

    return data;
}



customElements.define('profile-page', Profile);