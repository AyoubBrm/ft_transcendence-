import { Router } from '../services/Router.js';

const app = {
    router: Router,
    root: document.getElementById('app'),
    state: {
        'loggedUser': '',
    },
    setUserData(userData) {
        this.state.userData = userData;
        document.dispatchEvent(new Event('userDataReady'));
        //console.log('userData fired!');
    },
    getUserData() {
        return this.state.userData;
    },
}

export default app;