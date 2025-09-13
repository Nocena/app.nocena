// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Subscription Contract Deployment Script
 * @notice Deploys the Nocena subscription system to Kaia Network
 * @dev This script:
 *      - Uses real Kaia mainnet token addresses (USDT, NCX, KlaySwap)
 *      - Deploys with 30-day subscription duration
 *      - Reads private key from .env file for secure deployment
 *      - Works on Kaia mainnet fork (testing)
 * 
 * Usage:
 *   Fork: forge script script/Demo.s.sol:DemoScript --fork-url https://public-en.node.kaia.io --fork-block-number 195700000
 *   Mainnet: forge script script/Demo.s.sol:DemoScript --rpc-url https://public-en.node.kaia.io --broadcast
 */

import {Script, console} from "forge-std/Script.sol";
import {Subscription} from "../src/Subscription.sol";

contract DemoScript is Script {
    // Real Kaia Mainnet Token Addresses
    address constant USDT = 0xd077A400968890Eacc75cdc901F0356c943e4fDb;
    address constant NOCENIX = 0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519;
    address constant KLAYSWAP_ROUTER = 0x6C14E2e4bae412137437A8Ec9e57263212d141A0;
    
    // Demo wallet with existing tokens (deployer address)
    address constant DEMO_WALLET = 0x0fd8926eeDF2D5E19692d18dF02a8fBef9DEc89a;
    
    function run() external {
        console.log("=== KAIA MAINNET FORK DEMO ===");
        console.log("Block:", block.number);
        console.log("Demo Wallet:", DEMO_WALLET);
        
        // Deploy subscription contract using private key from .env
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        
        // Deploy with real Kaia token addresses and 30-day duration
        Subscription subscription = new Subscription(
            NOCENIX,           // NCX token for payments
            USDT,              // USDT token for swaps
            KLAYSWAP_ROUTER,   // KlaySwap router for NCX->USDT
            30 days            // Subscription duration
        );
        
        console.log("Subscription Contract:", address(subscription));
        
        vm.stopBroadcast();
        
        // Display contract capabilities
        console.log("\n=== CONTRACT FEATURES ===");
        console.log("- Creators can set subscription prices");
        console.log("- Users pay NCX to subscribe to creators");
        console.log("- Creators receive NCX payments directly");
        console.log("- Creators can swap NCX to USDT via KlaySwap");
        
        console.log("\n=== READY FOR TESTING ===");
        console.log("Contract deployed successfully on Kaia fork!");
    }
}
