#!/bin/bash

# Sync games.json to PostgreSQL database
# This script reads the games.json file and inserts it into the amirhessam_main.tarneeb.games table

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source .bashrc to get environment variables (works for both interactive and cron)
# Look for .bashrc in common locations
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
    echo "Sourced ~/.bashrc for environment variables"
fi

# Load configuration
CONFIG_FILE="$SCRIPT_DIR/db_config.env"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    log "Error: Configuration file not found at $CONFIG_FILE"
    log "Please create db_config.env with your database settings"
    exit 1
fi

# Verify credentials are set
if [ -z "$DATABASE_USERNAME" ] || [ -z "$DATABASE_PASSWORD" ]; then
    log "Error: DATABASE_USERNAME or DATABASE_PASSWORD not set!"
    log ""
    log "Troubleshooting:"
    log "  1. Check if ~/.bashrc contains: export DATABASE_USERNAME=... and export DATABASE_PASSWORD=..."
    log "  2. Or create $CREDENTIALS_FILE with export statements"
    log ""
    log "Current environment:"
    log "  DATABASE_USERNAME=${DATABASE_USERNAME:-NOT SET}"
    log "  DATABASE_PASSWORD=${DATABASE_PASSWORD:+SET (hidden)}${DATABASE_PASSWORD:-NOT SET}"
    exit 1
fi

# File paths
GAMES_FILE="assets/data/games.json"
FULL_GAMES_PATH="$SCRIPT_DIR/$GAMES_FILE"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if games.json exists
if [ ! -f "$FULL_GAMES_PATH" ]; then
    log "Error: games.json file not found at $FULL_GAMES_PATH"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    log "Error: psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check if jq is available for JSON processing
if ! command -v jq &> /dev/null; then
    log "Warning: jq command not found. Game count will not be displayed."
fi

# Read the JSON file and escape it for SQL
log "Reading games data from $FULL_GAMES_PATH"
JSON_DATA=$(cat "$FULL_GAMES_PATH" | sed "s/'/''/g")

# Validate JSON
if ! echo "$JSON_DATA" | jq empty 2>/dev/null; then
    log "Error: Invalid JSON format in games.json"
    exit 1
fi

# Get game count if jq is available
if command -v jq &> /dev/null; then
    GAME_COUNT=$(jq '.games | length' "$FULL_GAMES_PATH")
    log "Found $GAME_COUNT games in the file"
fi

# Create the SQL command
SQL_COMMAND="
INSERT INTO $TABLE_NAME (timestamp, games) 
VALUES (NOW(), '$JSON_DATA'::jsonb)
ON CONFLICT (timestamp) 
DO UPDATE SET games = EXCLUDED.games;
"

# Dry run mode
if [ "$DRY_RUN" = "1" ]; then
    log "DRY RUN MODE - Would execute:"
    echo "$SQL_COMMAND"
    log "Dry run completed successfully"
    exit 0
fi

# Execute the SQL command
log "Syncing games data to database..."
log "Database: $DB_NAME"
log "Table: $TABLE_NAME"
log "Username: $DATABASE_USERNAME"

# Set PGPASSWORD environment variable for password
export PGPASSWORD="$DATABASE_PASSWORD"

# Execute the command
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DATABASE_USERNAME" -d "$DB_NAME" -c "$SQL_COMMAND" 2>/dev/null; then
    log "✅ Successfully synced games data to database"
    if [ -n "$GAME_COUNT" ]; then
        log "📊 Synced $GAME_COUNT games"
    fi
else
    log "❌ Error syncing games data to database"
    log "Please check your database credentials and connection"
    exit 1
fi

# Clear the password from environment
unset PGPASSWORD

log "🔄 Sync completed successfully"