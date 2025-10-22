// Tarneeb Score Tracker JavaScript

class TarneebTracker {
    constructor() {
        this.games = [];
        this.currentUser = null;
        this.editingGameId = null;
        this.apiBase = 'api.php';
        this.config = null;
        this.frequentPlayers = [
            'Ali', 'Amir', 'Bassel', 'Brittany', 'Christina', 'Hesham',
            'Joseph', 'Osama', 'Raquel', 'Youssef', 'Zena'
        ];

        this.initializeEventListeners();
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('assets/config.json');
            this.config = await response.json();
            this.checkAuth();
            this.loadGames();
        } catch (error) {
            console.error('Error loading config:', error);
            // Fallback to hardcoded credentials
            this.config = { admin: { username: 'rhc', password: 'rhc' } };
            this.checkAuth();
            this.loadGames();
        }
    }

    // Authentication
    checkAuth() {
        const user = localStorage.getItem('tarneeb_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showAdminControls();
        }
        this.showMainScreen();
    }

    login(username, password) {
        // Simple authentication - in production, use proper authentication
        if (this.config && username === this.config.admin.username && password === this.config.admin.password) {
            this.currentUser = { username, loginTime: new Date().toISOString() };
            localStorage.setItem('tarneeb_user', JSON.stringify(this.currentUser));
            this.showAdminControls();
            this.hideLoginModal();
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('tarneeb_user');
        this.hideAdminControls();
    }

    // Screen Management
    showMainScreen() {
        document.getElementById('mainScreen').classList.add('active');
        this.updateStats();
        this.renderGames();
    }

    showAdminControls() {
        document.getElementById('adminLoginBtn').style.display = 'none';
        document.getElementById('adminControls').style.display = 'flex';
    }

    hideAdminControls() {
        document.getElementById('adminLoginBtn').style.display = 'block';
        document.getElementById('adminControls').style.display = 'none';
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    }

    // Data Management
    async loadGames() {
        try {
            const response = await fetch(`${this.apiBase}?action=games`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.games = data.games || [];
            this.updateStats();
            this.renderGames();

            console.log('Games loaded successfully:', this.games.length, 'games');
        } catch (error) {
            console.error('Error loading games:', error);
            // Fallback to localStorage for offline mode
            const games = localStorage.getItem('tarneeb_games');
            this.games = games ? JSON.parse(games) : [];
            this.updateStats();
            this.renderGames();

            // Show user-friendly error message
            this.showNotification('Using offline mode. Data may not be synced.', 'warning');
        }
    }

    async saveGames() {
        try {
            const response = await fetch(`${this.apiBase}?action=save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ games: this.games })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                // Also save to localStorage as backup
                localStorage.setItem('tarneeb_games', JSON.stringify(this.games));
                console.log('Games saved successfully to server');
                this.showNotification('Game saved successfully!', 'success');
            } else {
                console.error('Failed to save games:', result.message);
                // Fallback to localStorage
                localStorage.setItem('tarneeb_games', JSON.stringify(this.games));
                this.showNotification('Saved locally. Server sync failed.', 'warning');
            }
        } catch (error) {
            console.error('Error saving games:', error);
            // Fallback to localStorage
            localStorage.setItem('tarneeb_games', JSON.stringify(this.games));
            this.showNotification('Saved locally. Server unavailable.', 'warning');
        }
    }

    addGame(gameData) {
        const game = {
            id: Date.now().toString(),
            ...gameData,
            createdAt: new Date().toISOString()
        };
        this.games.unshift(game);
        this.saveGames();
        this.updateStats();
        this.renderGames();
    }

    updateGame(gameId, gameData) {
        const index = this.games.findIndex(game => game.id === gameId);
        if (index !== -1) {
            this.games[index] = { ...this.games[index], ...gameData };
            this.saveGames();
            this.updateStats();
            this.renderGames();
        }
    }

    deleteGame(gameId) {
        this.games = this.games.filter(game => game.id !== gameId);
        this.saveGames();
        this.updateStats();
        this.renderGames();
    }

    // Statistics
    updateStats() {
        const totalGames = this.games.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyGames = this.games.filter(game => {
            const gameDate = new Date(game.gameDate);
            return gameDate.getMonth() === currentMonth && gameDate.getFullYear() === currentYear;
        }).length;

        document.getElementById('totalGames').textContent = totalGames;
        document.getElementById('monthlyGames').textContent = monthlyGames;

        this.updatePlayerRecords();
        this.updateTeamRankings();
    }

    // Player Records
    calculatePlayerRecords() {
        const playerStats = {};

        this.games.forEach(game => {
            if (game.team1Players && game.team2Players) {
                // New team format
                const team1Won = game.team1Score > game.team2Score;
                const team2Won = game.team2Score > game.team1Score;

                // Team 1 players
                game.team1Players.forEach(player => {
                    if (!playerStats[player]) {
                        playerStats[player] = { wins: 0, losses: 0, games: 0 };
                    }
                    playerStats[player].games++;
                    if (team1Won) playerStats[player].wins++;
                    else if (team2Won) playerStats[player].losses++;
                });

                // Team 2 players
                game.team2Players.forEach(player => {
                    if (!playerStats[player]) {
                        playerStats[player] = { wins: 0, losses: 0, games: 0 };
                    }
                    playerStats[player].games++;
                    if (team2Won) playerStats[player].wins++;
                    else if (team1Won) playerStats[player].losses++;
                });
            } else {
                // Legacy individual format - skip for now as it doesn't have clear team structure
            }
        });

        return playerStats;
    }

    updatePlayerRecords() {
        const playerStats = this.calculatePlayerRecords();
        const recordsContainer = document.getElementById('playerRecords');

        if (Object.keys(playerStats).length === 0) {
            recordsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No player records yet</h3>
                    <p>Start playing games to see player statistics!</p>
                </div>
            `;
            return;
        }

        // Sort players by win rate (wins / total games)
        const sortedPlayers = Object.entries(playerStats).sort((a, b) => {
            const aWinRate = a[1].games > 0 ? a[1].wins / a[1].games : 0;
            const bWinRate = b[1].games > 0 ? b[1].wins / b[1].games : 0;
            return bWinRate - aWinRate;
        });

        recordsContainer.innerHTML = sortedPlayers.map(([playerName, stats]) => {
            const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : 0;
            const winRateColor = winRate >= 60 ? '#28a745' : winRate >= 40 ? '#ffc107' : '#dc3545';

            return `
                <div class="player-record-card">
                    <div class="player-name-header">${playerName}</div>
                    <div class="player-stats">
                        <div class="stat-item">
                            <span class="stat-value">${stats.wins}</span>
                            <span class="stat-label">Wins</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.losses}</span>
                            <span class="stat-label">Losses</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.games}</span>
                            <span class="stat-label">Games</span>
                        </div>
                    </div>
                    <div class="win-rate" style="color: ${winRateColor}">
                        Win Rate: ${winRate}%
                    </div>
                </div>
            `;
        }).join('');
    }

    // Team Rankings
    normalizeTeamName(players) {
        // Sort players alphabetically to ensure "foo-bar" and "bar-foo" are treated as the same team
        return players.slice().sort().join(' & ');
    }

    calculateTeamRankings() {
        const teamStats = {};

        this.games.forEach(game => {
            if (game.team1Players && game.team2Players) {
                const team1Won = game.team1Score > game.team2Score;
                const team2Won = game.team2Score > game.team1Score;

                // Normalize team names
                const team1Name = this.normalizeTeamName(game.team1Players);
                const team2Name = this.normalizeTeamName(game.team2Players);

                // Initialize team stats if not exists
                if (!teamStats[team1Name]) {
                    teamStats[team1Name] = {
                        players: game.team1Players,
                        wins: 0,
                        losses: 0,
                        games: 0
                    };
                }
                if (!teamStats[team2Name]) {
                    teamStats[team2Name] = {
                        players: game.team2Players,
                        wins: 0,
                        losses: 0,
                        games: 0
                    };
                }

                // Update stats
                teamStats[team1Name].games++;
                teamStats[team2Name].games++;

                if (team1Won) {
                    teamStats[team1Name].wins++;
                    teamStats[team2Name].losses++;
                } else if (team2Won) {
                    teamStats[team2Name].wins++;
                    teamStats[team1Name].losses++;
                }
            }
        });

        return teamStats;
    }

    updateTeamRankings() {
        const teamStats = this.calculateTeamRankings();
        const rankingsContainer = document.getElementById('teamRankings');

        if (Object.keys(teamStats).length === 0) {
            rankingsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No team records yet</h3>
                    <p>Start playing games to see team rankings!</p>
                </div>
            `;
            return;
        }

        // Sort teams by win rate (wins / total games), then by total wins
        const sortedTeams = Object.entries(teamStats).sort((a, b) => {
            const aWinRate = a[1].games > 0 ? a[1].wins / a[1].games : 0;
            const bWinRate = b[1].games > 0 ? b[1].wins / b[1].games : 0;

            // First sort by win rate
            if (Math.abs(aWinRate - bWinRate) > 0.001) {
                return bWinRate - aWinRate;
            }

            // If win rates are equal, sort by total wins
            return b[1].wins - a[1].wins;
        });

        rankingsContainer.innerHTML = sortedTeams.map(([teamName, stats], index) => {
            const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : 0;
            const winRateColor = winRate >= 60 ? '#28a745' : winRate >= 40 ? '#ffc107' : '#dc3545';
            const rankClass = index < 3 ? `rank-${index + 1}` : '';

            return `
                <div class="team-ranking-card ${rankClass}">
                    <div class="team-rank">${index + 1}</div>
                    <div class="team-name">${teamName}</div>
                    <div class="team-players-list">
                        ${stats.players.map(player => `
                            <span class="team-player-tag">${player}</span>
                        `).join('')}
                    </div>
                    <div class="team-stats">
                        <div class="team-stat-item">
                            <span class="team-stat-value">${stats.wins}</span>
                            <span class="team-stat-label">Wins</span>
                        </div>
                        <div class="team-stat-item">
                            <span class="team-stat-value">${stats.losses}</span>
                            <span class="team-stat-label">Losses</span>
                        </div>
                        <div class="team-stat-item">
                            <span class="team-stat-value">${stats.games}</span>
                            <span class="team-stat-label">Games</span>
                        </div>
                    </div>
                    <div class="team-win-rate" style="color: ${winRateColor}">
                        Win Rate: ${winRate}%
                    </div>
                </div>
            `;
        }).join('');
    }

    // Rendering
    renderGames() {
        const gamesList = document.getElementById('gamesList');

        if (this.games.length === 0) {
            gamesList.innerHTML = `
                <div class="empty-state">
                    <h3>No games yet</h3>
                    <p>Start by adding your first Tarneeb game!</p>
                </div>
            `;
            return;
        }

        gamesList.innerHTML = this.games.map(game => this.renderGameCard(game)).join('');
    }

    renderGameCard(game) {
        const gameDate = new Date(game.gameDate).toLocaleDateString();

        // Handle both old format (individual players) and new format (teams)
        let gameDisplay;
        if (game.team1Players && game.team2Players) {
            // New team format
            const team1Won = game.team1Score > game.team2Score;
            const team2Won = game.team2Score > game.team1Score;

            gameDisplay = `
                <div class="game-teams">
                    <div class="team-display team1 ${team1Won ? 'winner' : ''}">
                        <h4>Team 1 ${team1Won ? '🏆' : ''}</h4>
                        <div class="team-players">
                            <span class="player-name">${game.team1Players[0]}</span>
                            <span class="player-name">${game.team1Players[1]}</span>
                        </div>
                        <div class="team-score-display">${game.team1Score}</div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-display team2 ${team2Won ? 'winner' : ''}">
                        <h4>Team 2 ${team2Won ? '🏆' : ''}</h4>
                        <div class="team-players">
                            <span class="player-name">${game.team2Players[0]}</span>
                            <span class="player-name">${game.team2Players[1]}</span>
                        </div>
                        <div class="team-score-display">${game.team2Score}</div>
                    </div>
                </div>
            `;
        } else {
            // Legacy individual player format
            const players = [
                { name: game.player1, score: game.score1 },
                { name: game.player2, score: game.score2 },
                { name: game.player3, score: game.score3 },
                { name: game.player4, score: game.score4 }
            ];
            gameDisplay = `
                <div class="game-players">
                    ${players.map(player => `
                        <div class="player-score">
                            <span class="player-name">${player.name}</span>
                            <span class="player-score-value">${player.score}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const adminButtons = this.currentUser ? `
            <div class="game-actions">
                <button class="btn btn-small btn-secondary" onclick="tracker.editGame('${game.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="tracker.deleteGame('${game.id}')">Delete</button>
            </div>
        ` : '';

        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-header">
                    <span class="game-date">${gameDate}</span>
                    ${adminButtons}
                </div>
                ${gameDisplay}
                ${game.photo ? `
                    <div style="margin-top: 15px; text-align: center;">
                        <img src="assets/${game.photo}" alt="Game proof" class="game-photo" style="max-width: 100px; max-height: 100px; border-radius: 8px;" onclick="tracker.showEnlargedPhoto('assets/${game.photo}')">
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Modal Management
    showGameModal(gameId = null) {
        if (!this.currentUser) {
            this.showLoginModal();
            return;
        }

        this.editingGameId = gameId;
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('gameForm');

        if (gameId) {
            const game = this.games.find(g => g.id === gameId);
            modalTitle.textContent = 'Edit Game';
            this.populateGameForm(game);
        } else {
            modalTitle.textContent = 'Add New Game';
            form.reset();
            document.getElementById('photoPreview').innerHTML = '';
        }

        modal.classList.add('active');

        // Setup autocomplete for player inputs
        setTimeout(() => {
            this.setupPlayerAutocomplete();
        }, 100);
    }

    hideGameModal() {
        document.getElementById('gameModal').classList.remove('active');
        this.editingGameId = null;
    }

    populateGameForm(game) {
        // Handle both old format and new team format
        if (game.team1Players && game.team2Players) {
            // New team format
            document.getElementById('team1Player1').value = game.team1Players[0];
            document.getElementById('team1Player2').value = game.team1Players[1];
            document.getElementById('team2Player1').value = game.team2Players[0];
            document.getElementById('team2Player2').value = game.team2Players[1];
            document.getElementById('team1Score').value = game.team1Score;
            document.getElementById('team2Score').value = game.team2Score;
        } else {
            // Legacy individual player format - convert to team format
            document.getElementById('team1Player1').value = game.player1 || '';
            document.getElementById('team1Player2').value = game.player2 || '';
            document.getElementById('team2Player1').value = game.player3 || '';
            document.getElementById('team2Player2').value = game.player4 || '';
            document.getElementById('team1Score').value = game.score1 || '';
            document.getElementById('team2Score').value = game.score2 || '';
        }

        document.getElementById('gameDate').value = game.gameDate;

        if (game.photo) {
            document.getElementById('photoPreview').innerHTML = `
                <img src="assets/${game.photo}" alt="Current photo" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
            `;
        }
    }

    showGameDetails(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        const modal = document.getElementById('gameDetailsModal');
        const content = document.getElementById('gameDetailsContent');

        let gameDisplay;
        if (game.team1Players && game.team2Players) {
            // New team format
            const team1Won = game.team1Score > game.team2Score;
            const team2Won = game.team2Score > game.team1Score;

            gameDisplay = `
                <div class="game-teams">
                    <div class="team-display team1 ${team1Won ? 'winner' : ''}">
                        <h4>Team 1 ${team1Won ? '🏆' : ''}</h4>
                        <div class="team-players">
                            <span class="player-name">${game.team1Players[0]}</span>
                            <span class="player-name">${game.team1Players[1]}</span>
                        </div>
                        <div class="team-score-display">${game.team1Score}</div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-display team2 ${team2Won ? 'winner' : ''}">
                        <h4>Team 2 ${team2Won ? '🏆' : ''}</h4>
                        <div class="team-players">
                            <span class="player-name">${game.team2Players[0]}</span>
                            <span class="player-name">${game.team2Players[1]}</span>
                        </div>
                        <div class="team-score-display">${game.team2Score}</div>
                    </div>
                </div>
            `;
        } else {
            // Legacy individual player format
            const players = [
                { name: game.player1, score: game.score1 },
                { name: game.player2, score: game.score2 },
                { name: game.player3, score: game.score3 },
                { name: game.player4, score: game.score4 }
            ];
            gameDisplay = `
                <div class="game-players" style="margin: 20px 0;">
                    ${players.map(player => `
                        <div class="player-score">
                            <span class="player-name">${player.name}</span>
                            <span class="player-score-value">${player.score}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        content.innerHTML = `
            <div class="game-details">
                <h3>Game on ${new Date(game.gameDate).toLocaleDateString()}</h3>
                ${gameDisplay}
                ${game.photo ? `
                    <div class="game-details-photo">
                        <h4>Game Proof</h4>
                        <img src="assets/${game.photo}" alt="Game proof" class="game-photo" onclick="tracker.showEnlargedPhoto('assets/${game.photo}')" style="cursor: pointer;">
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    hideGameDetails() {
        document.getElementById('gameDetailsModal').classList.remove('active');
    }

    // Photo Enlargement
    showEnlargedPhoto(photoSrc) {
        const modal = document.getElementById('photoModal');
        const photo = document.getElementById('enlargedPhoto');
        photo.src = photoSrc;
        modal.classList.add('active');
    }

    hidePhotoModal() {
        document.getElementById('photoModal').classList.remove('active');
    }

    // Player Name Validation and Autocomplete
    normalizePlayerName(input) {
        if (!input) return '';

        // Trim whitespace
        const trimmed = input.trim();
        if (!trimmed) return '';

        // Find exact match (case insensitive)
        const exactMatch = this.frequentPlayers.find(player =>
            player.toLowerCase() === trimmed.toLowerCase()
        );

        if (exactMatch) {
            return exactMatch; // Return with proper capitalization
        }

        // Find partial match
        const partialMatch = this.frequentPlayers.find(player =>
            player.toLowerCase().includes(trimmed.toLowerCase()) ||
            trimmed.toLowerCase().includes(player.toLowerCase())
        );

        if (partialMatch) {
            return partialMatch; // Return with proper capitalization
        }

        // Return original input with proper capitalization
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }

    setupPlayerAutocomplete() {
        const playerInputs = [
            'team1Player1', 'team1Player2', 'team2Player1', 'team2Player2'
        ];

        playerInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                // Add autocomplete list
                input.setAttribute('list', `datalist-${inputId}`);

                // Create datalist if it doesn't exist
                if (!document.getElementById(`datalist-${inputId}`)) {
                    const datalist = document.createElement('datalist');
                    datalist.id = `datalist-${inputId}`;
                    document.body.appendChild(datalist);
                }

                // Add blur event for normalization and validation
                input.addEventListener('blur', (e) => {
                    const normalized = this.normalizePlayerName(e.target.value);
                    e.target.value = normalized;
                    this.validatePlayerUniqueness();
                });

                // Add input event for real-time suggestions and validation
                input.addEventListener('input', (e) => {
                    const value = e.target.value.toLowerCase();
                    const availablePlayers = this.getAvailablePlayers(inputId);
                    const matches = availablePlayers.filter(player =>
                        player.toLowerCase().includes(value)
                    );

                    // Update datalist options
                    const datalist = document.getElementById(`datalist-${inputId}`);
                    datalist.innerHTML = '';
                    matches.forEach(player => {
                        const option = document.createElement('option');
                        option.value = player;
                        datalist.appendChild(option);
                    });

                    // Real-time validation
                    this.validatePlayerUniqueness();
                });
            }
        });
    }

    getAvailablePlayers(currentInputId) {
        const allInputs = ['team1Player1', 'team1Player2', 'team2Player1', 'team2Player2'];
        const usedPlayers = [];

        allInputs.forEach(inputId => {
            if (inputId !== currentInputId) {
                const input = document.getElementById(inputId);
                if (input && input.value.trim()) {
                    usedPlayers.push(input.value.trim());
                }
            }
        });

        return this.frequentPlayers.filter(player =>
            !usedPlayers.some(used =>
                used.toLowerCase() === player.toLowerCase()
            )
        );
    }

    validatePlayerUniqueness() {
        const allInputs = ['team1Player1', 'team1Player2', 'team2Player1', 'team2Player2'];
        const players = [];
        const duplicates = [];

        // Collect all player names
        allInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input && input.value.trim()) {
                const player = input.value.trim();
                if (players.includes(player.toLowerCase())) {
                    duplicates.push(inputId);
                } else {
                    players.push(player.toLowerCase());
                }
            }
        });

        // Remove previous error styling
        allInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.remove('error');
                const errorMsg = input.parentNode.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });

        // Add error styling to duplicates
        duplicates.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.add('error');

                // Add error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'Player already selected';
                errorMsg.style.color = '#dc3545';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.marginTop = '4px';

                input.parentNode.appendChild(errorMsg);
            }
        });

        return duplicates.length === 0;
    }

    // Photo Handling
    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Photo preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
            `;
        };
        reader.readAsDataURL(file);
    }

    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(`${this.apiBase}?action=upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Photo uploaded successfully:', result.url);
                this.showNotification('Photo uploaded successfully!', 'success');
                return result.url; // Return the URL path to the uploaded photo
            } else {
                console.error('Photo upload failed:', result.message);
                this.showNotification('Photo upload failed: ' + result.message, 'error');
                return null;
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            this.showNotification('Photo upload failed. Please try again.', 'error');
            return null;
        }
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;

        // Set colors based on type
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Event Listeners
    initializeEventListeners() {
        // Admin login button
        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (this.login(username, password)) {
                // Success - handled in login method
            } else {
                alert('Invalid credentials. Please check your username and password.');
            }
        });

        // Close login modal
        document.getElementById('closeLoginModal').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('cancelLogin').addEventListener('click', () => {
            this.hideLoginModal();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Export data
        document.getElementById('exportBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportData();
        });

        // Import data
        document.getElementById('importBtn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e);
        });

        // Add game button
        document.getElementById('addGameBtn').addEventListener('click', () => {
            this.showGameModal();
        });

        // Game form
        document.getElementById('gameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGameSubmit();
        });

        // Photo upload
        document.getElementById('gamePhoto').addEventListener('change', (e) => {
            this.handlePhotoUpload(e);
        });

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideGameModal();
        });

        document.getElementById('closeDetailsModal').addEventListener('click', () => {
            this.hideGameDetails();
        });

        // Photo modal
        document.getElementById('closePhotoModal').addEventListener('click', () => {
            this.hidePhotoModal();
        });

        document.getElementById('cancelGame').addEventListener('click', () => {
            this.hideGameModal();
        });

        // Close modals when clicking outside
        document.getElementById('loginModal').addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') {
                this.hideLoginModal();
            }
        });

        document.getElementById('gameModal').addEventListener('click', (e) => {
            if (e.target.id === 'gameModal') {
                this.hideGameModal();
            }
        });

        document.getElementById('gameDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'gameDetailsModal') {
                this.hideGameDetails();
            }
        });

        document.getElementById('photoModal').addEventListener('click', (e) => {
            if (e.target.id === 'photoModal') {
                this.hidePhotoModal();
            }
        });
    }

    // Game Form Handling
    async handleGameSubmit() {
        // Validate player uniqueness before proceeding
        if (!this.validatePlayerUniqueness()) {
            alert('Please ensure all players are unique. No player can be selected twice.');
            return;
        }

        const formData = new FormData(document.getElementById('gameForm'));
        const photoFile = document.getElementById('gamePhoto').files[0];

        const gameData = {
            team1Players: [
                this.normalizePlayerName(formData.get('team1Player1')),
                this.normalizePlayerName(formData.get('team1Player2'))
            ],
            team2Players: [
                this.normalizePlayerName(formData.get('team2Player1')),
                this.normalizePlayerName(formData.get('team2Player2'))
            ],
            team1Score: parseInt(formData.get('team1Score')),
            team2Score: parseInt(formData.get('team2Score')),
            gameDate: formData.get('gameDate')
        };

        // Handle photo upload
        if (photoFile) {
            const photoUrl = await this.uploadPhoto(photoFile);
            if (photoUrl) {
                gameData.photo = photoUrl;
            } else {
                alert('Failed to upload photo. Game will be saved without photo.');
            }
        }

        this.saveGameData(gameData);
    }

    saveGameData(gameData) {
        if (this.editingGameId) {
            this.updateGame(this.editingGameId, gameData);
        } else {
            this.addGame(gameData);
        }
        this.hideGameModal();
    }

    // Public methods for onclick handlers
    editGame(gameId) {
        if (!this.currentUser) {
            this.showLoginModal();
            return;
        }
        this.showGameModal(gameId);
    }

    deleteGame(gameId) {
        if (!this.currentUser) {
            this.showLoginModal();
            return;
        }
        if (confirm('Are you sure you want to delete this game?')) {
            this.deleteGame(gameId);
        }
    }

    showGameDetails(gameId) {
        this.showGameDetails(gameId);
    }

    showEnlargedPhoto(photoSrc) {
        this.showEnlargedPhoto(photoSrc);
    }

    // Export/Import functionality
    exportData() {
        const data = {
            games: this.games,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `tarneeb-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(link.href);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.games && Array.isArray(data.games)) {
                    if (confirm(`This will import ${data.games.length} games. This will replace your current data. Continue?`)) {
                        this.games = data.games;
                        this.saveGames();
                        this.updateStats();
                        this.renderGames();
                        alert('Data imported successfully!');
                    }
                } else {
                    alert('Invalid file format. Please select a valid Tarneeb backup file.');
                }
            } catch (error) {
                alert('Error reading file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }
}

// Initialize the application
const tracker = new TarneebTracker();

// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('gameDate').value = today;
});
