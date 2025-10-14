#!/bin/bash

# Resource Management Tool - Update Deployment Script
# Use this script to deploy updates to an already-configured server

set -e

# Configuration
APP_DIR="/var/www/resource-management"
DEPLOY_USER="app"
PM2_APP_NAME="resource-management-api"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_info "Starting deployment update..."

# Backup current version
print_info "Creating backup..."
BACKUP_DIR="/var/backups/resource-management-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r $APP_DIR/* $BACKUP_DIR/
print_info "Backup created at: $BACKUP_DIR"

# Pull latest code (if using git)
if [ -d "$APP_DIR/.git" ]; then
    print_info "Pulling latest code from git..."
    cd $APP_DIR
    sudo -u $DEPLOY_USER git pull origin main
else
    print_info "Not a git repository, skipping pull..."
fi

# Update backend
print_info "Updating backend..."
cd $APP_DIR/server
sudo -u $DEPLOY_USER npm install --production
sudo -u $DEPLOY_USER npm run build

# Update frontend
print_info "Updating frontend..."
cd $APP_DIR
sudo -u $DEPLOY_USER npm install
sudo -u $DEPLOY_USER npm run build

# Restart backend
print_info "Restarting backend..."
sudo -u $DEPLOY_USER pm2 restart $PM2_APP_NAME

# Reload Nginx
print_info "Reloading Nginx..."
systemctl reload nginx

print_info "Deployment update completed successfully!"
print_info "Backup location: $BACKUP_DIR"
print_info "Check status: sudo -u $DEPLOY_USER pm2 status"

