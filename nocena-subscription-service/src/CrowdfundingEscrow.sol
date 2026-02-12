// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NCXConverter.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrowdfundingEscrow Contract
 * @notice Creator crowdfunding system with NCX token payments and reward tiers
 * @dev Allows creators to create funding challenges with reward tiers,
 *      backers to contribute NCX tokens, and automatic refunds if goals aren't met
 */

contract CrowdfundingEscrow is NCXConverter, ReentrancyGuard {
    /// @notice Reward tier structure for challenges
    struct RewardTier {
        uint256 minContribution;
        string description;
        uint256 maxBackers;
        uint256 currentBackers;
    }

    /// @notice Challenge structure for crowdfunding campaigns
    struct Challenge {
        address creator;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        bool completed;
        bool claimed;
        RewardTier[] tiers;
    }

    /// @notice Contribution tracking for backers
    struct Contribution {
        uint256 amount;
        uint256 tierIndex;
    }

    /// @notice Counter for unique challenge IDs
    uint256 public challengeCounter;
    /// @notice Mapping of challenge ID to challenge data
    mapping(uint256 => Challenge) public challenges;
    /// @notice Mapping of challenge ID to backer contributions
    mapping(uint256 => mapping(address => Contribution)) public contributions;

    /// @notice Emitted when a new challenge is created
    event ChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 goalAmount);
    /// @notice Emitted when a backer contributes to a challenge
    event ContributionMade(uint256 indexed challengeId, address indexed backer, uint256 amount, uint256 tierIndex);
    /// @notice Emitted when a creator marks their challenge as completed
    event ChallengeCompleted(uint256 indexed challengeId);
    /// @notice Emitted when a creator claims their raised funds
    event FundsClaimed(uint256 indexed challengeId, uint256 amount);

    /// @notice Thrown when goal amount is zero
    error InvalidGoalAmount();
    /// @notice Thrown when duration is zero
    error InvalidDuration();
    /// @notice Thrown when challenge doesn't exist
    error ChallengeNotFound();
    /// @notice Thrown when challenge deadline has passed
    error ChallengeExpired();
    /// @notice Thrown when challenge is not in active state
    error ChallengeNotActive();
    /// @notice Thrown when contribution is below tier minimum
    error InsufficientContribution();
    /// @notice Thrown when reward tier is at maximum capacity
    error TierCapReached();
    /// @notice Thrown when caller is not the challenge creator
    error NotCreator();
    /// @notice Thrown when funding goal hasn't been reached
    error GoalNotReached();
    /// @notice Thrown when funds have already been claimed
    error AlreadyClaimed();
    /// @notice Thrown when user has no contribution to refund
    error NoContribution();

    /**
     * @notice Initialize the crowdfunding escrow contract
     * @param _ncxToken Address of the NCX token contract
     * @param _usdtToken Address of the USDT token contract
     * @param _klayswapRouter Address of the KlaySwap router
     */
    constructor(address _ncxToken, address _usdtToken, address _klayswapRouter)
        NCXConverter(_ncxToken, _usdtToken, _klayswapRouter) {}

    /**
     * @notice Creator creates a new crowdfunding challenge with reward tiers
     * @param goalAmount Target funding amount in NCX tokens
     * @param durationDays Challenge duration in days
     * @param tierMinAmounts Minimum contribution amounts for each tier
     * @param tierDescriptions Description of rewards for each tier
     * @param tierMaxBackers Maximum number of backers per tier
     * @return uint256 The unique challenge ID
     */

    function createChallenge(
        uint256 goalAmount,
        uint256 durationDays,
        uint256[] calldata tierMinAmounts,
        string[] calldata tierDescriptions,
        uint256[] calldata tierMaxBackers
    ) external returns (uint256) {
        if (goalAmount == 0) revert InvalidGoalAmount();
        if (durationDays == 0) revert InvalidDuration();

        uint256 challengeId = ++challengeCounter;
        Challenge storage challenge = challenges[challengeId];
        
        challenge.creator = msg.sender;
        challenge.goalAmount = goalAmount;
        challenge.deadline = block.timestamp + (durationDays * 1 days);

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

    /**
     * @notice Backer contributes NCX tokens to a challenge and selects reward tier
     * @param challengeId ID of the challenge to back
     * @param amount Amount of NCX tokens to contribute
     * @param tierIndex Index of the reward tier (0 for no tier, 1+ for specific tiers)
     * @dev Transfers NCX tokens to escrow and tracks contribution
     */
    function contribute(uint256 challengeId, uint256 amount, uint256 tierIndex) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator == address(0)) revert ChallengeNotFound();
        if (block.timestamp > challenge.deadline) revert ChallengeExpired();
        if (challenge.completed) revert ChallengeNotActive();

        if (tierIndex > 0 && tierIndex <= challenge.tiers.length) {
            RewardTier storage tier = challenge.tiers[tierIndex - 1];
            if (amount < tier.minContribution) revert InsufficientContribution();
            if (tier.currentBackers >= tier.maxBackers) revert TierCapReached();
            tier.currentBackers++;
        }

        ncxToken.transferFrom(msg.sender, address(this), amount);
        
        contributions[challengeId][msg.sender].amount += amount;
        contributions[challengeId][msg.sender].tierIndex = tierIndex;
        challenge.raisedAmount += amount;

        emit ContributionMade(challengeId, msg.sender, amount, tierIndex);
    }

    /**
     * @notice Creator marks their challenge as completed after reaching the goal
     * @param challengeId ID of the challenge to complete
     * @dev Only callable by challenge creator when goal is reached
     */
    function completeChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator != msg.sender) revert NotCreator();
        if (challenge.raisedAmount < challenge.goalAmount) revert GoalNotReached();
        
        challenge.completed = true;
        emit ChallengeCompleted(challengeId);
    }

    /**
     * @notice Creator claims raised funds from completed challenge
     * @param challengeId ID of the challenge to claim funds from
     * @param convertToUSDT Whether to convert NCX to USDT before transfer
     * @param minUSDTOut Minimum USDT to receive if converting (slippage protection)
     * @dev Only callable by challenge creator after completion
     */
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

    /**
     * @notice Backer claims refund if challenge fails to reach goal by deadline
     * @param challengeId ID of the failed challenge
     * @dev Only callable after deadline if goal wasn't reached
     */
    function claimRefund(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator == address(0)) revert ChallengeNotFound();
        if (block.timestamp <= challenge.deadline) revert ChallengeNotActive();
        if (challenge.raisedAmount >= challenge.goalAmount) revert GoalNotReached();

        Contribution storage contribution = contributions[challengeId][msg.sender];
        if (contribution.amount == 0) revert NoContribution();

        uint256 refundAmount = contribution.amount;
        contribution.amount = 0;

        ncxToken.transfer(msg.sender, refundAmount);
    }

    /**
     * @notice Get the number of reward tiers for a challenge
     * @param challengeId ID of the challenge
     * @return uint256 Number of reward tiers
     */
    function getTierCount(uint256 challengeId) external view returns (uint256) {
        return challenges[challengeId].tiers.length;
    }

    /**
     * @notice Get details of a specific reward tier
     * @param challengeId ID of the challenge
     * @param tierIndex Index of the tier to query
     * @return minContribution Minimum contribution required for this tier
     * @return description Description of the reward
     * @return maxBackers Maximum number of backers allowed
     * @return currentBackers Current number of backers in this tier
     */
    function getTier(uint256 challengeId, uint256 tierIndex)
        external view returns (uint256 minContribution, string memory description, uint256 maxBackers, uint256 currentBackers) {
        RewardTier storage tier = challenges[challengeId].tiers[tierIndex];
        return (tier.minContribution, tier.description, tier.maxBackers, tier.currentBackers);
    }
}
