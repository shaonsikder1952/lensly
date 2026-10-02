/**
 * Lensly Unified Analytics Abstraction Layer
 *
 * Provides a clean, integration-ready event tracking API for all key conversion
 * and engagement funnels without vendor lock-in.
 */

export type AnalyticsEventName =
  | "page_view"
  | "hero_cta_click"
  | "frame_request_started"
  | "frame_upload_started"
  | "frame_upload_completed"
  | "prescription_started"
  | "prescription_submitted"
  | "pricing_viewed"
  | "signup_started"
  | "signup_completed"
  | "checkout_started"
  | "purchase_completed"
  | "contact_started";

export interface AnalyticsEventProperties {
  page?: string;
  source?: string;
  frameUrl?: string;
  fileType?: string;
  fileSize?: number;
  planId?: string;
  price?: number;
  contractId?: string;
  [key: string]: unknown;
}

export type AnalyticsHandler = (event: AnalyticsEventName, properties?: AnalyticsEventProperties) => void;

class AnalyticsManager {
  private handlers: AnalyticsHandler[] = [];

  constructor() {
    // Default development logger & DOM CustomEvent dispatcher
    this.addHandler((event, properties) => {
      if (typeof window !== "undefined") {
        // Dispatch custom DOM event for lightweight in-page hooks or testing
        try {
          const customEvent = new CustomEvent("lensly_analytics", {
            detail: { event, properties, timestamp: new Date().toISOString() },
          });
          window.dispatchEvent(customEvent);
        } catch {
          // Ignore event dispatch errors in restricted environments
        }

        // Development console trace
        if (process.env.NODE_ENV !== "production") {
          console.log(`[Analytics] ${event}`, properties || {});
        }
      }
    });
  }

  /**
   * Registers a third-party analytics provider (e.g., GA4, PostHog, Plausible).
   */
  public addHandler(handler: AnalyticsHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /**
   * Dispatches an event to all registered tracking handlers.
   */
  public track(event: AnalyticsEventName, properties?: AnalyticsEventProperties): void {
    for (const handler of this.handlers) {
      try {
        handler(event, properties);
      } catch (err) {
        console.error(`Error in analytics handler for "${event}":`, err);
      }
    }
  }
}

export const analytics = new AnalyticsManager();

/**
 * Convenience helper to track events directly.
 */
export function trackEvent(event: AnalyticsEventName, properties?: AnalyticsEventProperties): void {
  analytics.track(event, properties);
}
