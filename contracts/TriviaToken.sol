// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TriviaToken
 * @dev ERC20 token with:
 * - 2% transfer tax (except for exempt addresses)
 * - 7-day lock period on earned tokens
 * - Treasury management
 * - Tax exemptions for specific addresses
 */
contract TriviaToken is ERC20, Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant TAX_BPS = 200; // 2% tax
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant LOCK_PERIOD = 7 days;

    // State variables
    address public immutable treasury;
    mapping(address => bool) private _isExempt;
    mapping(address => uint256) private _lockTimestamps;

    // Events
    event AddressExemptionUpdated(address indexed account, bool isExempt);
    event TokensLocked(address indexed account, uint256 unlockTime);

    /**
     * @dev Constructor that gives msg.sender all initial tokens
     */
    constructor(address treasuryAddress) ERC20("Trivia Token", "TRIVIA") {
        require(treasuryAddress != address(0), "Treasury cannot be zero address");
        treasury = treasuryAddress;
        _isExempt[treasuryAddress] = true;
        _isExempt[msg.sender] = true;
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Set tax exemption status for an address
     */
    function setExemption(address account, bool exempt) external onlyOwner {
        require(account != address(0), "Cannot exempt zero address");
        _isExempt[account] = exempt;
        emit AddressExemptionUpdated(account, exempt);
    }

    /**
     * @dev Check if an address is tax exempt
     */
    function isExempt(address account) external view returns (bool) {
        return _isExempt[account];
    }

    /**
     * @dev Get unlock time for an address
     */
    function getUnlockTime(address account) public view returns (uint256) {
        return _lockTimestamps[account];
    }

    /**
     * @dev Override _beforeTokenTransfer to handle token locks on mints
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        // If this is a mint (from = address(0)) and recipient is not exempt, lock the tokens
        if (from == address(0) && !_isExempt[to]) {
            _lockTimestamps[to] = block.timestamp + LOCK_PERIOD;
            emit TokensLocked(to, _lockTimestamps[to]);
        }
    }

    /**
     * @dev Override transfer function to include tax and lock logic
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        require(amount > 0, "Transfer amount must be greater than zero");
        require(_isExempt[owner] || block.timestamp >= _lockTimestamps[owner], "Tokens are locked");
        
        if (_isExempt[owner] || _isExempt[to]) {
            _transfer(owner, to, amount);
        } else {
            uint256 taxAmount = (amount * TAX_BPS) / BPS_DENOMINATOR;
            uint256 transferAmount = amount - taxAmount;
            
            if (taxAmount > 0) {
                _transfer(owner, treasury, taxAmount);
            }
            _transfer(owner, to, transferAmount);
        }
        
        return true;
    }

    /**
     * @dev Override transferFrom function to include tax and lock logic
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(amount > 0, "Transfer amount must be greater than zero");
        require(_isExempt[from] || block.timestamp >= _lockTimestamps[from], "Tokens are locked");
        
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);

        if (_isExempt[from] || _isExempt[to]) {
            _transfer(from, to, amount);
        } else {
            uint256 taxAmount = (amount * TAX_BPS) / BPS_DENOMINATOR;
            uint256 transferAmount = amount - taxAmount;
            
            if (taxAmount > 0) {
                _transfer(from, treasury, taxAmount);
            }
            _transfer(from, to, transferAmount);
        }
        
        return true;
    }
} 