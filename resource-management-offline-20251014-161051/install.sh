#!/bin/bash

###############################################################################
# Offline Installation Script
# Run this on the target VM
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Installing Resource Management Tool"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Install Node.js
echo -e "${GREEN}Installing Node.js...${NC}"
if [ -f "node-v*.tar.xz" ]; then
    tar xf node-v*.tar.xz
    NODE_DIR=$(ls -d node-v*/ | head -n 1)
    mv "${NODE_DIR}" /usr/local/node
    
    # Add to PATH
    if ! grep -q "/usr/local/node/bin" /etc/profile; then
        echo 'export PATH=/usr/local/node/bin:$PATH' >> /etc/profile
    fi
    
    export PATH=/usr/local/node/bin:$PATH
    
    # Verify
    node --version
    npm --version
    
    echo -e "${GREEN}Node.js installed successfully${NC}"
else
    echo -e "${RED}Node.js package not found${NC}"
    exit 1
fi

# Install PM2
echo -e "${GREEN}Installing PM2...${NC}"
if [ -d "pm2-package" ]; then
    cd pm2-package
    npm install -g pm2-*.tgz
    cd ..
    echo -e "${GREEN}PM2 installed successfully${NC}"
else
    echo -e "${YELLOW}PM2 package not found, skipping...${NC}"
fi

# Setup application
echo -e "${GREEN}Setting up application...${NC}"
APP_DIR="/opt/resource-management"
mkdir -p "${APP_DIR}"

# Copy application files
cp -r app/* "${APP_DIR}/"

# Extract node_modules
echo -e "${GREEN}Extracting dependencies...${NC}"
cd "${APP_DIR}"
if [ -f ../frontend-node-modules.tar.gz ]; then
    tar xzf ../frontend-node-modules.tar.gz
fi

cd server
if [ -f ../../server-node-modules.tar.gz ]; then
    tar xzf ../../server-node-modules.tar.gz
fi
cd ..

# Setup environment
echo -e "${GREEN}Setting up environment...${NC}"
if [ ! -f .env ]; then
    cat > .env << ENVEOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resource_management
DB_USER=rmuser
DB_PASSWORD=your_secure_password_here

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration (generate a secure random string)
JWT_SECRET=$(openssl rand -base64 32)
ENVEOF
    echo -e "${YELLOW}Please edit ${APP_DIR}/.env with your database credentials${NC}"
fi

# Create database setup script
cat > setup_db.sh << 'DBEOF'
#!/bin/bash
sudo -u postgres psql << SQL
CREATE DATABASE resource_management;
CREATE USER rmuser WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE resource_management TO rmuser;
\q
SQL
DBEOF
chmod +x setup_db.sh

echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Install PostgreSQL:"
echo "   sudo apt-get update"
echo "   sudo apt-get install -y postgresql postgresql-contrib"
echo ""
echo "2. Setup database:"
echo "   cd ${APP_DIR}"
echo "   ./setup_db.sh"
echo ""
echo "3. Edit environment file:"
echo "   nano ${APP_DIR}/.env"
echo ""
echo "4. Run migrations:"
echo "   cd ${APP_DIR}/server"
echo "   npm run db:migrate"
echo ""
echo "5. Start the application:"
echo "   pm2 start dist/server.js --name resource-management"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "6. Setup Nginx (optional):"
echo "   See DEPLOYMENT.md for Nginx configuration"
echo ""

