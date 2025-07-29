# Troubleshooting Guide

Having issues with Samantha AI? This comprehensive troubleshooting guide will help you resolve common problems and get back to voice-powered browsing quickly.

---

## 🚨 **Quick Fixes**

### **Most Common Issues**
- **Voice not working?** → [Voice Recognition Issues](#voice-recognition-issues)
- **Can't install?** → [Installation Problems](#installation-problems)
- **Extension not appearing?** → [Browser Compatibility](#browser-compatibility)
- **Slow performance?** → [Performance Issues](#performance-issues)
- **Privacy concerns?** → [Privacy & Security](#privacy--security)

---

## 🎤 **Voice Recognition Issues**

### **"Microphone not working"**

#### **Check Microphone Permissions**
1. **Chrome/Edge:**
   - Click the lock icon in the address bar
   - Ensure microphone is set to "Allow"
   - Or go to `chrome://settings/content/microphone`

2. **Firefox:**
   - Click the microphone icon in the address bar
   - Select "Allow" for microphone access
   - Or go to `about:preferences#privacy` → Permissions

3. **Safari:**
   - Go to Safari → Preferences → Websites → Microphone
   - Ensure Samantha AI is set to "Allow"

#### **Test Your Microphone**
1. **Browser Test:**
   - Go to [https://www.onlinemictest.com](https://www.onlinemictest.com)
   - Click "Test Microphone"
   - Speak and verify audio levels

2. **System Test:**
   - **Windows:** Settings → System → Sound → Test microphone
   - **macOS:** System Preferences → Sound → Input → Test
   - **Linux:** Check audio settings in your desktop environment

#### **Common Solutions**
```bash
# Reset microphone permissions
Chrome: chrome://settings/content/microphone → Reset
Firefox: about:preferences#privacy → Permissions → Reset
Safari: Safari → Preferences → Websites → Microphone → Reset
```

### **"Voice commands not recognized"**

#### **Improve Voice Recognition**
1. **Environment:**
   - Reduce background noise
   - Move closer to microphone (1-2 feet)
   - Close other applications using microphone

2. **Speech:**
   - Speak clearly and at normal pace
   - Don't rush or speak too slowly
   - Use consistent phrasing

3. **Training:**
   - Open Samantha AI settings
   - Go to "Voice Training"
   - Complete the training exercises

#### **Advanced Voice Settings**
```bash
# Access voice settings
Settings → Voice Recognition → Advanced Settings

# Adjust sensitivity
- Increase sensitivity for quiet environments
- Decrease sensitivity for noisy environments

# Language settings
- Ensure correct language is selected
- Try different accent settings if available
```

### **"Wrong commands being executed"**

#### **Improve Command Accuracy**
1. **Be More Specific:**
   - ❌ "Open email" → ✅ "Open Gmail"
   - ❌ "Search" → ✅ "Search for weather"
   - ❌ "Go there" → ✅ "Go to YouTube"

2. **Use Standard Phrases:**
   - "Open [website name]"
   - "Search for [query]"
   - "Go to [website]"

3. **Check Command History:**
   - Review what Samantha heard
   - Look for patterns in misrecognition
   - Report unrecognized commands

---

## 📦 **Installation Problems**

### **"Extension not found in store"**

#### **Alternative Installation Methods**
1. **Direct Download:**
   - Visit [GitHub Releases](https://github.com/samantha-ai/browser-extension/releases)
   - Download the latest version for your browser
   - Follow manual installation instructions

2. **Developer Mode Installation:**
   ```bash
   # Chrome/Edge
   1. Download the .crx file
   2. Go to chrome://extensions/
   3. Enable "Developer mode"
   4. Drag and drop the .crx file

   # Firefox
   1. Download the .xpi file
   2. Go to about:addons
   3. Click the gear icon → Install Add-on From File
   4. Select the .xpi file
   ```

### **"Installation failed"**

#### **Common Solutions**
1. **Clear Browser Cache:**
   ```bash
   Chrome: Ctrl+Shift+Delete → Clear browsing data
   Firefox: Ctrl+Shift+Delete → Clear recent history
   Safari: Safari → Preferences → Privacy → Manage Website Data
   ```

2. **Disable Antivirus Temporarily:**
   - Some antivirus software blocks extension installation
   - Temporarily disable real-time protection
   - Install the extension
   - Re-enable antivirus

3. **Check Browser Version:**
   - Ensure you're using a supported browser version
   - Update to the latest version if needed

### **"Extension not appearing after installation"**

#### **Troubleshooting Steps**
1. **Check Extensions List:**
   ```bash
   Chrome: chrome://extensions/
   Firefox: about:addons
   Safari: Safari → Preferences → Extensions
   ```

2. **Enable the Extension:**
   - Find Samantha AI in the extensions list
   - Toggle the switch to enable it
   - Pin it to the toolbar if needed

3. **Refresh Browser:**
   - Close and reopen the browser
   - Check if the extension appears

---

## 🌐 **Browser Compatibility**

### **"Not working on my browser"**

#### **Supported Browsers**
- ✅ **Google Chrome** (88+) - Recommended
- ✅ **Mozilla Firefox** (85+)
- ✅ **Microsoft Edge** (88+)
- ✅ **Safari** (14+) - macOS only

#### **Browser-Specific Issues**

##### **Chrome/Edge Issues**
```bash
# Reset extension data
chrome://extensions/ → Samantha AI → Details → Clear Data

# Reset permissions
chrome://extensions/ → Samantha AI → Details → Reset Permissions

# Update Chrome
chrome://settings/help → Update Google Chrome
```

##### **Firefox Issues**
```bash
# Clear extension data
about:addons → Samantha AI → Options → Clear Data

# Reset Firefox
about:support → Refresh Firefox

# Update Firefox
about:preferences → Firefox Updates
```

##### **Safari Issues**
```bash
# Reset Safari
Safari → Preferences → Privacy → Manage Website Data → Remove All

# Update Safari
App Store → Updates → Safari (if available)

# Check Extensions
Safari → Preferences → Extensions → Enable Samantha AI
```

### **"Feature not available"**

#### **Browser Feature Support**
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Voice Recognition | ✅ | ✅ | ✅ | ✅ |
| AI Responses | ✅ | ✅ | ✅ | ✅ |
| Tab Management | ✅ | ✅ | ⚠️ | ✅ |
| Analytics | ✅ | ✅ | ⚠️ | ✅ |
| Debug Mode | ✅ | ✅ | ⚠️ | ✅ |

#### **Workarounds for Limited Features**
1. **Safari Limitations:**
   - Some features may be limited due to Safari's security model
   - Use Chrome or Firefox for full functionality
   - Check Safari-specific documentation

2. **Firefox Differences:**
   - Some APIs may work differently
   - Check Firefox-specific settings
   - Report Firefox-specific issues

---

## ⚡ **Performance Issues**

### **"Samantha AI is slow"**

#### **Optimization Steps**
1. **Close Unnecessary Tabs:**
   - Reduce the number of open tabs
   - Close tabs you're not using
   - Restart browser if needed

2. **Clear Browser Data:**
   ```bash
   Chrome: Ctrl+Shift+Delete → Clear browsing data
   Firefox: Ctrl+Shift+Delete → Clear recent history
   Safari: Safari → Preferences → Privacy → Manage Website Data
   ```

3. **Disable Other Extensions:**
   - Temporarily disable other extensions
   - Test if Samantha AI works better
   - Re-enable extensions one by one

4. **Check System Resources:**
   - Monitor CPU and memory usage
   - Close unnecessary applications
   - Restart computer if needed

### **"Voice recognition is laggy"**

#### **Improve Performance**
1. **Internet Connection:**
   - Ensure stable internet connection
   - Use wired connection if possible
   - Check for network issues

2. **Browser Settings:**
   ```bash
   # Disable hardware acceleration (if causing issues)
   Chrome: chrome://settings/system → Use hardware acceleration
   Firefox: about:config → media.hardware-video-decoding
   ```

3. **Extension Settings:**
   - Reduce voice recognition sensitivity
   - Disable unnecessary features
   - Use offline mode if available

### **"AI responses are slow"**

#### **Optimization Tips**
1. **Check API Status:**
   - Verify AI service is operational
   - Check your internet connection
   - Try again in a few minutes

2. **Simplify Commands:**
   - Use shorter, clearer commands
   - Avoid complex queries
   - Break down complex tasks

3. **Cache Settings:**
   - Enable response caching
   - Clear cache if responses are outdated
   - Check cache settings in preferences

---

## 🔒 **Privacy & Security**

### **"Privacy concerns"**

#### **Data Protection**
1. **What Data is Collected:**
   - Voice commands (processed anonymously)
   - Usage analytics (optional, can be disabled)
   - Settings and preferences (stored locally)

2. **How to Control Data:**
   ```bash
   Settings → Privacy → Analytics → Disable
   Settings → Privacy → Voice Data → Clear
   Settings → Privacy → Command History → Clear
   ```

3. **Data Retention:**
   - Voice data is not stored permanently
   - Analytics data is anonymized
   - You can delete all data anytime

### **"Security warnings"**

#### **Security Measures**
1. **Extension Permissions:**
   - Microphone: Required for voice commands
   - Storage: Saves your preferences
   - Network: Connects to AI services
   - Tabs: Enables browser automation

2. **Safe Usage:**
   - Only install from official stores
   - Keep browser and extension updated
   - Don't share sensitive information via voice

3. **Report Security Issues:**
   - Email: security@samantha-ai.com
   - GitHub: [Security Issues](https://github.com/samantha-ai/browser-extension/security)
   - Responsible disclosure policy available

---

## 🛠️ **Advanced Troubleshooting**

### **Debug Mode**

#### **Enable Debug Mode**
1. **Open Settings** → "Open settings"
2. **Advanced** → "Advanced settings"
3. **Debug Mode** → Enable debug mode
4. **View Logs** → Check console for errors

#### **Common Debug Information**
```bash
# Check browser console
F12 → Console → Look for Samantha AI errors

# Check extension logs
chrome://extensions/ → Samantha AI → Details → Errors

# Check network requests
F12 → Network → Look for failed requests
```

### **Reset Samantha AI**

#### **Complete Reset**
1. **Backup Settings** (optional):
   - Export your settings before reset
   - Save custom commands

2. **Clear All Data:**
   ```bash
   Settings → Privacy → Clear All Data
   Settings → Voice Training → Reset Training
   Settings → Analytics → Clear Analytics
   ```

3. **Reinstall Extension:**
   - Uninstall Samantha AI
   - Clear browser cache
   - Reinstall from store

### **System Requirements Check**

#### **Verify Requirements**
```bash
# Check browser version
Chrome: chrome://version/
Firefox: about:support
Safari: Safari → About Safari

# Check microphone
Test microphone in browser settings

# Check internet
Test connection to AI services
```

---

## 📞 **Getting Help**

### **When to Contact Support**
- ✅ Tried all troubleshooting steps
- ✅ Issue persists across browsers
- ✅ Error messages in debug mode
- ✅ Security or privacy concerns

### **Contact Information**
- **Email:** support@samantha-ai.com
- **Discord:** [Samantha AI Community](https://discord.gg/samantha-ai)
- **GitHub:** [Report Issues](https://github.com/samantha-ai/browser-extension/issues)
- **Documentation:** [User Guide](../README.md)

### **Before Contacting Support**
1. **Gather Information:**
   - Browser version and OS
   - Error messages or screenshots
   - Steps to reproduce the issue
   - Debug mode logs

2. **Check Known Issues:**
   - [GitHub Issues](https://github.com/samantha-ai/browser-extension/issues)
   - [FAQ](./faq.md)
   - [Community Forum](https://discord.gg/samantha-ai)

---

## ✅ **Quick Reference**

### **Common Commands for Troubleshooting**
```bash
"Open settings" - Access Samantha AI settings
"Debug mode" - Enable debug mode
"Test microphone" - Test voice recognition
"Clear data" - Clear all stored data
"Reset settings" - Reset to default settings
"Report issue" - Open issue reporting
"Help" - Show help menu
```

### **Keyboard Shortcuts**
```bash
Ctrl+Shift+S - Activate voice recognition
Ctrl+Shift+O - Open voice orb
Ctrl+Shift+D - Open debug panel
Ctrl+Shift+H - Show command history
```

---

**🎯 Still having issues? Contact our support team with detailed information about your problem, and we'll help you get back to voice-powered browsing!**
