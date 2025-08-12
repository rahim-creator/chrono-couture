import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const useAnalytics = () => {
  const trackEvent = (eventName: string, parameters: Record<string, any>) => {
    window.gtag?.('event', eventName, parameters);
  };

  const trackPageView = (url: string, title: string) => {
    window.gtag?.('event', 'page_view', { page_location: url, page_title: title });
  };

  const trackEcommerce = {
    viewItem: (item: { id: string; name: string; category?: string; price: number }) =>
      trackEvent('view_item', {
        currency: 'EUR',
        value: item.price,
        items: [
          { item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity: 1 },
        ],
      }),

    addToCart: (item: { id: string; name: string; category?: string; price: number }, quantity = 1) =>
      trackEvent('add_to_cart', {
        currency: 'EUR',
        value: item.price * quantity,
        items: [
          { item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity },
        ],
      }),

    beginCheckout: (cart: { total: number; items: Array<{ id: string; name: string; category?: string; price: number; quantity: number }> }) =>
      trackEvent('begin_checkout', {
        currency: 'EUR',
        value: cart.total,
        items: cart.items.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          item_category: i.category,
          price: i.price,
          quantity: i.quantity,
        })),
      }),

    purchase: (order: { id: string; total: number; tax?: number; shipping?: number; items: any[] }) =>
      trackEvent('purchase', {
        transaction_id: order.id,
        currency: 'EUR',
        value: order.total,
        tax: order.tax,
        shipping: order.shipping,
        items: order.items,
      }),
  };

  // Optional: example of auto page_view on mount
  const useAutoPageView = (title: string) => {
    useEffect(() => {
      trackPageView(window.location.href, title);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  };

  return { trackEvent, trackPageView, trackEcommerce, useAutoPageView };
};
