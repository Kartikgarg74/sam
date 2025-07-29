#!/bin/bash

# Samantha AI MCP Server Deployment Script
# This script automates the deployment to Railway.app

set -e

echo "🚀 Samantha AI MCP Server Deployment Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "working_mcp_server.py" ]; then
    print_error "Please run this script from the MCP server directory (samantha_ai_assistant/apps/mcp-server)"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Check if Railway CLI is installed
print_status "Checking Railway CLI installation..."
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    print_success "Railway CLI installed successfully"
else
    print_success "Railway CLI is already installed"
fi

# Step 2: Check if user is logged in
print_status "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway. Please login..."
    railway login
    print_success "Logged in to Railway successfully"
else
    print_success "Already logged in to Railway"
fi

# Step 3: Initialize Railway project if not already done
if [ ! -f ".railway" ]; then
    print_status "Initializing Railway project..."
    railway init
    print_success "Railway project initialized"
else
    print_success "Railway project already initialized"
fi

# Step 4: Set environment variables
print_status "Setting up environment variables..."

# Check if environment variables are provided
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OPENAI_API_KEY not set. Please provide it:"
    read -p "Enter your OpenAI API key: " OPENAI_API_KEY
fi

if [ -z "$ELEVENLABS_API_KEY" ]; then
    print_warning "ELEVENLABS_API_KEY not set. (Optional - press Enter to skip):"
    read -p "Enter your ElevenLabs API key (optional): " ELEVENLABS_API_KEY
fi

# Set Railway environment variables
print_status "Setting Railway environment variables..."
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"

if [ ! -z "$ELEVENLABS_API_KEY" ]; then
    railway variables set ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY"
fi

# Set default values
railway variables set MCP_SERVER_PORT="8000"
railway variables set MCP_SERVER_HOST="0.0.0.0"
railway variables set JWT_SECRET="samantha-ai-secret-key-$(date +%s)"
railway variables set CORS_ORIGINS="*"

print_success "Environment variables set successfully"

# Step 5: Deploy to Railway
print_status "Deploying to Railway..."
railway up

# Step 6: Get deployment URL
print_status "Getting deployment URL..."
DEPLOYMENT_URL=$(railway domain)

if [ ! -z "$DEPLOYMENT_URL" ]; then
    print_success "Deployment successful!"
    echo ""
    echo "🎉 Your MCP Server is now live at:"
    echo "   ${GREEN}$DEPLOYMENT_URL${NC}"
    echo ""
    echo "📊 Health Check:"
    echo "   ${BLUE}$DEPLOYMENT_URL/api/v1/monitoring/health${NC}"
    echo ""
    echo "📈 Analytics:"
    echo "   ${BLUE}$DEPLOYMENT_URL/api/v1/analytics/usage-stats${NC}"
    echo ""
    echo "🔧 Railway Dashboard:"
    echo "   ${BLUE}https://railway.app/dashboard${NC}"
    echo ""

    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -s "$DEPLOYMENT_URL/api/v1/monitoring/health" > /dev/null; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. Check Railway logs for details."
    fi

else
    print_error "Failed to get deployment URL. Check Railway logs."
    exit 1
fi

# Step 7: Show next steps
echo ""
echo "📋 Next Steps:"
echo "1. Update your VS Code/Cursor extension configuration with the new URL"
echo "2. Test the voice control features"
echo "3. Monitor usage and performance"
echo "4. Set up custom domain (optional)"
echo "5. Implement billing and monetization"
echo ""

print_success "Deployment completed successfully! 🚀"

# Optional: Set up custom domain
read -p "Would you like to set up a custom domain? (y/n): " SETUP_DOMAIN
if [ "$SETUP_DOMAIN" = "y" ] || [ "$SETUP_DOMAIN" = "Y" ]; then
    read -p "Enter your domain (e.g., mcp.yourdomain.com): " CUSTOM_DOMAIN
    if [ ! -z "$CUSTOM_DOMAIN" ]; then
        print_status "Setting up custom domain..."
        railway domain add "$CUSTOM_DOMAIN"
        print_success "Custom domain added. Please configure DNS records."
        echo "   Add CNAME record: $CUSTOM_DOMAIN -> $DEPLOYMENT_URL"
    fi
fi

echo ""
echo "🎯 Ready to monetize your MCP server!"
echo "   Check the MONETIZATION_GUIDE.md for revenue strategies"
echo ""
