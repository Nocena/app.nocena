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
    MockUSDT public usdt;
    
    constructor(address _usdt) {
        usdt = MockUSDT(_usdt);
    }
    
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
        usdt.transfer(to, amounts[1]);
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
        router = new MockRouter(address(usdt));
        
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

    function testRefundMechanism() public {
        // Create challenge that will fail
        vm.prank(creator);
        uint256[] memory empty = new uint256[](0);
        string[] memory emptyStr = new string[](0);
        uint256 challengeId = escrow.createChallenge(1000e18, 1, empty, emptyStr, empty);
        
        // Backer contributes but goal won't be reached
        vm.prank(backer1);
        escrow.contribute(challengeId, 100e18, 0);
        
        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);
        
        // Backer can claim refund
        uint256 balanceBefore = ncx.balanceOf(backer1);
        vm.prank(backer1);
        escrow.claimRefund(challengeId);
        
        assertEq(ncx.balanceOf(backer1), balanceBefore + 100e18);
    }

    function testTierCapacityLimits() public {
        vm.prank(creator);
        uint256[] memory tierAmounts = new uint256[](1);
        tierAmounts[0] = 10e18;
        string[] memory tierDescs = new string[](1);
        tierDescs[0] = "Limited Tier";
        uint256[] memory tierMaxBackers = new uint256[](1);
        tierMaxBackers[0] = 1; // Only 1 backer allowed
        
        uint256 challengeId = escrow.createChallenge(100e18, 30, tierAmounts, tierDescs, tierMaxBackers);
        
        // First backer succeeds
        vm.prank(backer1);
        escrow.contribute(challengeId, 10e18, 1);
        
        // Second backer should fail - tier at capacity
        vm.expectRevert(abi.encodeWithSignature("TierCapReached()"));
        vm.prank(backer2);
        escrow.contribute(challengeId, 10e18, 1);
    }

    function testChallengeExpiry() public {
        vm.prank(creator);
        uint256[] memory empty = new uint256[](0);
        string[] memory emptyStr = new string[](0);
        uint256 challengeId = escrow.createChallenge(100e18, 1, empty, emptyStr, empty);
        
        // Contribution works before expiry
        vm.prank(backer1);
        escrow.contribute(challengeId, 50e18, 0);
        
        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);
        
        // New contributions should fail
        vm.expectRevert(abi.encodeWithSignature("ChallengeExpired()"));
        vm.prank(backer2);
        escrow.contribute(challengeId, 50e18, 0);
    }

    function testTierValidation() public {
        vm.prank(creator);
        uint256[] memory tierAmounts = new uint256[](1);
        tierAmounts[0] = 50e18;
        string[] memory tierDescs = new string[](1);
        tierDescs[0] = "Premium Tier";
        uint256[] memory tierMaxBackers = new uint256[](1);
        tierMaxBackers[0] = 10;
        
        uint256 challengeId = escrow.createChallenge(100e18, 30, tierAmounts, tierDescs, tierMaxBackers);
        
        // Contribution below tier minimum should fail
        vm.expectRevert(abi.encodeWithSignature("InsufficientContribution()"));
        vm.prank(backer1);
        escrow.contribute(challengeId, 25e18, 1);
        
        // Valid contribution should succeed
        vm.prank(backer1);
        escrow.contribute(challengeId, 50e18, 1);
    }

    function testMultipleContributions() public {
        vm.prank(creator);
        uint256[] memory empty = new uint256[](0);
        string[] memory emptyStr = new string[](0);
        uint256 challengeId = escrow.createChallenge(200e18, 30, empty, emptyStr, empty);
        
        // Same backer contributes multiple times
        vm.prank(backer1);
        escrow.contribute(challengeId, 50e18, 0);
        
        vm.prank(backer1);
        escrow.contribute(challengeId, 75e18, 0);
        
        (,, uint256 raisedAmount,,,) = escrow.challenges(challengeId);
        assertEq(raisedAmount, 125e18);
        
        (uint256 totalContribution,) = escrow.contributions(challengeId, backer1);
        assertEq(totalContribution, 125e18);
    }

    function testSecurityProtections() public {
        vm.prank(creator);
        uint256[] memory empty = new uint256[](0);
        string[] memory emptyStr = new string[](0);
        uint256 challengeId = escrow.createChallenge(100e18, 30, empty, emptyStr, empty);
        
        // Non-creator cannot complete challenge
        vm.prank(backer1);
        escrow.contribute(challengeId, 100e18, 0);
        
        vm.expectRevert(abi.encodeWithSignature("NotCreator()"));
        vm.prank(backer1);
        escrow.completeChallenge(challengeId);
        
        // Cannot complete without reaching goal
        vm.prank(creator);
        uint256 challengeId2 = escrow.createChallenge(200e18, 30, empty, emptyStr, empty);
        
        vm.prank(backer1);
        escrow.contribute(challengeId2, 50e18, 0);
        
        vm.expectRevert(abi.encodeWithSignature("GoalNotReached()"));
        vm.prank(creator);
        escrow.completeChallenge(challengeId2);
    }

    function testClaimFundsWithUSDTConversion() public {
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
        
        // Claim funds with USDT conversion
        vm.prank(creator);
        escrow.claimFunds(challengeId, true, 150e18); // Expecting 2:1 mock rate
        
        // Creator should receive USDT (mocked)
        assertEq(usdt.balanceOf(creator), 200e18); // 100 NCX * 2 mock rate
    }
}
