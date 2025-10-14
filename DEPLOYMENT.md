# Deployment Guide - Resource Management Tool

This guide explains how to deploy the Resource Management Tool to a VM or server.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or later (Debian-based)
- **RAM**: Minimum 2GB, recommended 4GB
- **Storage**: Minimum 10GB free space
- **CPU**: 2 cores recommended
- **Network**: Public IP or domain name

### Local Requirements
- SSH access to the server
- Git installed
- Basic Linux command knowledge

## 🚀 Quick Deployment

### Option 1: Automated Deployment Script

1. **Clone repository on your local machine**
   ```bash
   git clone <your-repo-url>
   cd timesheet-cursor
   ```

2. **Copy files to server**
   ```bash
   # Replace with your server IP/hostname
   SERVER_IP="your-server-ip"
   
   scp -r * root@$SERVER_IP:/tmp/app-deploy/
   ```

3. **SSH into server and run deployment**
   ```bash
   ssh root@$SERVER_IP
   cd /tmp/app-deploy
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Access your application**
   - Frontend: `http://your-server-ip`
   - Backend API: `http://your-server-ip/api`

### Option 2: Manual Deployment

See detailed steps below for manual deployment.

## 🔧 Manual Deployment Steps

### 1. Update System
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PostgreSQL
```bash
sudo apt-get install -y postgresql postgresql-contrib
```

### 4. Install Nginx
```bash
sudo apt-get install -y nginx
```

### 5. Install PM2
```bash
sudo npm install -g pm2
```

### 6. Setup Database
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE resource_management;
CREATE USER appuser WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE resource_management TO appuser;
ALTER DATABASE resource_management OWNER TO appuser;
\q
```

### 7. Create Application Directory
```bash
sudo mkdir -p /var/www/resource-management
sudo useradd -m -s /bin/bash appuser
sudo chown -R appuser:appuser /var/www/resource-management
```

### 8. Copy Application Files
```bash
cd /var/www/resource-management
# Upload your files here using SCP, Git, or other method
```

### 9. Configure Environment Variables
```bash
# Backend environment
cat > server/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resource_management
DB_USER=appuser
DB_PASSWORD=your-secure-password
JWT_SECRET=$(openssl rand -base64 32)
PORT=3001
NODE_ENV=production
EOF
```

### 10. Install Dependencies
```bash
# Backend
cd server
npm install --production
npm run build

# Frontend
cd ..
npm install
npm run build
```

### 11. Run Database Migrations
```bash
cd server
psql -U appuser -d resource_management -f src/database/schema.sql
psql -U appuser -d resource_management -f src/database/add_project_dates.sql
psql -U appuser -d resource_management -f src/database/add_devs_needed.sql
psql -U appuser -d resource_management -f src/database/add_authentication.sql
```

### 12. Start Backend with PM2
```bash
cd /var/www/resource-management/server
sudo -u appuser pm2 start dist/server.js --name resource-management-api
sudo -u appuser pm2 save
sudo pm2 startup systemd -u appuser --hp /home/appuser
```

### 13. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/resource-management
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Frontend
    location / {
        root /var/www/resource-management/dist;
        try_files $uri $uri/ /index.html;
        
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
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/resource-management /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 14. Setup Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔐 SSL Setup (HTTPS)

### Using Let's Encrypt (Certbot)

1. **Install Certbot**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```

2. **Get SSL Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

## 🔄 Updates and Maintenance

### Deploy New Version
```bash
cd /var/www/resource-management

# Pull latest code
git pull origin main

# Update backend
cd server
npm install --production
npm run build
sudo -u appuser pm2 restart resource-management-api

# Update frontend
cd ..
npm install
npm run build

# Restart Nginx
sudo systemctl reload nginx
```

### Backup Database
```bash
# Create backup
pg_dump -U appuser resource_management > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U appuser resource_management < backup_20250101.sql
```

### View Logs
```bash
# Backend logs
sudo -u appuser pm2 logs resource-management-api

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Monitor Application
```bash
# PM2 monitoring
sudo -u appuser pm2 monit

# Check status
sudo -u appuser pm2 status

# System resources
htop
```

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check PM2 logs
sudo -u appuser pm2 logs resource-management-api --lines 100

# Check if port is in use
sudo lsof -i :3001

# Restart backend
sudo -u appuser pm2 restart resource-management-api
```

### Database Connection Issues
```bash
# Test database connection
psql -U appuser -d resource_management -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R appuser:appuser /var/www/resource-management

# Fix permissions
sudo chmod -R 755 /var/www/resource-management
```

## 📊 Performance Optimization

### Enable Gzip Compression
Add to Nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### Enable PM2 Cluster Mode
```bash
sudo -u appuser pm2 delete resource-management-api
sudo -u appuser pm2 start dist/server.js --name resource-management-api -i max
sudo -u appuser pm2 save
```

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_allocations_developer_dates ON allocations(developer_id, start_date, end_date);
CREATE INDEX idx_allocations_project_dates ON allocations(project_id, start_date, end_date);
CREATE INDEX idx_developers_user ON developers(user_id);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
```

## 🔒 Security Checklist

- [ ] Change default database password
- [ ] Set strong JWT_SECRET
- [ ] Enable firewall (UFW)
- [ ] Setup SSL/HTTPS
- [ ] Regular security updates: `sudo apt-get update && sudo apt-get upgrade`
- [ ] Setup fail2ban for SSH protection
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] Use environment variables for sensitive data
- [ ] Disable directory listing in Nginx

## 📝 Environment Variables Reference

### Backend (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resource_management
DB_USER=appuser
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-random-secret-key

# Server
PORT=3001
NODE_ENV=production
```

## 🆘 Support

### Common Issues
1. **502 Bad Gateway**: Backend not running, check PM2 status
2. **Database Connection Failed**: Check credentials in .env
3. **CORS Errors**: Check backend CORS configuration
4. **Build Failures**: Ensure Node.js version 18+

### Helpful Commands
```bash
# Restart everything
sudo -u appuser pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Check all services
sudo -u appuser pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View all logs
sudo -u appuser pm2 logs --lines 50
sudo tail -f /var/log/nginx/error.log
```

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Last Updated**: October 14, 2025

