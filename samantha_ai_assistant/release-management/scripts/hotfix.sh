#!/bin/bash
# hotfix.sh - Emergency hotfix deployment for critical issues
# Usage: ./hotfix.sh [description] [--skip-review] [--force]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="samantha-ai/browser-extension"
CURRENT_VERSION=$(node -p "require('./package.json').version")
SKIP_REVIEW=false
FORCE=false

# Parse arguments
HOTFIX_DESCRIPTION=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-review)
            SKIP_REVIEW=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate description
if [[ -z "$HOTFIX_DESCRIPTION" ]]; then
    echo -e "${RED}Error: Hotfix description is required${NC}"
    echo "Usage: ./hotfix.sh \"Critical security fix\" [--skip-review] [--force]"
    exit 1
fi

echo -e "${RED}🚨 EMERGENCY HOTFIX PROCESS${NC}"
echo -e "${RED}Current Version: ${CURRENT_VERSION}${NC}"
echo -e "${RED}Description: ${HOTFIX_DESCRIPTION}${NC}"
echo -e "${RED}Skip Review: ${SKIP_REVIEW}${NC}"
echo -e "${RED}Force: ${FORCE}${NC}"
echo ""

# Function to print step headers
print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

# Function to print warnings
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print errors
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Emergency hotfix confirmation
if [[ "$FORCE" != "true" ]]; then
    echo -e "${RED}⚠️  WARNING: This is an emergency hotfix process!${NC}"
    echo -e "${RED}This will:${NC}"
    echo -e "${RED}  - Bypass normal review process${NC}"
    echo -e "${RED}  - Deploy immediately to all stores${NC}"
    echo -e "${RED}  - Skip comprehensive testing${NC}"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo -e "${YELLOW}Hotfix cancelled${NC}"
        exit 0
    fi
fi

# Pre-hotfix checks
print_step "Pre-hotfix checks"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_error "Not on main branch. Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    print_error "Working directory is not clean. Please commit or stash changes."
    exit 1
fi

print_success "Pre-hotfix checks passed"

# Calculate hotfix version
print_step "Calculating hotfix version"

HOTFIX_VERSION=$(node -e "
    const semver = require('semver');
    const current = '$CURRENT_VERSION';
    const hotfix = semver.inc(current, 'patch');
    console.log(hotfix);
")

echo -e "${BLUE}Hotfix version: ${HOTFIX_VERSION}${NC}"

# Create hotfix branch
print_step "Creating hotfix branch"

git checkout -b hotfix/$HOTFIX_VERSION
print_success "Hotfix branch created"

# Update version
print_step "Updating version"

npm version patch --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")

# Update all package.json files
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" {} \;

# Update manifest files
find . -name "manifest.json" -exec sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" {} \;

print_success "Version updated to $NEW_VERSION"

# Minimal testing (critical path only)
print_step "Running critical path tests"

if [[ "$SKIP_REVIEW" != "true" ]]; then
    # Run only essential tests
    npm run test:critical

    # Quick smoke test
    npm run test:smoke

    print_success "Critical tests passed"
else
    print_warning "Tests skipped due to --skip-review flag"
fi

# Build packages
print_step "Building hotfix packages"

# Clean previous builds
rm -rf dist/ build/ packages/

# Build for all browsers
npm run build:chrome
npm run build:firefox
npm run build:safari
npm run build:edge

# Package extensions
npm run package:chrome
npm run package:firefox
npm run package:safari
npm run package:edge

print_success "Hotfix packages built"

# Generate hotfix release notes
print_step "Generating hotfix release notes"

cat > "HOTFIX_NOTES_$NEW_VERSION.md" << EOF
# Samantha AI v$NEW_VERSION - Emergency Hotfix

## 🚨 Critical Fix

$HOTFIX_DESCRIPTION

## ⚡ Immediate Deployment

This hotfix is being deployed immediately to address a critical issue.

## 📦 Installation

### Chrome/Edge
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/samantha-ai)
2. Click "Update" or "Add to Chrome"

### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/samantha-ai/)
2. Click "Update" or "Add to Firefox"

### Safari
1. Visit [App Store](https://apps.apple.com/app/samantha-ai)
2. Click "Update" in the App Store

## 🔄 Migration Notes

- **Settings Migration** - Your existing settings will be preserved
- **Command History** - Previous commands will be maintained
- **Voice Training** - Voice training data will be migrated

## 📞 Support

- **Documentation**: [docs.samantha-ai.com](https://docs.samantha-ai.com)
- **Support**: [support.samantha-ai.com](https://support.samantha-ai.com)
- **Community**: [Discord](https://discord.gg/samantha-ai)

## 🚨 Emergency Contact

If you experience any issues with this hotfix, please contact:
- **Email**: emergency@samantha-ai.com
- **Discord**: [Emergency Channel](https://discord.gg/samantha-ai)
EOF

print_success "Hotfix release notes generated"

# Deploy to stores (emergency deployment)
print_step "Emergency deployment to stores"

# Deploy to Chrome Web Store
print_step "Deploying to Chrome Web Store"
npm run deploy:chrome -- --version $NEW_VERSION --emergency

# Deploy to Firefox Add-ons
print_step "Deploying to Firefox Add-ons"
npm run deploy:firefox -- --version $NEW_VERSION --emergency

# Deploy to Safari Extensions
print_step "Deploying to Safari Extensions"
npm run deploy:safari -- --version $NEW_VERSION --emergency

# Deploy to Edge Add-ons
print_step "Deploying to Edge Add-ons"
npm run deploy:edge -- --version $NEW_VERSION --emergency

print_success "Emergency deployment completed"

# Commit and tag
print_step "Creating git tag and pushing"

# Commit changes
git add .
git commit -m "fix: emergency hotfix - $HOTFIX_DESCRIPTION"

# Create and push tag
git tag -a "v$NEW_VERSION" -m "Emergency hotfix v$NEW_VERSION - $HOTFIX_DESCRIPTION"
git push origin hotfix/$NEW_VERSION
git push origin "v$NEW_VERSION"

print_success "Git tag created and pushed"

# Create GitHub release
print_step "Creating GitHub release"

# Create GitHub release using gh CLI
gh release create "v$NEW_VERSION" \
    --title "Samantha AI v$NEW_VERSION - Emergency Hotfix" \
    --notes-file "HOTFIX_NOTES_$NEW_VERSION.md" \
    --draft=false \
    --prerelease

print_success "GitHub release created"

# Send emergency notifications
print_step "Sending emergency notifications"

# Send to Discord emergency channel
curl -H "Content-Type: application/json" \
     -d "{\"content\":\"🚨 EMERGENCY HOTFIX DEPLOYED: Samantha AI v$NEW_VERSION - $HOTFIX_DESCRIPTION - https://github.com/$REPO_NAME/releases/tag/v$NEW_VERSION\"}" \
     $DISCORD_EMERGENCY_WEBHOOK_URL

# Send email to users
if [[ -n "$EMAIL_API_KEY" ]]; then
    npm run notify:emergency -- --version $NEW_VERSION --description "$HOTFIX_DESCRIPTION"
fi

print_success "Emergency notifications sent"

# Merge to main and develop
print_step "Merging hotfix"

git checkout main
git merge hotfix/$NEW_VERSION
git push origin main

git checkout develop
git merge hotfix/$NEW_VERSION
git push origin develop

# Delete hotfix branch
git branch -d hotfix/$NEW_VERSION
git push origin --delete hotfix/$NEW_VERSION

print_success "Hotfix merged to main and develop"

# Post-hotfix cleanup
print_step "Post-hotfix cleanup"

# Remove temporary files
rm -f "HOTFIX_NOTES_$NEW_VERSION.md"

print_success "Post-hotfix cleanup completed"

# Final summary
echo ""
echo -e "${RED}🚨 Emergency hotfix completed!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Version: $CURRENT_VERSION → $NEW_VERSION"
echo -e "  Description: $HOTFIX_DESCRIPTION"
echo -e "  Emergency: TRUE"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Monitor deployment progress in stores"
echo -e "  2. Monitor error rates and user feedback"
echo -e "  3. Verify the critical issue is resolved"
echo -e "  4. Plan comprehensive testing for next release"
echo -e "  5. Document lessons learned"
echo ""

# Alert team
echo -e "${RED}⚠️  IMPORTANT: This was an emergency hotfix!${NC}"
echo -e "${RED}Please ensure:${NC}"
echo -e "${RED}  - The critical issue is actually resolved${NC}"
echo -e "${RED}  - Monitor for any new issues introduced${NC}"
echo -e "${RED}  - Plan comprehensive testing for next release${NC}"
echo -e "${RED}  - Document the incident and lessons learned${NC}"
