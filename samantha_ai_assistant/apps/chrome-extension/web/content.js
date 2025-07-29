// Samantha AI Content Script
// Handles browser automation commands from voice processing

console.log('Samantha AI Content Script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  try {
    switch (request.action) {
      case 'clickElement':
        const clickElement = document.querySelector(request.selector);
        if (clickElement) {
          clickElement.click();
          sendResponse({ success: true, message: `Clicked ${request.selector}` });
        } else {
          sendResponse({ success: false, message: `Element not found: ${request.selector}` });
        }
        break;

      case 'typeText':
        const typeElement = document.querySelector(request.selector);
        if (typeElement) {
          typeElement.value = request.text;
          typeElement.dispatchEvent(new Event('input', { bubbles: true }));
          sendResponse({ success: true, message: `Typed text in ${request.selector}` });
        } else {
          sendResponse({ success: false, message: `Element not found: ${request.selector}` });
        }
        break;

      case 'scrollPage':
        const direction = request.direction || 'down';
        const distance = request.distance || 500;

        if (direction === 'up') {
          window.scrollBy(0, -distance);
        } else {
          window.scrollBy(0, distance);
        }
        sendResponse({ success: true, message: `Scrolled ${direction}` });
        break;

      case 'getPageInfo':
        const pageInfo = {
          title: document.title,
          url: window.location.href,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          links: document.querySelectorAll('a').length
        };
        sendResponse({ success: true, data: pageInfo });
        break;

      case 'navigateTo':
        window.location.href = request.url;
        sendResponse({ success: true, message: `Navigating to ${request.url}` });
        break;

      default:
        sendResponse({ success: false, message: `Unknown action: ${request.action}` });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ success: false, message: `Error: ${error.message}` });
  }

  return true; // Keep message channel open for async response
});

// Notify background script that content script is ready
chrome.runtime.sendMessage({
  action: 'contentScriptReady',
  url: window.location.href
});
