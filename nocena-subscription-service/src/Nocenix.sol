// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Nocenix Token - Native token for Nocena ecosystem
/// @notice ERC20 token with mint/burn functionality for platform rewards and payments
contract Nocenix is ERC20, Ownable {
    constructor() ERC20("Nocenix", "NCX") Ownable(msg.sender) {}

    /// @notice Mint NCX tokens (owner only)
    /// @param _to Address to receive the minted tokens
    /// @param _amount Amount of tokens to mint (with 18 decimals)
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    /// @notice Burn NCX tokens (owner only)
    /// @param _from Address to burn tokens from
    /// @param _amount Amount of tokens to burn (with 18 decimals)
    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }
}
