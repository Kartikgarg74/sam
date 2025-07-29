// Mock Chrome Extension APIs for testing - DISABLED FOR BUILD
/*
const mockChrome = {
  // Runtime API
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    getManifest: jest.fn(() => ({
      name: 'Samantha AI Assistant',
      version: '1.0.0',
    })),
    id: 'test-extension-id',
  },

  // Tabs API
  tabs: {
    query: jest.fn(() => Promise.resolve([{
      id: 1,
      url: 'https://example.com',
      title: 'Example Page',
      active: true,
    }])),
    create: jest.fn(() => Promise.resolve({ id: 2 })),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    sendMessage: jest.fn(() => Promise.resolve()),
  },

  // Scripting API
  scripting: {
    executeScript: jest.fn(() => Promise.resolve([{ result: 'success' }])),
    insertCSS: jest.fn(() => Promise.resolve()),
    removeCSS: jest.fn(() => Promise.resolve()),
  },

  // Storage API
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Action API (Manifest V3)
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn(),
    setTitle: jest.fn(),
    getBadgeText: jest.fn(() => Promise.resolve('')),
    getBadgeBackgroundColor: jest.fn(() => Promise.resolve({ color: '#000000' })),
    getTitle: jest.fn(() => Promise.resolve('Samantha AI')),
  },

  // Permissions API
  permissions: {
    contains: jest.fn(() => Promise.resolve(true)),
    request: jest.fn(() => Promise.resolve({ granted: true })),
    getAll: jest.fn(() => Promise.resolve({ permissions: [] })),
  },

  // Context Menus API
  contextMenus: {
    create: jest.fn(() => Promise.resolve('menu-id')),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    removeAll: jest.fn(() => Promise.resolve()),
  },

  // Notifications API
  notifications: {
    create: jest.fn(() => Promise.resolve('notification-id')),
    update: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAll: jest.fn(() => Promise.resolve({})),
    getPermissionLevel: jest.fn(() => Promise.resolve('granted')),
  },

  // Web Navigation API
  webNavigation: {
    onCompleted: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onBeforeNavigate: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Web Request API
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onBeforeSendHeaders: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Audio Capture API
  tabCapture: {
    capture: jest.fn(() => Promise.resolve({ streamId: 'test-stream' })),
    getCapturedTabs: jest.fn(() => Promise.resolve([])),
  },

  // Commands API
  commands: {
    getAll: jest.fn(() => Promise.resolve([])),
    onCommand: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Extension API
  extension: {
    getViews: jest.fn(() => []),
    getBackgroundPage: jest.fn(() => null),
    getExtensionTabs: jest.fn(() => []),
  },

  // I18n API
  i18n: {
    getMessage: jest.fn((messageName: string) => messageName),
    getUILanguage: jest.fn(() => 'en'),
    detectLanguage: jest.fn(() => Promise.resolve({ languages: [{ language: 'en' }] })),
  },

  // Alarms API
  alarms: {
    create: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve(null)),
    getAll: jest.fn(() => Promise.resolve([])),
    clear: jest.fn(() => Promise.resolve()),
    clearAll: jest.fn(() => Promise.resolve()),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Bookmarks API
  bookmarks: {
    create: jest.fn(() => Promise.resolve({ id: 'bookmark-id' })),
    get: jest.fn(() => Promise.resolve([])),
    getChildren: jest.fn(() => Promise.resolve([])),
    getRecent: jest.fn(() => Promise.resolve([])),
    getSubTree: jest.fn(() => Promise.resolve([])),
    getTree: jest.fn(() => Promise.resolve([])),
    move: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    removeTree: jest.fn(() => Promise.resolve()),
    search: jest.fn(() => Promise.resolve([])),
    update: jest.fn(() => Promise.resolve()),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onMoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onChildrenReordered: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // History API
  history: {
    addUrl: jest.fn(() => Promise.resolve()),
    deleteAll: jest.fn(() => Promise.resolve()),
    deleteRange: jest.fn(() => Promise.resolve()),
    deleteUrl: jest.fn(() => Promise.resolve()),
    getVisits: jest.fn(() => Promise.resolve([])),
    search: jest.fn(() => Promise.resolve([])),
    onVisited: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onVisitRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },

  // Downloads API
  downloads: {
    download: jest.fn(() => Promise.resolve({ id: 1 })),
    pause: jest.fn(() => Promise.resolve()),
    resume: jest.fn(() => Promise.resolve()),
    cancel: jest.fn(() => Promise.resolve()),
    getFileIcon: jest.fn(() => Promise.resolve('icon-url')),
    open: jest.fn(() => Promise.resolve()),
    show: jest.fn(() => Promise.resolve()),
    showDefaultFolder: jest.fn(() => Promise.resolve()),
    erase: jest.fn(() => Promise.resolve()),
    removeFile: jest.fn(() => Promise.resolve()),
    acceptDanger: jest.fn(() => Promise.resolve()),
    drag: jest.fn(() => Promise.resolve()),
    setShelfEnabled: jest.fn(() => Promise.resolve()),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onErased: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
};

// Mock browser APIs for Firefox compatibility
const mockBrowser = {
  ...mockChrome,
  // Firefox-specific APIs
  tabs: {
    ...mockChrome.tabs,
    executeScript: jest.fn(() => Promise.resolve([{ result: 'success' }])),
  },
};

// Set up global mocks
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true,
});

Object.defineProperty(global, 'browser', {
  value: mockBrowser,
  writable: true,
});

// Export for use in tests
export { mockChrome, mockBrowser };
*/
