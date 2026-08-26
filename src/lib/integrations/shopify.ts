// Mock Shopify Adapter

export interface ShopifyOrder {
  id: string;
  orderNumber: string;
  totalPrice: number;
  currency: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  lineItems: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
}

export class ShopifyAdapter {
  async fetchOrder(externalOrderId: string): Promise<ShopifyOrder> {
    console.log(`[ShopifyAdapter] Fetching order ${externalOrderId}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      id: `gid://shopify/Order/${Math.floor(Math.random() * 1000000)}`,
      orderNumber: externalOrderId,
      totalPrice: 85.00,
      currency: 'USD',
      customer: {
        email: 'customer@example.com',
        firstName: 'Alex',
        lastName: 'Ross'
      },
      lineItems: [
        {
          title: 'Premium Subscription (Annual)',
          quantity: 1,
          price: 85.00
        }
      ]
    };
  }

  formatAsEvidence(order: ShopifyOrder): string {
    return `Shopify Order Receipt:
Order Number: ${order.orderNumber}
Customer: ${order.customer.firstName} ${order.customer.lastName} (${order.customer.email})
Total: ${order.totalPrice} ${order.currency}
Items:
${order.lineItems.map(item => `- ${item.quantity}x ${item.title} ($${item.price})`).join('\n')}`;
  }
}
