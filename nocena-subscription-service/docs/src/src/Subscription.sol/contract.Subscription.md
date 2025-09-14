# Subscription
[Git Source](https://github.com/cadenpiper/app.nocena/blob/5816d082f11c57d7ed65d7f1fba8efe53fbdb25f/src/Subscription.sol)

**Inherits:**
[NCXConverter](/src/NCXConverter.sol/abstract.NCXConverter.md), ReentrancyGuard

Multi-creator subscription system with NCX token payments and KlaySwap integration

*Allows creators to set individual prices, users to subscribe with NCX tokens,
and creators to swap NCX earnings to USDT via KlaySwap*


## State Variables
### subscriptionDuration
Fixed subscription duration (30 days)


```solidity
uint256 public immutable subscriptionDuration;
```


### MAX_PRICE
Maximum subscription price to prevent overflow attacks


```solidity
uint256 public constant MAX_PRICE = 1_000_000 * 10 ** 18;
```


### MIN_PRICE
Minimum subscription price to prevent spam


```solidity
uint256 public constant MIN_PRICE = 1 * 10 ** 18;
```


### subscriptionEnd
Tracks subscription end times: user => creator => tier => endTime


```solidity
mapping(address => mapping(address => mapping(SubscriptionTier => uint256))) public subscriptionEnd;
```


### tierPrices
Tracks creator subscription prices: creator => tier => price in NCX


```solidity
mapping(address => mapping(SubscriptionTier => uint256)) public tierPrices;
```


### subscriberCount
Public subscriber count for each creator


```solidity
mapping(address => uint256) public subscriberCount;
```


### totalEarnings
Private total earnings for creators (only creator can view)


```solidity
mapping(address => uint256) private totalEarnings;
```


## Functions
### constructor

Initialize the subscription contract


```solidity
constructor(address _ncxToken, address _usdtToken, address _klayswapRouter, uint256 _duration)
    NCXConverter(_ncxToken, _usdtToken, _klayswapRouter);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_ncxToken`|`address`|Address of the NCX token contract|
|`_usdtToken`|`address`|Address of the USDT token contract|
|`_klayswapRouter`|`address`|Address of the KlaySwap router|
|`_duration`|`uint256`|Subscription duration in seconds|


### setTierPrice

Creator sets their subscription price for a specific tier


```solidity
function setTierPrice(SubscriptionTier tier, uint256 _price) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`tier`|`SubscriptionTier`|Subscription tier (BASIC, PREMIUM, VIP)|
|`_price`|`uint256`|Price in NCX tokens (with 18 decimals)|


### subscribe

User subscribes to a creator at a specific tier

*Transfers NCX directly to creator and grants 30-day access*


```solidity
function subscribe(address creator, SubscriptionTier tier) external nonReentrant;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`creator`|`address`|Address of the creator to subscribe to|
|`tier`|`SubscriptionTier`|Subscription tier to purchase|


### cancelSubscription

User cancels their subscription to a creator for a specific tier


```solidity
function cancelSubscription(address creator, SubscriptionTier tier) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`creator`|`address`|Address of the creator to unsubscribe from|
|`tier`|`SubscriptionTier`|Subscription tier to cancel|


### isActive

Check if a user's subscription to a creator at specific tier is active


```solidity
function isActive(address user, address creator, SubscriptionTier tier) external view returns (bool);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|Address of the subscriber|
|`creator`|`address`|Address of the creator|
|`tier`|`SubscriptionTier`|Subscription tier to check|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`bool`|bool True if subscription is active, false otherwise|


### getCreatorEarnings

Get creator's total earnings (only creator can view)


```solidity
function getCreatorEarnings(address creator) external view returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`creator`|`address`|Address of the creator|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`uint256`|uint256 Total earnings in NCX tokens|


### swapNCXToUSDT

Creator swaps their NCX tokens to USDT via KlaySwap

*Requires creator to approve NCX tokens to this contract first*


```solidity
function swapNCXToUSDT(uint256 ncxAmount, uint256 minUSDTOut) external nonReentrant;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`ncxAmount`|`uint256`|Amount of NCX tokens to swap|
|`minUSDTOut`|`uint256`|Minimum USDT to receive (slippage protection)|


## Events
### Subscribed
Emitted when a user subscribes to a creator


```solidity
event Subscribed(address indexed user, address indexed creator, SubscriptionTier tier, uint256 endTime);
```

### SubscriptionCancelled
Emitted when a user cancels their subscription


```solidity
event SubscriptionCancelled(address indexed user, address indexed creator, SubscriptionTier tier);
```

### TierPriceSet
Emitted when a creator sets their subscription price


```solidity
event TierPriceSet(address indexed creator, SubscriptionTier tier, uint256 price);
```

## Errors
### CannotSubscribeToSelf
Thrown when trying to subscribe to yourself


```solidity
error CannotSubscribeToSelf();
```

### InvalidPrice
Thrown when price is outside allowed range


```solidity
error InvalidPrice();
```

### TierPriceNotSet
Thrown when creator hasn't set a price for tier


```solidity
error TierPriceNotSet();
```

### InvalidTokenAddress
Thrown when token addresses are invalid


```solidity
error InvalidTokenAddress();
```

### UnauthorizedAccess
Thrown when unauthorized access to earnings


```solidity
error UnauthorizedAccess();
```

## Enums
### SubscriptionTier
Subscription tier levels


```solidity
enum SubscriptionTier {
    BASIC,
    PREMIUM,
    VIP
}
```

