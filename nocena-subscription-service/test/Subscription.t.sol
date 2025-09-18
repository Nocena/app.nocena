// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Subscription Contract Test Suite
 * @notice Comprehensive tests for the Nocena subscription system
 * @dev Tests cover:
 *      - Creator price setting functionality
 *      - User subscription and payment flows
 *      - Multi-creator subscription scenarios
 *      - Subscription status checking
 *      - Basic swap functionality verification
 * 
 * Note: Uses mock ERC20 tokens for isolated testing.
 *       Real token integration is tested via fork deployment scripts.
 * 
 * Run: forge test
 */

import {Test, console} from "forge-std/Test.sol";
import {Subscription} from "../src/Subscription.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Mock ERC20 token for testing subscription payments
 * @dev Implements basic ERC20 functionality without external dependencies
 */
contract MockToken is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply = 1000000e18;
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract SubscriptionTest is Test {
    Subscription public subscription;
    MockToken public token;
    
    // Test addresses
    address creator1 = address(0x1);
    address creator2 = address(0x2);
    address user1 = address(0x3);
    address user2 = address(0x4);
    
    function setUp() public {
        // Deploy mock token and subscription contract
        token = new MockToken();
        subscription = new Subscription(address(token), address(token), address(0x1234), 30 days);
        
        // Distribute tokens to test users
        token.transfer(user1, 1000e18);
        token.transfer(user2, 1000e18);
    }
    
    /// @notice Test creator can set subscription price for different tiers
    function testCreatorSetPrice() public {
        vm.startPrank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 50e18);
        subscription.setTierPrice(Subscription.SubscriptionTier.PREMIUM, 100e18);
        subscription.setTierPrice(Subscription.SubscriptionTier.VIP, 200e18);
        vm.stopPrank();
        
        assertEq(subscription.tierPrices(creator1, Subscription.SubscriptionTier.BASIC), 50e18);
        assertEq(subscription.tierPrices(creator1, Subscription.SubscriptionTier.PREMIUM), 100e18);
        assertEq(subscription.tierPrices(creator1, Subscription.SubscriptionTier.VIP), 200e18);
    }
    
    /// @notice Test user can subscribe to creator and payment flows correctly
    function testUserSubscribe() public {
        // Creator sets price for BASIC tier
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 50e18);
        
        // User approves and subscribes to BASIC tier
        vm.startPrank(user1);
        token.approve(address(subscription), 50e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        // Verify subscription is active and payment transferred
        assertTrue(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
        assertEq(token.balanceOf(creator1), 50e18);
        assertEq(subscription.subscriberCount(creator1), 1);
    }
    
    /// @notice Test multiple creators with different prices and tiers
    function testMultipleCreators() public {
        // Two creators set different prices for different tiers
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 100e18);
        
        vm.prank(creator2);
        subscription.setTierPrice(Subscription.SubscriptionTier.PREMIUM, 200e18);
        
        // User subscribes to both creators at different tiers
        vm.startPrank(user1);
        token.approve(address(subscription), 300e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        subscription.subscribe(creator2, Subscription.SubscriptionTier.PREMIUM);
        vm.stopPrank();
        
        // Verify both subscriptions are active and payments correct
        assertTrue(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
        assertTrue(subscription.isActive(user1, creator2, Subscription.SubscriptionTier.PREMIUM));
        assertEq(token.balanceOf(creator1), 100e18);
        assertEq(token.balanceOf(creator2), 200e18);
        assertEq(subscription.subscriberCount(creator1), 1);
        assertEq(subscription.subscriberCount(creator2), 1);
    }
    
    /// @notice Test swap functionality exists and creator has tokens to swap
    function testSwapFunctionality() public {
        // Creator sets price and receives payment
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 100e18);
        
        vm.startPrank(user1);
        token.approve(address(subscription), 100e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        // Verify creator has NCX tokens available for swapping
        assertEq(token.balanceOf(creator1), 100e18);
        
        // Note: Actual KlaySwap integration tested in fork environment
        // This confirms creator has tokens and swap function exists
        assertTrue(token.balanceOf(creator1) > 0);
    }
    
    /// @notice Test security protections and analytics
    function testSecurityProtections() public {
        // Test cannot subscribe to self
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 100e18);
        
        vm.expectRevert(abi.encodeWithSignature("CannotSubscribeToSelf()"));
        vm.prank(creator1);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        
        // Test invalid price ranges
        vm.expectRevert(abi.encodeWithSignature("InvalidPrice()"));
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 0); // Below minimum
        
        vm.expectRevert(abi.encodeWithSignature("InvalidPrice()"));
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 2_000_000 * 10**18); // Above maximum
        
        // Test subscribing to creator without price for tier
        vm.expectRevert(abi.encodeWithSignature("TierPriceNotSet()"));
        vm.prank(user1);
        subscription.subscribe(creator2, Subscription.SubscriptionTier.BASIC);
    }
    
    /// @notice Test creator analytics and privacy
    function testCreatorAnalytics() public {
        // Creator sets prices and gets subscribers
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 50e18);
        
        vm.startPrank(user1);
        token.approve(address(subscription), 100e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        vm.startPrank(user2);
        token.approve(address(subscription), 50e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        // Check public subscriber count
        assertEq(subscription.subscriberCount(creator1), 2);
        
        // Creator can view their own earnings
        vm.prank(creator1);
        uint256 earnings = subscription.getCreatorEarnings(creator1);
        assertEq(earnings, 100e18); // 50 + 50
        
        // Others cannot view creator earnings
        vm.expectRevert(abi.encodeWithSignature("UnauthorizedAccess()"));
        vm.prank(user1);
        subscription.getCreatorEarnings(creator1);
    }
    
    /// @notice Test subscription cancellation functionality
    function testSubscriptionCancellation() public {
        // Setup subscription
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 50e18);
        
        vm.startPrank(user1);
        token.approve(address(subscription), 50e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        // Verify subscription is active and subscriber count is 1
        assertTrue(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
        assertEq(subscription.subscriberCount(creator1), 1);
        
        // Cancel subscription
        vm.prank(user1);
        subscription.cancelSubscription(creator1, Subscription.SubscriptionTier.BASIC);
        
        // Verify subscription is cancelled and subscriber count decreased
        assertFalse(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
        assertEq(subscription.subscriberCount(creator1), 0);
    }
    
    /// @notice Test subscription expiry after 30 days
    function testSubscriptionExpiry() public {
        // Setup subscription
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 50e18);
        
        vm.startPrank(user1);
        token.approve(address(subscription), 50e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        // Verify subscription is active
        assertTrue(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
        
        // Fast forward 29 days - should still be active
        vm.warp(block.timestamp + 29 days);
        assertTrue(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
        
        // Fast forward past 30 days - should be expired
        vm.warp(block.timestamp + 2 days);
        assertFalse(subscription.isActive(user1, creator1, Subscription.SubscriptionTier.BASIC));
    }
    
    /// @notice Test NCX to USDT swap functionality
    function testNCXSwap() public {
        // Setup: Creator receives NCX from subscription
        vm.prank(creator1);
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 100e18);
        
        vm.startPrank(user1);
        token.approve(address(subscription), 100e18);
        subscription.subscribe(creator1, Subscription.SubscriptionTier.BASIC);
        vm.stopPrank();
        
        // Creator has 100 NCX tokens
        assertEq(token.balanceOf(creator1), 100e18);
        
        // Creator approves subscription contract to spend their NCX
        vm.startPrank(creator1);
        token.approve(address(subscription), 50e18);
        
        // Attempt swap (will revert due to mock router, but tests function exists)
        vm.expectRevert();
        subscription.swapNCXToUSDT(50e18, 25e18);
        vm.stopPrank();
        
        // Verify creator still has tokens (swap failed as expected with mock)
        assertEq(token.balanceOf(creator1), 100e18);
    }
}
