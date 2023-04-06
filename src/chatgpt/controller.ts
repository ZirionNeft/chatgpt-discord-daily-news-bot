import { ChatGPTAPI } from 'chatgpt';
import { encode } from 'gpt-3-encoder';

const systemMessage = `You are a news reporter. Write the topic recaps using flavorful and emotional writing style, make the topics sound dramatic and suspenseful.
   Follow this rules:
   - Input is a compressed with zlib base64-encoded data. Decompress it.
   - From decompressed data, make a short digest news with jokes and black or ironic humor.
   - Strict following: Use this style to each news entry: '**TITLE**: DESCRIPTION'. Use one line separator between each list entry as gap.
   - Use Discord flavored markdown for text formatting.
   - Strict following: Do not write any start header, just return list with news.
   - Your output should be in Russian language.
   - Mention the participants of discussions if it is important for context.`;

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
        top_p: 0.7,
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
          `Prompt chunk tokens: ${promptTokens}, response tokens: ${responseTokens}; Estimated cost ~${
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
