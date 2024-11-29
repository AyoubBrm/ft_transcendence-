import notifications from "../components/notifications.js";
import { Router } from "./Router.js";

async function verifyToken(token) {
    
    const response = await fetch('/api/auth/token/verify/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        
        
        body: JSON.stringify({ token }),
    })
    return response.ok;
}

export async function makeAuthRequest(url, options = {}) {
    
    options.credentials = 'include';

    let token = await getMe();
    let response = await verifyToken(token.access);
    if (!response) {
        // const refreshRes = await fetch('http://localhost:8000/api/auth/refresh/', {
        const refreshRes = await fetch('/api/auth/refresh/', {
            method: 'POST',
            credentials: 'include'
        })
        if (refreshRes.ok) {
            response = await fetch(url, options)
        } else {
            //console.log('Session expired, please login again');
            notifications.notify('Session expired, please login again', 'error', 1000);
            Router.findRoute('/login');
            return;
        }
    }
    response = await fetch(url, options);
    return response
}

export async function getMe() {
    const response = await fetch('/api/auth/me', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    const data = await response.json();
    return data;
}

export async function isAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        return response.ok;
    }
    catch (e) {
        return false;
    }
}

export async function getUserDataByID(id) {
    const response = await fetch(`/api/auth/user/id/${id}/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    const data = await response.json();
    return data;
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}