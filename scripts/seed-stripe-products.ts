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
    name: "NBN 50",
    description: "Perfect for small households with basic streaming and browsing",
    priceMonthly: 6900,
    metadata: { speed: "50", upload: "20", typical: "50 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 100",
    description: "Great for families with multiple devices and HD streaming",
    priceMonthly: 8900,
    metadata: { speed: "100", upload: "20", typical: "98 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 250",
    description: "Ideal for power users and 4K streaming on multiple devices",
    priceMonthly: 10900,
    metadata: { speed: "250", upload: "25", typical: "245 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 1000",
    description: "Ultra-fast speeds for demanding households and home offices",
    priceMonthly: 12900,
    metadata: { speed: "1000", upload: "50", typical: "850 Mbps", planType: "fibre" }
  },
  {
    name: "NBN 2000",
    description: "Maximum speed tier for extreme performance and future-proofing",
    priceMonthly: 15500,
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
  
  for (const plan of allPlans) {
    try {
      const existingProducts = await stripe.products.search({
        query: `name:'${plan.name}'`
      });
      
      if (existingProducts.data.length > 0) {
        console.log(`Product "${plan.name}" already exists, skipping...`);
        continue;
      }
      
      const product = await stripe.products.create({
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
    } catch (error: any) {
      console.error(`Failed to create ${plan.name}:`, error.message);
    }
  }
  
  console.log('Stripe product seed complete!');
}

seedProducts().catch(console.error);
