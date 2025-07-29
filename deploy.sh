#!/bin/bash

echo "🚀 Deploying Respond.io n8n nodes..."

# Clean up the n8n custom folder completely
echo "🧹 Removing and recreating n8n custom folder..."
rm -rf ~/.n8n/custom
mkdir -p ~/.n8n/custom

# Clean up any duplicate installations in nodes directory
echo "🧹 Cleaning up duplicate installations..."
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-respondio 2>/dev/null || true

# Build the project
echo "📦 Building project..."
cd /Users/Mahin/Desktop/n8n-integration
npm run build

# Create npm link from the project directory
echo "🔗 Creating npm link from project directory..."
npm link

# Unlink and relink the package in n8n custom directory
echo "🔗 Updating npm links in n8n custom directory..."
cd ~/.n8n/custom
npm init -y
npm unlink n8n-nodes-respondio 2>/dev/null || true
npm link n8n-nodes-respondio

# Restart n8n with proper shutdown
echo "🔄 Restarting n8n..."
cd /Users/Mahin/Desktop/n8n-integration

# Kill any process using port 5678
echo "🛑 Stopping n8n on port 5678..."
lsof -ti:5678 | xargs kill -9 2>/dev/null || true
sleep 2

# Wait for port to be free
while lsof -i :5678 >/dev/null 2>&1; do
    echo "⏳ Waiting for port 5678 to be free..."
    sleep 1
done

# Start n8n
n8n start &

echo "✅ Deployment complete! n8n is starting..."
echo "🌐 Open http://localhost:5678 to access n8n" 