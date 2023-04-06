import { ChatGPTAPI } from 'chatgpt';
import { encode } from 'gpt-3-encoder';
import { config } from 'dotenv';

config();

const LANGUAGE = process.env.RESULT_LANGUAGE || 'English';

const systemMessage = `You are a news reporter. Write the topic recaps using flavorful and emotional writing style, make the topics sound dramatic and suspenseful.
   Follow this rules:
   - Recap key discussion themes and make a short digest news with jokes and black or ironic humor with the louder titles.
   - Strict follow this rule: Use this style to each news entry - '**NEWS TITLE**: DESCRIPTION'.
   - Use one line separator between each list entry as gap.
   - Use Discord flavored markdown for text formatting.
   - Strict follow this rule: Do not write any header in start of result.
   - Your output should be in ${LANGUAGE} language.`;

const CHATGPT_TIMEOUT_MS = 2 * 60 * 1000;

const TOKENS_COST = 0.002;

export async function makeRequestToChatGPT(
  chunks: string[],
  date: string,
  abortSignal: AbortSignal,
): Promise<string[] | { error: string }> {
  try {
    const gptApi = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      systemMessage,
      debug: true,
      completionParams: {
        temperature: 0.9,
      },
    });

    console.log(`Sending message to ChatGPT for the date '${date}'`);

    const results = [];
    for (const chunk of chunks) {
      try {
        const response = await gptApi.sendMessage(chunk, {
          timeoutMs: CHATGPT_TIMEOUT_MS,
          abortSignal,
        });

        results.push(response.text);

        const responseTokens = encode(response.text).length;
        const promptTokens = encode(chunk).length;
        console.log(
          `Prompt chunk tokens: ${promptTokens}, response tokens: ${responseTokens}; Spent ~${
            ((responseTokens + promptTokens) / 1000) * TOKENS_COST
          }`,
        );
      } catch (e) {
        console.error(e);
      }
    }

    return results;
  } catch (e) {
    if (e.name === 'AbortError') {
      return {
        error: 'Request aborted.',
      };
    }

    console.error('Error sending request to ChatGPT:', e);
    return {
      error: `Error: ${e.name}`,
    };
  }
}
