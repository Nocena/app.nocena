# Nocena Smart Contracts

Creator subscription system and crowdfunding escrow with NCX token payments on **Kaia Network**.

## Contracts

**Subscription Contract** - Creator subscriptions with BASIC/PREMIUM/VIP tiers
**CrowdfundingEscrow Contract** - Challenge funding with reward tiers  
**NCXConverter Module** - Shared NCX → USDT conversion via KlaySwap
**Nocenix Token** - Native ERC20 token with mint/burn functionality

## Setup

```bash
forge install
forge build
```

## Testing

```bash
# Run all tests
forge test

# Run with verbose output
forge test -v

# Run specific contract tests
forge test --match-contract SubscriptionTest
forge test --match-contract CrowdfundingEscrowTest
```

## Demo Script

```bash
# Run comprehensive demo (shows all functionality)
forge script script/Demo.s.sol:DemoScript --fork-url https://public-en.node.kaia.io --fork-block-number 195700000
```

## Key Functions

**Subscription:**
- `setTierPrice(tier, price)` - Set subscription prices
- `subscribe(creator, tier)` - Subscribe to creator
- `swapNCXToUSDT(amount, minOut)` - Convert NCX to USDT

**Crowdfunding:**
- `createChallenge(goal, duration, tiers...)` - Create funding challenge
- `contribute(challengeId, amount, tierIndex)` - Back a challenge
- `completeChallenge(challengeId)` - Mark challenge complete
- `claimFunds(challengeId, convertToUSDT, minOut)` - Claim raised funds

## Network

**Kaia Mainnet Fork:**
- RPC: `https://public-en.node.kaia.io`
- USDT: `0xd077A400968890Eacc75cdc901F0356c943e4fDb`
- KlaySwap Router: `0x6C14E2e4bae412137437A8Ec9e57263212d141A0`
