# Deployment Troubleshooting Guide

## Common Deployment Issues

### 0. Network Connectivity Issues (CRITICAL)

**Error:**
```bash
npm ERR! code ETIMEDOUT
npm ERR! syscall connect
npm ERR! errno ETIMEDOUT
npm ERR! network request to https://registry.npmjs.org/pm2 failed
npm ERR! network This is a problem related to network connectivity.
```

**This is the most critical issue - the deployment script requires internet access.**

#### Immediate Checks:

**1. Test basic connectivity:**
```bash
# Test internet connection
ping -c 3 8.8.8.8

# Test DNS resolution
ping -c 3 google.com

# Test npm registry
curl -I https://registry.npmjs.org

# Test NodeSource
curl -I https://deb.nodesource.com
```

**2. Check firewall rules:**
```bash
# Check if UFW is blocking
sudo ufw status

# Check iptables
sudo iptables -L

# Temporarily disable UFW (for testing only)
sudo ufw disable
```

**3. Check proxy settings:**
```bash
# Check environment proxy
echo $HTTP_PROXY
echo $HTTPS_PROXY
echo $NO_PROXY

# Check npm proxy config
npm config get proxy
npm config get https-proxy
```

#### Solutions:

**Option A: Fix Network Connectivity (RECOMMENDED)**

If you're behind a corporate proxy:
```bash
# Set npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or with authentication
npm config set proxy http://username:password@proxy.company.com:8080
npm config set https-proxy http://username:password@proxy.company.com:8080

# Set no-proxy for local addresses
npm config set no-proxy localhost,127.0.0.1
```

If your VM has restricted outbound access:
- Contact your network administrator to allow outbound HTTPS (443) to:
  - `registry.npmjs.org`
  - `deb.nodesource.com`
  - `github.com` (if using git)
  - `raw.githubusercontent.com`

**Option B: Manual Offline Deployment**

If network access cannot be enabled, you'll need to prepare packages offline:

**Step 1: On a machine WITH internet access:**
```bash
# Create deployment package directory
mkdir offline-deploy
cd offline-deploy

# Download Node.js binary (adjust for your OS/architecture)
wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz

# Download your application dependencies
git clone https://github.com/your-repo/timesheet-cursor.git
cd timesheet-cursor

# Install and package dependencies
npm install
tar czf node_modules.tar.gz node_modules/

cd server
npm install
tar czf node_modules.tar.gz node_modules/

# Package everything
cd ../..
tar czf deployment-package.tar.gz timesheet-cursor/
```

**Step 2: Transfer to VM (using SCP, USB, or other means):**
```bash
# From your local machine
scp deployment-package.tar.gz user@your-vm-ip:/home/user/
```

**Step 3: On the VM (manual installation):**
```bash
# Extract package
tar xzf deployment-package.tar.gz
cd timesheet-cursor

# Install Node.js manually
cd /tmp
tar xf node-v18.19.0-linux-x64.tar.xz
sudo mv node-v18.19.0-linux-x64 /usr/local/node
echo 'export PATH=/usr/local/node/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Verify
node --version
npm --version

# Install PM2 globally (from cache if available)
npm install -g pm2

# Setup PostgreSQL (if not already installed)
sudo apt-get install postgresql postgresql-contrib

# Setup the application
cd /path/to/timesheet-cursor
# node_modules should already be extracted

# Setup database
sudo -u postgres psql << EOF
CREATE DATABASE resource_management;
CREATE USER rmuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE resource_management TO rmuser;
EOF

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
cd server
npm run build
npm run db:migrate

# Start with PM2
pm2 start dist/server.js --name resource-management
pm2 save
pm2 startup

# Setup Nginx manually
# (copy nginx config from DEPLOYMENT.md)
```

**Option C: Use Different Package Registry**

If npm registry is blocked but you have access to other mirrors:
```bash
# Use a different registry (e.g., Alibaba mirror in China)
npm config set registry https://registry.npmmirror.com

# Or Yarn registry
npm config set registry https://registry.yarnpkg.com

# Reset to default
npm config set registry https://registry.npmjs.org
```

**Option D: Docker Deployment (if Docker is available)**

Create a `Dockerfile` and build the image on a machine with internet, then transfer:
```bash
# On machine with internet
docker build -t resource-management .
docker save resource-management > resource-management.tar

# Transfer to VM
scp resource-management.tar user@vm:/tmp/

# On VM
docker load < /tmp/resource-management.tar
docker run -d -p 3001:3001 resource-management
```

#### Debug Network Issues:

```bash
# Check if specific ports are blocked
nc -zv registry.npmjs.org 443

# Test with verbose curl
curl -v https://registry.npmjs.org/pm2

# Check DNS resolution
nslookup registry.npmjs.org

# Check routing
traceroute registry.npmjs.org

# Check if SELinux is blocking (RHEL/CentOS)
getenforce
# If enforcing, try:
sudo setenforce 0
```

---

### 1. Node.js Installation Fails

**Error:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
# Permission denied or command fails
```

**Solutions:**

**Option A: Run script with sudo**
```bash
sudo ./deploy.sh
```

**Option B: Manual Node.js installation**
```bash
# Download and run setup script
curl -fsSL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Option C: Use NVM (Node Version Manager)**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18
nvm alias default 18
```

### 2. Permission Denied Errors

**Error:**
```bash
./deploy.sh: Permission denied
```

**Solution:**
```bash
# Make script executable
chmod +x deploy.sh

# Run with sudo
sudo ./deploy.sh
```

### 3. PostgreSQL Connection Issues

**Error:**
```
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed
```

**Solutions:**

**Check PostgreSQL status:**
```bash
sudo systemctl status postgresql
```

**Start PostgreSQL:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Check if port is in use:**
```bash
sudo lsof -i :5432
```

**Reset PostgreSQL password:**
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
\q
```

### 4. Database Creation Fails

**Error:**
```
ERROR:  database "resource_management" already exists
```

**Solution:**
```bash
# Drop and recreate database (WARNING: This deletes all data!)
sudo -u postgres psql -c "DROP DATABASE resource_management;"
sudo -u postgres psql -c "CREATE DATABASE resource_management;"
```

**Or skip if already exists:**
```bash
# Check if database exists
sudo -u postgres psql -l | grep resource_management
```

### 5. Port 3001 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

**Find process using port:**
```bash
sudo lsof -i :3001
```

**Kill the process:**
```bash
sudo kill -9 <PID>
```

**Or use a different port:**
Edit `server/.env`:
```bash
PORT=3002
```

### 6. Nginx Configuration Error

**Error:**
```
nginx: [emerg] unknown directive "proxy_pass"
```

**Solution:**
```bash
# Test Nginx configuration
sudo nginx -t

# If syntax error, check the config file
sudo nano /etc/nginx/sites-available/resource-management

# Reload after fixing
sudo systemctl reload nginx
```

### 7. 502 Bad Gateway

**Causes:**
- Backend not running
- Wrong port in Nginx config
- Firewall blocking connection

**Solutions:**

**Check backend status:**
```bash
sudo -u app pm2 status
sudo -u app pm2 logs resource-management-api
```

**Restart backend:**
```bash
sudo -u app pm2 restart resource-management-api
```

**Check if backend is listening:**
```bash
curl http://localhost:3001/health
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

### 8. Frontend Build Fails

**Error:**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Solutions:**

**Clear cache and rebuild:**
```bash
cd /var/www/resource-management
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

**Check Node.js version:**
```bash
node --version  # Should be 18 or higher
```

**Check memory:**
```bash
free -h  # Ensure enough RAM available
```

### 9. Database Migration Fails

**Error:**
```
ERROR:  relation "users" already exists
```

**Solution:**
```bash
# Check which migrations have run
sudo -u postgres psql -d resource_management -c "\dt"

# Run specific migration
cd /var/www/resource-management/server
sudo -u app npm run build

# Run migrations one by one
psql -U app -d resource_management -f src/database/schema.sql
psql -U app -d resource_management -f src/database/add_authentication.sql
```

### 10. PM2 Command Not Found

**Error:**
```
pm2: command not found
```

**Solution:**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Or use npx
npx pm2 start server.js
```

### 11. Cannot Connect to Database

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

**Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

**Check connection settings:**
```bash
cat /var/www/resource-management/server/.env
```

**Test connection:**
```bash
psql -U app -d resource_management -h localhost
```

**Check pg_hba.conf:**
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Ensure this line exists:
# local   all   all   peer
```

### 12. Firewall Blocking Connections

**Error:**
Cannot access application from browser

**Solutions:**

**Check firewall status:**
```bash
sudo ufw status
```

**Open required ports:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

**Check if port is listening:**
```bash
sudo netstat -tlnp | grep :80
```

### 13. SSL Certificate Issues

**Error:**
```
certbot: command not found
```

**Solution:**
```bash
# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### 14. Out of Memory During Build

**Error:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Then run build
npm run build
```

### 15. Git Pull Fails

**Error:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Solutions:**

**Option A: Stash changes**
```bash
git stash
git pull
git stash pop
```

**Option B: Discard local changes**
```bash
git reset --hard
git pull
```

**Option C: Create backup and force pull**
```bash
cp -r /var/www/resource-management /var/backups/backup-$(date +%Y%m%d)
git fetch --all
git reset --hard origin/main
```

## Verification Commands

### Check All Services
```bash
# PostgreSQL
sudo systemctl status postgresql

# Nginx
sudo systemctl status nginx

# Backend (PM2)
sudo -u app pm2 status

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|3001|5432)'
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Frontend
curl http://localhost

# API
curl http://localhost:3001/api/auth/me
```

### View All Logs
```bash
# Backend
sudo -u app pm2 logs resource-management-api --lines 50

# Nginx access
sudo tail -f /var/log/nginx/access.log

# Nginx errors
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

## Clean Reinstall

If all else fails, here's how to do a clean reinstall:

```bash
# Stop all services
sudo -u app pm2 delete all
sudo systemctl stop nginx

# Backup database
pg_dump -U app resource_management > backup.sql

# Remove application
sudo rm -rf /var/www/resource-management

# Drop database
sudo -u postgres psql -c "DROP DATABASE resource_management;"

# Rerun deployment
sudo ./deploy.sh

# Restore data if needed
psql -U app resource_management < backup.sql
```

## Getting Help

### Collect Debug Information
```bash
# System info
uname -a
cat /etc/os-release

# Node.js version
node --version
npm --version

# PostgreSQL version
psql --version

# Nginx version
nginx -v

# Check services
sudo systemctl status postgresql nginx

# PM2 status
sudo -u app pm2 status

# Disk space
df -h

# Memory
free -h

# Recent errors
sudo journalctl -xe
```

### Log Collection Script
```bash
#!/bin/bash
# Save to debug-info.sh

mkdir -p debug-logs
sudo -u app pm2 logs --lines 100 > debug-logs/pm2.log
sudo tail -100 /var/log/nginx/error.log > debug-logs/nginx-error.log
sudo tail -100 /var/log/nginx/access.log > debug-logs/nginx-access.log
cat /var/www/resource-management/server/.env | grep -v PASSWORD > debug-logs/env.log
sudo systemctl status postgresql nginx > debug-logs/services.log
tar -czf debug-$(date +%Y%m%d).tar.gz debug-logs/
echo "Debug info saved to debug-$(date +%Y%m%d).tar.gz"
```

## Contact Support

If you're still having issues:
1. Run the debug info script above
2. Check GitHub issues
3. Provide error messages and logs
4. Include system information

---

**Last Updated**: October 14, 2025

