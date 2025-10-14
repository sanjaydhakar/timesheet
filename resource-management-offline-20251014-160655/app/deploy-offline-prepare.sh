#!/bin/bash

###############################################################################
# Offline Deployment Preparation Script
# Run this on a machine WITH internet access
###############################################################################

set -e

echo "=========================================="
echo "Preparing Offline Deployment Package"
echo "=========================================="

# Configuration
NODE_VERSION="18.19.0"
PACKAGE_NAME="resource-management-offline"
DEPLOY_DIR="${PACKAGE_NAME}-$(date +%Y%m%d-%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create deployment directory
echo -e "${GREEN}Creating deployment directory: ${DEPLOY_DIR}${NC}"
mkdir -p "${DEPLOY_DIR}"
cd "${DEPLOY_DIR}"

# Download Node.js
echo -e "${GREEN}Downloading Node.js ${NODE_VERSION}...${NC}"

# Use curl (macOS compatible) or wget (Linux)
if command -v curl &> /dev/null; then
    curl -LO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
elif command -v wget &> /dev/null; then
    wget "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
else
    echo -e "${RED}Neither curl nor wget found. Please install one of them:${NC}"
    echo "macOS: curl should be pre-installed"
    echo "Linux: sudo apt-get install curl"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to download Node.js${NC}"
    exit 1
fi

# Copy application files
echo -e "${GREEN}Copying application files...${NC}"
cd ..
mkdir -p "${DEPLOY_DIR}/app"

# Copy all necessary files except node_modules
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.env' \
    --exclude='*.log' \
    ./ "${DEPLOY_DIR}/app/"

cd "${DEPLOY_DIR}/app"

# Install frontend dependencies
echo -e "${GREEN}Installing frontend dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies${NC}"
    exit 1
fi

# Build frontend
echo -e "${GREEN}Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build frontend${NC}"
    exit 1
fi

# Install server dependencies
echo -e "${GREEN}Installing server dependencies...${NC}"
cd server
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install server dependencies${NC}"
    exit 1
fi

# Build server
echo -e "${GREEN}Building server...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build server${NC}"
    exit 1
fi

cd ../..

# Package node_modules
echo -e "${GREEN}Packaging dependencies...${NC}"
cd "${DEPLOY_DIR}/app"
tar czf ../frontend-node-modules.tar.gz node_modules/
cd server
tar czf ../../server-node-modules.tar.gz node_modules/
cd ../..

# Download PM2
echo -e "${GREEN}Downloading PM2 package...${NC}"
mkdir -p pm2-package
cd pm2-package
npm pack pm2
cd ..

# Create installation script
echo -e "${GREEN}Creating installation script...${NC}"
cat > install.sh << 'EOF'
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

EOF

chmod +x install.sh

# Create README
cat > README.txt << 'READMEEOF'
Offline Deployment Package for Resource Management Tool
========================================================

This package contains everything needed to deploy the application
on a server without internet access.

Contents:
---------
1. node-v*.tar.xz         - Node.js binary distribution
2. app/                   - Application source code and built files
3. frontend-node-modules.tar.gz - Frontend dependencies
4. server-node-modules.tar.gz   - Server dependencies
5. pm2-package/           - PM2 process manager
6. install.sh             - Installation script

Prerequisites on Target VM:
---------------------------
- Ubuntu 20.04 or later (or compatible Linux distribution)
- PostgreSQL (will be installed during setup if not present)
- At least 2GB RAM
- At least 10GB disk space

Installation Steps:
-------------------
1. Transfer this entire directory to your target VM:
   scp -r resource-management-offline-* user@your-vm-ip:/tmp/
   
   Or use USB/other transfer method if no network

2. On the VM, navigate to the directory:
   cd /tmp/resource-management-offline-*

3. Run the installation script with sudo:
   sudo bash install.sh

4. Follow the post-installation steps shown by the script

5. Access the application:
   http://your-vm-ip:3001

Troubleshooting:
----------------
If you encounter any issues, check the TROUBLESHOOTING.md file
in the app directory.

For database issues:
- Check PostgreSQL status: sudo systemctl status postgresql
- Check logs: tail -f /var/log/postgresql/postgresql-*.log

For application issues:
- Check PM2 logs: pm2 logs
- Check application logs in the server directory

Support:
--------
See DEPLOYMENT.md in the app directory for detailed documentation.

READMEEOF

# Create final package
cd ..
echo -e "${GREEN}Creating final package...${NC}"
tar czf "${DEPLOY_DIR}.tar.gz" "${DEPLOY_DIR}/"

echo ""
echo -e "${GREEN}=========================================="
echo "Offline Package Created Successfully!"
echo "==========================================${NC}"
echo ""
echo "Package location: ${DEPLOY_DIR}.tar.gz"
echo "Package size: $(du -h "${DEPLOY_DIR}.tar.gz" | cut -f1)"
echo ""
echo "Transfer this file to your VM using:"
echo "  scp ${DEPLOY_DIR}.tar.gz user@your-vm-ip:/tmp/"
echo ""
echo "Then on the VM:"
echo "  cd /tmp"
echo "  tar xzf ${DEPLOY_DIR}.tar.gz"
echo "  cd ${DEPLOY_DIR}"
echo "  sudo bash install.sh"
echo ""

