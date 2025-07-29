# Multi-Browser Build System Documentation

## 🚀 **OVERVIEW**

The Samantha AI extension uses a comprehensive multi-browser build system that generates optimized builds for Chrome, Firefox, and Safari with browser-specific configurations, polyfills, and manifest transformations.

---

## 📁 **BUILD SYSTEM ARCHITECTURE**

```
build/
├── webpack.config.js          # Main webpack configuration
├── manifests/                 # Browser-specific manifests
│   ├── manifest.chrome.json   # Chrome/Edge MV3 manifest
│   ├── manifest.firefox.json  # Firefox MV2 manifest
│   └── manifest.safari.json   # Safari MV2 manifest
├── polyfills/                 # Browser compatibility polyfills
│   ├── api-polyfill.js        # chrome.* namespace for Firefox/Safari
│   ├── mv2-fallback.js        # MV3 features for MV2 browsers
│   ├── safari-fallback.js     # Safari-specific adaptations
│   └── webkit-polyfill.js     # WebKit-specific APIs
├── scripts/
│   └── build.js               # Multi-browser build script
└── tsconfig.*.json           # Browser-specific TypeScript configs
```

---

## 🛠️ **SETUP INSTRUCTIONS**

### **1. Install Dependencies**
```bash
# Install build dependencies
npm install --save-dev webpack webpack-cli webpack-dev-server
npm install --save-dev ts-loader typescript @types/node
npm install --save-dev copy-webpack-plugin clean-webpack-plugin
npm install --save-dev terser-webpack-plugin mini-css-extract-plugin
npm install --save-dev css-loader style-loader postcss-loader
npm install --save-dev archiver @types/chrome
```

### **2. Environment Setup**
```bash
# Set up environment variables
export NODE_ENV=development
export BROWSER=chrome  # chrome, firefox, safari
```

### **3. Build Configuration**
```bash
# Verify build configuration
npm run type-check:chrome
npm run type-check:firefox
npm run type-check:safari
```

---

## 🎯 **BUILD COMMANDS**

### **Development Builds**
```bash
# Development server for Chrome
npm run dev:chrome

# Development server for Firefox
npm run dev:firefox

# Development server for Safari
npm run dev:safari
```

### **Production Builds**
```bash
# Build all browsers and environments
npm run build

# Build specific browser
npm run build:chrome
npm run build:firefox
npm run build:safari

# Build production only
npm run build:prod

# Build with packages
npm run build:packages
```

### **Verification & Testing**
```bash
# Verify builds
npm run verify

# Type checking
npm run type-check
npm run type-check:chrome
npm run type-check:firefox
npm run type-check:safari

# Linting
npm run lint
npm run lint:fix
```

---

## 🌐 **BROWSER-SPECIFIC CONFIGURATIONS**

### **Chrome/Edge (MV3)**
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "scripting",
    "audioCapture"
  ]
}
```

**Features:**
- ✅ Full MV3 support
- ✅ Service worker background
- ✅ chrome.scripting API
- ✅ chrome.tabCapture API
- ✅ Modern ES2020 features

### **Firefox (MV2)**
```json
{
  "manifest_version": 2,
  "background": {
    "scripts": [
      "api-polyfill.js",
      "mv2-fallback.js",
      "background.js"
    ]
  },
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "audioCapture",
    "<all_urls>"
  ]
}
```

**Features:**
- ✅ MV2 compatibility
- ✅ browser.* namespace
- ✅ tabs.executeScript fallback
- ✅ API polyfills
- ✅ ES2018 features

### **Safari (MV2)**
```json
{
  "manifest_version": 2,
  "background": {
    "scripts": [
      "api-polyfill.js",
      "safari-fallback.js",
      "webkit-polyfill.js",
      "background.js"
    ]
  },
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "audioCapture",
    "<all_urls>"
  ]
}
```

**Features:**
- ✅ MV2 compatibility
- ✅ Safari-specific adaptations
- ✅ WebKit polyfills
- ✅ Limited service worker support
- ✅ ES2017 features

---

## 🔧 **POLYFILL SYSTEM**

### **API Polyfill (`api-polyfill.js`)**
```javascript
// Provides chrome.* namespace for Firefox/Safari
window.chrome = {
  runtime: browser.runtime,
  tabs: browser.tabs,
  storage: browser.storage,
  permissions: browser.permissions
};
```

### **MV2 Fallback (`mv2-fallback.js`)**
```javascript
// Provides MV3 features using MV2 APIs
chrome.scripting = {
  executeScript: function(options) {
    return browser.tabs.executeScript({
      tabId: options.target.tabId,
      code: options.func.toString()
    });
  }
};
```

### **Safari Fallback (`safari-fallback.js`)**
```javascript
// Safari-specific audio and API adaptations
navigator.mediaDevices.getUserMedia = function(constraints) {
  const safariConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };
  return originalGetUserMedia.call(this, safariConstraints);
};
```

### **WebKit Polyfill (`webkit-polyfill.js`)**
```javascript
// WebKit-specific API polyfills
if (typeof webkitAudioContext !== 'undefined') {
  window.AudioContext = webkitAudioContext;
}
if (typeof webkitSpeechRecognition !== 'undefined') {
  window.SpeechRecognition = webkitSpeechRecognition;
}
```

---

## 📊 **BUILD PROCESS**

### **1. Webpack Configuration**
```javascript
// Dynamic configuration based on browser
const config = webpackConfig({ BROWSER: browser }, { mode: environment });

// Browser-specific settings
const browserConfigs = {
  chrome: {
    manifestVersion: 3,
    apiNamespace: 'chrome',
    features: ['serviceWorker', 'scripting', 'tabCapture'],
    polyfills: []
  },
  firefox: {
    manifestVersion: 2,
    apiNamespace: 'browser',
    features: ['backgroundScripts', 'tabsExecuteScript'],
    polyfills: ['api-polyfill', 'mv2-fallback']
  },
  safari: {
    manifestVersion: 2,
    apiNamespace: 'browser',
    features: ['backgroundScripts', 'limitedServiceWorker'],
    polyfills: ['api-polyfill', 'safari-fallback', 'webkit-polyfill']
  }
};
```

### **2. Build Pipeline**
```bash
# 1. Clean build directory
rm -rf dist/

# 2. Build for each browser
for browser in chrome firefox safari; do
  for environment in development production; do
    webpack --config build/webpack.config.js --env BROWSER=$browser --mode $environment
  done
done

# 3. Generate build report
node build/scripts/build.js --report

# 4. Verify builds
node build/scripts/build.js --verify

# 5. Create packages
node build/scripts/build.js --package
```

### **3. Output Structure**
```
dist/
├── chrome/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   └── assets/
├── firefox/
│   ├── manifest.json
│   ├── api-polyfill.js
│   ├── mv2-fallback.js
│   ├── background.js
│   └── ...
├── safari/
│   ├── manifest.json
│   ├── api-polyfill.js
│   ├── safari-fallback.js
│   ├── webkit-polyfill.js
│   └── ...
└── build-report.json
```

---

## 🧪 **TESTING & VERIFICATION**

### **Build Verification**
```bash
# Verify all builds
npm run verify

# Expected output:
# ✅ Build verification passed: chrome-development
# ✅ Build verification passed: chrome-production
# ✅ Build verification passed: firefox-development
# ✅ Build verification passed: firefox-production
# ✅ Build verification passed: safari-development
# ✅ Build verification passed: safari-production
```

### **Type Checking**
```bash
# Check types for all browsers
npm run type-check

# Browser-specific type checking
npm run type-check:chrome
npm run type-check:firefox
npm run type-check:safari
```

### **Bundle Analysis**
```bash
# Analyze bundle sizes
npm run build:prod
# Output:
# 📦 Chrome bundle size: 245.67 KB
# 📦 Firefox bundle size: 278.34 KB
# 📦 Safari bundle size: 312.89 KB
```

---

## 🚀 **DEPLOYMENT**

### **Chrome Web Store**
```bash
# Build Chrome extension
npm run build:chrome

# Package for Chrome Web Store
cd dist/chrome
zip -r samantha-ai-chrome.zip .
```

### **Firefox Add-ons**
```bash
# Build Firefox addon
npm run build:firefox

# Package for Firefox Add-ons
cd dist/firefox
zip -r samantha-ai-firefox.zip .
```

### **Safari App Extensions**
```bash
# Build Safari extension
npm run build:safari

# Package for Safari App Extensions
cd dist/safari
zip -r samantha-ai-safari.zip .
```

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues**

#### **1. TypeScript Configuration Errors**
```bash
# Error: Parent configuration missing
# Solution: Ensure tsconfig.json exists in root
touch tsconfig.json
```

#### **2. Webpack Build Failures**
```bash
# Error: Module not found
# Solution: Check path aliases in tsconfig
npm run type-check:chrome
```

#### **3. Polyfill Loading Issues**
```bash
# Error: Polyfill not loaded
# Solution: Check browser detection
console.log('Browser:', process.env.BROWSER);
```

#### **4. Manifest Validation Errors**
```bash
# Error: Invalid manifest
# Solution: Verify browser-specific manifest
npm run verify
```

### **Debug Commands**
```bash
# Debug webpack configuration
node -e "console.log(require('./build/webpack.config.js')({BROWSER:'chrome'}, {mode:'development'}))"

# Debug build script
node build/scripts/build.js --browser chrome --env development

# Check bundle contents
ls -la dist/chrome/
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Bundle Size Optimization**
```javascript
// webpack.config.js optimizations
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      }
    }
  },
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction
        }
      }
    })
  ]
}
```

### **Development vs Production**
```bash
# Development: Fast builds, source maps, hot reload
npm run dev:chrome

# Production: Optimized bundles, minified code
npm run build:chrome
```

---

## 📚 **REFERENCES**

### **Browser Extension APIs**
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)
- [Firefox WebExtensions APIs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
- [Safari App Extensions](https://developer.apple.com/documentation/safariservices)

### **Build Tools**
- [Webpack Documentation](https://webpack.js.org/)
- [TypeScript Configuration](https://www.typescriptlang.org/docs/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)

### **Polyfill Libraries**
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)
- [WebKit Polyfills](https://webkit.org/blog/)

---

**🎉 Your multi-browser build system is now ready for production deployment across Chrome, Firefox, and Safari!**
