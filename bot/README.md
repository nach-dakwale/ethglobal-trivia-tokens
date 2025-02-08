# TRIVIA Discord Bot

A Discord bot that generates trivia questions and rewards correct answers with TRIVIA tokens.

## Features

- Generate trivia questions about any theme (e.g., technology, history, science, gardening)
- Two difficulty levels: Easy (5 TRIVIA) and Hard (10 TRIVIA)
- Support for partial rewards (50%) for borderline correct answers
- Wallet registration for receiving rewards
- Balance checking command
- Uses GPT-4 for question generation and answer validation
- Question history tracking to prevent duplicates
- Input sanitization and error handling
- Automated trivia sessions with configurable intervals

## Prerequisites

- Node.js v23 or higher
- Discord Bot Token
- OpenAI API Key
- Ethereum Wallet with TRIVIA tokens for rewards

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd bot
   npm install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Fill in the required environment variables in `.env`:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `CLIENT_ID`: Your Discord application client ID
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PRIVATE_KEY`: Private key of the wallet holding TRIVIA tokens
   - Other variables can use the default values

5. Create the data directory:
   ```bash
   mkdir -p data
   ```

6. Build the project:
   ```bash
   npm run build
   ```

## Usage

There are two ways to run the bot:

### Development Mode
For local development with auto-reload:
```bash
npm run dev
```

### Production Mode
For production deployment with PM2 process manager:
1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Start the bot:
   ```bash
   npm start
   ```

Additional PM2 commands:
- `npm run stop` - Stop the bot
- `npm run restart` - Restart the bot
- `npm run logs` - View bot logs
- `npm run status` - Check bot status

### Commands

- `/trivia start <interval> <theme>` - Start automated trivia with questions every <interval> minutes (1-60) about any <theme>
- `/trivia stop` - Stop the current trivia game (requires Manage Messages permission)
- `/register <address>` - Register your wallet address to receive rewards
- `/balance` - Check your TRIVIA token balance

## Development

Run in development mode:
```bash
npm run dev
```

## Production Considerations

This is a hackathon project, but here are some considerations for production deployment:

### Security
- Move sensitive keys to AWS Parameter Store/Secrets Manager
- Implement rate limiting for OpenAI API
- Add input validation for user messages
- Set up proper monitoring for bot wallet balances

### Infrastructure
- Using PM2 for process management
- Consider moving user registration from JSON to a proper database
- Set up monitoring for bot health and token balances
- Implement proper logging system

### Economic
- Monitor OpenAI API costs
- Track gas fees usage
- Maintain sufficient reward token balance
- Set up alerts for low balances

### Future Improvements
- Multi-signature wallet for bot funds
- Emergency pause functionality
- Professional security audit
- Anti-farming measures
- Comprehensive test coverage

## License

MIT 