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
    freeModem: string;
    modemType: string;
    modemCommitment: string;
  };
}

const fibrePlans: PlanConfig[] = [
  {
    name: "NBN 50/20",
    description: "Perfect for small households with basic streaming and browsing. Includes free modem.",
    priceMonthly: 6900,
    metadata: { speed: "50", upload: "20", typical: "50 Mbps", planType: "fibre", freeModem: "true", modemType: "eero", modemCommitment: "24" }
  },
  {
    name: "NBN 100/20",
    description: "Great for families with multiple devices and HD streaming. Includes free modem.",
    priceMonthly: 7900,
    metadata: { speed: "100", upload: "20", typical: "98 Mbps", planType: "fibre", freeModem: "true", modemType: "eero", modemCommitment: "24" }
  },
  {
    name: "NBN 250/25",
    description: "Ideal for power users and 4K streaming on multiple devices. Includes free modem.",
    priceMonthly: 8900,
    metadata: { speed: "250", upload: "25", typical: "230 Mbps", planType: "fibre", freeModem: "true", modemType: "eero", modemCommitment: "24" }
  },
  {
    name: "NBN 500/50",
    description: "High-speed fibre for heavy users and large households. Includes free WiFi 7 modem.",
    priceMonthly: 10900,
    metadata: { speed: "500", upload: "50", typical: "480 Mbps", planType: "fibre", freeModem: "true", modemType: "eero7", modemCommitment: "24" }
  },
  {
    name: "NBN 1000/50",
    description: "Ultra-fast speeds for demanding households and home offices. Includes free WiFi 7 modem.",
    priceMonthly: 12900,
    metadata: { speed: "1000", upload: "50", typical: "900 Mbps", planType: "fibre", freeModem: "true", modemType: "eero7", modemCommitment: "24" }
  }
];

const fixedWirelessPlans: PlanConfig[] = [
  {
    name: "Fixed Wireless 50",
    description: "Entry-level wireless broadband for light users. Includes free modem.",
    priceMonthly: 5900,
    metadata: { speed: "50", upload: "10", typical: "47 Mbps", planType: "wireless", freeModem: "true", modemType: "eero", modemCommitment: "24" }
  },
  {
    name: "Fixed Wireless 75",
    description: "Balanced wireless plan for everyday streaming and gaming. Includes free modem.",
    priceMonthly: 6900,
    metadata: { speed: "75", upload: "10", typical: "70 Mbps", planType: "wireless", freeModem: "true", modemType: "eero", modemCommitment: "24" }
  },
  {
    name: "Fixed Wireless Plus",
    description: "Premium wireless tier with maximum available speeds. Includes free modem.",
    priceMonthly: 7900,
    metadata: { speed: "100", upload: "20", typical: "90 Mbps", planType: "wireless", freeModem: "true", modemType: "eero", modemCommitment: "24" }
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
