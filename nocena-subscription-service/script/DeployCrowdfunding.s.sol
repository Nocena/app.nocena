// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrowdfundingEscrow.sol";
import "../src/Nocenix.sol";

contract DeployCrowdfundingScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // These would be the actual addresses on your target network
        address ncxToken = vm.envAddress("NCX_TOKEN_ADDRESS");
        address usdtToken = vm.envAddress("USDT_TOKEN_ADDRESS"); 
        address klayswapRouter = vm.envAddress("KLAYSWAP_ROUTER_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        CrowdfundingEscrow escrow = new CrowdfundingEscrow(
            ncxToken,
            usdtToken,
            klayswapRouter
        );
        
        console.log("CrowdfundingEscrow deployed at:", address(escrow));
        
        vm.stopBroadcast();
    }
}
