# Tarneeb Score Tracker

A simple web application for tracking Tarneeb card game scores with photo proof functionality.

## Features

- **User Authentication**: Simple login system (admin/admin123)
- **Score Tracking**: Add, edit, and delete game scores for 4 players
- **Photo Upload**: Upload photos as proof of each game
- **Mobile Friendly**: Responsive design that works on phones and tablets
- **Data Persistence**: All data stored locally in your browser
- **Export/Import**: Backup and restore your game data
- **Statistics**: View total games and monthly game counts

## How to Use

1. **Login**: Use username `rhc` and password `rhc`
2. **Add Games**: Click "Add New Game" to record a new Tarneeb game
3. **Upload Photos**: Take a photo of the score sheet as proof
4. **View History**: All your games are displayed with scores and photos
5. **Edit/Delete**: Click edit or delete buttons on any game card
6. **Backup Data**: Use the menu to export your data for backup

## File Structure

```
tarneeb/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── api.php             # PHP API for data management
├── assets/
│   ├── favicon.png     # Website icon
│   ├── config.json     # Admin credentials configuration
│   ├── data/
│   │   └── games.json  # Game data storage
│   └── photos/         # Uploaded game proof photos
└── README.md           # This file
```

## Deployment

To deploy this website to your host:

1. **Upload all files** to your web server
2. **Ensure all files are in the same directory**
3. **Access via your domain** (e.g., `https://yourdomain.com`)

### Requirements
- Web hosting service with PHP support (shared hosting, VPS, etc.)
- No database required (uses JSON file storage)
- PHP 7.0+ for data management

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Storage

- All data is stored in `assets/data/games.json`
- Photos are stored in `assets/photos/` directory
- Data is shared across all users (real-time updates)
- Automatic backup to localStorage for offline mode
- PHP API handles data synchronization

## Security Notes

- This is a client-side only application
- Login credentials are stored in the code (rhc/rhc)
- For production use, consider implementing proper authentication
- All data is stored locally in the browser

## Customization

You can easily customize:
- Colors in `styles.css`
- Admin credentials in `assets/config.json`
- Number of players (currently 4)
- Game scoring system

### Changing Admin Credentials

Edit `assets/config.json`:
```json
{
  "admin": {
    "username": "your_username",
    "password": "your_password"
  }
}
```

## Troubleshooting

**Can't login?**
- Make sure you're using `rhc` / `rhc`

**Data disappeared?**
- Check if you cleared browser data
- Use the export feature to backup regularly

**Photos not uploading?**
- Make sure you're using a modern browser
- Check file size (should be under 10MB)

**Mobile issues?**
- Make sure you're using a recent mobile browser
- Try refreshing the page

## Support

This is a simple web application. For issues:
1. Check browser console for errors
2. Try refreshing the page
3. Clear browser cache if needed
4. Export data before making changes

Enjoy tracking your Tarneeb games! 🃏
