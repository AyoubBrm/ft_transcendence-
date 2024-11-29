import { isAuth } from '../services/utils.js';

export const Router = {
    normalizeRoute(route) {
        if (route.endsWith('/') && route.length > 1) {
            route = route.slice(0, -1);
            return this.normalizeRoute(route);
        }
        return route;
    },
    matchRoute(route, routePattern) {
        let routeSegments = route.split('/').filter(el => el !== '');
        let patternSegments = routePattern.split('/').filter(el => el !== '');

        if (routeSegments.length !== patternSegments.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < patternSegments.length; i++) {
            if (patternSegments[i].startsWith(':')) {
                const paramName = patternSegments[i].slice(1);
                params[paramName] = routeSegments[i];
            } else if (patternSegments[i] !== routeSegments[i]) {
                return null;
            }
        }
        //console.log('params', params);
        return params;
    },
    findRoute: (route) => {
        route = Router.normalizeRoute(route);
        for (let i = 0; i < routes.length; i++) {
            const params = Router.matchRoute(route, routes[i].path);
            if (params) {
                Router.goto(routes[i], true, params);
                return;
            }
        }
        if (route !== '/')
            Router.goto(routes.find((el => el.path === '404')))
    },
    goto: async (route, addHistory = true, params = {}) => {
        let path = route.path;
        if (Object.keys(params).length > 0) {
            for (let key in params) {
                path = path.replace(`:${key}`, params[key]);
            }
        }

        if (path === '404') {
            path = '/404';
        }

        if (route.isAuth !== undefined && route.isAuth === false) {
            let isUserAuth = await isAuth();
            //console.log('isUserAuth', isUserAuth);
            if (isUserAuth && (path === '/login' || path === '/register')) {
                route = routes.find((el => el.path === '/'));
                path = '/';
            } else if (!isUserAuth && path !== '/login' && path !== '/register' && path !== '/verify-otp') {
                route = routes.find((el => el.path === '/login'));
                path = '/login';
            } else if (!isUserAuth && path === '/verify-otp') {
                isUserAuth = true;
                //console.log('isUserAuth from verify-otp', isUserAuth);
                route = routes.find((el => el.path === '/verify-otp'));
                path = '/verify-otp';
            }
        }

        //console.log(`Navigating to ${path}`, params);
        if (addHistory) {
            //console.log('window.location.pathname', window.location.pathname);
            //console.log('path', path);
            if (window.location.pathname !== path) {
                history.pushState(null, null, path);
            }
        }
        
        app.root.innerHTML = '';
        
        await route.component(params);
    }
}

export const routes = [
    {
        path: '/',
        isAuth: false,
        component: () => import('../pages/homepage.js').then(async module => {
            await module.attachDOM();
        })
    },
    {
        path: '404',
        component: () => import('../pages/404.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/register',
        isAuth: false,
        component: () => import('../pages/auth.js').then(module => {
            module.attachDOM('register')
        })
    },
    {
        path: '/login',
        isAuth: false,
        component: () => import('../pages/auth.js').then(module => {
            module.attachDOM('login')
        })
    },
    {
        path: '/profile/:username',
        isAuth: false,
        // path: '/profile',
        component: async ({ username }) => import('../pages/profile.js').then(module => {
            module.attachDOM({ username });
        })
    },
    {
        path: '/game/offline',
        isAuth: false,
        component: () => import('../pages/game_offline.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/game/online',
        isAuth: false,
        component: () => import('../pages/game_online.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/game/3d',
        isAuth: false,
        component: () => import('../pages/3d_ping_pong.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/game/tournament',
        isAuth: false,
        component: () => import('../pages/tournament_component.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/verify-otp',
        isAuth: false,
        component: () => import('../pages/2fa.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/game/friends',
        isAuth: false,
        component: () => import('../pages/friends_game_component.js').then(module => {
            module.attachDOM();
        })
    },
    {
        path: '/game/localgame',
        isAuth: false,
        component: () => import('../pages/game_offline_local.js').then(module => {
            module.attachDOM();
        })
    }
]




function handleBackNavigation() {
    let path = window.location.pathname;
    //console.log('path', path);
    Router.findRoute(path);
};

window.addEventListener('popstate', handleBackNavigation);