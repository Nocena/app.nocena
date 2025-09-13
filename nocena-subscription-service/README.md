# Nocena Subscription Contract

Creator subscription system with NCX token payments and KlaySwap integration on **Kaia Network**.

## Features

- **Subscription Tiers**: BASIC, PREMIUM, VIP with individual pricing
- **Creator Analytics**: Public subscriber counts, private earnings tracking
- Creators set their own subscription prices in NCX tokens
- Users pay NCX to subscribe to creators for 30 days
- Creators receive payments directly
- Built-in KlaySwap integration to swap NCX → USDT
- **Deployed on Kaia Mainnet Fork**

## Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd nocena-subscription
forge install
```

2. **Create environment file:**
```bash
cp .env.example .env
# Edit .env with your private key
```

3. **Build contracts:**
```bash
forge build
```

4. **Clean cache (if needed):**
```bash
forge clean
```

## Testing & Deployment

### Run Tests
```bash
forge test
```

### Deploy to Kaia Mainnet Fork
```bash
forge script script/Demo.s.sol:DemoScript --fork-url https://public-en.node.kaia.io --fork-block-number 195700000
```

## Contract Functions

- `setTierPrice(tier, price)` - Creator sets subscription price for tier (BASIC/PREMIUM/VIP)
- `subscribe(creator, tier)` - User subscribes to creator at specific tier
- `isActive(user, creator, tier)` - Check subscription status for specific tier
- `swapNCXToUSDT(amount, minOut)` - Creator swaps NCX to USDT
- `subscriberCount(creator)` - Public view of creator's subscriber count
- `getCreatorEarnings(creator)` - Creator-only view of total earnings
