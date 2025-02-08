#!/bin/bash

echo "Starting deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the TypeScript project
echo "Building TypeScript..."
npm run build

# Install PM2 globally if not already installed
echo "Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Generate PM2 startup script
echo "Generating PM2 startup script..."
pm2 startup | tail -n1 | bash

# Start the bot with PM2
echo "Starting bot with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Display status
echo "Deployment complete! Showing PM2 status..."
pm2 status

echo "You can view logs with: pm2 logs trivia-bot" 