import { getUncachableStripeClient } from '../server/stripeClient';

interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  metadata: {
    speed: string;
    upload: string;
    typical: string;
    planType: string;
  };
}

const fibrePlans: PlanConfig[] = [
  {
    name: "NBN 50/20",
    description: "Perfect for small households with basic streaming and browsing",
    priceMonthly: 9400,
    metadata: { speed: "50", upload: "20", typical: "50 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 100/20",
    description: "Great for families with multiple devices and HD streaming",
    priceMonthly: 10500,
    metadata: { speed: "100", upload: "20", typical: "98 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 250/100",
    description: "Ideal for power users and 4K streaming on multiple devices",
    priceMonthly: 11000,
    metadata: { speed: "250", upload: "100", typical: "245 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 500/200",
    description: "High-speed fibre for heavy users and large households",
    priceMonthly: 13100,
    metadata: { speed: "500", upload: "200", typical: "480 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 1000/400",
    description: "Ultra-fast speeds for demanding households and home offices",
    priceMonthly: 15200,
    metadata: { speed: "1000", upload: "400", typical: "900 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 2000/200",
    description: "Ultra-connected smart homes with blazing fast speeds",
    priceMonthly: 18300,
    metadata: { speed: "2000", upload: "200", typical: "1800 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 2000/500",
    description: "Ultimate performance with maximum upload for professionals",
    priceMonthly: 24600,
    metadata: { speed: "2000", upload: "500", typical: "1800 Mbps", planType: "fibre" }
  }
];

const fixedWirelessPlans: PlanConfig[] = [
  {
    name: "Fixed Wireless 25",
    description: "Entry-level wireless broadband for light users",
    priceMonthly: 5900,
    metadata: { speed: "25", upload: "5", typical: "25 Mbps", planType: "wireless" }
  },
  {
    name: "Fixed Wireless 50",
    description: "Balanced wireless plan for everyday use",
    priceMonthly: 6900,
    metadata: { speed: "50", upload: "10", typical: "47 Mbps", planType: "wireless" }
  },
  {
    name: "Fixed Wireless 75",
    description: "Enhanced wireless speeds for streaming and gaming",
    priceMonthly: 7900,
    metadata: { speed: "75", upload: "10", typical: "70 Mbps", planType: "wireless" }
  },
  {
    name: "Fixed Wireless Plus",
    description: "Premium wireless tier with maximum available speeds",
    priceMonthly: 8900,
    metadata: { speed: "100", upload: "20", typical: "90 Mbps", planType: "wireless" }
  }
];

async function seedProducts() {
  console.log('Starting Stripe product seed...');
  
  const stripe = await getUncachableStripeClient();
  
  const allPlans = [...fibrePlans, ...fixedWirelessPlans];
  const validPlanNames = allPlans.map(p => p.name);
  
  // First, deactivate old products that no longer match our plans
  console.log('Checking for outdated products...');
  const existingProducts = await stripe.products.list({ active: true, limit: 100 });
  for (const product of existingProducts.data) {
    if (!validPlanNames.includes(product.name) && 
        (product.metadata?.planType === 'fibre' || product.metadata?.planType === 'wireless')) {
      console.log(`Deactivating outdated product: ${product.name}`);
      await stripe.products.update(product.id, { active: false });
    }
  }
  
  // Create or update products
  for (const plan of allPlans) {
    try {
      const existingProducts = await stripe.products.search({
        query: `name:'${plan.name}'`
      });
      
      let product;
      if (existingProducts.data.length > 0) {
        // Update existing product
        product = existingProducts.data[0];
        await stripe.products.update(product.id, {
          description: plan.description,
          metadata: plan.metadata,
          active: true
        });
        console.log(`Updated product: ${plan.name}`);
        
        // Check if price needs updating
        const existingPrices = await stripe.prices.list({ 
          product: product.id, 
          active: true 
        });
        
        const currentPrice = existingPrices.data[0];
        if (!currentPrice || currentPrice.unit_amount !== plan.priceMonthly) {
          // Deactivate old price and create new one
          if (currentPrice) {
            await stripe.prices.update(currentPrice.id, { active: false });
          }
          const newPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.priceMonthly,
            currency: 'aud',
            recurring: { interval: 'month' }
          });
          console.log(`  Updated price to $${plan.priceMonthly / 100}/mth (${newPrice.id})`);
        } else {
          console.log(`  Price unchanged: $${plan.priceMonthly / 100}/mth`);
        }
      } else {
        // Create new product
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: plan.metadata
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceMonthly,
          currency: 'aud',
          recurring: { interval: 'month' }
        });
        
        console.log(`Created: ${plan.name} (${product.id}) with price ${price.id}`);
      }
    } catch (error: any) {
      console.error(`Failed to process ${plan.name}:`, error.message);
    }
  }
  
  console.log('Stripe product seed complete!');
}

seedProducts().catch(console.error);
