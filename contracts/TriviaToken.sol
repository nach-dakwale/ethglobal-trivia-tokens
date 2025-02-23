// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TriviaToken is ERC20, Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant TAX_RATE = 200; // 2% in basis points (1/10000)
    uint256 public constant LOCK_PERIOD = 7 days;
    uint256 public constant STAKE_REQUIREMENT = 100_000 * 10**18; // 100k tokens for server access

    // Distribution constants
    uint256 public constant PRESALE_TOTAL = 450_000_000 * 10**18; // 45% presale
    uint256 public constant FIRST_RELEASE = 200_000_000 * 10**18; // 20% initial
    uint256 public constant SECOND_RELEASE = 125_000_000 * 10**18; // 12.5% at day 31
    uint256 public constant THIRD_RELEASE = 125_000_000 * 10**18; // 12.5% at day 61
    
    uint256 public constant MARKETING_AMOUNT = 250_000_000 * 10**18; // 25% marketing
    uint256 public constant DEX_LIQUIDITY = 100_000_000 * 10**18; // 10% liquidity
    uint256 public constant AIRDROP_AMOUNT = 100_000_000 * 10**18; // 10% airdrops
    uint256 public constant STAKING_REWARDS = 100_000_000 * 10**18; // 10% staking rewards

    // Vesting schedule timestamps
    uint256 public immutable SECOND_RELEASE_TIME; // Day 31
    uint256 public immutable THIRD_RELEASE_TIME;  // Day 61

    // Staking APY rates in basis points
    uint256 public constant INITIAL_APY = 40000; // 400%
    uint256 public constant MIDDLE_APY = 25000;  // 250%
    uint256 public constant FINAL_APY = 20000;   // 200%

    // Timestamps for APY changes
    uint256 public immutable DEPLOYMENT_TIME;
    uint256 public immutable MIDDLE_APY_START;
    uint256 public immutable FINAL_APY_START;
    uint256 public immutable REWARDS_END;

    // State variables
    address public treasuryWallet;    // For marketing/buyback
    address public presaleWallet;     // For presale distribution
    address public liquidityWallet;   // For DEX liquidity
    address public airdropWallet;     // For airdrops
    mapping(address => uint256) private _lockTimestamps;
    mapping(address => uint256) private _stakedBalance;
    mapping(address => uint256) private _lastRewardClaim;
    
    // New mappings for cooldown periods
    mapping(address => uint256) private _pendingUnstakeAmount;
    mapping(address => uint256) private _unstakeRequestTime;
    mapping(address => uint256) private _pendingRewardsAmount;
    mapping(address => uint256) private _rewardsRequestTime;
    
    // Vesting state
    bool public secondReleaseExecuted;
    bool public thirdReleaseExecuted;

    // New mapping for cooldown overrides
    mapping(address => bool) private _cooldownOverrides;

    // Events
    event TokensLocked(address indexed user, uint256 amount, uint256 unlockTime);
    event Staked(address indexed user, uint256 amount);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event RewardsClaimed(address indexed user, uint256 amount);
    event VestingReleased(uint256 releaseNumber, uint256 amount);
    event CooldownOverrideSet(address indexed user, bool status);
    event EmergencyCooldownOverride(address indexed user, string action);

    constructor(
        address _presaleWallet,
        address _treasuryWallet,
        address _liquidityWallet,
        address _airdropWallet
    ) ERC20("Trivia Token", "TRIVIA") Ownable(msg.sender) {
        require(_presaleWallet != address(0), "Invalid presale wallet");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_liquidityWallet != address(0), "Invalid liquidity wallet");
        require(_airdropWallet != address(0), "Invalid airdrop wallet");
        
        presaleWallet = _presaleWallet;
        treasuryWallet = _treasuryWallet;
        liquidityWallet = _liquidityWallet;
        airdropWallet = _airdropWallet;
        
        DEPLOYMENT_TIME = block.timestamp;
        MIDDLE_APY_START = DEPLOYMENT_TIME + 90 days;
        FINAL_APY_START = DEPLOYMENT_TIME + 180 days;
        REWARDS_END = DEPLOYMENT_TIME + 365 days;
        
        SECOND_RELEASE_TIME = DEPLOYMENT_TIME + 31 days;
        THIRD_RELEASE_TIME = DEPLOYMENT_TIME + 61 days;

        // Initial token distribution
        _mint(presaleWallet, FIRST_RELEASE);        // 20% to presale
        _mint(treasuryWallet, MARKETING_AMOUNT);    // 25% to marketing/buyback
        _mint(liquidityWallet, DEX_LIQUIDITY);      // 10% to DEX liquidity
        _mint(airdropWallet, AIRDROP_AMOUNT);       // 10% to airdrops
        _mint(address(this), STAKING_REWARDS);      // 10% to contract for staking rewards
    }

    // Vesting functionality
    function releaseVestedTokens() external onlyOwner {
        if (!secondReleaseExecuted && block.timestamp >= SECOND_RELEASE_TIME) {
            _mint(presaleWallet, SECOND_RELEASE);
            secondReleaseExecuted = true;
            emit VestingReleased(2, SECOND_RELEASE);
        }
        
        if (!thirdReleaseExecuted && block.timestamp >= THIRD_RELEASE_TIME) {
            _mint(presaleWallet, THIRD_RELEASE);
            thirdReleaseExecuted = true;
            emit VestingReleased(3, THIRD_RELEASE);
        }
    }

    // Core token functionality with tax
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp >= _lockTimestamps[msg.sender], "Tokens are locked");
        
        uint256 taxAmount = (amount * TAX_RATE) / 10000;
        uint256 netAmount = amount - taxAmount;

        super.transfer(treasuryWallet, taxAmount);
        return super.transfer(to, netAmount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp >= _lockTimestamps[from], "Tokens are locked");
        
        uint256 taxAmount = (amount * TAX_RATE) / 10000;
        uint256 netAmount = amount - taxAmount;

        super.transferFrom(from, treasuryWallet, taxAmount);
        return super.transferFrom(from, to, netAmount);
    }

    // Updated staking functionality
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _stakedBalance[msg.sender] += amount;
        _lastRewardClaim[msg.sender] = block.timestamp;
        _transfer(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }

    // New unstaking functions with cooldown
    function requestUnstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");
        require(amount == _stakedBalance[msg.sender], "Must unstake entire balance");
        require(_pendingUnstakeAmount[msg.sender] == 0, "Existing unstake pending");

        // Calculate and add pending rewards
        uint256 totalRewards = calculatePendingRewards(msg.sender);
        uint256 totalAmount = amount + totalRewards;
        
        // Update state
        _stakedBalance[msg.sender] = 0;
        _pendingUnstakeAmount[msg.sender] = totalAmount;
        _unstakeRequestTime[msg.sender] = block.timestamp;
        _lastRewardClaim[msg.sender] = block.timestamp;
        
        emit UnstakeRequested(msg.sender, totalAmount, block.timestamp + LOCK_PERIOD);
    }

    function executeUnstake() external nonReentrant {
        require(_pendingUnstakeAmount[msg.sender] > 0, "No pending unstake");
        require(
            _cooldownOverrides[msg.sender] || 
            block.timestamp >= _unstakeRequestTime[msg.sender] + LOCK_PERIOD, 
            "Cooldown period not met"
        );

        uint256 amount = _pendingUnstakeAmount[msg.sender];
        uint256 taxAmount = (amount * TAX_RATE) / 10000;
        uint256 netAmount = amount - taxAmount;

        // Reset unstaking state
        _pendingUnstakeAmount[msg.sender] = 0;
        _unstakeRequestTime[msg.sender] = 0;
        _pendingRewardsAmount[msg.sender] = 0; // Clear any pending rewards

        // Transfer tokens
        _transfer(address(this), treasuryWallet, taxAmount);
        _mint(msg.sender, netAmount);

        if (_cooldownOverrides[msg.sender]) {
            emit EmergencyCooldownOverride(msg.sender, "unstake");
        }
        emit Unstaked(msg.sender, netAmount);
    }

    // Remove separate rewards claiming functions since they're now bundled with unstaking
    function requestRewardsClaim() public pure {
        revert("Use unstake to claim rewards");
    }

    function executeRewardsClaim() public pure {
        revert("Use unstake to claim rewards");
    }

    // Reward calculation and claiming
    function getCurrentAPY() public view returns (uint256) {
        if (block.timestamp < MIDDLE_APY_START) return INITIAL_APY;
        if (block.timestamp < FINAL_APY_START) return MIDDLE_APY;
        if (block.timestamp < REWARDS_END) return FINAL_APY;
        return 0;
    }

    function calculatePendingRewards(address user) public view returns (uint256) {
        if (_stakedBalance[user] == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - _lastRewardClaim[user];
        uint256 apy = getCurrentAPY();
        
        // Calculate rewards: principal * APY * timeElapsed / (365 days * 10000)
        // We divide by 10000 because APY is in basis points (e.g., 40000 = 400%)
        uint256 rewards = (_stakedBalance[user] * apy * timeElapsed) / (365 days * 10000);
        return rewards;
    }

    // New function for tax-exempt transfers (only callable by owner)
    function transferWithoutTax(address to, uint256 amount) external onlyOwner returns (bool) {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Invalid amount");
        
        _mint(to, amount);
        _lockTimestamps[to] = block.timestamp + LOCK_PERIOD;
        
        emit TokensLocked(to, amount, _lockTimestamps[to]);
        return true;
    }

    // Reward distribution for trivia answers
    function rewardUser(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Invalid reward amount");

        this.transferWithoutTax(user, amount);
    }

    // View functions
    function getStakedBalance(address user) external view returns (uint256) {
        return _stakedBalance[user];
    }

    function getPendingUnstake(address user) external view returns (uint256, uint256) {
        return (_pendingUnstakeAmount[user], _unstakeRequestTime[user]);
    }

    function getTotalPendingAmount(address user) external view returns (uint256) {
        if (_pendingUnstakeAmount[user] > 0) {
            return _pendingUnstakeAmount[user];
        }
        return _stakedBalance[user] + calculatePendingRewards(user);
    }

    function getUnlockTime(address user) external view returns (uint256) {
        return _lockTimestamps[user];
    }

    function hasServerAccess(address user) external view returns (bool) {
        return _stakedBalance[user] >= STAKE_REQUIREMENT;
    }

    // New functions for cooldown management
    function setCooldownOverride(address user, bool status) external onlyOwner {
        _cooldownOverrides[user] = status;
        emit CooldownOverrideSet(user, status);
    }

    function hasCooldownOverride(address user) public view returns (bool) {
        return _cooldownOverrides[user];
    }

    // Emergency function to bypass cooldown for multiple users
    function emergencyOverrideCooldowns(address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            _cooldownOverrides[users[i]] = true;
            emit CooldownOverrideSet(users[i], true);
        }
    }
} 