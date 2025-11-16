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

