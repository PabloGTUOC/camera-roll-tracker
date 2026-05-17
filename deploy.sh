#!/bin/bash
set -e

NAS_IP="192.168.50.174"
NAS_USER="root"

echo "→ Building frontend image (linux/amd64)..."
docker build --platform linux/amd64 -f Dockerfile.frontend -t camera-roll-frontend:latest .

echo "→ Building backend image (linux/amd64)..."
docker build --platform linux/amd64 -f backend/Dockerfile -t camera-roll-backend:latest ./backend

echo "→ Saving images..."
docker save camera-roll-frontend:latest | gzip > /tmp/camera-roll-frontend.tar.gz
docker save camera-roll-backend:latest | gzip > /tmp/camera-roll-backend.tar.gz

echo "→ Transferring to NAS..."
scp /tmp/camera-roll-frontend.tar.gz $NAS_USER@$NAS_IP:/tmp/
scp /tmp/camera-roll-backend.tar.gz $NAS_USER@$NAS_IP:/tmp/

echo "→ Loading and restarting on NAS..."
ssh $NAS_USER@$NAS_IP << 'EOF'
  docker load < /tmp/camera-roll-frontend.tar.gz
  docker load < /tmp/camera-roll-backend.tar.gz
  docker stop camera-roll-frontend camera-roll-backend
  docker rm camera-roll-frontend camera-roll-backend
  docker run -d \
    --name camera-roll-backend \
    --network docker-composer-camera-roll-tracker_default \
    --restart unless-stopped \
    -e DB_HOST=camera-roll-db \
    -e DB_USER=root \
    -e DB_PASSWORD=root \
    -e DB_NAME=camera_roll_tracker \
    camera-roll-backend:latest
  docker run -d \
    --name camera-roll-frontend \
    --network docker-composer-camera-roll-tracker_default \
    --restart unless-stopped \
    -p 8081:80 \
    camera-roll-frontend:latest
  rm /tmp/camera-roll-frontend.tar.gz /tmp/camera-roll-backend.tar.gz
  echo "✓ Done"
EOF

echo "→ Cleaning up local temp files..."
rm /tmp/camera-roll-frontend.tar.gz /tmp/camera-roll-backend.tar.gz

echo "✓ Deploy complete!"
