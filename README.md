# ChatGPT Discord Daily News Bot

This project is a Discord bot that utilizes the OpenAI API to summarize messages into a concise and comprehensive
summary. The bot is designed to help streamline conversations by highlighting key points for easy reference.

## Features

- **Message Summarization**: Automatically composes a summary from messages in a channel for a specific date.
- **Easy-to-Use**: Simple commands to generate summaries within Discord.
- **Integrates OpenAI API**: Leverages the power of OpenAI's language model to provide accurate and context-aware
  summaries.

## Installation

To get started with the Discord Bot Summarizer, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Dependencies**: Ensure you have [Node.js](https://nodejs.org/) installed. Use Yarn for installing project
   dependencies:
   ```bash
   yarn install
   ```

3. **Set Environment Variables**: Create a `.env` file to store your API keys and bot token:
    ```
    NODE_ENV=development # Sets the environment in which the bot operates, typically 'development' or 'production'.
    
    DISCORD_TOKEN=your_discord_bot_token # Your Discord bot token to authenticate with Discord API.
    
    DISCORD_MAX_MESSAGE_LENGTH=2000 # Maximum length for a Discord message, to handle chunking and processing limits.
    DISCORD_API_REQ_LIMIT=100 # Limit for API requests per interval to avoid hitting rate limits.
    
    GUILD_ID= # Unique identifier for your Discord Guild (server) where the bot operates.
    CHANNELS_IDS= # Comma-separated list of Channel IDs to schedule.
    
    OPENAI_API_KEY=your_openai_api_key # The API key for accessing OpenAI services.
    
    GPT_MODEL=gpt-4o-mini # The specific model of OpenAI API you're using.
    GPT_TOKEN_COST=0.15 # Cost per 1M tokens (for info purposes and managing API usage costs).
    GPT_TIMEOUT_MS=120000 # Timeout setting for API requests in milliseconds.
    GPT_TEMPERATURE=0.8 # Sampling temperature, adjusting the randomness of the AI's responses.
    GPT_MODEL_TOKENS=16385 # Total tokens limit for the model, including input and output.
    GPT_COMPLETION_TOKENS=3000 # Number of tokens to allocate for the completion part of the request.
    GPT_MIN_TOKENS_TO_ANALYZE=300 # Minimum token count required to process and summarize effectively.
    
    DAYJS_LOCALE=en # Locale setting for date and time formatting, using dayjs library.
    RESULT_LANGUAGE=English # Language setting for output results and summaries.
    ```

4**Build**

   ```bash
   yarn build
   ```

5**Run the Bot**:

   ```bash
   yarn start
   ```

## Usage

Once the bot is live in a Discord server, use commands to summarize messages. Example command structure might include:

- `/daily [channel] [date]`: Initiates the summarization process for a selected range of messages. Date format:
  DD.MM.YY (example: 08.12.24)

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue for any bugs or features.

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.
