// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CrowdfundingEscrow} from "../src/CrowdfundingEscrow.sol";
import {Nocenix} from "../src/Nocenix.sol";

contract MockUSDT {
    mapping(address => uint256) public balanceOf;
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[to] += amount;
        return true;
    }
}

contract MockRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256,
        address[] calldata,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn * 2; // Mock 2:1 swap rate
        MockUSDT(0x1234567890123456789012345678901234567890).transfer(to, amounts[1]);
    }
}

contract CrowdfundingEscrowTest is Test {
    CrowdfundingEscrow public escrow;
    Nocenix public ncx;
    MockUSDT public usdt;
    MockRouter public router;
    
    address public creator = address(0x1);
    address public backer1 = address(0x2);
    address public backer2 = address(0x3);

    function setUp() public {
        ncx = new Nocenix();
        usdt = new MockUSDT();
        router = new MockRouter();
        
        vm.etch(address(0x1234567890123456789012345678901234567890), address(usdt).code);
        
        escrow = new CrowdfundingEscrow(address(ncx), address(usdt), address(router));
        
        // Mint NCX tokens for testing
        ncx.mint(backer1, 1000e18);
        ncx.mint(backer2, 1000e18);
        
        // Approve escrow to spend tokens
        vm.prank(backer1);
        ncx.approve(address(escrow), type(uint256).max);
        vm.prank(backer2);
        ncx.approve(address(escrow), type(uint256).max);
    }

    function testCreateChallenge() public {
        vm.prank(creator);
        
        uint256[] memory tierAmounts = new uint256[](2);
        tierAmounts[0] = 10e18;
        tierAmounts[1] = 50e18;
        
        string[] memory tierDescs = new string[](2);
        tierDescs[0] = "Basic Reward";
        tierDescs[1] = "Premium Reward";
        
        uint256[] memory tierMaxBackers = new uint256[](2);
        tierMaxBackers[0] = 100;
        tierMaxBackers[1] = 10;
        
        uint256 challengeId = escrow.createChallenge(
            1000e18, // goal
            30,      // duration days
            tierAmounts,
            tierDescs,
            tierMaxBackers
        );
        
        assertEq(challengeId, 1);
        assertEq(escrow.getTierCount(challengeId), 2);
    }

    function testContribute() public {
        // Create challenge first
        vm.prank(creator);
        uint256[] memory tierAmounts = new uint256[](1);
        tierAmounts[0] = 10e18;
        string[] memory tierDescs = new string[](1);
        tierDescs[0] = "Basic";
        uint256[] memory tierMaxBackers = new uint256[](1);
        tierMaxBackers[0] = 100;
        
        uint256 challengeId = escrow.createChallenge(100e18, 30, tierAmounts, tierDescs, tierMaxBackers);
        
        // Contribute
        vm.prank(backer1);
        escrow.contribute(challengeId, 50e18, 1);
        
        (,, uint256 raisedAmount,,,) = escrow.challenges(challengeId);
        assertEq(raisedAmount, 50e18);
    }

    function testCompleteAndClaimFunds() public {
        // Create and fund challenge
        vm.prank(creator);
        uint256[] memory empty = new uint256[](0);
        string[] memory emptyStr = new string[](0);
        uint256 challengeId = escrow.createChallenge(100e18, 30, empty, emptyStr, empty);
        
        vm.prank(backer1);
        escrow.contribute(challengeId, 100e18, 0);
        
        // Complete challenge
        vm.prank(creator);
        escrow.completeChallenge(challengeId);
        
        // Claim funds
        vm.prank(creator);
        escrow.claimFunds(challengeId, false, 0);
        
        assertEq(ncx.balanceOf(creator), 100e18);
    }
}
