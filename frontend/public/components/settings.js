import { Router } from '../services/Router.js';
import { makeAuthRequest } from '../services/utils.js';
import { sleep } from '../services/utils.js';
import notifications from './notifications.js';
import { getMe } from '../services/utils.js';

export function setupSetting() {
    const setModal = document.querySelector('.modal_settings');
    //console.log("im in settings");

    document.querySelectorAll('.setting_bnt').forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' class from all panels
            document.querySelectorAll('.edit_panel').forEach(panel => {
                panel.classList.remove('active');
            });

            // Get the target panel's ID from the data-target attribute
            const targetPanelId = button.getAttribute('data-target');

            // Show the target panel by adding the 'active' class
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === setModal) {
            setModal.style.display = 'none';
        }
    });
}

export class settings extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        this.render();
        setupSetting();
        await this.update2FA();
    }

    async updateUserInfo(newUserData) {
        let modal = document.querySelector('.modal_settings');
        for (let key in newUserData) {
            if (!newUserData[key]) {
                delete newUserData[key];
            }
        }
        //console.log(Object.values(newUserData), Object.values(newUserData).length, newUserData);
        if (Object.values(newUserData).length === 0) {
            notifications.notify('No changes made', 'info', 3000, modal);
            return;
        }
        function closeModal() {
            modal.style.display = 'none';
        }

        const response = await makeAuthRequest('/api/auth/update/', {
            'method': 'PUT',
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': JSON.stringify(newUserData),
        })
        let data = await response.json();
        if (response.ok) {
            //console.log('User info updated successfully');
            //console.log(data);
            notifications.notify('User info updated successfully', 'success', 3000, modal);
            document.getElementById('new_first-name').value = '';
            document.getElementById('new_last-name').value = '';
            // closeModal();
            // await sleep(3000);
        } else {
            //console.log('Failed to update user info', data);
            for (let key in data) {
                notifications.notify(`Error: ${data[key]}`, 'danger', 3000, modal);
            }
            // //console.log(data);
            // notifications.notify('Failed to update user info', 'danger', 3000, modal);
        }
    }

    async getNewUserData() {
        let new_first_name = document.getElementById('new_first-name').value;
        let new_last_name = document.getElementById('new_last-name').value;
        let new_pwd = document.getElementById('new_pwd').value;
        let confirmed_new_pwd = document.getElementById('Confirmed_new_pwd').value;

        let userInfoEl = document.getElementById('UserInfo');
        let securityInfoEl = document.getElementById('SecurityInfo');
        let controlInfoEl = document.getElementById('ControlInfo');

        if (userInfoEl.classList.contains('active')) {
            return {
                'first_name': new_first_name,
                'last_name': new_last_name,
            }
        } else if (securityInfoEl.classList.contains('active')) {
            if (new_pwd !== confirmed_new_pwd) {
                notifications.notify('Passwords do not match', 'danger', 3000);
                return {};
            }
            return {
                'password': new_pwd,
            }
        }
    }

    async update2FA() {
        let me = await getMe();
        document.getElementById('stay-sign').checked = me.is_2fa_enabled;
        // //console.log('me', staySign);

        // document.getElementById('stay-sign').checked = me.is_2fa_enabled;
        let applyChange = document.querySelectorAll('.Confirmed_change')[1];
        applyChange.addEventListener('click', async () => {
            let staySign = document.getElementById('stay-sign').checked;
            //console.log('me before', me, staySign);
            let updateOTP = await makeAuthRequest('/api/auth/update-otp/', {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json',
                },
                'body': JSON.stringify({
                    'is_2fa_enabled': staySign,
                }),
            })
            let data = await updateOTP.json();
            //console.log('2FA updated successfully', data);
            notifications.notify('2FA updated successfully', 'success', 1000);
            // document.getElementById('stay-sign').checked = staySign;
            document.getElementById('stay-sign').checked = data.is_2fa_enabled;
            await sleep(1000);
        });
    }

    async render() {
        this.innerHTML = `
            <div class="modal_settings">
	        		<div class="settings_window">
	        			<span class="switch_panel">
	        				<div class="setting_bnt" data-target="UserInfo">Profile</div>
	        				<div class="setting_bnt" data-target="SecurityInfo">Security</div>
	        				<div class="setting_bnt" data-target="ControlInfo">Control</div>
	        			</span>

	        			<span class="edit_panel active" id="UserInfo">
	        				<div class="message">Change your profile information below</div>
	        				<input type="text" id="new_first-name" name="first-name" placeholder="First Name">
	        				<input type="text" id="new_last-name" name="last-name" placeholder="Last Name">
	        				<div class="Confirmed_change">Apply Change</div>
	        			</span>

	        			<!-- Security Panel -->
	        			<span class="edit_panel" id="SecurityInfo">
	        				<div class="message">Change your security settings below</div>
	        				<input type="password" id="new_pwd" name="NewPassword" placeholder="New Password">
	        				<input type="password" id="Confirmed_new_pwd" name="Confirmed_NewPassword" placeholder="Confirmed New Password">
	        				<div class="checkbox-container">
	        					<input type="checkbox" id="stay-sign" name="stay-sign" value="stay-signed-in">
	        					<label for="stay-sign">Activate two-factor authentication</label>
	        				</div>
	        				<div class="Confirmed_change">Apply Change</div>
	        			</span>

	        			<!-- Control Panel -->
	        			<span class="edit_panel" id="ControlInfo">
	        				<div class="message">Adjust control settings below</div>

	        				<div class="Confirmed_change">Apply Change</div>
	        			</span>
	        		</div>

	        </div>
        `

        document.querySelector('.modal_settings').addEventListener('click', async (event) => {
            if (event.target && event.target.classList.contains('Confirmed_change')) {
                let newUserData = await this.getNewUserData();
                //console.log(Object.keys(newUserData), Object.keys(newUserData).length, newUserData);
                if (Object.keys(newUserData).length > 0) {
                    await this.updateUserInfo(newUserData);
                }
            }
        })
    }
}

customElements.define('app-settings', settings);