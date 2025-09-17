// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Comprehensive Deployment Script
 * @notice Deploys all Nocena contracts to Kaia Network
 * @dev Deploys Nocenix token, Subscription, and CrowdfundingEscrow contracts
 * 
 * Usage:
 *   Local Fork: forge script script/Demo.s.sol:DemoScript --rpc-url http://localhost:8545 --broadcast
 */

import {Script, console} from "forge-std/Script.sol";
import {Subscription} from "../src/Subscription.sol";
import {CrowdfundingEscrow} from "../src/CrowdfundingEscrow.sol";
import {Nocenix} from "../src/Nocenix.sol";

contract DemoScript is Script {
    // Real Kaia Mainnet Token Addresses
    address constant USDT = 0xd077A400968890Eacc75cdc901F0356c943e4fDb;
    address constant KLAYSWAP_ROUTER = 0x6C14E2e4bae412137437A8Ec9e57263212d141A0;
    
    function run() external {
        console.log("=== KAIA MAINNET FORK DEMO ===");
        console.log("Block:", block.number);
        
        // Use anvil's first default private key
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Nocenix token first
        Nocenix ncxToken = new Nocenix();
        
        // Deploy Subscription contract
        Subscription subscription = new Subscription(
            address(ncxToken),     // NCX token for payments
            USDT,                  // USDT token for swaps
            KLAYSWAP_ROUTER,       // KlaySwap router for NCX->USDT
            30 days                // Subscription duration
        );
        
        // Deploy CrowdfundingEscrow contract
        CrowdfundingEscrow crowdfunding = new CrowdfundingEscrow(
            address(ncxToken),     // NCX token for payments
            USDT,                  // USDT token for swaps
            KLAYSWAP_ROUTER        // KlaySwap router for NCX->USDT
        );
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYED CONTRACTS ===");
        console.log("Nocenix Token:", address(ncxToken));
        console.log("Subscription Contract:", address(subscription));
        console.log("CrowdfundingEscrow Contract:", address(crowdfunding));
        console.log("USDT Token:", USDT);
        console.log("KlaySwap Router:", KLAYSWAP_ROUTER);
        
        console.log("\n=== CONTRACT FEATURES ===");
        console.log("SUBSCRIPTION:");
        console.log("- Creators set BASIC/PREMIUM/VIP tier prices");
        console.log("- Users pay NCX to subscribe to creators");
        console.log("- Creators receive NCX payments directly");
        console.log("- Creators can swap NCX to USDT via KlaySwap");
        
        console.log("\nCROWDFUNDING:");
        console.log("- Creators set funding goals with reward tiers");
        console.log("- Backers contribute NCX to challenges");
        console.log("- Funds held in escrow until completion");
        console.log("- Automatic refunds if goals not met");
        
        console.log("\n=== READY FOR TESTING ===");
        console.log("All contracts deployed successfully on Kaia fork!");
    }
}
