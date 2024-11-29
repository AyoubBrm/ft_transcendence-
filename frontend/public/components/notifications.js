class Notifications extends HTMLElement {
    constructor() {
        super();
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }

    /**
     * Displays a notification message with the specified type and duration.
     * @param {string} message - The notification message to display.
     * @param {string} type - The type of notification (e.g., 'info', 'success', 'warning', 'danger').
     * @param {number} duration - The duration in milliseconds before the notification disappears.
     */
    notify(message, type = 'info', duration = 3000, htmlElement = null) {
        // Create a new notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" style="background-color = #181818;" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        notification.style.position = 'fixed';  // Ensure it stays on top
        notification.style.bottom = '0';         // Vertically center
        notification.style.left = '50%';        // Horizontally center
        notification.style.transform = 'translate(-50%, -50%)';  // Offset for perfect centering
        notification.style.zIndex = '9999';     // Make sure it's above other elements
        notification.style.display = 'flex';    // Use flexbox for layout
        notification.style.flexDirection = 'column';  // Arrange items vertically
        notification.style.alignItems = 'center';  // Center items horizontally
        notification.style.textAlign = 'center';  // Center the text
        notification.style.padding = '20px';      // Optional: Add padding for spacing
        if (type == "success")
            notification.style.backgroundColor = 'green';
        else
        notification.style.backgroundColor = '#a30f0f'; // Optional: Add a background color
        notification.style.color = '#fff';
        notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'; // Optional: Add shadow
        notification.style.borderRadius = '10px'; // Optional: Add rounded corners
        notification.style.width = '50%';
        notification.style.maxWidth = '400px';    // Optional: Limit the width
        
        

        if (htmlElement) {
            htmlElement.appendChild(notification);
        } else {
            //console.log('appending to container', notification);
            this.container.appendChild(notification);
        }


        if (duration) {
            setTimeout(() => {
                if (notification.classList.contains('show')) {
                    notification.remove();
                }
            }, duration);
        }

        notification.querySelector('.btn-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

customElements.define('app-notifications', Notifications);
const notifications = new Notifications();
export default notifications;