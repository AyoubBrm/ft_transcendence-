

export class achievements extends HTMLElement {

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
        <div class="modal-achivements">
                <div class="achievements_window">
                    <div class="achievements_bar" id="brounz_Achivment">
                        <div class="achievements_icon brounz"></div>
                        <div class="achievements_score">You must Win 5 Games</div>
                        <div class="achievements_current_score">1</div>
                    </div>
                    <div class="achievements_bar" id="silver_Achivment">
                        <div class="achievements_icon silver"></div>
                        <div class="achievements_score">You must Win 10 Games</div>
                        <div class="achievements_current_score">1</div>
                    </div>
                    <div class="achievements_bar" id="gold_Achivment">
                        <div class="achievements_icon gold"></div>
                        <div class="achievements_score">You must Win 20 Games</div>
                        <div class="achievements_current_score">1</div>
                    </div>
                </div>
        </div>
        `;
        const achiModal = document.querySelector('.modal-achivements');
        //console.log("im in achivments");

        window.addEventListener('click', (event) => {
            if (event.target === achiModal) {
                achiModal.style.display = 'none';
            }
        });
    }
}

customElements.define('app-achievements', achievements);