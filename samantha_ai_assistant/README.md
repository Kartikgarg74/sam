# Samantha AI Assistant - Monorepo

A comprehensive voice-controlled AI assistant with progressive deployment strategy: Browser Extension → MCP Server → Desktop Application.

## 🏗️ **Monorepo Structure**

```
samantha-ai-assistant/
├── apps/                          # Current Development
│   ├── chrome-extension/          # Phase 1: Browser Extension
│   ├── mcp-server/               # Phase 2: MCP Server
│   └── desktop/                  # Phase 3: Desktop Application
│
├── packages/                      # Shared Libraries
│   ├── voice-core/               # Voice processing pipeline
│   ├── ai-engine/                # AI processing engine
│   ├── command-intelligence/     # Command learning & patterns
│   ├── ui-components/            # Shared UI components
│   └── types/                    # Shared TypeScript types
│
├── legacy/                       # Legacy Components
│   ├── backend-flask/            # Old Flask backend
│   ├── frontend-legacy/          # Old frontend
│   └── backend-legacy/           # Old backend
│
├── docs/                         # Documentation
└── tools/                        # Development tools
```

## 🚀 **Development Phases**

### **Phase 1: Chrome Extension (Current)**
- Voice-controlled browser automation
- AI-powered command processing
- Chrome Web Store deployment
- **Status**: 🟡 In Development

### **Phase 2: MCP Server (Next)**
- System-level integration
- Cross-platform compatibility
- Model Context Protocol implementation
- **Status**: 🔴 Planned

### **Phase 3: Desktop Application (Future)**
- Native macOS application
- Full system automation
- Offline capabilities
- **Status**: 🔴 Planned

## 🛠️ **Quick Start**

### **Prerequisites**
```bash
node >= 18.0.0
pnpm >= 8.0.0
```

### **Installation**
```bash
# Clone the repository
git clone https://github.com/emotionai-vimukti/samantha-ai-assistant.git
cd samantha-ai-assistant

# Install dependencies
pnpm install

# Build all packages
pnpm run packages:build
```

### **Development Commands**

#### **Chrome Extension**
```bash
# Start development server
pnpm run chrome-extension:dev

# Build for production
pnpm run chrome-extension:build

# Package for Chrome Web Store
pnpm run chrome-extension:package
```

#### **MCP Server**
```bash
# Start development server
pnpm run mcp-server:dev

# Build for production
pnpm run mcp-server:build
```

#### **Desktop Application**
```bash
# Start development server
pnpm run desktop:dev

# Build for production
pnpm run desktop:build
```

#### **All Applications**
```bash
# Start all development servers
pnpm run dev

# Build all applications
pnpm run build

# Run all tests
pnpm run test

# Lint all code
pnpm run lint
```

## 📦 **Package Dependencies**

### **Chrome Extension**
- `@samantha-ai/voice-core` - Voice processing
- `@samantha-ai/ai-engine` - AI processing
- `@samantha-ai/command-intelligence` - Command learning
- `@samantha-ai/ui-components` - UI components
- `@samantha-ai/types` - Shared types

### **MCP Server**
- `@samantha-ai/voice-core` - Voice processing
- `@samantha-ai/ai-engine` - AI processing
- `@samantha-ai/command-intelligence` - Command learning
- `@samantha-ai/types` - Shared types

### **Desktop Application**
- `@samantha-ai/voice-core` - Voice processing
- `@samantha-ai/ai-engine` - AI processing
- `@samantha-ai/command-intelligence` - Command learning
- `@samantha-ai/ui-components` - UI components
- `@samantha-ai/types` - Shared types

## 🔧 **Technology Stack**

### **Current Stack**
- **Frontend**: Next.js 14 + React 18
- **Voice Processing**: Web Speech API + Whisper
- **AI Engine**: Gemini 2.5 Flash
- **Package Manager**: pnpm
- **Monorepo**: pnpm workspaces

### **Future Stack**
- **MCP Server**: Node.js + TypeScript
- **Desktop App**: Tauri (Rust + Web)
- **System Integration**: Model Context Protocol

## 📋 **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development
pnpm run chrome-extension:dev

# Build and test
pnpm run chrome-extension:build
pnpm run test
```

### **2. Package Development**
```bash
# Work on shared packages
pnpm run packages:dev

# Build packages
pnpm run packages:build
```

### **3. Testing**
```bash
# Run all tests
pnpm run test

# Run specific app tests
pnpm --filter @samantha-ai/chrome-extension test
```

## 🏛️ **Architecture**

### **Chrome Extension Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │    │ Background SW   │    │ Content Script   │
│   (React)       │◄──►│   (Voice/AI)    │◄──►│  (Page Control) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UI Components  │    │  Voice Core     │    │ Browser APIs    │
│   (Shared)      │    │   (Shared)      │    │   (Chrome)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **MCP Server Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │    │   MCP Server    │    │  System APIs    │
│   (AI Assistant)│◄──►│  (Node.js/TS)   │◄──►│  (OS Level)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  AI Engine      │    │  Voice Core     │    │ File System     │
│   (Shared)      │    │   (Shared)      │    │ Applications    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 **Roadmap**

### **Q1 2025: Chrome Extension**
- [x] Monorepo structure setup
- [x] Chrome extension foundation
- [ ] Voice processing integration
- [ ] AI command processing
- [ ] Browser automation
- [ ] Chrome Web Store submission

### **Q2 2025: MCP Server**
- [ ] MCP server foundation
- [ ] System integration
- [ ] Cross-platform support
- [ ] Security framework

### **Q3 2025: Desktop Application**
- [ ] Tauri application setup
- [ ] Native integrations
- [ ] Offline capabilities
- [ ] App Store submission

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 **Support**

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/emotionai-vimukti/samantha-ai-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/emotionai-vimukti/samantha-ai-assistant/discussions)

---

**Built with ❤️ by EmotionAI-Vimukti**
