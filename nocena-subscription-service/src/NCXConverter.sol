// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IKLAYswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/// @title NCX Converter - Shared NCX to USDT conversion module
/// @notice Provides reusable NCX → USDT swap functionality via KlaySwap
abstract contract NCXConverter {
    IERC20 public immutable ncxToken;
    IERC20 public immutable usdtToken;
    IKLAYswapRouter public immutable klayswapRouter;
    
    event NCXSwappedToUSDT(address indexed user, uint256 ncxAmount, uint256 usdtReceived);
    
    error InvalidSwapAmount();
    error InsufficientNCXBalance();
    error InvalidAddress();
    
    constructor(address _ncxToken, address _usdtToken, address _klayswapRouter) {
        if (_ncxToken == address(0) || _usdtToken == address(0) || _klayswapRouter == address(0)) {
            revert InvalidAddress();
        }
        ncxToken = IERC20(_ncxToken);
        usdtToken = IERC20(_usdtToken);
        klayswapRouter = IKLAYswapRouter(_klayswapRouter);
    }
    
    /// @notice Swap NCX tokens to USDT via KlaySwap
    /// @param ncxAmount Amount of NCX to swap
    /// @param minUSDTOut Minimum USDT to receive (slippage protection)
    /// @param recipient Address to receive USDT
    function _swapNCXToUSDT(uint256 ncxAmount, uint256 minUSDTOut, address recipient) internal {
        ncxToken.approve(address(klayswapRouter), ncxAmount);
        
        address[] memory path = new address[](2);
        path[0] = address(ncxToken);
        path[1] = address(usdtToken);
        
        uint256[] memory amounts = klayswapRouter.swapExactTokensForTokens(
            ncxAmount,
            minUSDTOut,
            path,
            recipient,
            block.timestamp + 300 // 5 minute deadline
        );
        
        emit NCXSwappedToUSDT(recipient, ncxAmount, amounts[1]);
    }
}
