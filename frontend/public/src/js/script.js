import { Router } from '../../services/Router.js'
// import app from '../../components/state.js';

window.app = {};
app.router = Router;
app.root = document.getElementById('app');

document.addEventListener('DOMContentLoaded', () => {
    let path = window.location.pathname;   
    app.router.findRoute(path);
});

