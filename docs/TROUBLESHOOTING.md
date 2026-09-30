# Troubleshooting Guide

### 1. Port 3000 Already in Use
If port 3000 is occupied by another process:
```bash
# On Linux/macOS:
lsof -i :3000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 2. Node Version Incompatibility
Ensure Node.js is v18 or later:
```bash
node -v
```
If using `nvm`, switch to an active LTS:
```bash
nvm use 20
```

### 3. Re-seeding Database State
If you wish to reset in-memory decisions and analyses:
```bash
npm run seed
```

### 4. Build Issues
If `npm run build` encounters cache issues:
```bash
npm run clean
npm run build
```
