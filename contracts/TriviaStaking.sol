// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TriviaToken.sol";

/**
 * @title TriviaStaking
 * @dev Staking contract for TriviaToken that:
 * - Manages bot activation permissions through staking
 * - Enforces minimum stake requirements (0.01% of supply)
 * - Handles tax-aware staking operations
 * - Tracks staked balances per user
 * - Enforces 7-day cooldown period for unstaking
 */
contract TriviaStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for TriviaToken;

    struct StakingInfo {
        uint256 stakedAmount;
        uint256 lastStakeTime;
        bool isBotActive;
    }

    uint256 public constant STAKE_REQUIREMENT_BPS = 1; // 0.01% in basis points
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant COOLDOWN_PERIOD = 7 days;
    uint256 public constant BOT_STAKE_REQUIREMENT = 1000 * 10**18; // 1000 tokens

    IERC20 public immutable triviaToken;
    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => bool) private _isServerAdmin;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event ServerAdminStatusUpdated(address indexed user, bool isAdmin);
    event StakeRequirementUpdated(uint256 newRequirement);
    event BotActivated(address indexed user);
    event BotDeactivated(address indexed user);
    event UnstakeRequested(address indexed user, uint256 unlockTime);

    /**
     * @dev Constructor sets the token contract address
     */
    constructor(address tokenAddress) Ownable() {
        require(tokenAddress != address(0), "Token cannot be zero address");
        triviaToken = IERC20(tokenAddress);
    }

    /**
     * @dev Stakes tokens in the contract for bot activation
     */
    function stakeForBotActivation(uint256 amount) external nonReentrant {
        require(amount >= BOT_STAKE_REQUIREMENT, "Stake amount below requirement");
        
        // Transfer tokens from user to contract
        uint256 balanceBefore = triviaToken.balanceOf(address(this));
        require(triviaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 actualStaked = triviaToken.balanceOf(address(this)) - balanceBefore;
        
        // Update staking info
        stakingInfo[msg.sender].stakedAmount += actualStaked;
        stakingInfo[msg.sender].lastStakeTime = block.timestamp;
        stakingInfo[msg.sender].isBotActive = stakingInfo[msg.sender].stakedAmount >= BOT_STAKE_REQUIREMENT;
        totalStaked += actualStaked;
        
        emit Staked(msg.sender, actualStaked);
        if (stakingInfo[msg.sender].isBotActive) {
            emit BotActivated(msg.sender);
        }
    }

    /**
     * @dev Unstakes tokens from the contract
     */
    function unstake(uint256 amount) external nonReentrant {
        StakingInfo storage info = stakingInfo[msg.sender];
        require(amount > 0, "Cannot unstake 0 tokens");
        require(info.stakedAmount >= amount, "Insufficient staked amount");
        require(block.timestamp >= info.lastStakeTime + COOLDOWN_PERIOD, "Cooldown period not finished");
        
        // Update staking info
        info.stakedAmount -= amount;
        totalStaked -= amount;
        
        // Check if unstaking will deactivate bot
        bool wasBotActive = info.isBotActive;
        info.isBotActive = info.stakedAmount >= BOT_STAKE_REQUIREMENT;
        if (wasBotActive && !info.isBotActive) {
            emit BotDeactivated(msg.sender);
        }
        
        // Transfer tokens back to user
        require(triviaToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Calculate minimum stake requirement (0.01% of total supply)
     */
    function calculateStakeRequirement() public view returns (uint256) {
        return triviaToken.totalSupply() * STAKE_REQUIREMENT_BPS / BPS_DENOMINATOR;
    }

    /**
     * @dev Get staked balance for a user
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return stakingInfo[user].stakedAmount;
    }

    /**
     * @dev Check if address is a server admin
     */
    function isServerAdmin(address user) external view returns (bool) {
        return _isServerAdmin[user];
    }

    /**
     * @dev Get cooldown end timestamp for a user
     */
    function getCooldownEndTime(address user) external view returns (uint256) {
        return stakingInfo[user].lastStakeTime + COOLDOWN_PERIOD;
    }

    /**
     * @dev Emergency withdraw function for contract owner
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     */
    function emergencyWithdraw(uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Cannot withdraw to zero address");
        require(triviaToken.transfer(recipient, amount), "Transfer failed");
    }

    /**
     * @dev Get total amount of tokens staked in contract
     */
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }

    /**
     * @dev Check if an address meets staking requirements
     */
    function meetsStakingRequirement(address user) public view returns (bool) {
        return stakingInfo[user].stakedAmount >= calculateStakeRequirement();
    }

    /**
     * @dev Check if a user's bot is active
     */
    function isBotActive(address user) external view returns (bool) {
        return stakingInfo[user].isBotActive;
    }

    /**
     * @dev Get stake information for a user
     */
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 lastStakeTime, bool isActive) {
        StakingInfo memory info = stakingInfo[user];
        return (info.stakedAmount, info.lastStakeTime, info.isBotActive);
    }

    function distributeRewards(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty recipients array");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(triviaToken.balanceOf(address(this)) >= totalAmount, "Insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(triviaToken.transfer(recipients[i], amounts[i]), "Transfer failed");
        }
    }
} 