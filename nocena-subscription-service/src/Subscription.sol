// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NCXConverter.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Subscription Contract
 * @notice Multi-creator subscription system with NCX token payments and KlaySwap integration
 * @dev Allows creators to set individual prices, users to subscribe with NCX tokens,
 *      and creators to swap NCX earnings to USDT via KlaySwap
 */

contract Subscription is NCXConverter, ReentrancyGuard {
    /// @notice Subscription tier levels
    enum SubscriptionTier { BASIC, PREMIUM, VIP }
    
    /// @notice Fixed subscription duration (30 days)
    uint256 public immutable subscriptionDuration;
    
    /// @notice Maximum subscription price to prevent overflow attacks
    uint256 public constant MAX_PRICE = 1_000_000 * 10**18; // 1M NCX max
    /// @notice Minimum subscription price to prevent spam
    uint256 public constant MIN_PRICE = 1 * 10**18; // 1 NCX min
    
    /// @notice Tracks subscription end times: user => creator => tier => endTime
    mapping(address => mapping(address => mapping(SubscriptionTier => uint256))) public subscriptionEnd;
    /// @notice Tracks creator subscription prices: creator => tier => price in NCX
    mapping(address => mapping(SubscriptionTier => uint256)) public tierPrices;
    /// @notice Public subscriber count for each creator
    mapping(address => uint256) public subscriberCount;
    /// @notice Private total earnings for creators (only creator can view)
    mapping(address => uint256) private totalEarnings;
    
    /// @notice Emitted when a user subscribes to a creator
    event Subscribed(address indexed user, address indexed creator, SubscriptionTier tier, uint256 endTime);
    /// @notice Emitted when a user cancels their subscription
    event SubscriptionCancelled(address indexed user, address indexed creator, SubscriptionTier tier);
    /// @notice Emitted when a creator sets their subscription price
    event TierPriceSet(address indexed creator, SubscriptionTier tier, uint256 price);
    
    /// @notice Thrown when trying to subscribe to yourself
    error CannotSubscribeToSelf();
    /// @notice Thrown when price is outside allowed range
    error InvalidPrice();
    /// @notice Thrown when creator hasn't set a price for tier
    error TierPriceNotSet();
    /// @notice Thrown when unauthorized access to earnings
    error UnauthorizedAccess();
    
    /**
     * @notice Initialize the subscription contract
     * @param _ncxToken Address of the NCX token contract
     * @param _usdtToken Address of the USDT token contract
     * @param _klayswapRouter Address of the KlaySwap router
     * @param _duration Subscription duration in seconds
     */
    constructor(address _ncxToken, address _usdtToken, address _klayswapRouter, uint256 _duration)
        NCXConverter(_ncxToken, _usdtToken, _klayswapRouter) {
        subscriptionDuration = _duration;
    }
    
    /**
     * @notice Creator sets their subscription price for a specific tier
     * @param tier Subscription tier (BASIC, PREMIUM, VIP)
     * @param _price Price in NCX tokens (with 18 decimals)
     */
    function setTierPrice(SubscriptionTier tier, uint256 _price) external {
        if (_price < MIN_PRICE || _price > MAX_PRICE) {
            revert InvalidPrice();
        }
        
        tierPrices[msg.sender][tier] = _price;
        emit TierPriceSet(msg.sender, tier, _price);
    }
    
    /**
     * @notice User subscribes to a creator at a specific tier
     * @param creator Address of the creator to subscribe to
     * @param tier Subscription tier to purchase
     * @dev Transfers NCX directly to creator and grants 30-day access
     */
    function subscribe(address creator, SubscriptionTier tier) external nonReentrant {
        if (creator == msg.sender) {
            revert CannotSubscribeToSelf();
        }
        
        uint256 price = tierPrices[creator][tier];
        if (price == 0) {
            revert TierPriceNotSet();
        }
        
        // Check if user is already subscribed to this tier
        bool wasSubscribed = subscriptionEnd[msg.sender][creator][tier] > block.timestamp;
        
        ncxToken.transferFrom(msg.sender, creator, price);
        subscriptionEnd[msg.sender][creator][tier] = block.timestamp + subscriptionDuration;
        
        // Update analytics
        if (!wasSubscribed) {
            subscriberCount[creator]++;
        }
        totalEarnings[creator] += price;
        
        emit Subscribed(msg.sender, creator, tier, subscriptionEnd[msg.sender][creator][tier]);
    }
    
    /**
     * @notice User cancels their subscription to a creator for a specific tier
     * @param creator Address of the creator to unsubscribe from
     * @param tier Subscription tier to cancel
     */
    function cancelSubscription(address creator, SubscriptionTier tier) external {
        bool wasSubscribed = subscriptionEnd[msg.sender][creator][tier] > block.timestamp;
        
        subscriptionEnd[msg.sender][creator][tier] = block.timestamp;
        
        // Update subscriber count if was active
        if (wasSubscribed) {
            subscriberCount[creator]--;
        }
        
        emit SubscriptionCancelled(msg.sender, creator, tier);
    }
    
    /**
     * @notice Check if a user's subscription to a creator at specific tier is active
     * @param user Address of the subscriber
     * @param creator Address of the creator
     * @param tier Subscription tier to check
     * @return bool True if subscription is active, false otherwise
     */
    function isActive(address user, address creator, SubscriptionTier tier) external view returns (bool) {
        return subscriptionEnd[user][creator][tier] > block.timestamp;
    }
    
    /**
     * @notice Get creator's total earnings (only creator can view)
     * @param creator Address of the creator
     * @return uint256 Total earnings in NCX tokens
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        if (msg.sender != creator) {
            revert UnauthorizedAccess();
        }
        return totalEarnings[creator];
    }
    
    /**
     * @notice Creator swaps their NCX tokens to USDT via KlaySwap
     * @param ncxAmount Amount of NCX tokens to swap
     * @param minUSDTOut Minimum USDT to receive (slippage protection)
     * @dev Requires creator to approve NCX tokens to this contract first
     */
    function swapNCXToUSDT(uint256 ncxAmount, uint256 minUSDTOut) external nonReentrant {
        ncxToken.transferFrom(msg.sender, address(this), ncxAmount);
        _swapNCXToUSDT(ncxAmount, minUSDTOut, msg.sender);
    }
}
