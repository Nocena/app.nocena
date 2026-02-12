# Nocena Subscription Service

Creator subscription system with NCX token payments on Kaia Network.

## Features

- **Multi-tier subscriptions**: BASIC, PREMIUM, VIP with custom pricing
- **Direct NCX payments**: Creators receive tokens instantly
- **KlaySwap integration**: Built-in NCX → USDT conversion
- **30-day subscriptions**: Fixed duration with automatic expiry

## Setup

```bash
# Install dependencies
forge install

# Build contracts
forge build
```

## Testing

```bash
# Run all tests (uses forge's default test accounts)
forge test

# Run with verbose output
forge test -v
```

## Local Development

### Start Local Fork
```bash
# Start anvil fork at specific block with funded accounts
anvil --fork-url https://public-en.node.kaia.io --fork-block-number 195700000 --port 8545 --balance 1000 --auto-impersonate
```

### Deploy to Fork
```bash
# Deploy using first anvil account (no private key needed)
forge script script/Demo.s.sol:DemoScript --rpc-url http://localhost:8545 --broadcast

# Clean up old deployment files when necessary
rm -rf broadcast/ cache/
```

**Note**: Uses anvil's first default account with its well-known private key (safe for local development only).

## Key Functions

**Subscription Contract:**
- `setTierPrice(tier, price)` - Set subscription prices for BASIC/PREMIUM/VIP tiers
- `subscribe(creator, tier)` - Subscribe to creator at specific tier
- `cancelSubscription(creator, tier)` - Cancel subscription
- `isActive(user, creator, tier)` - Check subscription status
- `swapNCXToUSDT(amount, minOut)` - Convert earnings to USDT
- `getCreatorEarnings(creator)` - View total earnings

**CrowdfundingEscrow Contract:**
- `createChallenge(goal, duration, tiers...)` - Create funding challenge with reward tiers
- `contribute(challengeId, amount, tierIndex)` - Back a challenge and select reward tier
- `completeChallenge(challengeId)` - Mark challenge as completed (creator only)
- `claimFunds(challengeId, convertToUSDT, minOut)` - Claim raised funds as NCX or USDT
- `claimRefund(challengeId)` - Get refund if challenge fails
- `getTierCount(challengeId)` - View number of reward tiers
- `getTier(challengeId, tierIndex)` - View tier details and availability

## Network Details

- **Chain ID**: 8217 (Kaia Mainnet)
- **USDT**: `0xd077A400968890Eacc75cdc901F0356c943e4fDb`
- **KlaySwap Router**: `0x6C14E2e4bae412137437A8Ec9e57263212d141A0`
