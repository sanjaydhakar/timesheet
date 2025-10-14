#!/bin/bash

# Resource Management Tool - Deployment Script
# This script deploys the application to a VM/server

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="resource-management"
DEPLOY_USER="${DEPLOY_USER:-app}"
APP_DIR="/var/www/${APP_NAME}"
NODE_VERSION="18"
PM2_APP_NAME="resource-management-api"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_info "Starting deployment of Resource Management Tool..."

# Step 1: Update system packages
print_info "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Step 2: Install Node.js
print_info "Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Step 3: Install PostgreSQL
print_info "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Step 4: Install Nginx
print_info "Installing Nginx..."
apt-get install -y nginx

# Step 5: Install PM2 globally
print_info "Installing PM2 process manager..."
npm install -g pm2

# Step 6: Create application user if doesn't exist
print_info "Creating application user..."
if ! id -u $DEPLOY_USER > /dev/null 2>&1; then
    useradd -m -s /bin/bash $DEPLOY_USER
    print_info "User $DEPLOY_USER created"
else
    print_info "User $DEPLOY_USER already exists"
fi

# Step 7: Create application directory
print_info "Creating application directory..."
mkdir -p $APP_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Step 8: Setup PostgreSQL database
print_info "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE resource_management;" 2>/dev/null || print_warning "Database already exists"
sudo -u postgres psql -c "CREATE USER ${DEPLOY_USER} WITH ENCRYPTED PASSWORD 'changeme123';" 2>/dev/null || print_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE resource_management TO ${DEPLOY_USER};"
sudo -u postgres psql -c "ALTER DATABASE resource_management OWNER TO ${DEPLOY_USER};"

# Step 9: Copy application files
print_info "Copying application files..."
cp -r server/ $APP_DIR/
cp -r src/ $APP_DIR/
cp -r public/ $APP_DIR/ 2>/dev/null || true
cp package.json $APP_DIR/
cp vite.config.ts $APP_DIR/ 2>/dev/null || true
cp tailwind.config.js $APP_DIR/
cp tsconfig.json $APP_DIR/ 2>/dev/null || true
cp index.html $APP_DIR/ 2>/dev/null || true
cp postcss.config.js $APP_DIR/ 2>/dev/null || true

# Step 10: Create environment file
print_info "Creating environment configuration..."
cat > $APP_DIR/server/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resource_management
DB_USER=${DEPLOY_USER}
DB_PASSWORD=changeme123

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)

# Server Configuration
PORT=3001
NODE_ENV=production
EOF

print_warning "Please update the database password in $APP_DIR/server/.env"

# Step 11: Install dependencies and build
print_info "Installing backend dependencies..."
cd $APP_DIR/server
sudo -u $DEPLOY_USER npm install --production

print_info "Installing frontend dependencies..."
cd $APP_DIR
sudo -u $DEPLOY_USER npm install

print_info "Building frontend..."
sudo -u $DEPLOY_USER npm run build

# Step 12: Run database migrations
print_info "Running database migrations..."
cd $APP_DIR/server
sudo -u $DEPLOY_USER npm run build
sudo -u $DEPLOY_USER PGPASSWORD=changeme123 psql -U ${DEPLOY_USER} -d resource_management -f src/database/schema.sql
sudo -u $DEPLOY_USER PGPASSWORD=changeme123 psql -U ${DEPLOY_USER} -d resource_management -f src/database/add_project_dates.sql 2>/dev/null || true
sudo -u $DEPLOY_USER PGPASSWORD=changeme123 psql -U ${DEPLOY_USER} -d resource_management -f src/database/add_devs_needed.sql 2>/dev/null || true
sudo -u $DEPLOY_USER PGPASSWORD=changeme123 psql -U ${DEPLOY_USER} -d resource_management -f src/database/add_authentication.sql 2>/dev/null || true

# Step 13: Setup PM2 to run the backend
print_info "Setting up PM2 for backend..."
cd $APP_DIR/server
sudo -u $DEPLOY_USER pm2 delete $PM2_APP_NAME 2>/dev/null || true
sudo -u $DEPLOY_USER pm2 start dist/server.js --name $PM2_APP_NAME
sudo -u $DEPLOY_USER pm2 save
pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER

# Step 14: Configure Nginx
print_info "Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

    # Frontend
    location / {
        root /var/www/resource-management/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Step 15: Setup firewall
print_info "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Step 16: Set correct permissions
print_info "Setting permissions..."
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
chmod -R 755 $APP_DIR

print_info "Deployment completed successfully!"
echo ""
print_info "=== Deployment Summary ==="
print_info "Application Directory: $APP_DIR"
print_info "Backend API: http://localhost:3001"
print_info "Frontend: http://your-server-ip"
print_info "Database: resource_management"
print_info "PM2 Process: $PM2_APP_NAME"
echo ""
print_warning "IMPORTANT: Update the following:"
print_warning "1. Change database password in $APP_DIR/server/.env"
print_warning "2. Update JWT_SECRET in $APP_DIR/server/.env"
print_warning "3. Update server_name in /etc/nginx/sites-available/$APP_NAME with your domain"
print_warning "4. Consider setting up SSL with Let's Encrypt (see SSL_SETUP.md)"
echo ""
print_info "Useful commands:"
print_info "  - Check backend status: sudo -u $DEPLOY_USER pm2 status"
print_info "  - View backend logs: sudo -u $DEPLOY_USER pm2 logs $PM2_APP_NAME"
print_info "  - Restart backend: sudo -u $DEPLOY_USER pm2 restart $PM2_APP_NAME"
print_info "  - Check Nginx status: systemctl status nginx"
print_info "  - View Nginx logs: tail -f /var/log/nginx/error.log"

