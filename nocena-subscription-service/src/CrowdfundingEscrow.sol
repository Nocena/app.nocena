// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NCXConverter.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CrowdfundingEscrow is NCXConverter, ReentrancyGuard {
    struct RewardTier {
        uint256 minContribution;
        string description;
        uint256 maxBackers;
        uint256 currentBackers;
    }

    struct Challenge {
        address creator;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        bool completed;
        bool claimed;
        RewardTier[] tiers;
    }

    struct Contribution {
        uint256 amount;
        uint256 tierIndex;
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

    function completeChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.creator != msg.sender) revert NotCreator();
        if (challenge.raisedAmount < challenge.goalAmount) revert GoalNotReached();
        
        challenge.completed = true;
        emit ChallengeCompleted(challengeId);
    }

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

    function getTierCount(uint256 challengeId) external view returns (uint256) {
        return challenges[challengeId].tiers.length;
    }

    function getTier(uint256 challengeId, uint256 tierIndex)
        external view returns (uint256 minContribution, string memory description, uint256 maxBackers, uint256 currentBackers) {
        RewardTier storage tier = challenges[challengeId].tiers[tierIndex];
        return (tier.minContribution, tier.description, tier.maxBackers, tier.currentBackers);
    }
}
