/**
 * Screen Reader Announcer - Handles announcements to screen readers
 */
export class ScreenReaderAnnouncer {
  private announcementQueue: Announcement[] = [];
  private isAnnouncing = false;
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Initialize the screen reader announcer
   */
  async initialize(): Promise<void> {
    try {
      // Create announcement container
      this.createAnnouncementContainer();
      this.isSupported = true;
      console.log('Screen reader announcer initialized');
    } catch (error) {
      console.error('Failed to initialize screen reader announcer:', error);
      this.isSupported = false;
    }
  }

  /**
   * Check if screen reader support is available
   */
  private checkSupport(): void {
    // Check for common screen reader indicators
    const hasScreenReader =
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      navigator.userAgent.includes('TalkBack') ||
      document.querySelector('[aria-live]') !== null;

    this.isSupported = hasScreenReader;
  }

  /**
   * Create announcement container
   */
  private createAnnouncementContainer(): void {
    // Remove existing container if present
    const existingContainer = document.getElementById('screen-reader-announcements');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create new container
    const container = document.createElement('div');
    container.id = 'screen-reader-announcements';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.className = 'sr-only';
    container.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    document.body.appendChild(container);
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.isSupported) {
      console.warn('Screen reader not supported, message not announced:', message);
      return;
    }

    const announcement: Announcement = {
      message,
      priority,
      timestamp: Date.now(),
      id: this.generateId()
    };

    this.announcementQueue.push(announcement);

    if (!this.isAnnouncing) {
      this.processQueue();
    }
  }

  /**
   * Process announcement queue
   */
  private async processQueue(): Promise<void> {
    this.isAnnouncing = true;

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift()!;
      await this.announceMessage(announcement);
      await this.delay(100); // Small delay between announcements
    }

    this.isAnnouncing = false;
  }

  /**
   * Announce individual message
   */
  private async announceMessage(announcement: Announcement): Promise<void> {
    try {
      const container = document.getElementById('screen-reader-announcements');
      if (!container) {
        throw new Error('Announcement container not found');
      }

      // Create announcement element
      const announcementElement = document.createElement('div');
      announcementElement.id = announcement.id;
      announcementElement.setAttribute('aria-live', announcement.priority);
      announcementElement.setAttribute('aria-atomic', 'true');
      announcementElement.className = 'sr-only';
      announcementElement.textContent = announcement.message;

      // Add to container
      container.appendChild(announcementElement);

      // Trigger announcement
      this.triggerAnnouncement(announcementElement);

      // Remove after announcement
      setTimeout(() => {
        if (announcementElement.parentNode) {
          announcementElement.parentNode.removeChild(announcementElement);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to announce message:', error);
    }
  }

  /**
   * Trigger announcement for screen readers
   */
  private triggerAnnouncement(element: HTMLElement): void {
    // Force screen reader to read the announcement
    element.style.display = 'block';
    element.focus();
    element.blur();
    element.style.display = 'none';
  }

  /**
   * Generate unique ID for announcements
   */
  private generateId(): string {
    return `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if screen reader is supported
   */
  getIsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get announcement queue status
   */
  getQueueStatus(): QueueStatus {
    return {
      queueLength: this.announcementQueue.length,
      isAnnouncing: this.isAnnouncing,
      isSupported: this.getIsSupported()
    };
  }

  /**
   * Clear announcement queue
   */
  clearQueue(): void {
    this.announcementQueue = [];
  }

  /**
   * Destroy the announcer
   */
  destroy(): void {
    this.clearQueue();
    this.isAnnouncing = false;

    const container = document.getElementById('screen-reader-announcements');
    if (container) {
      container.remove();
    }
  }
}

/**
 * Type definitions
 */
export interface Announcement {
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
  id: string;
}

export interface QueueStatus {
  queueLength: number;
  isAnnouncing: boolean;
  isSupported: boolean;
}
