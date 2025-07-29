import { ScreenReaderAnnouncer } from './screen-reader-announcer';
import { FocusManager } from './focus-manager';
import { KeyboardNavigationManager } from './keyboard-navigation-manager';
import { ColorContrastManager } from './color-contrast-manager';

/**
 * Accessibility Manager - Central accessibility coordination
 */
export class AccessibilityManager {
  private screenReaderAnnouncer: ScreenReaderAnnouncer;
  private focusManager: FocusManager;
  private keyboardNavigationManager: KeyboardNavigationManager;
  private colorContrastManager: ColorContrastManager;
  private isInitialized = false;

  constructor() {
    this.screenReaderAnnouncer = new ScreenReaderAnnouncer();
    this.focusManager = new FocusManager();
    this.keyboardNavigationManager = new KeyboardNavigationManager();
    this.colorContrastManager = new ColorContrastManager();
  }

  /**
   * Initialize accessibility features
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize all accessibility components
      await this.screenReaderAnnouncer.initialize();
      await this.focusManager.initialize();
      await this.keyboardNavigationManager.initialize();
      await this.colorContrastManager.initialize();

      // Set up global accessibility event listeners
      this.setupGlobalListeners();

      // Announce initialization
      this.announce('Samantha AI accessibility features enabled');

      this.isInitialized = true;
      console.log('Accessibility manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize accessibility manager:', error);
      throw error;
    }
  }

  /**
   * Set up global accessibility event listeners
   */
  private setupGlobalListeners(): void {
    // Monitor focus changes
    document.addEventListener('focusin', (event) => {
      this.handleFocusChange(event);
    });

    // Monitor keyboard events
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardEvent(event);
    });

    // Monitor voice recognition events
    document.addEventListener('voice-recognition-start', () => {
      this.announce('Voice recognition started. Speak now.');
    });

    document.addEventListener('voice-recognition-stop', () => {
      this.announce('Voice recognition stopped.');
    });

    document.addEventListener('voice-recognition-error', (event: CustomEvent) => {
      this.announce(`Voice recognition error: ${event.detail.error}`, 'assertive');
    });

    document.addEventListener('voice-command-received', (event: CustomEvent) => {
      this.announce(`Command received: ${event.detail.command}`);
    });

    document.addEventListener('voice-command-result', (event: CustomEvent) => {
      this.announce(`Result: ${event.detail.result}`);
    });
  }

  /**
   * Handle focus changes
   */
  private handleFocusChange(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Save focus for potential restoration
    this.focusManager.saveFocus();

    // Announce focus changes for screen readers
    if (target.getAttribute('aria-label')) {
      this.announce(`Focused: ${target.getAttribute('aria-label')}`);
    } else if (target.textContent) {
      this.announce(`Focused: ${target.textContent.trim()}`);
    }

    // Update focus indicators
    this.updateFocusIndicators(target);
  }

  /**
   * Handle keyboard events
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    // Let keyboard navigation manager handle navigation
    this.keyboardNavigationManager.handleKeyEvent(event);

    // Handle specific accessibility shortcuts
    switch (event.key) {
      case 'h':
      case 'H':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.showAccessibilityHelp();
        }
        break;
      case 'm':
      case 'M':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleHighContrast();
        }
        break;
      case 'r':
      case 'R':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleReducedMotion();
        }
        break;
    }
  }

  /**
   * Update focus indicators
   */
  private updateFocusIndicators(element: HTMLElement): void {
    // Remove focus indicators from all elements
    document.querySelectorAll('.focus-visible').forEach(el => {
      el.classList.remove('focus-visible');
    });

    // Add focus indicator to current element
    element.classList.add('focus-visible');
  }

  /**
   * Announce to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.screenReaderAnnouncer.announce(message, priority);
  }

  /**
   * Trap focus in a container
   */
  trapFocus(container: HTMLElement): void {
    this.focusManager.trapFocus(container);
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(): void {
    this.focusManager.releaseFocusTrap();
  }

  /**
   * Move focus to first focusable element
   */
  focusFirstElement(container: HTMLElement): void {
    this.focusManager.focusFirstElement(container);
  }

  /**
   * Restore previous focus
   */
  restoreFocus(): void {
    this.focusManager.restoreFocus();
  }

  /**
   * Show accessibility help
   */
  private showAccessibilityHelp(): void {
    const helpContent = `
      Accessibility Shortcuts:
      - Ctrl/Cmd + H: Show this help
      - Ctrl/Cmd + M: Toggle high contrast
      - Ctrl/Cmd + R: Toggle reduced motion
      - Tab: Navigate between elements
      - Enter/Space: Activate buttons
      - Escape: Close modals or stop voice recognition
      - Arrow keys: Navigate in lists
    `;

    this.announce(helpContent, 'polite');

    // Show help modal
    this.showHelpModal(helpContent);
  }

  /**
   * Toggle high contrast mode
   */
  private toggleHighContrast(): void {
    const isHighContrast = document.documentElement.classList.toggle('high-contrast');
    this.announce(`High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle reduced motion
   */
  private toggleReducedMotion(): void {
    const isReducedMotion = document.documentElement.classList.toggle('reduced-motion');
    this.announce(`Reduced motion ${isReducedMotion ? 'enabled' : 'disabled'}`);
  }

  /**
   * Show help modal
   */
  private showHelpModal(content: string): void {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'help-title');
    modal.className = 'accessibility-help-modal';

    modal.innerHTML = `
      <div class="modal-content">
        <h2 id="help-title">Accessibility Help</h2>
        <div class="help-content">
          <pre>${content}</pre>
        </div>
        <button class="close-button" aria-label="Close help">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Trap focus in modal
    this.trapFocus(modal);

    // Handle close button
    const closeButton = modal.querySelector('.close-button') as HTMLButtonElement;
    closeButton.addEventListener('click', () => {
      this.closeHelpModal(modal);
    });

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeHelpModal(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Close help modal
   */
  private closeHelpModal(modal: HTMLElement): void {
    this.releaseFocusTrap();
    document.body.removeChild(modal);
    this.restoreFocus();
  }

  /**
   * Get accessibility status
   */
  getAccessibilityStatus(): AccessibilityStatus {
    return {
      isInitialized: this.isInitialized,
      hasScreenReader: this.screenReaderAnnouncer.isSupported(),
      hasKeyboardSupport: this.keyboardNavigationManager.isSupported(),
      hasHighContrast: document.documentElement.classList.contains('high-contrast'),
      hasReducedMotion: document.documentElement.classList.contains('reduced-motion'),
      currentFocus: document.activeElement,
      focusHistory: this.focusManager.getFocusHistory()
    };
  }

  /**
   * Validate accessibility compliance
   */
  async validateCompliance(): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      wcag21AA: await this.validateWCAG21AA(),
      section508: await this.validateSection508(),
      browserExtension: await this.validateBrowserExtension(),
      recommendations: []
    };

    // Generate recommendations
    if (!report.wcag21AA.compliant) {
      report.recommendations.push('Address WCAG 2.1 AA compliance issues');
    }
    if (!report.section508.compliant) {
      report.recommendations.push('Address Section 508 compliance issues');
    }

    return report;
  }

  /**
   * Validate WCAG 2.1 AA compliance
   */
  private async validateWCAG21AA(): Promise<ComplianceResult> {
    const issues: string[] = [];
    let compliant = true;

    // Check for alt text on images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push('Image missing alt text or aria-label');
        compliant = false;
      }
    });

    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push('Heading structure is not logical');
        compliant = false;
      }
      previousLevel = level;
    });

    // Check for focus indicators
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea');
    focusableElements.forEach(element => {
      const style = window.getComputedStyle(element);
      if (style.outline === 'none' && !element.classList.contains('focus-visible')) {
        issues.push('Focus indicator missing');
        compliant = false;
      }
    });

    return { compliant, issues };
  }

  /**
   * Validate Section 508 compliance
   */
  private async validateSection508(): Promise<ComplianceResult> {
    const issues: string[] = [];
    let compliant = true;

    // Check for keyboard accessibility
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(element => {
      if (element.getAttribute('tabindex') === '-1' && !element.hasAttribute('aria-hidden')) {
        issues.push('Interactive element not keyboard accessible');
        compliant = false;
      }
    });

    // Check for color contrast
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;

      if (color && backgroundColor) {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        if (contrast < 4.5) {
          issues.push('Color contrast below 4.5:1 ratio');
          compliant = false;
        }
      }
    });

    return { compliant, issues };
  }

  /**
   * Validate browser extension specific compliance
   */
  private async validateBrowserExtension(): Promise<ComplianceResult> {
    const issues: string[] = [];
    let compliant = true;

    // Check for proper ARIA roles
    const elementsWithRole = document.querySelectorAll('[role]');
    elementsWithRole.forEach(element => {
      const role = element.getAttribute('role');
      if (!this.isValidARIARole(role!)) {
        issues.push(`Invalid ARIA role: ${role}`);
        compliant = false;
      }
    });

    // Check for proper ARIA attributes
    const elementsWithAria = document.querySelectorAll('[aria-*]');
    elementsWithAria.forEach(element => {
      const ariaAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));

      ariaAttributes.forEach(attr => {
        if (!this.isValidARIAAttribute(attr.name, attr.value)) {
          issues.push(`Invalid ARIA attribute: ${attr.name}="${attr.value}"`);
          compliant = false;
        }
      });
    });

    return { compliant, issues };
  }

  /**
   * Calculate color contrast ratio
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In production, use a proper color contrast library
    return 4.5; // Placeholder
  }

  /**
   * Check if ARIA role is valid
   */
  private isValidARIARole(role: string): boolean {
    const validRoles = [
      'button', 'checkbox', 'dialog', 'gridcell', 'link', 'menuitem',
      'menuitemcheckbox', 'menuitemradio', 'option', 'progressbar',
      'radio', 'scrollbar', 'searchbox', 'slider', 'spinbutton',
      'switch', 'tab', 'tabpanel', 'textbox', 'treeitem',
      'application', 'banner', 'complementary', 'contentinfo',
      'form', 'main', 'navigation', 'region', 'search',
      'article', 'cell', 'columnheader', 'definition', 'directory',
      'document', 'feed', 'figure', 'group', 'heading', 'img',
      'list', 'listbox', 'listitem', 'log', 'marquee', 'math',
      'meter', 'none', 'note', 'presentation', 'row', 'rowgroup',
      'rowheader', 'separator', 'status', 'table', 'tablist',
      'term', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid'
    ];

    return validRoles.includes(role);
  }

  /**
   * Check if ARIA attribute is valid
   */
  private isValidARIAAttribute(name: string, value: string): boolean {
    // Simplified validation
    // In production, use a proper ARIA validation library
    return true; // Placeholder
  }

  /**
   * Cleanup accessibility manager
   */
  destroy(): void {
    this.screenReaderAnnouncer.destroy();
    this.focusManager.destroy();
    this.keyboardNavigationManager.destroy();
    this.colorContrastManager.destroy();
    this.isInitialized = false;
  }
}

/**
 * Type definitions
 */
export interface AccessibilityStatus {
  isInitialized: boolean;
  hasScreenReader: boolean;
  hasKeyboardSupport: boolean;
  hasHighContrast: boolean;
  hasReducedMotion: boolean;
  currentFocus: Element | null;
  focusHistory: HTMLElement[];
}

export interface ComplianceResult {
  compliant: boolean;
  issues: string[];
}

export interface ComplianceReport {
  wcag21AA: ComplianceResult;
  section508: ComplianceResult;
  browserExtension: ComplianceResult;
  recommendations: string[];
}
