# CrowdfundingEscrow
[Git Source](https://github.com/cadenpiper/app.nocena/blob/5816d082f11c57d7ed65d7f1fba8efe53fbdb25f/src/CrowdfundingEscrow.sol)

**Inherits:**
[NCXConverter](/src/NCXConverter.sol/abstract.NCXConverter.md), ReentrancyGuard

Creators set goals, backers contribute NCX, funds held in escrow until completion


## State Variables
### challengeCounter

```solidity
uint256 public challengeCounter;
```


### challenges

```solidity
mapping(uint256 => Challenge) public challenges;
```


### contributions

```solidity
mapping(uint256 => mapping(address => Contribution)) public contributions;
```


## Functions
### constructor


```solidity
constructor(address _ncxToken, address _usdtToken, address _klayswapRouter)
    NCXConverter(_ncxToken, _usdtToken, _klayswapRouter);
```

### createChallenge

Create a new crowdfunding challenge with reward tiers


```solidity
function createChallenge(
    uint256 goalAmount,
    uint256 durationDays,
    uint256[] calldata tierMinAmounts,
    string[] calldata tierDescriptions,
    uint256[] calldata tierMaxBackers
) external returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`goalAmount`|`uint256`|Target NCX amount to raise|
|`durationDays`|`uint256`|Challenge duration in days|
|`tierMinAmounts`|`uint256[]`|Minimum NCX for each tier|
|`tierDescriptions`|`string[]`|Reward descriptions for each tier|
|`tierMaxBackers`|`uint256[]`|Maximum backers for each tier|


### contribute

Contribute NCX to a challenge and optionally select a reward tier


```solidity
function contribute(uint256 challengeId, uint256 amount, uint256 tierIndex) external nonReentrant;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`challengeId`|`uint256`|Challenge to back|
|`amount`|`uint256`|NCX amount to contribute|
|`tierIndex`|`uint256`|Reward tier (0 = no tier, 1+ = tier index)|


### completeChallenge

Creator marks challenge as completed (requires goal reached)


```solidity
function completeChallenge(uint256 challengeId) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`challengeId`|`uint256`|Challenge to mark as completed|


### claimFunds

Creator claims raised funds (NCX or converted to USDT)


```solidity
function claimFunds(uint256 challengeId, bool convertToUSDT, uint256 minUSDTOut) external nonReentrant;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`challengeId`|`uint256`|Challenge to claim from|
|`convertToUSDT`|`bool`|Whether to convert NCX to USDT|
|`minUSDTOut`|`uint256`|Minimum USDT if converting (slippage protection)|


### claimRefund

Claim refund if challenge failed (goal not reached by deadline)


```solidity
function claimRefund(uint256 challengeId) external nonReentrant;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`challengeId`|`uint256`|Challenge to claim refund from|


### getTierCount

Get the number of reward tiers for a challenge


```solidity
function getTierCount(uint256 challengeId) external view returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`challengeId`|`uint256`|Challenge to query|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`uint256`|Number of reward tiers|


### getTier

Get details of a specific reward tier


```solidity
function getTier(uint256 challengeId, uint256 tierIndex)
    external
    view
    returns (uint256 minContribution, string memory description, uint256 maxBackers, uint256 currentBackers);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`challengeId`|`uint256`|Challenge to query|
|`tierIndex`|`uint256`|Index of the tier (0-based)|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`minContribution`|`uint256`|Minimum NCX required for this tier|
|`description`|`string`|Reward description|
|`maxBackers`|`uint256`|Maximum number of backers allowed|
|`currentBackers`|`uint256`|Current number of backers in this tier|


## Events
### ChallengeCreated

```solidity
event ChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 goalAmount);
```

### ContributionMade

```solidity
event ContributionMade(uint256 indexed challengeId, address indexed backer, uint256 amount, uint256 tierIndex);
```

### ChallengeCompleted

```solidity
event ChallengeCompleted(uint256 indexed challengeId);
```

### FundsClaimed

```solidity
event FundsClaimed(uint256 indexed challengeId, uint256 amount);
```

## Errors
### InvalidGoalAmount

```solidity
error InvalidGoalAmount();
```

### InvalidDuration

```solidity
error InvalidDuration();
```

### ChallengeNotFound

```solidity
error ChallengeNotFound();
```

### ChallengeExpired

```solidity
error ChallengeExpired();
```

### ChallengeNotActive

```solidity
error ChallengeNotActive();
```

### InsufficientContribution

```solidity
error InsufficientContribution();
```

### TierCapReached

```solidity
error TierCapReached();
```

### NotCreator

```solidity
error NotCreator();
```

### GoalNotReached

```solidity
error GoalNotReached();
```

### AlreadyClaimed

```solidity
error AlreadyClaimed();
```

### NoContribution

```solidity
error NoContribution();
```

## Structs
### RewardTier

```solidity
struct RewardTier {
    uint256 minContribution;
    string description;
    uint256 maxBackers;
    uint256 currentBackers;
}
```

### Challenge

```solidity
struct Challenge {
    address creator;
    uint256 goalAmount;
    uint256 raisedAmount;
    uint256 deadline;
    bool completed;
    bool claimed;
    RewardTier[] tiers;
}
```

### Contribution

```solidity
struct Contribution {
    uint256 amount;
    uint256 tierIndex;
}
```

