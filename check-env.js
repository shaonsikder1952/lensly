// Environment Variables Check Script
// Run: node check-env.js

const requiredEnvVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'NODE_ENV'
];

console.log('🔍 Checking environment variables...\n');

let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value || value.includes('REPLACE') || value.includes('your_')) {
    console.log(`❌ ${varName}: NOT SET or using placeholder`);
    allPresent = false;
  } else {
    // Show partial value for security
    const display = varName.includes('SECRET') || varName.includes('DATABASE')
      ? value.substring(0, 20) + '...'
      : value;
    console.log(`✅ ${varName}: ${display}`);
  }
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('✅ All environment variables are configured!');
  console.log('🚀 Ready to deploy to lensly.care');
} else {
  console.log('⚠️  Some environment variables are missing or not configured.');
  console.log('📝 Please update your .env file or hosting platform environment variables.');
  console.log('\nFor production deployment to lensly.care:');
  console.log('1. Go to your Stripe Dashboard: https://dashboard.stripe.com/apikeys');
  console.log('2. Copy your Live Secret Key (sk_live_...)');
  console.log('3. Get your Price ID from: https://dashboard.stripe.com/products');
  console.log('4. Set these in your hosting platform environment variables');
}

console.log('='.repeat(50) + '\n');
