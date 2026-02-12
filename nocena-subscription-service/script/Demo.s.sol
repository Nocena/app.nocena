// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Subscription} from "../src/Subscription.sol";
import {CrowdfundingEscrow} from "../src/CrowdfundingEscrow.sol";
import {Nocenix} from "../src/Nocenix.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DemoScript is Script {
    address constant USDT = 0xd077A400968890Eacc75cdc901F0356c943e4fDb;
    address constant KLAYSWAP_ROUTER = 0x6C14E2e4bae412137437A8Ec9e57263212d141A0;
    
    Subscription subscription;
    CrowdfundingEscrow escrow;
    Nocenix ncxToken;
    
    function run() external {
        console.log("=== NOCENA CONTRACTS DEMO ===");
        console.log("Block:", block.number);
        
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(privateKey);
        
        ncxToken = new Nocenix();
        console.log("\n=== DEPLOYED TOKENS ===");
        console.log("NCX Token:", address(ncxToken));
        
        ncxToken.mint(deployer, 1000000 * 10**18);
        
        subscription = new Subscription(address(ncxToken), USDT, KLAYSWAP_ROUTER, 30 days);
        escrow = new CrowdfundingEscrow(address(ncxToken), USDT, KLAYSWAP_ROUTER);
        
        console.log("\n=== DEPLOYED CONTRACTS ===");
        console.log("Subscription:", address(subscription));
        console.log("CrowdfundingEscrow:", address(escrow));
        
        console.log("\n=== SUBSCRIPTION CONTRACT DATA ===");
        console.log("Subscription Duration:", subscription.subscriptionDuration());
        console.log("Min Price:", subscription.MIN_PRICE());
        console.log("Max Price:", subscription.MAX_PRICE());
        console.log("NCX Token:", address(subscription.ncxToken()));
        console.log("USDT Token:", address(subscription.usdtToken()));
        console.log("KlaySwap Router:", address(subscription.klayswapRouter()));
        
        console.log("\n=== CROWDFUNDING CONTRACT DATA ===");
        console.log("Challenge Counter:", escrow.challengeCounter());
        console.log("NCX Token:", address(escrow.ncxToken()));
        console.log("USDT Token:", address(escrow.usdtToken()));
        console.log("KlaySwap Router:", address(escrow.klayswapRouter()));
        
        console.log("\n=== NCX TOKEN DATA ===");
        console.log("NCX Balance of Deployer:", ncxToken.balanceOf(deployer));
        console.log("NCX Total Supply:", ncxToken.totalSupply());
        console.log("NCX Name:", ncxToken.name());
        console.log("NCX Symbol:", ncxToken.symbol());
        
        // Demo subscription functionality
        console.log("\n=== SUBSCRIPTION DEMO ===");
        
        // Creator sets tier prices
        subscription.setTierPrice(Subscription.SubscriptionTier.BASIC, 10 * 10**18);
        subscription.setTierPrice(Subscription.SubscriptionTier.PREMIUM, 25 * 10**18);
        subscription.setTierPrice(Subscription.SubscriptionTier.VIP, 50 * 10**18);
        console.log("Creator set tier prices: BASIC=10 NCX, PREMIUM=25 NCX, VIP=50 NCX");
        
        // Check tier prices
        console.log("BASIC tier price:", subscription.tierPrices(deployer, Subscription.SubscriptionTier.BASIC));
        console.log("PREMIUM tier price:", subscription.tierPrices(deployer, Subscription.SubscriptionTier.PREMIUM));
        console.log("VIP tier price:", subscription.tierPrices(deployer, Subscription.SubscriptionTier.VIP));
        
        // Check subscriber count
        console.log("Subscriber count:", subscription.subscriberCount(deployer));
        
        _demoUserSubscription();
        
        // Demo crowdfunding functionality
        console.log("\n=== CROWDFUNDING DEMO ===");
        
        // Create challenge with reward tiers
        uint256[] memory tierAmounts = new uint256[](3);
        tierAmounts[0] = 5 * 10**18;   // 5 NCX
        tierAmounts[1] = 20 * 10**18;  // 20 NCX
        tierAmounts[2] = 50 * 10**18;  // 50 NCX
        
        string[] memory tierDescs = new string[](3);
        tierDescs[0] = "Basic Supporter";
        tierDescs[1] = "Premium Backer";
        tierDescs[2] = "VIP Sponsor";
        
        uint256[] memory tierMaxBackers = new uint256[](3);
        tierMaxBackers[0] = 100;
        tierMaxBackers[1] = 50;
        tierMaxBackers[2] = 10;
        
        uint256 challengeId = escrow.createChallenge(
            1000 * 10**18,  // Goal: 1000 NCX
            30,             // Duration: 30 days
            tierAmounts,
            tierDescs,
            tierMaxBackers
        );
        
        console.log("Created challenge ID:", challengeId);
        console.log("Challenge goal: 1000 NCX");
        console.log("Challenge duration: 30 days");
        console.log("Reward tiers: 3");
        
        // Check challenge data
        (address creator, uint256 goal, uint256 raised, , bool completed, bool claimed) = escrow.challenges(challengeId);
        console.log("Challenge creator:", creator);
        console.log("Goal amount:", goal);
        console.log("Raised amount:", raised);
        console.log("Completed:", completed);
        console.log("Claimed:", claimed);
        
        // Check tier details
        console.log("Tier count:", escrow.getTierCount(challengeId));
        (uint256 minContrib, string memory desc, uint256 maxBackers, uint256 currentBackers) = escrow.getTier(challengeId, 0);
        console.log("Tier 1 min contribution:", minContrib);
        console.log("Tier 1 description:", desc);
        console.log("Tier 1 max backers:", maxBackers);
        console.log("Tier 1 current backers:", currentBackers);
        
        _demoContributions(challengeId);
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
    }
    
    function _demoContributions(uint256 challengeId) internal {
        console.log("\n=== CONTRIBUTION DEMO ===");
        
        ncxToken.approve(address(escrow), 100 * 10**18);
        escrow.contribute(challengeId, 10 * 10**18, 1);
        console.log("Contributed 10 NCX to tier 1");
        
        escrow.contribute(challengeId, 25 * 10**18, 2);
        console.log("Contributed 25 NCX to tier 2");
        
        (, , uint256 raisedAfter, , ,) = escrow.challenges(challengeId);
        console.log("Total raised:", raisedAfter);
        
        (uint256 amount, uint256 tier) = escrow.contributions(challengeId, vm.addr(vm.envUint("PRIVATE_KEY")));
        console.log("User contribution:", amount);
        console.log("User tier:", tier);
        
        _demoCompletion(challengeId);
    }
    
    function _demoCompletion(uint256 challengeId) internal {
        console.log("\n=== COMPLETION DEMO ===");
        
        // Add more contributions to reach goal
        ncxToken.approve(address(escrow), 1000 * 10**18);
        escrow.contribute(challengeId, 965 * 10**18, 0); // No tier, just reach goal
        console.log("Added 965 NCX to reach 1000 NCX goal");
        
        // Check if goal reached
        (, , uint256 finalRaised, , ,) = escrow.challenges(challengeId);
        console.log("Final raised amount:", finalRaised);
        
        // Complete the challenge
        escrow.completeChallenge(challengeId);
        console.log("Challenge marked as completed");
        
        // Check completion status
        (, , , , bool isCompleted,) = escrow.challenges(challengeId);
        console.log("Challenge completed:", isCompleted);
        
        // Claim funds as NCX (not converting to USDT)
        uint256 balanceBefore = ncxToken.balanceOf(vm.addr(vm.envUint("PRIVATE_KEY")));
        escrow.claimFunds(challengeId, false, 0);
        uint256 balanceAfter = ncxToken.balanceOf(vm.addr(vm.envUint("PRIVATE_KEY")));
        
        console.log("NCX balance before claim:", balanceBefore);
        console.log("NCX balance after claim:", balanceAfter);
        console.log("NCX claimed:", balanceAfter - balanceBefore);
    }
    
    function _demoUserSubscription() internal {
        console.log("\n=== USER SUBSCRIPTION DEMO ===");
        
        address creator = vm.addr(vm.envUint("PRIVATE_KEY"));
        address whale = 0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6;
        
        // Give whale NCX tokens
        ncxToken.mint(whale, 1000 * 10**18);
        console.log("Minted 1000 NCX for whale user");
        
        vm.stopBroadcast();
        
        // Whale subscribes
        vm.startBroadcast(whale);
        ncxToken.approve(address(subscription), 100 * 10**18);
        subscription.subscribe(creator, Subscription.SubscriptionTier.PREMIUM);
        vm.stopBroadcast();
        
        console.log("Whale subscribed to PREMIUM tier (25 NCX)");
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Check results
        bool isActive = subscription.isActive(whale, creator, Subscription.SubscriptionTier.PREMIUM);
        console.log("PREMIUM subscription active:", isActive);
        console.log("Creator subscriber count:", subscription.subscriberCount(creator));
        
        uint256 endTime = subscription.subscriptionEnd(whale, creator, Subscription.SubscriptionTier.PREMIUM);
        console.log("Subscription ends at:", endTime);
        console.log("Current timestamp:", block.timestamp);
    }
}
