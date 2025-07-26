# Samantha AI Development Guide

## 🏗️ **Monorepo Architecture**

This monorepo follows a progressive development strategy with clear separation between current, legacy, and future components.

### **📁 Directory Structure**

```
samantha-ai-assistant/
├── apps/                          # 🟢 CURRENT DEVELOPMENT
│   ├── chrome-extension/          # Phase 1: Browser Extension
│   ├── mcp-server/               # Phase 2: MCP Server
│   └── desktop/                  # Phase 3: Desktop Application
│
├── packages/                      # 🔵 SHARED LIBRARIES
│   ├── voice-core/               # Voice processing pipeline
│   ├── ai-engine/                # AI processing engine
│   ├── command-intelligence/     # Command learning & patterns
│   ├── ui-components/            # Shared UI components
│   └── types/                    # Shared TypeScript types
│
├── legacy/                       # 🔴 LEGACY COMPONENTS
│   ├── backend-flask/            # Old Flask backend
│   ├── frontend-legacy/          # Old frontend
│   └── backend-legacy/           # Old backend
│
├── docs/                         # 📚 Documentation
└── tools/                        # 🛠️ Development tools
```

## 🚀 **Getting Started**

### **1. Environment Setup**
```bash
# Prerequisites
node >= 18.0.0
pnpm >= 8.0.0

# Clone and install
git clone <repository>
cd samantha-ai-assistant
pnpm install
```

### **2. Build Shared Packages**
```bash
# Build all shared packages first
pnpm run packages:build

# Or build individual packages
pnpm --filter @samantha-ai/voice-core build
pnpm --filter @samantha-ai/ai-engine build
pnpm --filter @samantha-ai/command-intelligence build
pnpm --filter @samantha-ai/ui-components build
pnpm --filter @samantha-ai/types build
```

### **3. Start Development**
```bash
# Chrome Extension (Current Focus)
pnpm run chrome-extension:dev

# MCP Server (Future)
pnpm run mcp-server:dev

# Desktop App (Future)
pnpm run desktop:dev

# All applications
pnpm run dev
```

## 🔧 **Development Workflows**

### **Chrome Extension Development**

#### **File Structure**
```
apps/chrome-extension/
├── manifest.json          # Chrome extension config
├── background.js          # Service worker
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── src/                  # Next.js app
│   ├── app/             # App router
│   ├── components/      # React components
│   └── types/          # TypeScript types
└── public/              # Static assets
```

#### **Development Commands**
```bash
# Start development server
pnpm run chrome-extension:dev

# Build for production
pnpm run chrome-extension:build

# Package for Chrome Web Store
pnpm run chrome-extension:package

# Test in Chrome
# 1. Open Chrome
# 2. Go to chrome://extensions/
# 3. Enable "Developer mode"
# 4. Click "Load unpacked"
# 5. Select apps/chrome-extension/.next/
```

### **MCP Server Development**

#### **File Structure**
```
apps/mcp-server/
├── src/
│   ├── index.ts         # Server entry point
│   ├── mcp/            # MCP protocol handlers
│   ├── services/       # Business logic
│   └── types/          # TypeScript types
├── dist/               # Built files
└── tests/              # Test files
```

#### **Development Commands**
```bash
# Start development server
pnpm run mcp-server:dev

# Build for production
pnpm run mcp-server:build

# Run tests
pnpm --filter @samantha-ai/mcp-server test
```

### **Desktop Application Development**

#### **File Structure**
```
apps/desktop/
├── src/
│   ├── main.tsx        # React entry point
│   ├── components/     # React components
│   └── types/          # TypeScript types
├── src-tauri/          # Tauri configuration
│   ├── src/           # Rust backend
│   └── tauri.conf.json # Tauri config
└── dist/               # Built files
```

#### **Development Commands**
```bash
# Start development server
pnpm run desktop:dev

# Build for production
pnpm run desktop:build

# Preview without Tauri
pnpm run desktop:preview
```

## 📦 **Package Development**

### **Shared Packages**

All shared packages follow the same structure:

```
packages/[package-name]/
├── src/
│   ├── index.ts        # Main export
│   ├── [feature].ts    # Feature modules
│   └── types.ts        # TypeScript types
├── dist/               # Built files
├── tests/              # Test files
└── package.json        # Package config
```

### **Package Development Commands**
```bash
# Build package
pnpm --filter @samantha-ai/[package-name] build

# Watch for changes
pnpm --filter @samantha-ai/[package-name] dev

# Run tests
pnpm --filter @samantha-ai/[package-name] test

# Lint code
pnpm --filter @samantha-ai/[package-name] lint
```

### **Adding Dependencies**

#### **To an Application**
```bash
# Add to chrome extension
pnpm --filter @samantha-ai/chrome-extension add [package]

# Add to mcp server
pnpm --filter @samantha-ai/mcp-server add [package]

# Add to desktop app
pnpm --filter @samantha-ai/desktop add [package]
```

#### **To a Shared Package**
```bash
# Add to voice-core
pnpm --filter @samantha-ai/voice-core add [package]

# Add to ai-engine
pnpm --filter @samantha-ai/ai-engine add [package]
```

#### **Between Packages**
```bash
# Add shared package to app
pnpm --filter @samantha-ai/chrome-extension add @samantha-ai/voice-core

# Add shared package to another package
pnpm --filter @samantha-ai/ai-engine add @samantha-ai/types
```

## 🧪 **Testing**

### **Running Tests**
```bash
# All tests
pnpm run test

# Specific app tests
pnpm --filter @samantha-ai/chrome-extension test
pnpm --filter @samantha-ai/mcp-server test
pnpm --filter @samantha-ai/desktop test

# Specific package tests
pnpm --filter @samantha-ai/voice-core test
pnpm --filter @samantha-ai/ai-engine test
```

### **Test Structure**
```
[app|package]/
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
└── jest.config.js     # Jest configuration
```

## 🔍 **Linting & Code Quality**

### **Linting Commands**
```bash
# Lint all code
pnpm run lint

# Lint specific app
pnpm --filter @samantha-ai/chrome-extension lint

# Lint specific package
pnpm --filter @samantha-ai/voice-core lint
```

### **ESLint Configuration**
Each package has its own ESLint configuration:
- **Apps**: React + TypeScript rules
- **Packages**: TypeScript rules
- **Shared**: Common rules in root

## 🚀 **Deployment**

### **Chrome Extension**
```bash
# Build extension
pnpm run chrome-extension:build

# Package for Chrome Web Store
pnpm run chrome-extension:package

# Upload to Chrome Web Store
# 1. Go to Chrome Web Store Developer Dashboard
# 2. Upload samantha-ai-extension.zip
# 3. Fill in store details
# 4. Submit for review
```

### **MCP Server**
```bash
# Build server
pnpm run mcp-server:build

# Deploy to Railway
railway up

# Deploy to other platforms
# - Vercel (with custom build)
# - DigitalOcean App Platform
# - AWS Lambda
```

### **Desktop Application**
```bash
# Build application
pnpm run desktop:build

# Package for distribution
# - macOS: .app bundle
# - Windows: .msi installer
# - Linux: .deb/.rpm packages
```

## 🔄 **Migration from Legacy**

### **Legacy Components**
- `legacy/backend-flask/` - Old Flask backend
- `legacy/frontend-legacy/` - Old frontend
- `legacy/backend-legacy/` - Old backend

### **Migration Strategy**
1. **Phase 1**: Chrome Extension (Current)
   - Focus on browser automation
   - Use existing voice processing
   - Deploy to Chrome Web Store

2. **Phase 2**: MCP Server (Next)
   - System-level integration
   - Cross-platform support
   - Replace legacy backends

3. **Phase 3**: Desktop Application (Future)
   - Native macOS app
   - Full system automation
   - Replace all legacy components

### **Code Migration**
```bash
# Extract useful code from legacy
cp legacy/backend-flask/services/ai_service.py apps/mcp-server/src/services/
cp legacy/frontend-legacy/src/components/ apps/chrome-extension/src/components/
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Build Errors**
```bash
# Clean all builds
pnpm run clean

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild packages
pnpm run packages:build
```

#### **Dependency Issues**
```bash
# Update lockfile
pnpm install --force

# Clear cache
pnpm store prune
```

#### **TypeScript Errors**
```bash
# Check types
pnpm run type-check

# Build with type checking
pnpm run build --type-check
```

### **Debug Commands**
```bash
# Show workspace info
pnpm list --depth=0

# Show package dependencies
pnpm why [package-name]

# Check for circular dependencies
pnpm list --depth=999
```

## 📚 **Resources**

### **Documentation**
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Tauri Documentation](https://tauri.app/docs/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

### **Development Tools**
- **VS Code Extensions**: TypeScript, ESLint, Prettier
- **Chrome DevTools**: Extension debugging
- **Tauri CLI**: Desktop app development
- **MCP SDK**: Server development

---

**Happy Coding! 🚀**
