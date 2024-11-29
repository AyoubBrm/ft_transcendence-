export class Circles extends HTMLElement {
    constructor() {
        super();
        this.last_clicked_circle = null;
    }

    connectedCallback() {
        this.render();
        this.setupCircleInteractions();

        // Wait until the content is fully loaded, then trigger the third circle click
        // window.addEventListener('DOMContentloaded', () => {
        const circles = this.querySelectorAll('.circle');
        const thirdCircle = circles[2];
        if (thirdCircle) {
            this.handleCircleClick(thirdCircle, 2);
        }
        // });
    }

    render() {
        this.innerHTML = `
            <div class="circle-container">
        <span class="circle" id="circle1" style="background-color: rgb(68, 65, 50);" data-background="/public/src/img/store.png">
            <img src="/public/src/img/icons8-shop-60.png" alt="STORE Icon" class="circle-image">
            <span class="circle-text" style="font-size: 24px;">Store</span>
            <span class="circle-description">Manage your purchases, Shop some Ball or Paddle skins or buy abilities to
                use in match</span>
        </span>
        <span class="circle" id="circle2" style="background-color: rgb(68, 65, 50);" data-background="/public/src/img/inv.png">
            <img src="/public/src/img/Frame 5.png" alt="INVENTORY Icon" class="circle-image">
            <span class="circle-text" style="font-size: 13px;">INVENTORY</span>
            <span class="circle-description">View your items, Set your play style and have a look on your
                inventory</span>
        </span>
        <span class="circle" id="circle3" data-background="/public/src/img/1.webp">
            <img src="/public/src/img/Frame 1.png" alt="PLAY Icon" class="circle-image">
            <span class="circle-text" style="font-size: 28px;">PLAY</span>
            <span class="circle-description">Enjoy playing a ping pong match with contesting either online around the
                world, local play, or with computer</span>
        </span>
        <span class="circle" id="circle4" data-background="/public/src/img/2.png">
            <img src="/public/src/img/Frame 3.png" alt="ACHIEVEMENTS Icon" class="circle-image">
            <span class="circle-text" style="font-size: 10px;">ACHIEVEMENTS</span>
            <span class="circle-description">Track your progress, have a look at your achievements, and play more games
                to unlock more</span>
        </span>
        <span class="circle" id="circle5" data-background="/public/src/img/3.webp">
            <img src="/public/src/img/Frame 4.png" alt="CONTROL Icon" class="circle-image">
            <span class="circle-text" style="font-size: 17px;">CONTROL</span>
            <span class="circle-description">Configure settings, edit your game style settings for a better experience
                in gameplay</span>
        </span>
    </div>
        `;

        this.setupCircleInteractions();
    }

    setupCircleInteractions() {
        const circles = this.querySelectorAll('.circle');
        const container = this.querySelector('.circle-container');
        const playModal = document.getElementById('play-modal'); // Make sure `play-modal` exists in the DOM

        circles.forEach((circle, index) => {
            circle.addEventListener('click', (e) => {
                this.handleCircleClick(circle, index);
            });
        });
    }

    handleCircleClick(circle, index) {
        const circles = this.querySelectorAll('.circle');
        const container = this.querySelector('.circle-container');
        const playModal = document.getElementById('play-modal'); // Ensure this element exists
        const setModal = document.querySelector('.modal_settings');
        const achiModal = document.querySelector('.modal-achivements');
        // Reset scale for all circles
        circles.forEach(c => {
            c.classList.remove('active');
            c.style.transform = 'scale(0.5)';
        });


        // Add 'active' class to clicked circle
        circle.classList.add('active');

        // Show modal if circle 3 is clicked
        if (circle.id === 'circle3') {
            const playText = circle.querySelector('.circle-text');
            playText.addEventListener('click', () => {
                if (playModal)
                    playModal.style.display = 'block'; // Show modal
            });
        }

        if (circle.id === 'circle5') {
            const setText = circle.querySelector('.circle-text');
            //console.log("im here in setting");

            setText.addEventListener('click', () => {
                setModal.style.display = 'flex'; // Show modal
            });
        }
        if (circle.id === 'circle4') {
            const setText = circle.querySelector('.circle-text');
            //console.log("im here in achivment");

            setText.addEventListener('click', () => {
                achiModal.style.display = 'flex'; // Show modal
            });
        }
        if (this.last_clicked_circle != circle.id)
        {
            // Background image change with fading effect
            const backgroundImage = circle.getAttribute('data-background');

            // Step 1: Fade the screen to black
            document.body.classList.add('fade-to-black'); // Apply fade to black class

            setTimeout(function () {
                // Step 2: Change the background image after the black fade
                document.body.style.backgroundImage = `radial-gradient(circle, rgba(151, 151, 151, 0), rgba(32, 32, 32, 1) 60% 80%), url('${backgroundImage}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';

                // Step 3: Fade the screen back to the new background image
                document.body.classList.remove('fade-to-black');
            }, 800); // Wait for 0.8 second (matching the fade-out duration)
        }
        this.last_clicked_circle = circle.id;

        // Center the clicked circle
        const circleRect = circle.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const circleCenterX = circleRect.left + circleRect.width / 2;
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const offsetX = containerCenterX - circleCenterX;
        container.style.transition = 'transform 0.8s ease-in-out'; // Smooth transition
        container.style.transform = `translateX(${offsetX}px)`;

        // Gradually scale other circles
        const activeScale = 2;
        circles.forEach((otherCircle, otherIndex) => {
            if (otherCircle !== circle) {
                const distance = Math.abs(index - otherIndex);
                let scale = 1 - 0.2 * distance;
                if (scale < 0.5) scale = 0.4;
                otherCircle.style.transform = `scale(${1})`;
            } else {
                otherCircle.style.transform = `scale(${activeScale})`;
            }
        });
    }

    disconnectedCallback() {
        this.innerHTML = '';
    }
}

customElements.define('app-circles', Circles);
