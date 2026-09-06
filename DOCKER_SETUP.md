# Docker Setup Guide

This guide explains how to use Docker to run your SellIt application.

## Prerequisites

- Docker installed on your machine ([Docker Desktop](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. **Prepare Environment Variables**

Copy the example environment file and update it with your actual values:

```bash
cp .env.docker .env
```

Then edit `.env` and add your:
- `DATABASE_URL` - Your PostgreSQL/Neon connection string
- `CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- `CLERK_SECRET_KEY` - From Clerk Dashboard

### 2. **Build and Run with Docker Compose**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. **Access the Application**

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

### 4. **Stop the Services**

```bash
# Stop all services
docker-compose down

# Stop and remove all volumes (careful - removes data)
docker-compose down -v
```

## File Structure

- **backend/Dockerfile** - Multi-stage build for Node.js backend
- **frontend/Dockerfile** - Multi-stage build with Nginx for React frontend
- **frontend/nginx.conf** - Nginx configuration for SPA routing
- **docker-compose.yml** - Production compose file
- **.env.docker** - Example environment file
- **.dockerignore** - Files excluded from Docker build context

## What's Included

### Backend Docker Image
- Node.js 20 Alpine image
- Multi-stage build for smaller final image
- Production dependencies only
- Health check endpoint
- Automatic restart policy

### Frontend Docker Image
- Node.js 20 Alpine for build stage
- Nginx Alpine for serving static files
- Optimized Nginx configuration with:
  - Gzip compression
  - Long-term caching for static assets
  - SPA routing (redirects all routes to index.html)
  - Cache busting for HTML files

## Environment Variables

### Backend Required
```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost
```

### Frontend Required
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000/api
```

## Development Mode

For hot-reload development with Docker:

```bash
docker-compose up -d

# Backend will be available at http://localhost:3000
# Frontend will be available at http://localhost:5173
```

Uncomment the volume and command sections in `docker-compose.yml` for development:

```yaml
# In backend service
volumes:
  - ./backend/src:/app/src
command: npm run dev

# In frontend service  
ports:
  - "5173:5173"
command: npm run dev
```

## Building Individual Images

### Build Backend Only
```bash
docker build -f backend/Dockerfile -t sellit-backend:latest ./backend
```

### Build Frontend Only
```bash
docker build -f frontend/Dockerfile -t sellit-frontend:latest ./frontend
```

### Run Individual Containers
```bash
# Backend
docker run -p 3000:3000 --env-file .env sellit-backend:latest

# Frontend
docker run -p 80:80 sellit-frontend:latest
```

## Common Issues

### Port Already in Use
If ports 80 or 3000 are already in use:
1. Change ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:80"      # Frontend on 8080
     - "3001:3000"    # Backend on 3001
   ```
2. Update `VITE_API_URL` in environment if you change the backend port

### Database Connection Error
- Verify `DATABASE_URL` is correct and the database is accessible
- Check network connectivity to your database host
- Ensure the connection string has correct credentials

### Frontend Shows Blank Page
- Check browser console for CORS errors
- Verify `VITE_API_URL` points to the correct backend URL
- Ensure backend is running and accessible

### Environment Variables Not Loaded
- Make sure `.env` file is in the root directory
- Restart containers after changing `.env`: `docker-compose down && docker-compose up -d`
- Check with: `docker-compose exec backend env | grep CLERK`

## Production Deployment

For production, consider:

1. **Use a private Docker registry** (Docker Hub, ECR, GCR)
2. **Add security headers** to Nginx configuration
3. **Use environment-specific configs**
4. **Enable HTTPS** with reverse proxy (Nginx, Traefik)
5. **Store secrets in secure vault** (not in .env files)
6. **Monitor logs** with centralized logging
7. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## Useful Commands

```bash
# See running containers
docker ps

# Access container shell
docker exec -it sellit-backend sh

# View container logs
docker logs sellit-backend

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Clean everything (careful!)
docker system prune -a
```

## Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Node.js in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
