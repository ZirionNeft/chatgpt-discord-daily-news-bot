import Authenticator from 'openai-authenticator';

export async function getAccessToken(): Promise<string | null> {
  try {
    const authenticator = new Authenticator();

    const { accessToken } = (await authenticator.login(
      process.env.CHATGPT_EMAIL,
      process.env.CHATGPT_PASSWORD,
    )) as { accessToken: string; cookie: string };

    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
