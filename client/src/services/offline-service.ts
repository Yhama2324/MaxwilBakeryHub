
import { offlineStorage } from '@/hooks/use-capacitor';
import { Product } from '@/shared/schema';

export class OfflineService {
  private static PRODUCTS_KEY = 'offline_products';
  private static ORDERS_KEY = 'offline_orders';

  // Cache products for offline use
  static async cacheProducts(products: Product[]) {
    await offlineStorage.set(this.PRODUCTS_KEY, products);
  }

  // Get cached products
  static async getCachedProducts(): Promise<Product[] | null> {
    return await offlineStorage.get(this.PRODUCTS_KEY);
  }

  // Store offline orders
  static async storeOfflineOrder(order: any) {
    const existingOrders = await offlineStorage.get(this.ORDERS_KEY) || [];
    existingOrders.push({
      ...order,
      timestamp: new Date().toISOString(),
      offline: true
    });
    await offlineStorage.set(this.ORDERS_KEY, existingOrders);
  }

  // Get offline orders
  static async getOfflineOrders() {
    return await offlineStorage.get(this.ORDERS_KEY) || [];
  }

  // Clear offline orders after sync
  static async clearOfflineOrders() {
    await offlineStorage.remove(this.ORDERS_KEY);
  }

  // Sync offline orders when back online
  static async syncOfflineOrders() {
    const offlineOrders = await this.getOfflineOrders();
    
    for (const order of offlineOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...order,
            offline: false
          }),
        });

        if (!response.ok) {
          console.error('Failed to sync order:', order);
        }
      } catch (error) {
        console.error('Error syncing order:', error);
      }
    }

    // Clear synced orders
    await this.clearOfflineOrders();
  }
}
