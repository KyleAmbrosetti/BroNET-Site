import { getStripeSync } from '../server/stripeClient';
async function main() {
  console.log("Getting Stripe sync...");
  const stripeSync = await getStripeSync();
  console.log("Starting backfill...");
  await stripeSync.syncBackfill({ fullResync: true });
  console.log("Backfill complete!");
}
main().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
