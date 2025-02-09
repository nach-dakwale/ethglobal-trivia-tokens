# The First AI-Powered Play-to-Earn Token: Trivia Token Bot

> Built for ETHGlobal's "Agentic Ethereum" Hackathon 2025, leveraging AI and the Base blockchain.

## Project Objective
Create the world's first AI-powered play-to-earn token through a Discord bot that rewards correct open-answer trivia responses with ERC-20 tokens on Base blockchain. The project features:
- Automated question generation and user-friendly answer validation using AI
- Token economics with transaction taxes and staking requirements
- React-based staking interface
- 7-day cooldown period for unstaking
- Seamless deployment on Base mainnet

## Token Economics
- Initial Supply: 1,000,000,000 $TRIVIA tokens (1 billion)
- Distribution:
  * 45% Pre-sale:
    - Day 1: 20% (200M tokens)
    - Day 31: 12.5% (125M tokens)
    - Day 61: 12.5% (125M tokens)
  * 25% Marketing/Buyback Fund
  * 10% DEX Liquidity
  * 10% Airdrops
  * 10% Staking Rewards

Other Economic Features:
- Transaction Tax: 2% collected by treasury wallet
- Server Access: Discord server owners must stake 100,000 $TRIVIA tokens (0.01% of initial supply) to use the bot
- Cooldown: 7-day lock period on unstaking operations

## Staking APY Schedule
- First 3 months: 400% APY
- Months 4-6: 250% APY
- Months 7-12: 200% APY

## Tech Stack
**Smart Contracts**
- Solidity 0.8.20
- OpenZeppelin Contracts
- Hardhat

**Frontend**
- React 18
- TypeScript
- Wagmi/Viem for Web3
- Chakra UI

**Discord Bot**
- TypeScript
- Discord.js
- OpenAI integration for trivia

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Discord Bot
```bash
cd bot
npm install
# Set up .env with your Discord bot token and OpenAI key
npm run dev
```

### Smart Contracts
```bash
npm install
npx hardhat compile
# Deploy to Base mainnet
npm run deploy:mainnet
```

## Security Features
- 7-day cooldown period for unstaking
- 2% transaction tax for treasury
- Non-upgradeable smart contracts
- Server staking requirement (100k TRIVIA)

## Known Limitations
- Manual treasury management
- No emergency pause functionality
- No automated compounding of staking rewards

## Contributing
1. Fork the repository
2. Create your feature branch
3. Submit a pull request

## License
MIT
