export const TRIVIA_TOKEN_ADDRESS = '0x3cc7d5a02df9096f5954f7e734a191735958dd3e';

export const TRIVIA_TOKEN_ABI = [
  // Staking functions
  'function stake(uint256 amount) external nonReentrant',
  'function unstake(uint256 amount) external nonReentrant',
  'function claimRewards() public nonReentrant',
  
  // View functions
  'function getStakedBalance(address user) external view returns (uint256)',
  'function calculatePendingRewards(address user) public view returns (uint256)',
  'function hasServerAccess(address user) external view returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  
  // Events
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
] as const; 