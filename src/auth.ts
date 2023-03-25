const CHATGPT_API_BASE_URL = 'https://api.openai.com/v1/';

export async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${CHATGPT_API_BASE_URL}login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.CHATGPT_EMAIL,
        password: process.env.CHATGPT_PASSWORD,
      }),
    });

    if (!response.ok) {
      console.error('Error getting access token:', response.statusText);
      return null;
    }

    const data: Record<string, unknown> = await response.json();
    return data.access_token as string;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
