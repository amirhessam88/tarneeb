# 🃏 Tarneeb Score Tracker

> **A modern, feature-rich web application for tracking Tarneeb card game scores and statistics**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-🌐%20tarneeb.amirhessam.com-blue?style=for-the-badge)](https://tarneeb.amirhessam.com/)
[![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.info/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

## 🎯 Overview

Tarneeb Score Tracker is a comprehensive web application designed to help players track their Tarneeb card game scores, statistics, and performance over time. Built with modern web technologies, it provides an intuitive interface for managing games, players, and detailed analytics.

## ✨ Features

### 🎮 Game Management
- **📝 Add New Games**: Create games with multiple rounds and detailed scoring
- **✏️ Edit Games**: Modify existing games and update scores
- **🗑️ Delete Games**: Remove games from the system
- **📸 Photo Proof**: Upload multiple photos as game evidence
- **📅 Date Tracking**: Organize games by date with automatic sorting

### 📊 Statistics & Analytics
- **👥 Player Rankings**: Score-based rankings with color-coded top performers
- **🏆 Team Rankings**: Track team performance and statistics
- **📈 Win Rates**: Calculate and display win percentages
- **🎯 Score Tracking**: Total score accumulation across all games
- **🏅 Visual Rankings**: Gold, silver, bronze indicators for top players/teams

### 🔐 Admin Features
- **🔑 Secure Login**: Admin authentication system
- **📤 Export Data**: Download game data as JSON
- **📥 Import Data**: Restore data from JSON files
- **⚙️ Game Management**: Full CRUD operations for games

### 🎨 User Experience
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🖼️ Photo Enlargement**: Click to view full-size game photos
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations
- **⚡ Fast Performance**: Optimized for quick loading and smooth interactions

## 🚀 Live Demo

**🌐 [Visit the Live Application](https://tarneeb.amirhessam.com/)**

Experience the full functionality of the Tarneeb Score Tracker with real-time data and all features enabled.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+
- **Data Storage**: JSON files
- **Photo Management**: Multi-file upload system
- **Styling**: Custom CSS with modern design patterns

## 📦 Installation

### Prerequisites
- PHP 7.4 or higher
- Web server (Apache/Nginx) or PHP built-in server
- Modern web browser

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tarneeb.git
   cd tarneeb
   ```

2. **Start the PHP development server**
   ```bash
   php -S localhost:8001
   ```

3. **Open your browser**
   ```
   http://localhost:8001
   ```

### Production Deployment

1. **Upload files** to your web server
2. **Set permissions** for the `assets/` directory (write access for photo uploads)
3. **Configure PHP** settings for file uploads if needed
4. **Access** your domain to start using the application

## 🎮 How to Use

### 👤 For Players
1. **View Statistics**: Check your ranking and performance metrics
2. **Browse Games**: Look through recent games and scores
3. **View Photos**: Click on game photos to see full-size images

### 🔑 For Admins
1. **Login**: Use the "Admin Login" button to access admin features
2. **Add Games**: Click "Add New Game" to create new game entries
3. **Manage Data**: Use the menu to export/import data
4. **Edit Games**: Click the edit button on any game card
5. **Delete Games**: Remove games using the delete button

## 📁 Project Structure

```
tarneeb/
├── 📄 index.php              # Main application entry point
├── 📄 api.php                # Backend API endpoints
├── 📄 script.js              # Frontend JavaScript logic
├── 📄 styles.css             # Application styling
├── 📄 index.html             # HTML backup version
├── 📄 LICENSE                # License information
├── 📄 README.md              # This file
└── 📁 assets/
    ├── 📁 config/            # Secure configuration (environment variables)
    ├── 📄 games.json         # Game data storage
    ├── 🖼️ favicon.png        # Site favicon
    ├── 🖼️ slickml.png        # SlickML logo
    └── 📁 photos/            # Uploaded game photos
        └── 🖼️ *.jpg          # Game proof photos
```

## 🎯 Key Features Explained

### 🏆 Ranking System
- **Score-Based Rankings**: Players and teams are ranked by total accumulated score
- **Visual Indicators**: Top 3 players/teams get special color coding
- **Circular Rank Numbers**: Easy-to-see ranking indicators on cards

### 📸 Photo Management
- **Multiple Uploads**: Add several photos per game
- **Photo Enlargement**: Click any photo to view full size
- **Delete Photos**: Remove unwanted photos when editing games
- **Proof System**: Photos serve as evidence for game results

### 📊 Statistics Tracking
- **Win Rates**: Percentage of games won
- **Total Scores**: Cumulative score across all games
- **Game Counts**: Total games played
- **Recent Activity**: Latest games with detailed round scores

## 🔧 Configuration

### Admin Credentials
The application uses a simple authentication system. Admin credentials can be configured in the JavaScript code.

### File Upload Settings
Ensure your PHP configuration allows file uploads and has sufficient `upload_max_filesize` and `post_max_size` settings.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🐛 Report Bugs**: Found an issue? Let us know!
2. **💡 Suggest Features**: Have ideas for improvements?
3. **🔧 Submit Pull Requests**: Help us improve the code
4. **📖 Improve Documentation**: Help others understand the project

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SlickML**: Powered by SlickML for enhanced functionality
- **Community**: Thanks to all users and contributors
- **Tarneeb Players**: For inspiring this score tracking solution

## 📞 Support

- **🌐 Live Demo**: [tarneeb.amirhessam.com](https://tarneeb.amirhessam.com/)
- **📧 Issues**: Report problems via GitHub Issues
- **💬 Discussions**: Join the conversation in GitHub Discussions

---

<div align="center">

**🎮 Happy Gaming! 🃏**

*Track your Tarneeb scores like a pro!*

[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)](https://github.com/yourusername/tarneeb)

</div>
