# Error Handling & Recovery Documentation

## Overview

The Samantha AI browser extension implements a comprehensive error handling system designed to provide robust error recovery, user feedback, and debugging capabilities across all components.

## Architecture

### Core Components

1. **ErrorHandler** (`/src/app/utils/errorHandler.ts`)
   - Central error management system
   - Error categorization and logging
   - Recovery strategy execution
   - User feedback generation

2. **ApiClient** (`/src/app/utils/apiClient.ts`)
   - Network request error handling
   - Retry logic with exponential backoff
   - Timeout management
   - Caching and fallback mechanisms

3. **StorageManager** (`/src/app/utils/storageManager.ts`)
   - Storage error handling
   - Data validation and corruption detection
   - Fallback storage mechanisms
   - Quota management

4. **DebugPanel** (`/src/app/components/DebugPanel.tsx`)
   - Real-time error monitoring
   - System information display
   - Error testing interface
   - Recovery mechanism testing

## Error Types

### Voice Processing Errors

| Error Type | Description | Recovery Strategy |
|------------|-------------|-------------------|
| `SPEECH_RECOGNITION_NOT_SUPPORTED` | Browser doesn't support speech recognition | Fallback to text input |
| `SPEECH_RECOGNITION_ERROR` | General speech recognition failure | Retry (2 attempts) |
| `SPEECH_RECOGNITION_TIMEOUT` | Speech recognition timed out | Retry (1 attempt) |
| `SPEECH_RECOGNITION_NO_SPEECH` | No speech detected | User feedback only |
| `SPEECH_RECOGNITION_AUDIO_CAPTURE` | Microphone access denied | User guidance |
| `SPEECH_RECOGNITION_NETWORK` | Network error during recognition | Retry (2 attempts) |
| `SPEECH_RECOGNITION_ABORTED` | Recognition was cancelled | No recovery needed |

### Network Errors

| Error Type | Description | Recovery Strategy |
|------------|-------------|-------------------|
| `NETWORK_TIMEOUT` | Request timed out | Retry (3 attempts) |
| `NETWORK_OFFLINE` | No internet connection | Graceful degradation |
| `NETWORK_CORS` | CORS policy violation | User notification |
| `NETWORK_404` | Resource not found | User notification |
| `NETWORK_500` | Server error | Retry (3 attempts) |
| `NETWORK_UNKNOWN` | Unknown network error | Retry (2 attempts) |

### API Errors

| Error Type | Description | Recovery Strategy |
|------------|-------------|-------------------|
| `API_TIMEOUT` | API request timed out | Retry (3 attempts) |
| `API_RATE_LIMIT` | Rate limit exceeded | Retry with delay (1 attempt) |
| `API_AUTHENTICATION` | Authentication failed | User re-authentication |
| `API_AUTHORIZATION` | Access denied | User notification |
| `API_VALIDATION` | Invalid request data | User notification |
| `API_SERVER_ERROR` | Server error | Retry (3 attempts) |

### Storage Errors

| Error Type | Description | Recovery Strategy |
|------------|-------------|-------------------|
| `STORAGE_QUOTA_EXCEEDED` | Storage limit reached | Cleanup old data |
| `STORAGE_ACCESS_DENIED` | Storage access denied | Fallback to memory |
| `STORAGE_CORRUPTED` | Data corruption detected | Remove corrupted data |
| `STORAGE_NOT_AVAILABLE` | Storage not available | Fallback to memory |

### Browser Extension Errors

| Error Type | Description | Recovery Strategy |
|------------|-------------|-------------------|
| `EXTENSION_PERMISSION_DENIED` | Extension permission denied | User guidance |
| `EXTENSION_API_NOT_AVAILABLE` | Extension API not available | Graceful degradation |
| `EXTENSION_CONTEXT_INVALID` | Extension context invalid | Page refresh |

## Recovery Strategies

### 1. Retry Strategy
```typescript
{
  type: 'retry',
  maxRetries: 3,
  retryDelay: 1000,
  userMessage: 'Retrying operation...'
}
```

**Implementation:**
- Exponential backoff: `delay * Math.pow(2, attempt)`
- Maximum retry attempts configurable per error type
- User feedback during retry attempts

### 2. Fallback Strategy
```typescript
{
  type: 'fallback',
  fallbackAction: () => { /* alternative implementation */ },
  userMessage: 'Using fallback method...'
}
```

**Implementation:**
- Alternative implementation when primary fails
- Graceful degradation of features
- User notification of fallback usage

### 3. Degrade Strategy
```typescript
{
  type: 'degrade',
  userMessage: 'Working with limited functionality...'
}
```

**Implementation:**
- Reduce feature set when errors occur
- Maintain core functionality
- Clear user communication

### 4. Abort Strategy
```typescript
{
  type: 'abort',
  userMessage: 'Operation cancelled due to error...'
}
```

**Implementation:**
- Stop all related operations
- Clear user state
- Provide clear error message

## Error Logging

### Log Levels
- **Error**: Critical failures requiring attention
- **Warning**: Non-critical issues that may affect functionality
- **Info**: General information and status updates
- **Debug**: Detailed debugging information

### Log Storage
- **In-Memory**: Fast access for current session
- **LocalStorage**: Persistent across sessions (last 100 errors)
- **Remote**: Optional remote logging for analytics

### Log Format
```typescript
interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
  userAgent?: string;
  browser?: string;
  version?: string;
}
```

## User Feedback

### Error Messages
- **User-friendly**: Clear, actionable messages
- **Contextual**: Specific to the error type
- **Helpful**: Include recovery suggestions when possible

### Notification Types
- **Toast**: Brief, non-intrusive notifications
- **Modal**: Important errors requiring user action
- **Inline**: Context-specific error display

### Accessibility
- **Screen Reader**: ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Visible error indicators

## Testing Scenarios

### 1. Voice Processing Tests
```typescript
// Test speech recognition errors
testError('speech');

// Test microphone permission denial
navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Permission denied'));

// Test network errors during recognition
// Simulate offline state
```

### 2. Network Tests
```typescript
// Test API timeouts
apiClient.get('/slow-endpoint', { timeout: 100 });

// Test rate limiting
// Mock 429 responses

// Test offline scenarios
// Disconnect network
```

### 3. Storage Tests
```typescript
// Test quota exceeded
// Fill storage to capacity

// Test data corruption
// Manually corrupt localStorage data

// Test storage access denial
// Disable localStorage
```

### 4. Browser Extension Tests
```typescript
// Test permission denial
// Revoke extension permissions

// Test API unavailability
// Mock missing chrome.* APIs

// Test context invalidation
// Reload extension context
```

## Monitoring Setup

### Performance Monitoring
```typescript
// API call timing
performanceMonitor.startApiCall('fetchUserData');
const response = await apiClient.get('/user/data');
performanceMonitor.endApiCall('fetchUserData', startTime);

// Memory usage tracking
performanceMonitor.logMemoryUsage();

// Network request analysis
performanceMonitor.logNetworkRequest(url, duration, status);
```

### Error Tracking
```typescript
// Error rate monitoring
const errorRate = errorLog.filter(e =>
  Date.now() - e.timestamp < 60000
).length;

// Error type distribution
const errorDistribution = errorLog.reduce((acc, error) => {
  acc[error.type] = (acc[error.type] || 0) + 1;
  return acc;
}, {});

// Recovery success rate
const recoverySuccessRate = successfulRecoveries / totalErrors;
```

### Health Checks
```typescript
// Storage health
const storageHealth = await storageManager.size() < storageManager.maxSize;

// Network health
const networkHealth = await apiClient.healthCheck();

// Extension health
const extensionHealth = chrome.runtime && chrome.runtime.id;
```

## Debug Mode

### Features
- **Real-time Error Log**: Live error monitoring
- **System Information**: Browser, version, capabilities
- **Storage Status**: Usage, availability, performance
- **Network Status**: Connection type, speed, reliability
- **Error Testing**: Simulate various error conditions

### Access
```typescript
// Enable debug mode
errorHandler.setDebugMode(true);

// Open debug panel
setDebugPanelOpen(true);
```

### Usage
1. Open debug panel (Ctrl+Shift+D)
2. Monitor error log in real-time
3. Test error scenarios
4. Verify recovery mechanisms
5. Export error data for analysis

## Best Practices

### 1. Error Prevention
- Validate inputs before processing
- Check browser compatibility
- Test edge cases thoroughly
- Implement proper timeouts

### 2. Error Handling
- Always provide user feedback
- Log errors with sufficient context
- Implement appropriate recovery strategies
- Don't let errors cascade

### 3. User Experience
- Clear, actionable error messages
- Graceful degradation when possible
- Maintain application state during errors
- Provide recovery options

### 4. Monitoring
- Track error rates and patterns
- Monitor recovery success rates
- Alert on critical error thresholds
- Regular error log analysis

## Integration Guide

### 1. Basic Error Handling
```typescript
import { errorHandler, ErrorType } from '../utils/errorHandler';

try {
  // Your code here
} catch (error) {
  errorHandler.handleError(error, {
    type: ErrorType.API_SERVER_ERROR,
    context: { operation: 'fetchData' }
  });
}
```

### 2. API Integration
```typescript
import { apiClient } from '../utils/apiClient';

const response = await apiClient.get('/api/data', {
  timeout: 5000,
  retries: 3,
  cache: true
});
```

### 3. Storage Integration
```typescript
import { storageManager } from '../utils/storageManager';

await storageManager.set('user-preferences', preferences);
const data = await storageManager.get('user-preferences');
```

### 4. Debug Integration
```typescript
import DebugPanel from '../components/DebugPanel';

// Add to your component
const [debugOpen, setDebugOpen] = useState(false);

// Add keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      setDebugOpen(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Troubleshooting

### Common Issues

1. **Errors not being logged**
   - Check errorHandler configuration
   - Verify console logging is enabled
   - Check for storage permissions

2. **Recovery not working**
   - Verify recovery strategy configuration
   - Check retry limits and delays
   - Monitor error event listeners

3. **User feedback not showing**
   - Check notification system integration
   - Verify user feedback is enabled
   - Test in different browsers

4. **Debug panel not opening**
   - Check keyboard shortcut implementation
   - Verify component is properly imported
   - Check for CSS conflicts

### Debugging Steps

1. Enable debug mode
2. Open browser developer tools
3. Monitor console for error messages
4. Check network tab for failed requests
5. Verify storage in Application tab
6. Test error scenarios manually

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Error pattern analysis
- **Predictive Recovery**: ML-based error prediction
- **Remote Monitoring**: Cloud-based error tracking
- **Automated Testing**: Error scenario automation
- **Performance Optimization**: Error handling optimization

### Integration Opportunities
- **Sentry**: Error tracking service integration
- **LogRocket**: Session replay for error debugging
- **DataDog**: APM and error monitoring
- **Custom Analytics**: Internal error analytics platform
