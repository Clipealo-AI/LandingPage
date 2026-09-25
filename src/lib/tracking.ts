/**
 * Pixel tracking helper for Google Analytics, Meta Pixel, and TikTok Pixel.
 * Fires "InitiateCheckout" (or equivalent) events with numeric price values.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

interface TrackCheckoutParams {
  value: number;        // numeric price in PEN
  currency?: string;    // default 'PEN'
  contentName?: string; // e.g. "Plan Estándar"
  contentId?: string;   // e.g. "estandar"
}

export function trackInitiateCheckout({
  value,
  currency = 'PEN',
  contentName,
  contentId,
}: TrackCheckoutParams) {
  // Google Analytics 4 — begin_checkout
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      value,
      currency,
      items: [
        {
          item_name: contentName,
          item_id: contentId,
          price: value,
          quantity: 1,
        },
      ],
    });
  }

  // Meta Pixel — InitiateCheckout
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value,
      currency,
      content_name: contentName,
      content_ids: contentId ? [contentId] : undefined,
      content_type: 'product',
      num_items: 1,
    });
  }

  // TikTok Pixel — InitiateCheckout
  if (window.ttq) {
    window.ttq.track('InitiateCheckout', {
      value,
      currency,
      content_name: contentName,
      content_id: contentId,
      content_type: 'product',
      quantity: 1,
    });
  }
}

export function trackLead(contentName?: string) {
  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'engagement',
      event_label: contentName,
    });
  }
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: contentName,
    });
  }
  if (window.ttq) {
    window.ttq.track('SubmitForm', {
      content_name: contentName,
    });
  }
}
