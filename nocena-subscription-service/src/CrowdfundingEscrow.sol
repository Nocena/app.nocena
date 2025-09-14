// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NCXConverter.sol";

/// @title Crowdfunding Escrow - Kickstarter-style challenge funding
/// @notice Creators set goals, backers contribute NCX, funds held in escrow until completion
contract CrowdfundingEscrow is NCXConverter, ReentrancyGuard {
    struct RewardTier {
        uint256 minContribution;    // Minimum NCX required for this tier
        string description;         // Reward description
        uint256 maxBackers;        // Maximum number of backers for this tier
        uint256 currentBackers;    // Current number of backers
    }
    
    struct Challenge {
        address creator;
        uint256 goalAmount;        // Target NCX amount
        uint256 raisedAmount;      // Current NCX raised
        uint256 deadline;          // Block timestamp deadline
        bool completed;            // Creator marked as completed
        bool claimed;              // Funds claimed by creator
        RewardTier[] tiers;        // Available reward tiers
    }
    
    struct Contribution {
        uint256 amount;            // Total NCX contributed
        uint256 tierIndex;         // Chosen reward tier (0 = no tier)
    }
    
    uint256 public challengeCounter;
    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => mapping(address => Contribution)) public contributions;
    
    event ChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 goalAmount);
    event ContributionMade(uint256 indexed challengeId, address indexed backer, uint256 amount, uint256 tierIndex);
    event ChallengeCompleted(uint256 indexed challengeId);
    event FundsClaimed(uint256 indexed challengeId, uint256 amount);
    
    error InvalidGoalAmount();
    error InvalidDuration();
    error ChallengeNotFound();
    error ChallengeExpired();
    error ChallengeNotActive();
    error InsufficientContribution();
    error TierCapReached();
    error NotCreator();
    error GoalNotReached();
    error AlreadyClaimed();
    error NoContribution();
    
    constructor(address _ncxToken, address _usdtToken, address _klayswapRouter) 
        NCXConverter(_ncxToken, _usdtToken, _klayswapRouter) {}
    
    /// @notice Create a new crowdfunding challenge with reward tiers
    /// @param goalAmount Target NCX amount to raise
    /// @param durationDays Challenge duration in days
    /// @param tierMinAmounts Minimum NCX for each tier
    /// @param tierDescriptions Reward descriptions for each tier
    /// @param tierMaxBackers Maximum backers for each tier
    function createChallenge(
        uint256 goalAmount, 
        uint256 durationDays,
        uint256[] calldata tierMinAmounts,
        string[] calldata tierDescriptions,
        uint256[] calldata tierMaxBackers
    ) external returns (uint256) {
        if (goalAmount == 0) revert InvalidGoalAmount();
        if (durationDays == 0) revert InvalidDuration();
        if (tierMinAmounts.length != tierDescriptions.length) revert("Tier data mismatch");
        if (tierMinAmounts.length != tierMaxBackers.length) revert("Tier data mismatch");
        
        uint256 challengeId = ++challengeCounter;
        Challenge storage challenge = challenges[challengeId];
        
        challenge.creator = msg.sender;
        challenge.goalAmount = goalAmount;
        challenge.deadline = block.timestamp + (durationDays * 1 days);
        
        // Add reward tiers
        for (uint256 i = 0; i < tierMinAmounts.length; i++) {
            challenge.tiers.push(RewardTier({
                minContribution: tierMinAmounts[i],
                description: tierDescriptions[i],
                maxBackers: tierMaxBackers[i],
                currentBackers: 0
            }));
        }
        
        emit ChallengeCreated(challengeId, msg.sender, goalAmount);
        return challengeId;
    }
    
    /// @notice Contribute NCX to a challenge and optionally select a reward tier
    /// @param challengeId Challenge to back
    /// @param amount NCX amount to contribute
    /// @param tierIndex Reward tier (0 = no tier, 1+ = tier index)
    function contribute(uint256 challengeId, uint256 amount, uint256 tierIndex) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator == address(0)) revert ChallengeNotFound();
        if (block.timestamp > challenge.deadline) revert ChallengeExpired();
        if (challenge.completed) revert ChallengeNotActive();
        
        // Validate tier selection
        if (tierIndex > 0) {
            if (tierIndex > challenge.tiers.length) revert("Invalid tier");
            RewardTier storage tier = challenge.tiers[tierIndex - 1];
            if (amount < tier.minContribution) revert InsufficientContribution();
            if (tier.currentBackers >= tier.maxBackers) revert TierCapReached();
            
            // Count new backer for this tier
            if (contributions[challengeId][msg.sender].tierIndex != tierIndex) {
                tier.currentBackers++;
            }
        }
        
        ncxToken.transferFrom(msg.sender, address(this), amount);
        
        Contribution storage contrib = contributions[challengeId][msg.sender];
        contrib.amount += amount;
        contrib.tierIndex = tierIndex;
        
        challenge.raisedAmount += amount;
        
        emit ContributionMade(challengeId, msg.sender, amount, tierIndex);
    }
    
    /// @notice Creator marks challenge as completed (requires goal reached)
    /// @param challengeId Challenge to mark as completed
    function completeChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator != msg.sender) revert NotCreator();
        if (challenge.raisedAmount < challenge.goalAmount) revert GoalNotReached();
        if (challenge.completed) revert AlreadyClaimed();
        
        challenge.completed = true;
        emit ChallengeCompleted(challengeId);
    }
    
    /// @notice Creator claims raised funds (NCX or converted to USDT)
    /// @param challengeId Challenge to claim from
    /// @param convertToUSDT Whether to convert NCX to USDT
    /// @param minUSDTOut Minimum USDT if converting (slippage protection)
    function claimFunds(uint256 challengeId, bool convertToUSDT, uint256 minUSDTOut) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator != msg.sender) revert NotCreator();
        if (!challenge.completed) revert ChallengeNotActive();
        if (challenge.claimed) revert AlreadyClaimed();
        
        challenge.claimed = true;
        uint256 amount = challenge.raisedAmount;
        
        if (convertToUSDT) {
            _swapNCXToUSDT(amount, minUSDTOut, msg.sender);
        } else {
            ncxToken.transfer(msg.sender, amount);
        }
        
        emit FundsClaimed(challengeId, amount);
    }
    
    /// @notice Claim refund if challenge failed (goal not reached by deadline)
    /// @param challengeId Challenge to claim refund from
    function claimRefund(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (block.timestamp <= challenge.deadline) revert ChallengeNotActive();
        if (challenge.raisedAmount >= challenge.goalAmount) revert("Goal was reached");
        
        uint256 contribution = contributions[challengeId][msg.sender].amount;
        if (contribution == 0) revert NoContribution();
        
        contributions[challengeId][msg.sender].amount = 0;
        ncxToken.transfer(msg.sender, contribution);
    }
    
    /// @notice Get the number of reward tiers for a challenge
    /// @param challengeId Challenge to query
    /// @return Number of reward tiers
    function getTierCount(uint256 challengeId) external view returns (uint256) {
        return challenges[challengeId].tiers.length;
    }
    
    /// @notice Get details of a specific reward tier
    /// @param challengeId Challenge to query
    /// @param tierIndex Index of the tier (0-based)
    /// @return minContribution Minimum NCX required for this tier
    /// @return description Reward description
    /// @return maxBackers Maximum number of backers allowed
    /// @return currentBackers Current number of backers in this tier
    function getTier(uint256 challengeId, uint256 tierIndex) external view returns (
        uint256 minContribution,
        string memory description,
        uint256 maxBackers,
        uint256 currentBackers
    ) {
        RewardTier storage tier = challenges[challengeId].tiers[tierIndex];
        return (tier.minContribution, tier.description, tier.maxBackers, tier.currentBackers);
    }
}
