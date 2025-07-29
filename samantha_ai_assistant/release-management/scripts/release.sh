#!/bin/bash
# release.sh - Automated release process for Samantha AI browser extension
# Usage: ./release.sh [major|minor|patch] [--dry-run] [--skip-tests]

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
DRY_RUN=false
SKIP_TESTS=false

# Parse arguments
RELEASE_TYPE=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Error: Invalid release type. Use major, minor, or patch${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Samantha AI Release Process${NC}"
echo -e "${BLUE}Current Version: ${CURRENT_VERSION}${NC}"
echo -e "${BLUE}Release Type: ${RELEASE_TYPE}${NC}"
echo -e "${BLUE}Dry Run: ${DRY_RUN}${NC}"
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

# Pre-release checks
print_step "Pre-release checks"

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    print_error "Working directory is not clean. Please commit or stash changes."
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_error "Not on main branch. Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check if remote is up to date
git fetch origin
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)
if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
    print_error "Local main is not up to date with remote"
    exit 1
fi

print_success "Pre-release checks passed"

# Calculate new version
print_step "Calculating new version"

if [[ "$DRY_RUN" == "true" ]]; then
    NEW_VERSION=$(node -e "
        const semver = require('semver');
        const current = '$CURRENT_VERSION';
        const newVersion = semver.inc(current, '$RELEASE_TYPE');
        console.log(newVersion);
    ")
    echo -e "${BLUE}New version would be: ${NEW_VERSION}${NC}"
else
    NEW_VERSION=$(npm version $RELEASE_TYPE --no-git-tag-version)
    NEW_VERSION=${NEW_VERSION#v}
    print_success "New version: $NEW_VERSION"
fi

# Update version in all package.json files
print_step "Updating version numbers"

if [[ "$DRY_RUN" != "true" ]]; then
    # Update root package.json
    npm version $RELEASE_TYPE --no-git-tag-version

    # Update package.json files in subdirectories
    find . -name "package.json" -not -path "./node_modules/*" -exec sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" {} \;

    # Update manifest files
    find . -name "manifest.json" -exec sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" {} \;

    print_success "Version numbers updated"
fi

# Generate changelog
print_step "Generating changelog"

if [[ "$DRY_RUN" != "true" ]]; then
    # Generate changelog from commits
    npx conventional-changelog-cli -i CHANGELOG.md -s -r 0

    # Add release date
    sed -i "s/## \[Unreleased\]/## [$NEW_VERSION] - $(date +%Y-%m-%d)/" CHANGELOG.md

    print_success "Changelog generated"
fi

# Run tests
if [[ "$SKIP_TESTS" != "true" ]]; then
    print_step "Running tests"

    if [[ "$DRY_RUN" != "true" ]]; then
        npm test
        npm run test:e2e
        npm run test:performance

        print_success "All tests passed"
    else
        echo -e "${BLUE}Tests would be run in production${NC}"
    fi
else
    print_warning "Tests skipped"
fi

# Build packages
print_step "Building packages"

if [[ "$DRY_RUN" != "true" ]]; then
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

    print_success "Packages built successfully"
else
    echo -e "${BLUE}Packages would be built in production${NC}"
fi

# Generate release notes
print_step "Generating release notes"

if [[ "$DRY_RUN" != "true" ]]; then
    # Extract changes from changelog
    RELEASE_NOTES=$(awk '/^## \['$NEW_VERSION'\]/,/^## \[/ {if (!/^## \[/) print}' CHANGELOG.md | head -n -1)

    # Create release notes file
    cat > "RELEASE_NOTES_$NEW_VERSION.md" << EOF
# Samantha AI v$NEW_VERSION

## 🎉 What's New

$RELEASE_NOTES

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
EOF

    print_success "Release notes generated"
else
    echo -e "${BLUE}Release notes would be generated in production${NC}"
fi

# Deploy to stores
if [[ "$DRY_RUN" != "true" ]]; then
    print_step "Deploying to stores"

    # Deploy to Chrome Web Store
    print_step "Deploying to Chrome Web Store"
    npm run deploy:chrome -- --version $NEW_VERSION

    # Deploy to Firefox Add-ons
    print_step "Deploying to Firefox Add-ons"
    npm run deploy:firefox -- --version $NEW_VERSION

    # Deploy to Safari Extensions
    print_step "Deploying to Safari Extensions"
    npm run deploy:safari -- --version $NEW_VERSION

    # Deploy to Edge Add-ons
    print_step "Deploying to Edge Add-ons"
    npm run deploy:edge -- --version $NEW_VERSION

    print_success "Deployed to all stores"
else
    echo -e "${BLUE}Deployment would occur in production${NC}"
fi

# Create git tag and push
if [[ "$DRY_RUN" != "true" ]]; then
    print_step "Creating git tag and pushing"

    # Commit changes
    git add .
    git commit -m "chore: release version $NEW_VERSION"

    # Create and push tag
    git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
    git push origin main
    git push origin "v$NEW_VERSION"

    print_success "Git tag created and pushed"
else
    echo -e "${BLUE}Git operations would occur in production${NC}"
fi

# Create GitHub release
if [[ "$DRY_RUN" != "true" ]]; then
    print_step "Creating GitHub release"

    # Create GitHub release using gh CLI
    gh release create "v$NEW_VERSION" \
        --title "Samantha AI v$NEW_VERSION" \
        --notes-file "RELEASE_NOTES_$NEW_VERSION.md" \
        --draft=false

    print_success "GitHub release created"
else
    echo -e "${BLUE}GitHub release would be created in production${NC}"
fi

# Send notifications
if [[ "$DRY_RUN" != "true" ]]; then
    print_step "Sending notifications"

    # Send to Discord
    curl -H "Content-Type: application/json" \
         -d "{\"content\":\"🎉 Samantha AI v$NEW_VERSION has been released! Check out the new features: https://github.com/$REPO_NAME/releases/tag/v$NEW_VERSION\"}" \
         $DISCORD_WEBHOOK_URL

    # Send email to users (if configured)
    if [[ -n "$EMAIL_API_KEY" ]]; then
        npm run notify:users -- --version $NEW_VERSION
    fi

    print_success "Notifications sent"
else
    echo -e "${BLUE}Notifications would be sent in production${NC}"
fi

# Post-release cleanup
if [[ "$DRY_RUN" != "true" ]]; then
    print_step "Post-release cleanup"

    # Remove temporary files
    rm -f "RELEASE_NOTES_$NEW_VERSION.md"

    # Update development branch
    git checkout develop
    git merge main
    git push origin develop

    print_success "Post-release cleanup completed"
else
    echo -e "${BLUE}Cleanup would occur in production${NC}"
fi

# Final summary
echo ""
echo -e "${GREEN}🎉 Release process completed successfully!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Version: $CURRENT_VERSION → $NEW_VERSION"
echo -e "  Type: $RELEASE_TYPE"
echo -e "  Dry Run: $DRY_RUN"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Monitor deployment progress in stores"
echo -e "  2. Check for any deployment errors"
echo -e "  3. Monitor user feedback and error rates"
echo -e "  4. Plan next release"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}This was a dry run. No actual changes were made.${NC}"
fi
