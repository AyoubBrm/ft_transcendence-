import { Router } from '../../services/Router.js';
import { makeAuthRequest } from '../../services/utils.js';

const players = [
    document.querySelector('.player1'),
    document.querySelector('.player2'),
    document.querySelector('.player3'),
    document.querySelector('.player4')
]

const winners = [
    document.querySelector('.winner1'),
    document.querySelector('.winner2'),
]

let register = document.querySelector('.Annancement');
let data = null;
let room_name = "tour_room";
let token = null;
let locker = false;
let super_locker = true;
let self_username = null;
let game_started = false;

// let response = await fetch('http://localhost:8000/api/accounts/me',
//   {
//     method: 'POST',
//     headers: 
//     {
//       'Content-Type': 'application/json',
//     },
//     credentials: 'include',
//   }
// )
// let response = await makeAuthRequest('http://localhost:8000/api/accounts/me', {
let response = await makeAuthRequest('/api/auth/me', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
});

if (response.ok) {
    data = await response.json();
    // //console.log ('full data: ', data)
    token = data.access;
    self_username = data.username;
}
else {
    //console.log('Error fetching user data');
}

let gameSocket = new WebSocket(`wss://${window.location.host}/ws/tournament/?token=${token}`);

gameSocket.onopen = function () {
    //console.log('Connection opened');
}


function initGame(user_data) {
    return new Promise((resolve, reject) => {
        makeAuthRequest('/api/tournament/init-game/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(user_data)
        }).then(async res => {
            res = await res.json();
            resolve(res);
        }).catch(err => {
            console.error('Error initializing game: ', err);
            reject(err);
        });
    });
}

let tournamentData = {
    init: 0,
    game_id: null,
}


gameSocket.onmessage = function (e) {
    data = JSON.parse(e.data);
    if (data.type === 'usernames') {
        for (let i = 0; i < data.player_num; i++)
            if (i < data.usernames.length)
                players[i].innerHTML = data.usernames[i];
            else
                players[i].innerHTML = '...';
        register.innerHTML = `Waiting for ${data.player_num - data.usernames.length} players`;
        if (data.usernames.length === data.player_num) {
            // //console.log('data.usernames======>', data.usernames);
            if (!tournamentData.init) {
                //console.log('Init game============================>');
                tournamentData.init = 1;
                initGame(data.usernames).then(res => {
                    //console.log('init game response: ', res);
                    app.tournament_id = res.tournament_id;
                }).catch(err => {
                    console.error('Error initializing game: ', err);
                });
            }
        }
    }
    else if (data.type === 'start_game' && !game_started) {
        game_started = true;
        //console.log('lets start the game');
        //console.log('data received: ', data);
        (async () => {
            const tge = document.querySelector('tour-game-page').innerHTML;
            const head = document.head.innerHTML;
            // document.querySelector('tour-game-page').innerHTML = '';
            //let doc_save = { 'head': document.head.innerHTML, 'body': document.body.innerHTML };
            //console.log('game started');
            const module = await import(`./tournament_game.js?t=${Date.now()}`);
            //console.log('le token: ', token)
            await module.tour_game(token);
            game_started = false;
            document.querySelector('tour-game-page').innerHTML = tge;
            // await new Promise((resolve) => {setTimeout(resolve, 5000);});
            //console.log('lets continue the tournament');
            document.head.innerHTML = head;
            //document.head.innerHTML = doc_save.head;
            //document.body.innerHTML = doc_save.body;
            try { document.getElementById("waiter").remove(); } catch (e) { }//console.log('No waiter'); }
            for (let i = 0; i < players.length; i++)
                players[i] = document.querySelector('.player' + (i + 1));
            for (let i = 0; i < winners.length; i++)
                winners[i] = document.querySelector('.winner' + (i + 1));
        })().then(() => {
            //console.log('update winners');
            if (gameSocket.readyState === WebSocket.OPEN) {
                gameSocket.send(JSON.stringify({ 'type': 'get_update' }));
                //console.log('Sent get_update');
            } else {
                console.error('WebSocket is not open. ReadyState:', gameSocket.readyState);
                gameSocket.addEventListener('open', () => {
                    gameSocket.send(JSON.stringify({ 'type': 'get_update' }));
                    //console.log('Sent get_update after reopening');
                });
                //console.log('my job is done here');
            }
            // //console.log ('sent get_update');
        });
    }
    else if (data.type === 'winners') {
        //console.log(data)
        // if self is in winners, locker = false
        for (let i = 0; i < data.winners.length; i++)
        {
            //console.log (`data.winners[${i}].winner: `, data.winners[i].winner);
            if (data.winners[i].winner === self_username)
            {
                //console.log ('self is in winners');
                super_locker = false;
                break;
            }
        }
        for (let i = 0; i < data.winners.length; i++)
            if (i < winners.length)
                if (data.winners[i].winner)
                    winners[i].innerHTML = data.winners[i].winner;
                else
                    winners[i].innerHTML = '...';
        for (let i = 0; i < data.players.length; i++)
            if (i < players.length)
                players[i].innerHTML = data.players[i];
            else
                players[i].innerHTML = '...';

        //console.log('data.winners: ', data.winners)
        if (data.winners.length === 2 && !locker) {
            if (super_locker)
                locker = true;
            //console.log('lets start the championship');
            gameSocket.send(JSON.stringify(
                {
                    'type': 'start_championship',
                    'self': data.winners[0].winner,
                    'opponent': data.winners[1].winner
                }));
        }
        else if (data.winners.length === 3) {
            //console.log('the champion chep is : ', data.winners)
            let win = document.getElementById('champion');
            win.innerHTML = data.winners[2].winner;
            new Promise((resolve) => {
                setTimeout(resolve, 3000);
            }
            ).then(() => {
                gameSocket.send(JSON.stringify(
                    {
                        'type': 'end_tournament',
                    }));
                //console.log('closing ...');
                try {
                    gameSocket.close();
                }
                catch (e) {
                    //console.log('error closing socket: ', e);
                }
            });
            gameSocket.close();
            setTimeout(() => {
                Router.findRoute('/');
            }, 1000);
            // new Promise((resolve) => {
            //     setTimeout(resolve, 3000);
            // }).then(() => {//console.log ('closing ...');gameSocket.close()});
        }
        else
        {
            //console.log ('waiting for the next round');
            //console.log ('data.winners: ', data.winners)
            //console.log ('the fucking locker: ', locker)
        }
    }
    else if (data.type === 'bye')
    {
        //console.log ('go to hell, bye');
        gameSocket.close();
        setTimeout(() => {
            Router.findRoute('/');
        }, 1000);
    }
    // else if (data.type === 'winner_winner_chicken_dinner')
    // {
    //   // show_notification(`${data.winner} wins the game!`);
    //   //console.log ('the champion chep is : ', data.champion)
    //   win = document.getElementById('champion');
    //   win.innerHTML = data.champion;
    //   // winner = data.winner;
    //   // breaker = 1;
    //   // gameSocket.close();
    // }
}

gameSocket.onclose = function (e) {
    console.error('Connection closed');
}

export function tournament() {
    if (!token) {
        console.alert('you need to login first');
        Router.findRoute('/login');
    }
    //console.log('Tournament page loaded');
    return () => {
        //console.log('tournament disconnected')
        gameSocket.close();
    };
}

