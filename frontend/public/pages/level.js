class UserLevelSystem {
    constructor() {
        this.API_URL = 'http://localhost/api/auth/update-xp-level';
    }

    async fetchUserLevel(userId) {
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching user level:', error);
            return null;
        }
    }

    async updateUserXP(userId, xpGained) {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    xpGained: xpGained
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating XP:', error);
            return null;
        }
    }

    calculateXPPercentage(currentXP, xpForNextLevel) {
        return Math.round((currentXP / xpForNextLevel) * 100);
    }

    renderLevelBar(levelData) {
        const xpPercentage = this.calculateXPPercentage(levelData.currentXP, levelData.xpForNextLevel);
        return `
            <span class="user_exp">
                <span class="level">lvl ${levelData.level}</span>
                <div class="xp-progress-bar">
                    <div class="xp-progress-fill" style="width: ${xpPercentage}%"></div>
                </div>
                <span class="experience">${xpPercentage}%</span>
            </span>
        `;
    }

    async init(userId) {
        // Ajouter les styles nécessaires
        this.addStyles();
        
        // Obtenir l'élément de la barre d'expérience
        const expBar = document.querySelector('.expbar-profile-dashbord');
        if (!expBar) return;

        // Charger les données initiales
        const levelData = await this.fetchUserLevel(userId);
        if (levelData) {
            expBar.innerHTML = this.renderLevelBar(levelData);
        }

        // Mettre en place les écouteurs d'événements pour les actions qui donnent de l'XP
        this.setupXPListeners(userId);
    }

    addStyles() {
        const styles = `
            .xp-progress-bar {
                width: 100%;
                height: 20px;
                background-color: #2c2c2c;
                border-radius: 10px;
                overflow: hidden;
                margin: 5px 0;
            }

            .xp-progress-fill {
                height: 100%;
                background-color: #ffc800;
                transition: width 0.3s ease-in-out;
            }

            .user_exp {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }

            .level {
                font-size: 1.2em;
                color: #ffc800;
                font-weight: bold;
            }

            .experience {
                font-size: 0.9em;
                color: #ffffff;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupXPListeners(userId) {
        // Exemple d'écouteurs d'événements pour les actions qui donnent de l'XP
        document.addEventListener('gameEnd', async (event) => {
            let xpGained = 0;
            switch (event.detail.result) {
                case 'win':
                    xpGained = 50;
                    break;
                case 'lose':
                    xpGained = 20;
                    break;
                case 'draw':
                    xpGained = 30;
                    break;
            }
            
            if (xpGained > 0) {
                const updatedLevel = await this.updateUserXP(userId, xpGained);
                if (updatedLevel) {
                    const expBar = document.querySelector('.expbar-profile-dashbord');
                    expBar.innerHTML = this.renderLevelBar(updatedLevel);
                }
            }
        });

        // Écouteur pour les achievements
        document.addEventListener('achievementUnlocked', async (event) => {
            const updatedLevel = await this.updateUserXP(userId, 100); // 100 XP pour chaque achievement
            if (updatedLevel) {
                const expBar = document.querySelector('.expbar-profile-dashbord');
                expBar.innerHTML = this.renderLevelBar(updatedLevel);
            }
        });
    }
}