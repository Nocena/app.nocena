// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CrowdfundingEscrow.sol";
import "../src/Nocenix.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256,
        address[] calldata,
        address,
        uint256
    ) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
        return amounts;
    }
}

contract CrowdfundingEscrowTest is Test {
    CrowdfundingEscrow public escrow;
    Nocenix public ncx;
    MockUSDT public usdt;
    MockRouter public router;
    
    address creator = address(0x1);
    address backer1 = address(0x2);
    address backer2 = address(0x3);
    
    function setUp() public {
        ncx = new Nocenix();
        usdt = new MockUSDT();
        router = new MockRouter();
        escrow = new CrowdfundingEscrow(address(ncx), address(usdt), address(router));
        
        ncx.mint(backer1, 1000 * 10**18);
        ncx.mint(backer2, 1000 * 10**18);
        
        vm.prank(backer1);
        ncx.approve(address(escrow), type(uint256).max);
        
        vm.prank(backer2);
        ncx.approve(address(escrow), type(uint256).max);
    }
    
    function testCreateChallengeWithTiers() public {
        vm.prank(creator);
        
        uint256[] memory tierAmounts = new uint256[](2);
        tierAmounts[0] = 10 * 10**18;  // Tier 1: 10 NCX
        tierAmounts[1] = 50 * 10**18;  // Tier 2: 50 NCX
        
        string[] memory tierDescs = new string[](2);
        tierDescs[0] = "Basic Reward";
        tierDescs[1] = "Premium Reward";
        
        uint256[] memory tierMaxBackers = new uint256[](2);
        tierMaxBackers[0] = 100;
        tierMaxBackers[1] = 10;
        
        uint256 challengeId = escrow.createChallenge(
            100 * 10**18, 
            30,
            tierAmounts,
            tierDescs,
            tierMaxBackers
        );
        
        assertEq(escrow.getTierCount(challengeId), 2);
    }
    
    function testContributeWithTier() public {
        vm.prank(creator);
        
        uint256[] memory tierAmounts = new uint256[](1);
        tierAmounts[0] = 25 * 10**18;
        
        string[] memory tierDescs = new string[](1);
        tierDescs[0] = "Special Reward";
        
        uint256[] memory tierMaxBackers = new uint256[](1);
        tierMaxBackers[0] = 5;
        
        uint256 challengeId = escrow.createChallenge(100 * 10**18, 30, tierAmounts, tierDescs, tierMaxBackers);
        
        vm.prank(backer1);
        escrow.contribute(challengeId, 30 * 10**18, 1); // Tier 1
        
        (uint256 amount, uint256 tierIndex) = escrow.contributions(challengeId, backer1);
        assertEq(amount, 30 * 10**18);
        assertEq(tierIndex, 1);
    }
    
    function testCompleteAndClaim() public {
        vm.prank(creator);
        
        // No tiers for simple test
        uint256[] memory empty = new uint256[](0);
        string[] memory emptyStr = new string[](0);
        
        uint256 challengeId = escrow.createChallenge(100 * 10**18, 30, empty, emptyStr, empty);
        
        vm.prank(backer1);
        escrow.contribute(challengeId, 60 * 10**18, 0); // No tier
        
        vm.prank(backer2);
        escrow.contribute(challengeId, 50 * 10**18, 0); // No tier
        
        vm.prank(creator);
        escrow.completeChallenge(challengeId);
        
        uint256 balanceBefore = ncx.balanceOf(creator);
        
        vm.prank(creator);
        escrow.claimFunds(challengeId, false, 0);
        
        uint256 balanceAfter = ncx.balanceOf(creator);
        assertEq(balanceAfter - balanceBefore, 110 * 10**18);
    }
}
