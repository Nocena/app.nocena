# NCXConverter
[Git Source](https://github.com/cadenpiper/app.nocena/blob/5816d082f11c57d7ed65d7f1fba8efe53fbdb25f/src/NCXConverter.sol)

Provides reusable NCX → USDT swap functionality via KlaySwap


## State Variables
### ncxToken

```solidity
IERC20 public immutable ncxToken;
```


### usdtToken

```solidity
IERC20 public immutable usdtToken;
```


### klayswapRouter

```solidity
IKLAYswapRouter public immutable klayswapRouter;
```


## Functions
### constructor


```solidity
constructor(address _ncxToken, address _usdtToken, address _klayswapRouter);
```

### _swapNCXToUSDT

Swap NCX tokens to USDT via KlaySwap


```solidity
function _swapNCXToUSDT(uint256 ncxAmount, uint256 minUSDTOut, address recipient) internal;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`ncxAmount`|`uint256`|Amount of NCX to swap|
|`minUSDTOut`|`uint256`|Minimum USDT to receive (slippage protection)|
|`recipient`|`address`|Address to receive USDT|


## Events
### NCXSwappedToUSDT

```solidity
event NCXSwappedToUSDT(address indexed user, uint256 ncxAmount, uint256 usdtReceived);
```

## Errors
### InvalidSwapAmount

```solidity
error InvalidSwapAmount();
```

### InsufficientNCXBalance

```solidity
error InsufficientNCXBalance();
```

### InvalidAddress

```solidity
error InvalidAddress();
```

