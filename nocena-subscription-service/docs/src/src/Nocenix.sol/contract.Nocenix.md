# Nocenix
[Git Source](https://github.com/cadenpiper/app.nocena/blob/5816d082f11c57d7ed65d7f1fba8efe53fbdb25f/src/Nocenix.sol)

**Inherits:**
ERC20, Ownable

ERC20 token with mint/burn functionality for platform rewards and payments


## Functions
### constructor


```solidity
constructor() ERC20("Nocenix", "NCX") Ownable(msg.sender);
```

### mint

Mint NCX tokens (owner only)


```solidity
function mint(address _to, uint256 _amount) external onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_to`|`address`|Address to receive the minted tokens|
|`_amount`|`uint256`|Amount of tokens to mint (with 18 decimals)|


### burn

Burn NCX tokens (owner only)


```solidity
function burn(address _from, uint256 _amount) external onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_from`|`address`|Address to burn tokens from|
|`_amount`|`uint256`|Amount of tokens to burn (with 18 decimals)|


