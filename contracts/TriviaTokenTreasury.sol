// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TriviaToken.sol";

/**
 * @title TriviaTokenTreasury
 * @dev Treasury contract that:
 * - Collects and tracks taxes from token transfers and staking operations
 * - Manages tax distribution and withdrawals
 * - Provides historical tax collection data
 * - Ensures secure fund management
 */
contract TriviaTokenTreasury is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for TriviaToken;

    // State variables
    IERC20 public triviaToken;
    uint256 public constant WITHDRAW_THRESHOLD = 100 * 10**18; // 100 tokens
    uint256 public totalTaxCollected;
    uint256 public totalTaxWithdrawn;
    uint256 public lastWithdrawTimestamp;
    uint256 public minimumWithdrawThreshold;
    bool private _initialized;

    // Authorized contracts that can send taxes
    mapping(address => bool) public authorizedSources;
    
    // Tax collection history per source
    mapping(address => uint256) public taxCollectedPerSource;
    
    // Monthly tax collection tracking
    mapping(uint256 => uint256) public monthlyTaxCollected;

    // Events
    event TaxReceived(address indexed source, uint256 amount);
    event TaxWithdrawn(address indexed recipient, uint256 amount);
    event SourceAuthorized(address indexed source, bool authorized);
    event WithdrawThresholdUpdated(uint256 newThreshold);
    event MonthlyTaxRecorded(uint256 indexed yearMonth, uint256 amount);
    event TaxCollected(address indexed source, uint256 amount);
    event Initialized(address tokenAddress);

    /**
     * @dev Constructor sets initial parameters
     */
    constructor(uint256 initialWithdrawThreshold) Ownable() {
        minimumWithdrawThreshold = initialWithdrawThreshold;
    }

    /**
     * @dev Initialize the contract with token address
     */
    function initialize(address tokenAddress) external onlyOwner {
        require(!_initialized, "Already initialized");
        require(tokenAddress != address(0), "Token address cannot be zero");
        triviaToken = IERC20(tokenAddress);
        _initialized = true;
        emit Initialized(tokenAddress);
    }

    /**
     * @dev Modifier to check if caller is authorized
     */
    modifier onlyAuthorized() {
        require(authorizedSources[msg.sender], "Not authorized");
        _;
    }

    /**
     * @dev Receive tax from authorized sources
     * @param amount Amount of tax being deposited
     */
    function receiveTax(uint256 amount) external nonReentrant onlyAuthorized {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 balanceBefore = triviaToken.balanceOf(address(this));
        require(triviaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 actualReceived = triviaToken.balanceOf(address(this)) - balanceBefore;
        
        _updateTaxRecords(msg.sender, actualReceived);
        
        emit TaxReceived(msg.sender, actualReceived);
    }

    /**
     * @dev Withdraw accumulated taxes
     * @param amount Amount to withdraw
     * @param recipient Recipient address (optional, defaults to owner)
     */
    function withdrawTax(uint256 amount, address recipient) external nonReentrant onlyOwner whenNotPaused {
        require(amount >= minimumWithdrawThreshold, "Below withdrawal threshold");
        require(amount <= triviaToken.balanceOf(address(this)), "Insufficient balance");
        
        address to = recipient == address(0) ? owner() : recipient;
        require(triviaToken.transfer(to, amount), "Transfer failed");
        
        totalTaxWithdrawn += amount;
        lastWithdrawTimestamp = block.timestamp;
        emit TaxWithdrawn(to, amount);
    }

    /**
     * @dev Authorize or deauthorize a source contract
     */
    function setSourceAuthorization(address source, bool authorized) external onlyOwner {
        require(source != address(0), "Cannot authorize zero address");
        authorizedSources[source] = authorized;
        emit SourceAuthorized(source, authorized);
    }

    /**
     * @dev Update minimum withdraw threshold
     */
    function setWithdrawThreshold(uint256 newThreshold) external onlyOwner {
        minimumWithdrawThreshold = newThreshold;
        emit WithdrawThresholdUpdated(newThreshold);
    }

    /**
     * @dev Get current withdrawable balance
     */
    function getWithdrawableBalance() public view returns (uint256) {
        return triviaToken.balanceOf(address(this));
    }

    /**
     * @dev Get tax collected in a specific month
     * @param year Year to query
     * @param month Month to query (1-12)
     */
    function getMonthlyTaxCollected(uint256 year, uint256 month) external view returns (uint256) {
        require(month >= 1 && month <= 12, "Invalid month");
        return monthlyTaxCollected[getYearMonth(year, month)];
    }

    /**
     * @dev Emergency pause withdrawals
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume withdrawals
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Internal function to update tax collection records
     */
    function _updateTaxRecords(address source, uint256 amount) private {
        totalTaxCollected += amount;
        taxCollectedPerSource[source] += amount;
        
        // Update monthly tracking
        uint256 yearMonth = getCurrentYearMonth();
        monthlyTaxCollected[yearMonth] += amount;
        
        emit MonthlyTaxRecorded(yearMonth, monthlyTaxCollected[yearMonth]);
    }

    /**
     * @dev Internal function to get year from timestamp
     */
    function _getYear(uint256 timestamp) private pure returns (uint256) {
        return timestamp / 31536000 + 1970;
    }

    /**
     * @dev Internal function to get month from timestamp
     */
    function _getMonth(uint256 timestamp) private pure returns (uint256) {
        return (timestamp % 31536000) / 2628000 + 1;
    }

    /**
     * @dev Internal function to generate year-month key
     */
    function _getYearMonthKey(uint256 year, uint256 month) private pure returns (uint256) {
        return year * 100 + month;
    }

    /**
     * @dev Tracks tax collection and updates total collected
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {
        if (to == address(this) && from != address(0)) {
            _updateTaxRecords(from, amount);
        }
    }

    /**
     * @dev Returns total tax collected
     */
    function getTotalTaxCollected() external view returns (uint256) {
        return totalTaxCollected;
    }

    function getCurrentYearMonth() internal view returns (uint256) {
        uint256 timestamp = block.timestamp;
        uint256 year = (timestamp / 31536000) + 1970; // Seconds in a year
        uint256 month = ((timestamp % 31536000) / 2592000) + 1; // Seconds in a month
        return getYearMonth(year, month);
    }

    function getYearMonth(uint256 year, uint256 month) internal pure returns (uint256) {
        return year * 100 + month;
    }
} 