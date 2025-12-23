import { getUncachableStripeClient } from '../server/stripeClient';
async function main() {
  const stripe = await getUncachableStripeClient();
  const products = await stripe.products.list({ active: true, limit: 100 });
  console.log("Stripe Products count:", products.data.length);
  for (const p of products.data) {
    console.log(`- ${p.name} (${p.id})`);
  }
}
main().catch(console.error);
