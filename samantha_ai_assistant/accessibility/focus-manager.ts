/**
 * Focus Manager - Handles focus management and trapping
 */
export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private maxHistoryLength = 10;
  private trappedContainer: HTMLElement | null = null;
  private originalTabIndex: Map<HTMLElement, string | null> = new Map();

  constructor() {
    // Initialize focus manager
  }

  /**
   * Initialize the focus manager
   */
  async initialize(): Promise<void> {
    try {
      // Set up focus event listeners
      this.setupFocusListeners();
      console.log('Focus manager initialized');
    } catch (error) {
      console.error('Failed to initialize focus manager:', error);
      throw error;
    }
  }

  /**
   * Set up focus event listeners
   */
  private setupFocusListeners(): void {
    // Monitor focus changes
    document.addEventListener('focusin', (event) => {
      this.handleFocusIn(event);
    });

    document.addEventListener('focusout', (event) => {
      this.handleFocusOut(event);
    });
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Save focus to history
    this.saveFocus(target);

    // Update focus indicators
    this.updateFocusIndicators(target);
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Remove focus indicators
    this.removeFocusIndicators(target);
  }

  /**
   * Save focus to history
   */
  saveFocus(element?: HTMLElement): void {
    const activeElement = element || (document.activeElement as HTMLElement);

    if (activeElement && activeElement !== document.body) {
      // Don't add duplicates
      if (this.focusHistory[0] !== activeElement) {
        this.focusHistory.unshift(activeElement);

        // Limit history size
        if (this.focusHistory.length > this.maxHistoryLength) {
          this.focusHistory.pop();
        }
      }
    }
  }

  /**
   * Restore previous focus
   */
  restoreFocus(): void {
    const previousFocus = this.focusHistory.shift();

    if (previousFocus && previousFocus.focus) {
      try {
        previousFocus.focus();
        console.log('Focus restored to:', previousFocus);
      } catch (error) {
        console.error('Failed to restore focus:', error);
      }
    }
  }

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): void {
    if (this.trappedContainer) {
      this.releaseFocusTrap();
    }

    this.trappedContainer = container;

    // Get focusable elements within container
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length === 0) {
      console.warn('No focusable elements found in container');
      return;
    }

    // Store original tabindex values
    focusableElements.forEach(element => {
      this.originalTabIndex.set(element, element.getAttribute('tabindex'));
    });

    // Set up focus trap
    this.setupFocusTrap(container, focusableElements);

    // Focus first element
    this.focusFirstElement(container);

    console.log('Focus trapped in container:', container);
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(): void {
    if (!this.trappedContainer) return;

    // Restore original tabindex values
    this.originalTabIndex.forEach((tabindex, element) => {
      if (tabindex === null) {
        element.removeAttribute('tabindex');
      } else {
        element.setAttribute('tabindex', tabindex);
      }
    });

    this.originalTabIndex.clear();
    this.trappedContainer = null;

    console.log('Focus trap released');
  }

  /**
   * Set up focus trap
   */
  private setupFocusTrap(container: HTMLElement, focusableElements: HTMLElement[]): void {
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Handle tab key
    const handleTab = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const currentElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          // Shift + Tab: move to previous element
          if (currentElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move to next element
          if (currentElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Add event listener to container
    container.addEventListener('keydown', handleTab);

    // Store event listener for cleanup
    (container as any)._focusTrapHandler = handleTab;
  }

  /**
   * Get focusable elements within a container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(elements) as HTMLElement[];
  }

  /**
   * Focus first focusable element
   */
  focusFirstElement(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      firstElement.focus();
      console.log('Focused first element:', firstElement);
    }
  }

  /**
   * Focus last focusable element
   */
  focusLastElement(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length > 0) {
      const lastElement = focusableElements[focusableElements.length - 1];
      lastElement.focus();
      console.log('Focused last element:', lastElement);
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
   * Remove focus indicators
   */
  private removeFocusIndicators(element: HTMLElement): void {
    element.classList.remove('focus-visible');
  }

  /**
   * Get focus history
   */
  getFocusHistory(): HTMLElement[] {
    return [...this.focusHistory];
  }

  /**
   * Clear focus history
   */
  clearFocusHistory(): void {
    this.focusHistory = [];
  }

  /**
   * Check if focus is trapped
   */
  isFocusTrapped(): boolean {
    return this.trappedContainer !== null;
  }

  /**
   * Get current trapped container
   */
  getTrappedContainer(): HTMLElement | null {
    return this.trappedContainer;
  }

  /**
   * Move focus to next element
   */
  focusNext(container?: HTMLElement): void {
    const targetContainer = container || this.trappedContainer || document.body;
    const focusableElements = this.getFocusableElements(targetContainer);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    }
  }

  /**
   * Move focus to previous element
   */
  focusPrevious(container?: HTMLElement): void {
    const targetContainer = container || this.trappedContainer || document.body;
    const focusableElements = this.getFocusableElements(targetContainer);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    }
  }

  /**
   * Check if element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(document.body);
    return focusableElements.includes(element);
  }

  /**
   * Get current focus status
   */
  getFocusStatus(): FocusStatus {
    return {
      currentFocus: document.activeElement as HTMLElement,
      isTrapped: this.isFocusTrapped(),
      trappedContainer: this.trappedContainer,
      focusHistory: this.getFocusHistory(),
      focusHistoryLength: this.focusHistory.length
    };
  }

  /**
   * Destroy the focus manager
   */
  destroy(): void {
    // Release any active focus trap
    this.releaseFocusTrap();

    // Clear focus history
    this.clearFocusHistory();

    // Remove event listeners
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
  }
}

/**
 * Type definitions
 */
export interface FocusStatus {
  currentFocus: HTMLElement | null;
  isTrapped: boolean;
  trappedContainer: HTMLElement | null;
  focusHistory: HTMLElement[];
  focusHistoryLength: number;
}
