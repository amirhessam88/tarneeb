// Tarneeb Score Tracker JavaScript

class TarneebTracker {
    constructor() {
        this.games = [];
        this.currentUser = null;
        this.editingGameId = null;
        this.apiBase = 'api.php';
        this.config = null;
        this.offlineWarningShown = false;
        this.apiCallInProgress = false;
        this.initialized = false;
        this.frequentPlayers = [
            'Ali', 'Amir', 'Bassel', 'Brittany', 'Christina', 'Hesham',
            'Joseph', 'Lester', 'Osama', 'Raquel', 'Youssef', 'Zena'
        ];

        this.initializeEventListeners();
        this.loadConfig();
        this.initializeRounds();
        this.initialized = true;
    }

    async loadConfig() {
        if (this.configLoading) return;
        this.configLoading = true;

        try {
            console.log('Loading config...');
            const response = await fetch(`assets/config.json?v=${Date.now()}`);
            this.config = await response.json();
            console.log('Config loaded successfully:', this.config);
            this.checkAuth();
            this.loadGames();
        } catch (error) {
            console.error('Error loading config:', error);
            // Fallback to hardcoded credentials
            this.config = { admin: { username: 'rhc', password: 'rhc' } };
            console.log('Using fallback config:', this.config);
            this.checkAuth();
            this.loadGames();
        } finally {
            this.configLoading = false;
        }
    }

    // Authentication
    checkAuth() {
        const user = localStorage.getItem('tarneeb_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showAdminControls();
            this.renderGames(); // Re-render games to show edit buttons
        }
        this.showMainScreen();
    }

    login(username, password) {
        console.log('Login attempt:', { username, password });
        console.log('Config loaded:', this.config);

        // Simple authentication - in production, use proper authentication
        if (this.config && username === this.config.admin.username && password === this.config.admin.password) {
            console.log('Login successful');
            this.currentUser = { username, loginTime: new Date().toISOString() };
            localStorage.setItem('tarneeb_user', JSON.stringify(this.currentUser));
            this.showAdminControls();
            this.hideLoginModal();
            this.renderGames(); // Re-render games to show edit buttons
            return true;
        }
        console.log('Login failed - invalid credentials');
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
        console.log('showLoginModal called');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
            console.log('Login modal should be visible now');
        } else {
            console.error('Login modal element not found');
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    // Test API connectivity
    async testAPI() {
        try {
            console.log('Testing API connectivity...');
            console.log('API Base URL:', this.apiBase);
            console.log('Full URL:', `${this.apiBase}?action=debug`);

            const response = await fetch(`${this.apiBase}?action=debug`);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Debug info:', data);

            if (data.status === 'API is working') {
                console.log('✅ API is working correctly');
                this.showNotification('API connected successfully!', 'success');
            } else {
                console.log('❌ API debug failed');
                this.showNotification('API connection failed', 'error');
            }
        } catch (error) {
            console.error('API test failed:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            this.showNotification('API test failed: ' + error.message, 'error');
        }
    }

    // Data Management
    async loadGames() {
        if (this.gamesLoading) return;
        this.gamesLoading = true;

        try {
            const response = await fetch(`${this.apiBase}?action=games&v=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.games = data.games || [];
            this.updateStats();
            this.renderGames();
        } catch (error) {
            console.error('Error loading games:', error);
            // Fallback to localStorage for offline mode
            const games = localStorage.getItem('tarneeb_games');
            this.games = games ? JSON.parse(games) : [];
            this.updateStats();
            this.renderGames();
        } finally {
            this.gamesLoading = false;
        }
    }

    async saveGames() {
        try {
            const response = await fetch(`${this.apiBase}?action=save&v=${Date.now()}`, {
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
            createdAt: new Date().toISOString(),
            // Calculate game winner based on rounds
            winner: this.calculateGameWinner(gameData.rounds),
            // Calculate round results
            roundResults: this.calculateRoundResults(gameData.rounds)
        };
        this.games.unshift(game);
        this.saveGames();
        this.updateStats();
        this.renderGames();
    }

    // Calculate game winner based on rounds (2 out of 3 wins)
    calculateGameWinner(rounds) {
        if (!rounds || rounds.length === 0) return null;

        let team1Wins = 0;
        let team2Wins = 0;
        let draws = 0;

        rounds.forEach(round => {
            if (round.team1Score > round.team2Score) {
                team1Wins++;
            } else if (round.team2Score > round.team1Score) {
                team2Wins++;
            } else {
                draws++;
            }
        });

        // Complete wins: 2-0 or 2-1 (team has 2+ wins)
        if (team1Wins >= 2) return 'team1';
        if (team2Wins >= 2) return 'team2';

        // Incomplete scenarios with specific outcomes
        if (team1Wins === 1 && team2Wins === 0) return 'incomplete_team1_win'; // 1-0
        if (team2Wins === 1 && team1Wins === 0) return 'incomplete_team2_win'; // 0-1
        if (team1Wins === 1 && team2Wins === 1) return 'incomplete_draw'; // 1-1

        // All other cases are incomplete
        return 'incomplete';
    }

    // Calculate individual round results
    calculateRoundResults(rounds) {
        if (!rounds || rounds.length === 0) return [];

        return rounds.map(round => {
            if (round.team1Score > round.team2Score) {
                return { winner: 'team1', team1Score: round.team1Score, team2Score: round.team2Score };
            } else if (round.team2Score > round.team1Score) {
                return { winner: 'team2', team1Score: round.team1Score, team2Score: round.team2Score };
            } else {
                return { winner: 'draw', team1Score: round.team1Score, team2Score: round.team2Score };
            }
        });
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
                // Handle rounds-based games
                if (game.rounds && game.rounds.length > 0) {
                    const team1Won = game.winner === 'team1';
                    const team2Won = game.winner === 'team2';
                    const isDraw = game.winner === 'draw';
                    const isIncomplete = game.winner === 'incomplete';
                    const isIncompleteTeam1Win = game.winner === 'incomplete_team1_win';
                    const isIncompleteTeam2Win = game.winner === 'incomplete_team2_win';
                    const isIncompleteDraw = game.winner === 'incomplete_draw';

                    // Team 1 players
                    game.team1Players.forEach(player => {
                        if (!playerStats[player]) {
                            playerStats[player] = { wins: 0, losses: 0, draws: 0, incomplete: 0, games: 0, kaboots: 0, score: 0 };
                        }
                        playerStats[player].games++;
                        if (team1Won) playerStats[player].wins++;
                        else if (team2Won) playerStats[player].losses++;
                        else if (isIncompleteTeam1Win) {
                            playerStats[player].wins++; // 1-0 is a win
                            playerStats[player].incomplete++; // but also incomplete
                        }
                        else if (isIncompleteTeam2Win) {
                            playerStats[player].losses++; // 0-1 is a loss
                            playerStats[player].incomplete++; // but also incomplete
                        }
                        else if (isIncompleteDraw) {
                            playerStats[player].draws++; // 1-1 is a draw
                            playerStats[player].incomplete++; // but also incomplete
                        }
                        else if (isIncomplete) playerStats[player].incomplete++;

                        // Add kaboots and scores for Team 1 players
                        game.rounds.forEach(round => {
                            playerStats[player].kaboots += round.team1Kaboots || 0;
                            playerStats[player].score += round.team1Score || 0;
                        });
                    });

                    // Team 2 players
                    game.team2Players.forEach(player => {
                        if (!playerStats[player]) {
                            playerStats[player] = { wins: 0, losses: 0, draws: 0, incomplete: 0, games: 0, kaboots: 0, score: 0 };
                        }
                        playerStats[player].games++;
                        if (team2Won) playerStats[player].wins++;
                        else if (team1Won) playerStats[player].losses++;
                        else if (isIncompleteTeam2Win) {
                            playerStats[player].wins++; // 0-1 is a win
                            playerStats[player].incomplete++; // but also incomplete
                        }
                        else if (isIncompleteTeam1Win) {
                            playerStats[player].losses++; // 1-0 is a loss
                            playerStats[player].incomplete++; // but also incomplete
                        }
                        else if (isIncompleteDraw) {
                            playerStats[player].draws++; // 1-1 is a draw
                            playerStats[player].incomplete++; // but also incomplete
                        }
                        else if (isIncomplete) playerStats[player].incomplete++;

                        // Add kaboots and scores for Team 2 players
                        game.rounds.forEach(round => {
                            playerStats[player].kaboots += round.team2Kaboots || 0;
                            playerStats[player].score += round.team2Score || 0;
                        });
                    });
                } else {
                    // Legacy single-score format
                    const team1Won = game.team1Score > game.team2Score;
                    const team2Won = game.team2Score > game.team1Score;

                    // Team 1 players
                    game.team1Players.forEach(player => {
                        if (!playerStats[player]) {
                            playerStats[player] = { wins: 0, losses: 0, draws: 0, incomplete: 0, games: 0, kaboots: 0, score: 0 };
                        }
                        playerStats[player].games++;
                        if (team1Won) playerStats[player].wins++;
                        else if (team2Won) playerStats[player].losses++;
                        else playerStats[player].draws++;

                        // Add score for legacy format
                        playerStats[player].score += game.team1Score || 0;
                    });

                    // Team 2 players
                    game.team2Players.forEach(player => {
                        if (!playerStats[player]) {
                            playerStats[player] = { wins: 0, losses: 0, draws: 0, incomplete: 0, games: 0, kaboots: 0, score: 0 };
                        }
                        playerStats[player].games++;
                        if (team2Won) playerStats[player].wins++;
                        else if (team1Won) playerStats[player].losses++;
                        else playerStats[player].draws++;

                        // Add score for legacy format
                        playerStats[player].score += game.team2Score || 0;
                    });
                }
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

        // Sort players by total score (highest first)
        const sortedPlayers = Object.entries(playerStats).sort((a, b) => {
            const aScore = a[1].score || 0;
            const bScore = b[1].score || 0;
            return bScore - aScore;
        });

        recordsContainer.innerHTML = sortedPlayers.map(([playerName, stats], index) => {
            const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : 0;
            const winRateColor = winRate >= 60 ? '#28a745' : winRate >= 40 ? '#ffc107' : '#dc3545';
            const rankClass = index < 3 ? `rank-${index + 1}` : '';

            return `
                <div class="player-record-card ${rankClass}">
                    <div class="player-rank">${index + 1}</div>
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
                            <span class="stat-value">${stats.draws || 0}</span>
                            <span class="stat-label">Draws</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.incomplete || 0}</span>
                            <span class="stat-label">Incomplete</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.kaboots || 0}</span>
                            <span class="stat-label">Kaboots</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.score || 0}</span>
                            <span class="stat-label">Score</span>
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
                // Handle rounds-based games
                if (game.rounds && game.rounds.length > 0) {
                    const team1Won = game.winner === 'team1';
                    const team2Won = game.winner === 'team2';
                    const isDraw = game.winner === 'draw';
                    const isIncomplete = game.winner === 'incomplete';
                    const isIncompleteTeam1Win = game.winner === 'incomplete_team1_win';
                    const isIncompleteTeam2Win = game.winner === 'incomplete_team2_win';
                    const isIncompleteDraw = game.winner === 'incomplete_draw';

                    // Normalize team names
                    const team1Name = this.normalizeTeamName(game.team1Players);
                    const team2Name = this.normalizeTeamName(game.team2Players);

                    // Initialize team stats if not exists
                    if (!teamStats[team1Name]) {
                        teamStats[team1Name] = {
                            players: game.team1Players,
                            wins: 0,
                            losses: 0,
                            draws: 0,
                            incomplete: 0,
                            games: 0,
                            kaboots: 0,
                            score: 0
                        };
                    }
                    if (!teamStats[team2Name]) {
                        teamStats[team2Name] = {
                            players: game.team2Players,
                            wins: 0,
                            losses: 0,
                            draws: 0,
                            incomplete: 0,
                            games: 0,
                            kaboots: 0,
                            score: 0
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
                    } else if (isIncompleteTeam1Win) {
                        teamStats[team1Name].wins++; // 1-0 is a win
                        teamStats[team1Name].incomplete++; // but also incomplete
                        teamStats[team2Name].losses++;
                        teamStats[team2Name].incomplete++; // but also incomplete
                    } else if (isIncompleteTeam2Win) {
                        teamStats[team2Name].wins++; // 0-1 is a win
                        teamStats[team2Name].incomplete++; // but also incomplete
                        teamStats[team1Name].losses++;
                        teamStats[team1Name].incomplete++; // but also incomplete
                    } else if (isIncompleteDraw) {
                        teamStats[team1Name].draws++; // 1-1 is a draw
                        teamStats[team1Name].incomplete++; // but also incomplete
                        teamStats[team2Name].draws++; // 1-1 is a draw
                        teamStats[team2Name].incomplete++; // but also incomplete
                    } else if (isIncomplete) {
                        teamStats[team1Name].incomplete++;
                        teamStats[team2Name].incomplete++;
                    }

                    // Add kaboots and scores for both teams
                    game.rounds.forEach(round => {
                        teamStats[team1Name].kaboots += round.team1Kaboots || 0;
                        teamStats[team2Name].kaboots += round.team2Kaboots || 0;
                        teamStats[team1Name].score += round.team1Score || 0;
                        teamStats[team2Name].score += round.team2Score || 0;
                    });
                } else {
                    // Legacy single-score format
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
                            draws: 0,
                            incomplete: 0,
                            games: 0,
                            kaboots: 0,
                            score: 0
                        };
                    }
                    if (!teamStats[team2Name]) {
                        teamStats[team2Name] = {
                            players: game.team2Players,
                            wins: 0,
                            losses: 0,
                            draws: 0,
                            incomplete: 0,
                            games: 0,
                            kaboots: 0,
                            score: 0
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

                    // Add scores for legacy format
                    teamStats[team1Name].score += game.team1Score || 0;
                    teamStats[team2Name].score += game.team2Score || 0;
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

        // Sort teams by total score (highest first)
        const sortedTeams = Object.entries(teamStats).sort((a, b) => {
            const aScore = a[1].score || 0;
            const bScore = b[1].score || 0;
            return bScore - aScore;
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
                            <span class="team-stat-value">${stats.draws || 0}</span>
                            <span class="team-stat-label">Draws</span>
                        </div>
                        <div class="team-stat-item">
                            <span class="team-stat-value">${stats.incomplete || 0}</span>
                            <span class="team-stat-label">Incomplete</span>
                        </div>
                        <div class="team-stat-item">
                            <span class="team-stat-value">${stats.kaboots || 0}</span>
                            <span class="team-stat-label">Kaboots</span>
                        </div>
                        <div class="team-stat-item">
                            <span class="team-stat-value">${stats.score || 0}</span>
                            <span class="team-stat-label">Score</span>
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

        // Sort games by date (newest first)
        const sortedGames = this.games.sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));
        gamesList.innerHTML = sortedGames.map(game => this.renderGameCard(game)).join('');
    }

    renderGameCard(game) {
        const gameDate = new Date(game.gameDate).toLocaleDateString();

        // Handle rounds-based games
        let gameDisplay;
        if (game.rounds && game.rounds.length > 0) {
            // New rounds format
            const team1Wins = game.roundResults ? game.roundResults.filter(r => r.winner === 'team1').length : 0;
            const team2Wins = game.roundResults ? game.roundResults.filter(r => r.winner === 'team2').length : 0;
            const draws = game.roundResults ? game.roundResults.filter(r => r.winner === 'draw').length : 0;
            const team1Kaboots = game.rounds ? game.rounds.reduce((sum, round) => sum + (round.team1Kaboots || 0), 0) : 0;
            const team2Kaboots = game.rounds ? game.rounds.reduce((sum, round) => sum + (round.team2Kaboots || 0), 0) : 0;

            const team1Won = game.winner === 'team1';
            const team2Won = game.winner === 'team2';
            const isIncomplete = game.winner === 'incomplete';
            const isIncompleteTeam1Win = game.winner === 'incomplete_team1_win';
            const isIncompleteTeam2Win = game.winner === 'incomplete_team2_win';
            const isIncompleteDraw = game.winner === 'incomplete_draw';

            // Generate round scores display
            const roundScoresHtml = game.rounds.map((round, index) => {
                const roundResult = game.roundResults ? game.roundResults[index] : null;
                const roundWinner = roundResult ? roundResult.winner : 'draw';
                return `
                    <div class="round-score-item">
                        <div class="round-number">R${round.number}</div>
                        <div class="round-scores">
                            <span class="team1-score ${roundWinner === 'team1' ? 'winner' : ''}">${round.team1Score}</span>
                            <span class="vs">-</span>
                            <span class="team2-score ${roundWinner === 'team2' ? 'winner' : ''}">${round.team2Score}</span>
                        </div>
                        <div class="round-kaboots">
                            <span class="kaboot-count">${round.team1Kaboots || 0}</span>
                            <span class="vs">-</span>
                            <span class="kaboot-count">${round.team2Kaboots || 0}</span>
                        </div>
                    </div>
                `;
            }).join('');

            gameDisplay = `
                <div class="game-teams">
                    <div class="team-display team1 ${team1Won ? 'winner' : ''}">
                        <h4>Team 1 ${team1Won ? '🏆' : ''}</h4>
                        <div class="team-players">
                            <span class="player-name">${game.team1Players[0]}</span>
                            <span class="player-name">${game.team1Players[1]}</span>
                        </div>
                        <div class="rounds-summary">
                            <div class="rounds-wins">${team1Wins}-${team2Wins}</div>
                            <div class="rounds-details">${game.rounds.length} rounds</div>
                            <div class="rounds-kaboots">${team1Kaboots} kaboots</div>
                        </div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-display team2 ${team2Won ? 'winner' : ''}">
                        <h4>Team 2 ${team2Won ? '🏆' : ''}</h4>
                        <div class="team-players">
                            <span class="player-name">${game.team2Players[0]}</span>
                            <span class="player-name">${game.team2Players[1]}</span>
                        </div>
                        <div class="rounds-summary">
                            <div class="rounds-wins">${team2Wins}-${team1Wins}</div>
                            <div class="rounds-details">${game.rounds.length} rounds</div>
                            <div class="rounds-kaboots">${team2Kaboots} kaboots</div>
                        </div>
                    </div>
                </div>
                <div class="round-scores-breakdown">
                    <h5>Round Scores</h5>
                    <div class="round-scores-list">
                        ${roundScoresHtml}
                    </div>
                </div>
                <div class="game-status">
                    ${isIncompleteTeam1Win ? '<span class="status-badge incomplete-win">Incomplete Win (Team 1)</span>' : ''}
                    ${isIncompleteTeam2Win ? '<span class="status-badge incomplete-win">Incomplete Win (Team 2)</span>' : ''}
                    ${isIncompleteDraw ? '<span class="status-badge incomplete-draw">Incomplete Draw (1-1)</span>' : ''}
                    ${isIncomplete ? '<span class="status-badge incomplete">Incomplete</span>' : ''}
                    ${draws > 0 ? `<span class="status-badge draws">${draws} draws</span>` : ''}
                </div>
            `;
        } else if (game.team1Players && game.team2Players) {
            // Legacy team format (single score)
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
                ${this.renderGamePhotos(game)}
            </div>
        `;
    }

    renderGamePhotos(game) {
        if (game.photos && game.photos.length > 0) {
            // Multiple photos
            const photosHtml = game.photos.map(photo =>
                `<img src="${photo}" alt="Game proof" class="game-photo" style="max-width: 100px; max-height: 100px; border-radius: 8px; margin: 2px; cursor: pointer;" onclick="window.showPhoto('${photo}')" onerror="console.error('Image failed to load:', '${photo}')">`
            ).join('');

            return `
                <div style="margin-top: 15px; text-align: center;">
                    ${photosHtml}
                </div>
            `;
        } else if (game.photo) {
            // Single photo (backward compatibility)
            return `
                <div style="margin-top: 15px; text-align: center;">
                    <img src="${game.photo}" alt="Game proof" class="game-photo" style="max-width: 100px; max-height: 100px; border-radius: 8px; cursor: pointer;" onclick="window.showPhoto('${game.photo}')" onerror="console.error('Image failed to load:', '${game.photo}')">
                </div>
            `;
        }
        return '';
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
            document.getElementById('gamePhotos').value = '';
            // Initialize rounds for new game
            this.rounds = [];
            console.log('Initializing rounds for new game');
            // Add a default first round
            this.addRound();
            // Render the rounds immediately
            this.renderRounds();

            // Double-check that rounds are rendered
            setTimeout(() => {
                const container = document.getElementById('roundsContainer');
                if (container && container.innerHTML.trim() === '') {
                    console.log('Rounds not rendered, forcing render again...');
                    this.renderRounds();
                }
            }, 50);
        }

        modal.classList.add('active');
        modal.style.display = 'flex';

        // Setup autocomplete for player inputs and round button
        setTimeout(() => {
            this.setupPlayerAutocomplete();
            this.setupRoundEventListeners();
            // Debug: Check if rounds container exists
            const roundsContainer = document.getElementById('roundsContainer');
            console.log('Rounds container found:', !!roundsContainer);
            if (roundsContainer) {
                console.log('Rounds container HTML:', roundsContainer.innerHTML);
                console.log('Current rounds array:', this.rounds);
                // Force render rounds if they're not showing
                if (this.rounds.length > 0 && roundsContainer.innerHTML.trim() === '') {
                    console.log('Forcing rounds render...');
                    this.renderRounds();
                }
            }
        }, 100);
    }

    hideGameModal() {
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        this.editingGameId = null;
    }

    populateGameForm(game) {
        // Handle rounds-based format (current format)
        if (game.rounds && game.rounds.length > 0) {
            // Load rounds data
            this.rounds = game.rounds;
            this.renderRounds();

            // Load team players from game level (not from rounds)
            if (game.team1Players && game.team2Players) {
                document.getElementById('team1Player1').value = game.team1Players[0] || '';
                document.getElementById('team1Player2').value = game.team1Players[1] || '';
                document.getElementById('team2Player1').value = game.team2Players[0] || '';
                document.getElementById('team2Player2').value = game.team2Players[1] || '';
            }
        }
        // Handle old team format
        else if (game.team1Players && game.team2Players) {
            document.getElementById('team1Player1').value = game.team1Players[0];
            document.getElementById('team1Player2').value = game.team1Players[1];
            document.getElementById('team2Player1').value = game.team2Players[0];
            document.getElementById('team2Player2').value = game.team2Players[1];
            document.getElementById('team1Score').value = game.team1Score;
            document.getElementById('team2Score').value = game.team2Score;
        }
        // Handle legacy individual player format
        else {
            document.getElementById('team1Player1').value = game.player1 || '';
            document.getElementById('team1Player2').value = game.player2 || '';
            document.getElementById('team2Player1').value = game.player3 || '';
            document.getElementById('team2Player2').value = game.player4 || '';
            document.getElementById('team1Score').value = game.score1 || '';
            document.getElementById('team2Score').value = game.score2 || '';
        }

        document.getElementById('gameDate').value = game.gameDate;

        // Handle photos with delete functionality
        this.renderExistingPhotos(game);
    }

    renderExistingPhotos(game) {
        const photoPreview = document.getElementById('photoPreview');
        let photosHtml = '';

        if (game.photos && game.photos.length > 0) {
            photosHtml = game.photos.map((photo, index) => `
                    <div class="existing-photo-container" style="display: inline-block; margin: 5px; position: relative;">
                        <img src="${photo}" alt="Game photo" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #ddd;">
                        <button type="button" class="delete-photo-btn" onclick="deleteExistingPhoto(${index})" 
                                style="position: absolute; top: 5px; right: 5px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 14px; line-height: 1;">
                            ×
                        </button>
                    </div>
                `).join('');
        } else if (game.photo) {
            photosHtml = `
                    <div class="existing-photo-container" style="display: inline-block; margin: 5px; position: relative;">
                        <img src="assets/${game.photo}" alt="Current photo" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #ddd;">
                        <button type="button" class="delete-photo-btn" onclick="deleteExistingPhoto(0)" 
                                style="position: absolute; top: 5px; right: 5px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 14px; line-height: 1;">
                            ×
                        </button>
                    </div>
                `;
        }

        photoPreview.innerHTML = photosHtml;
    }

    deleteExistingPhoto(photoIndex) {
        if (!this.editingGameId) return;

        const game = this.games.find(g => g.id === this.editingGameId);
        if (!game) return;

        if (confirm('Are you sure you want to delete this photo?')) {
            if (game.photos && game.photos.length > 0) {
                game.photos.splice(photoIndex, 1);
            } else if (game.photo) {
                delete game.photo;
            }

            // Re-render the photos
            this.renderExistingPhotos(game);
        }
    }

    showGameDetails(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        const modal = document.getElementById('gameDetailsModal');
        const content = document.getElementById('gameDetailsContent');

        let gameDisplay;
        if (game.team1Players && game.team2Players) {
            // New team format with rounds
            if (game.rounds && game.rounds.length > 0) {
                const team1Wins = game.roundResults ? game.roundResults.filter(r => r.winner === 'team1').length : 0;
                const team2Wins = game.roundResults ? game.roundResults.filter(r => r.winner === 'team2').length : 0;
                const team1Won = game.winner === 'team1';
                const team2Won = game.winner === 'team2';
                const isIncomplete = game.winner === 'incomplete';

                // Round details
                const roundsHtml = game.rounds.map((round, index) => {
                    const roundResult = game.roundResults ? game.roundResults[index] : null;
                    const roundWinner = roundResult ? roundResult.winner : 'draw';
                    return `
                        <div class="round-detail">
                            <div class="round-number">Round ${round.number}</div>
                            <div class="round-scores">
                                <span class="team1-score ${roundWinner === 'team1' ? 'winner' : ''}">${round.team1Score}</span>
                                <span class="vs">-</span>
                                <span class="team2-score ${roundWinner === 'team2' ? 'winner' : ''}">${round.team2Score}</span>
                            </div>
                            <div class="round-kaboots">
                                <span class="kaboot-count">${round.team1Kaboots || 0} kaboots</span>
                                <span class="vs">-</span>
                                <span class="kaboot-count">${round.team2Kaboots || 0} kaboots</span>
                            </div>
                        </div>
                    `;
                }).join('');

                gameDisplay = `
                    <div class="game-teams">
                        <div class="team-display team1 ${team1Won ? 'winner' : ''}">
                            <h4>Team 1 ${team1Won ? '🏆' : ''}</h4>
                            <div class="team-players">
                                <span class="player-name">${game.team1Players[0]}</span>
                                <span class="player-name">${game.team1Players[1]}</span>
                            </div>
                            <div class="team-score-display">${team1Wins}-${team2Wins}</div>
                        </div>
                        <div class="vs-divider">VS</div>
                        <div class="team-display team2 ${team2Won ? 'winner' : ''}">
                            <h4>Team 2 ${team2Won ? '🏆' : ''}</h4>
                            <div class="team-players">
                                <span class="player-name">${game.team2Players[0]}</span>
                                <span class="player-name">${game.team2Players[1]}</span>
                            </div>
                            <div class="team-score-display">${team2Wins}-${team1Wins}</div>
                        </div>
                    </div>
                    <div class="rounds-breakdown">
                        <h4>Round Details</h4>
                        <div class="rounds-list">
                            ${roundsHtml}
                        </div>
                        <div class="game-status">
                            ${isIncomplete ? '<span class="status-badge incomplete">Incomplete</span>' : ''}
                        </div>
                    </div>
                `;
            } else {
                // Legacy single score format
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
            }
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
                ${this.renderGameDetailsPhotos(game)}
            </div>
        `;

        modal.classList.add('active');
    }

    renderGameDetailsPhotos(game) {
        if (game.photos && game.photos.length > 0) {
            // Multiple photos
            const photosHtml = game.photos.map(photo =>
                `<img src="${photo}" alt="Game proof" class="game-photo" style="cursor: pointer; max-width: 200px; max-height: 200px; border-radius: 8px; margin: 5px;" onclick="window.showPhoto('${photo}')" onerror="console.error('Image failed to load:', '${photo}')">`
            ).join('');

            return `
                <div class="game-details-photo">
                    <h4>Game Proof (${game.photos.length} photo${game.photos.length > 1 ? 's' : ''})</h4>
                    <div style="text-align: center;">
                        ${photosHtml}
                    </div>
                </div>
            `;
        } else if (game.photo) {
            // Single photo (backward compatibility)
            return `
                <div class="game-details-photo">
                    <h4>Game Proof</h4>
                    <img src="${game.photo}" alt="Game proof" class="game-photo" style="cursor: pointer;" onclick="window.showPhoto('${game.photo}')" onerror="console.error('Image failed to load:', '${game.photo}')">
                </div>
            `;
        }
        return '';
    }

    hideGameDetails() {
        document.getElementById('gameDetailsModal').classList.remove('active');
    }

    // Photo Enlargement
    showEnlargedPhoto(photoSrc) {
        console.log('=== showEnlargedPhoto called ===');
        console.log('photoSrc:', photoSrc);

        const modal = document.getElementById('photoModal');
        const photo = document.getElementById('enlargedPhoto');

        console.log('Modal found:', !!modal);
        console.log('Photo element found:', !!photo);

        if (!modal || !photo) {
            console.error('Photo modal elements not found');
            return;
        }

        // Set the photo source
        photo.src = photoSrc;
        console.log('Photo src set to:', photo.src);

        // Show the modal
        modal.classList.add('active');
        modal.style.display = 'flex'; // Force display

        console.log('Modal classes after adding active:', modal.className);
        console.log('Modal style display:', modal.style.display);
        console.log('Modal computed style display:', window.getComputedStyle(modal).display);

        // Check positioning and z-index
        const computedStyle = window.getComputedStyle(modal);
        console.log('Modal position:', computedStyle.position);
        console.log('Modal z-index:', computedStyle.zIndex);
        console.log('Modal top:', computedStyle.top);
        console.log('Modal left:', computedStyle.left);
        console.log('Modal width:', computedStyle.width);
        console.log('Modal height:', computedStyle.height);
        console.log('Modal visibility:', computedStyle.visibility);
        console.log('Modal opacity:', computedStyle.opacity);

        // Check if modal is actually in viewport
        const rect = modal.getBoundingClientRect();
        console.log('Modal bounding rect:', rect);
        console.log('Modal is in viewport:', rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth);

        console.log('=== end showEnlargedPhoto ===');
    }

    hidePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none'; // Force hide
        }
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
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            document.getElementById('photoPreview').innerHTML = '';
            return;
        }

        // Show preview for all selected files
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = '';

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `Photo preview ${index + 1}`;
                img.style.cssText = 'max-width: 200px; max-height: 200px; border-radius: 8px; margin: 5px;';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(`${this.apiBase}?action=upload&v=${Date.now()}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Photo uploaded successfully:', result.url);
                console.log('Photo URL being returned:', result.url);
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

    async uploadMultiplePhotos(files) {
        const uploadPromises = files.map(file => this.uploadPhoto(file));
        const results = await Promise.all(uploadPromises);

        // Filter out null results (failed uploads)
        const successfulUploads = results.filter(url => url !== null);

        if (successfulUploads.length > 0) {
            this.showNotification(`${successfulUploads.length} photo(s) uploaded successfully!`, 'success');
        }

        return successfulUploads;
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

    // Round Management
    initializeRounds() {
        this.rounds = [];
        this.setupRoundEventListeners();
    }

    setupRoundEventListeners() {
        console.log('Setting up round event listeners');
        // Add round button (remove existing listener first to avoid duplicates)
        const addBtn = document.getElementById('addRoundBtn');
        console.log('Add round button found:', !!addBtn);
        if (addBtn) {
            // Remove any existing event listeners
            addBtn.replaceWith(addBtn.cloneNode(true));
            // Add new event listener
            document.getElementById('addRoundBtn').addEventListener('click', () => {
                console.log('Add round button clicked');
                this.addRound();
            });
        } else {
            console.error('Add round button not found!');
        }
    }

    setupRoundScoreListeners() {
        // Add event listeners to all round score and kaboot inputs
        const inputs = document.querySelectorAll('.round-score, .round-kaboot');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const roundId = e.target.dataset.roundId;
                const team = e.target.dataset.team;
                const value = parseInt(e.target.value) || 0;

                if (e.target.dataset.type === 'score') {
                    this.updateRoundScore(roundId, team, value);
                } else if (e.target.dataset.type === 'kaboot') {
                    this.updateRoundKaboot(roundId, team, value);
                }
            });
        });
    }

    addRound() {
        console.log('Adding round, current rounds:', this.rounds.length);

        if (this.rounds.length >= 3) {
            this.showNotification('Maximum 3 rounds allowed', 'warning');
            return;
        }

        const roundNumber = this.rounds.length + 1;
        const roundId = `round_${Date.now()}`;

        const round = {
            id: roundId,
            number: roundNumber,
            team1Score: 0,
            team2Score: 0,
            team1Kaboots: 0,
            team2Kaboots: 0
        };

        this.rounds.push(round);
        console.log('Round added, total rounds:', this.rounds.length);
        this.renderRounds();
        this.updateRoundResults();
    }

    removeRound(roundId) {
        this.rounds = this.rounds.filter(round => round.id !== roundId);
        this.renumberRounds();
        this.renderRounds();
        this.updateRoundResults();
    }

    renumberRounds() {
        this.rounds.forEach((round, index) => {
            round.number = index + 1;
        });
    }

    renderRounds() {
        console.log('Rendering rounds:', this.rounds.length);
        const container = document.getElementById('roundsContainer');
        if (!container) {
            console.error('roundsContainer not found!');
            return;
        }

        container.innerHTML = '';

        this.rounds.forEach(round => {
            const roundElement = this.createRoundElement(round);
            container.appendChild(roundElement);
        });

        // Add event listeners to score inputs
        this.setupRoundScoreListeners();

        // Update add button state
        const addBtn = document.getElementById('addRoundBtn');
        if (addBtn) {
            addBtn.disabled = this.rounds.length >= 3;
            addBtn.textContent = this.rounds.length >= 3 ? 'Max Rounds' : '+ Add Round';
        } else {
            console.error('addRoundBtn not found!');
        }
    }

    createRoundElement(round) {
        const div = document.createElement('div');
        div.className = 'round-item';
        div.innerHTML = `
            <div class="round-header">
                <h4 class="round-title">Round ${round.number}</h4>
                <button type="button" class="remove-round" onclick="tracker.removeRound('${round.id}')">Remove</button>
            </div>
            <div class="round-scores">
                <div class="round-score-input">
                    <label>Team 1 Score</label>
                    <input type="number" 
                           class="round-score" 
                           data-round-id="${round.id}" 
                           data-team="1" 
                           data-type="score"
                           value="${round.team1Score}">
                    <label class="kaboot-label">Kaboots</label>
                    <input type="number" 
                           class="round-kaboot" 
                           data-round-id="${round.id}" 
                           data-team="1" 
                           data-type="kaboot"
                           value="${round.team1Kaboots}"
                           min="0">
                </div>
                <div class="round-vs">VS</div>
                <div class="round-score-input">
                    <label>Team 2 Score</label>
                    <input type="number" 
                           class="round-score" 
                           data-round-id="${round.id}" 
                           data-team="2" 
                           data-type="score"
                           value="${round.team2Score}">
                    <label class="kaboot-label">Kaboots</label>
                    <input type="number" 
                           class="round-kaboot" 
                           data-round-id="${round.id}" 
                           data-team="2" 
                           data-type="kaboot"
                           value="${round.team2Kaboots}"
                           min="0">
                </div>
            </div>
            <div class="round-result" id="result_${round.id}"></div>
        `;

        // Add event listeners for score and kaboot changes
        const scoreInputs = div.querySelectorAll('.round-score, .round-kaboot');
        scoreInputs.forEach(input => {
            input.addEventListener('input', () => {
                const value = parseInt(input.value) || 0;
                if (input.dataset.type === 'score') {
                    this.updateRoundScore(round.id, input.dataset.team, value);
                } else if (input.dataset.type === 'kaboot') {
                    this.updateRoundKaboot(round.id, input.dataset.team, value);
                }
            });
        });

        return div;
    }

    updateRoundScore(roundId, team, score) {
        const round = this.rounds.find(r => r.id === roundId);
        if (round) {
            if (team === '1') {
                round.team1Score = score;
            } else {
                round.team2Score = score;
            }
            this.updateRoundResults();
        }
    }

    updateRoundKaboot(roundId, team, kaboots) {
        const round = this.rounds.find(r => r.id === roundId);
        if (round) {
            if (team === '1') {
                round.team1Kaboots = kaboots;
            } else {
                round.team2Kaboots = kaboots;
            }
            this.updateRoundResults();
        }
    }

    updateRoundResults() {
        this.rounds.forEach(round => {
            const resultDiv = document.getElementById(`result_${round.id}`);
            if (resultDiv) {
                let result = '';
                let className = '';

                if (round.team1Score > round.team2Score) {
                    result = 'Team 1 Wins';
                    className = 'team1-win';
                } else if (round.team2Score > round.team1Score) {
                    result = 'Team 2 Wins';
                    className = 'team2-win';
                } else if (round.team1Score === round.team2Score) {
                    result = 'Draw';
                    className = 'draw';
                }

                resultDiv.textContent = result;
                resultDiv.className = `round-result ${className}`;
            }
        });
    }

    // Event Listeners
    initializeEventListeners() {
        // Admin login button
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => {
                console.log('Admin login button clicked');
                this.showLoginModal();
            });
            console.log('Admin login button event listener attached');
        } else {
            console.error('Admin login button not found');
        }

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
        document.getElementById('gamePhotos').addEventListener('change', (e) => {
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

        // Photo enlargement - use global function for inline onclick handlers

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

        // Delegated click handler for game photos (robust against CSP/inline handler issues)
        document.addEventListener('click', (e) => {
            const photoEl = e.target && (e.target.classList && e.target.classList.contains('game-photo')
                ? e.target
                : (e.target.closest ? e.target.closest('.game-photo') : null));
            if (photoEl) {
                const src = photoEl.getAttribute('src');
                if (!src) return;
                e.preventDefault();
                // Minimal trace to verify click in production
                console.debug('game-photo clicked:', src);
                if (typeof window.showPhoto === 'function') {
                    window.showPhoto(src);
                } else if (window.tracker && typeof window.tracker.showEnlargedPhoto === 'function') {
                    window.tracker.showEnlargedPhoto(src);
                }
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

        // Validate rounds
        if (this.rounds.length === 0) {
            alert('Please add at least one round.');
            return;
        }

        const formData = new FormData(document.getElementById('gameForm'));
        const photoFiles = Array.from(document.getElementById('gamePhotos').files);

        const gameData = {
            team1Players: [
                this.normalizePlayerName(formData.get('team1Player1')),
                this.normalizePlayerName(formData.get('team1Player2'))
            ],
            team2Players: [
                this.normalizePlayerName(formData.get('team2Player1')),
                this.normalizePlayerName(formData.get('team2Player2'))
            ],
            rounds: this.rounds.map(round => ({
                number: round.number,
                team1Score: round.team1Score,
                team2Score: round.team2Score,
                team1Kaboots: round.team1Kaboots,
                team2Kaboots: round.team2Kaboots
            })),
            gameDate: formData.get('gameDate')
        };

        // Handle photos (existing + new uploads)
        if (this.editingGameId) {
            // When editing, preserve existing photos that weren't deleted
            const existingGame = this.games.find(g => g.id === this.editingGameId);
            if (existingGame && existingGame.photos) {
                gameData.photos = [...existingGame.photos];
            } else if (existingGame && existingGame.photo) {
                gameData.photos = [existingGame.photo];
            }
        }

        // Handle new photo uploads
        if (photoFiles.length > 0) {
            const photoUrls = await this.uploadMultiplePhotos(photoFiles);
            if (photoUrls.length > 0) {
                if (gameData.photos) {
                    gameData.photos = [...gameData.photos, ...photoUrls];
                } else {
                    gameData.photos = photoUrls;
                }
                // Keep backward compatibility with single photo
                if (gameData.photos.length === 1) {
                    gameData.photo = gameData.photos[0];
                }
            } else {
                alert('Failed to upload photos. Game will be saved without new photos.');
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
            this.games = this.games.filter(game => game.id !== gameId);
            this.saveGames();
            this.updateStats();
            this.renderGames();
        }
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
window.tracker = tracker; // Make it globally available

// Global function for photo enlargement - defined immediately
window.showPhoto = function (photoSrc) {
    console.log('=== showPhoto called ===');
    console.log('photoSrc:', photoSrc);

    // Try multiple ways to access the tracker
    let trackerInstance = window.tracker || tracker;
    console.log('trackerInstance exists:', !!trackerInstance);
    console.log('trackerInstance.showEnlargedPhoto exists:', !!(trackerInstance && trackerInstance.showEnlargedPhoto));

    if (trackerInstance && trackerInstance.showEnlargedPhoto) {
        console.log('Using tracker instance');
        trackerInstance.showEnlargedPhoto(photoSrc);
    } else {
        console.log('Using fallback - direct modal manipulation');
        // Fallback: directly manipulate the modal
        const modal = document.getElementById('photoModal');
        const photo = document.getElementById('enlargedPhoto');

        console.log('Modal found:', !!modal);
        console.log('Photo element found:', !!photo);

        if (modal && photo) {
            console.log('Setting photo src and showing modal');
            photo.src = photoSrc;
            modal.classList.add('active');
            modal.style.display = 'flex'; // Force display

            console.log('Modal classes after adding active:', modal.className);
            console.log('Modal style display:', modal.style.display);

            // Add close button listener if not already added
            const closeBtn = document.getElementById('closePhotoModal');
            if (closeBtn && !closeBtn.hasAttribute('data-listener-added')) {
                closeBtn.addEventListener('click', function () {
                    modal.classList.remove('active');
                    modal.style.display = 'none';
                });
                closeBtn.setAttribute('data-listener-added', 'true');
            }

            // Add click-outside-to-close functionality
            if (!modal.hasAttribute('data-listener-added')) {
                modal.addEventListener('click', function (e) {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                        modal.style.display = 'none';
                    }
                });
                modal.setAttribute('data-listener-added', 'true');
            }
        } else {
            console.error('Modal or photo element not found!');
        }
    }
    console.log('=== end showPhoto ===');
};

// Make deleteExistingPhoto globally accessible
window.deleteExistingPhoto = function (photoIndex) {
    if (tracker && tracker.deleteExistingPhoto) {
        tracker.deleteExistingPhoto(photoIndex);
    } else {
        console.error('Tracker not available for photo deletion');
    }
};




// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const gameDateInput = document.getElementById('gameDate');
    if (gameDateInput) {
        gameDateInput.value = today;
    }
});
