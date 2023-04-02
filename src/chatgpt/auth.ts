import fetchCookie from 'fetch-cookie';
import { Cookie } from 'tough-cookie';
import { config } from 'dotenv';
import { fetch, ProxyAgent } from 'undici';

config();

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

export default class Authenticator {
  private _accessToken: string = null;

  private readonly _cookieJar = new fetchCookie.toughCookie.CookieJar();

  private _agent: ProxyAgent;

  private readonly _session = {
    fetch: fetchCookie(fetch, this._cookieJar),
  };

  get accessToken(): string {
    return this._accessToken;
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      const authenticator = new Authenticator();

      if (!authenticator.accessToken) {
        return authenticator.login(
          process.env.PROXY,
          process.env.CHATGPT_EMAIL,
          process.env.CHATGPT_PASSWORD,
          process.env.PUID,
        );
      }

      return authenticator.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async login(proxy: string, email: string, password: string, puid: string) {
    const puidCookie = new Cookie({
      key: '_puid',
      value: puid,
    });
    await this._cookieJar.setCookie(puidCookie, `https://chat.openai.com`);

    this._agent = new ProxyAgent({
      uri: proxy,
    });

    const data = await this.zero()
      .then(this.one)
      .then(this.two)
      .then(this.three)
      .then((state) => this.four(state, email))
      .then((state) => this.five(state, email, password))
      .then(([url, oldState]) => this.six(url, oldState))
      .then(([url, redirectUrl]) => this.seven(url, redirectUrl))
      .then(this.eight);

    this._accessToken = data.accessToken;

    return this._accessToken;
  }

  private async zero() {
    const headers = {
      Host: 'chat.openai.com',
      Accept: '*/*',
      Connection: 'keep-alive',
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      Referer: 'https://chat.openai.com/auth/login',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    const response = await this._session.fetch(
      'https://chat.openai.com/api/auth/csrf',
      {
        headers,
        dispatcher: this._agent,
      },
    );
    const { csrfToken }: { csrfToken?: string } = await response.json();
    return csrfToken;
  }

  private async one(csrfToken: string) {
    const headers = {
      Host: 'chat.openai.com',
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      'Sec-Gpc': '1',
      'Accept-Language': 'en-US,en;q=0.8',
      Origin: 'https://chat.openai.com',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      Referer: 'https://chat.openai.com/auth/login',
      'Accept-Encoding': 'gzip, deflate',
    };

    const response = await this._session.fetch(
      'https://chat.openai.com/api/auth/signin/auth0?prompt=login',
      {
        method: 'POST',
        body: new URLSearchParams({
          callbackUrl: '/',
          csrfToken,
          json: 'true',
        }),
        headers,
        dispatcher: this._agent,
      },
    );
    const { url }: { url?: string } = await response.json();
    return url;
  }

  private async two(url: string) {
    const headers = {
      Host: 'auth0.openai.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Connection: 'keep-alive',
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://chat.openai.com/',
    };

    const response = await this._session.fetch(url, {
      redirect: 'manual',
      headers,
      dispatcher: this._agent,
    });
    const rawData = await response.text();

    return rawData.match(/state=(.*)/g)[0];
  }

  async three(state: string) {
    const headers = {
      Host: 'auth0.openai.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Connection: 'keep-alive',
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://chat.openai.com/',
    };

    await this._session.fetch(
      `https://auth0.openai.com/u/login/identifier?state=${state}`,
      {
        headers,
        dispatcher: this._agent,
      },
    );

    return state;
  }

  private async four(state: string, username: string) {
    const headers = {
      Host: 'auth0.openai.com',
      Origin: 'https://auth0.openai.com',
      Connection: 'keep-alive',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': USER_AGENT,
      Referer: `https://auth0.openai.com/u/login/identifier?state=${state}`,
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    await this._session.fetch(
      `https://auth0.openai.com/u/login/identifier?state=${state}`,
      {
        method: 'POST',
        body: new URLSearchParams({
          state,
          username,
          'js-available': 'false',
          'webauthn-available': 'true',
          'is-brave': 'false',
          'webauthn-platform-available': 'true',
          action: 'default',
        }),
        headers,
        dispatcher: this._agent,
      },
    );
    return state;
  }

  private async five(state: string, username: string, password: string) {
    const headers = {
      Host: 'auth0.openai.com',
      Origin: 'https://auth0.openai.com',
      Connection: 'keep-alive',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': USER_AGENT,
      Referer: `https://auth0.openai.com/u/login/password?state=${state}`,
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await this._session.fetch(
      `https://auth0.openai.com/u/login/password?state=${state}`,
      {
        method: 'POST',
        body: new URLSearchParams({
          state,
          username,
          password,
          action: 'default',
        }),
        headers,
        dispatcher: this._agent,
        redirect: 'manual',
      },
    );

    if (response.status === 302) {
      const url = response.headers.get('Location');
      return [url, state];
    } else {
      throw new Error(
        `part 5, Status ${response.status}: ${response.statusText}`,
      );
    }
  }

  private async six(url: string, oldState: string) {
    const headers = {
      Host: 'auth0.openai.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Connection: 'keep-alive',
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      Referer: `https://auth0.openai.com/u/login/password?state=${oldState}`,
    };

    const response = await this._session.fetch(
      `https://auth0.openai.com${url}`,
      {
        headers,
        redirect: 'manual',
        dispatcher: this._agent,
      },
    );

    if (response.status === 302) {
      const redirectUrl = response.headers.get('Location');
      return [url, redirectUrl];
    } else {
      throw new Error(
        `part 6, Status ${response.status}: ${response.statusText}`,
      );
    }
  }

  private async seven(previousUrl: string, redirectUrl: string) {
    const headers = {
      Host: 'chat.openai.com',
      Accept: 'application/json',
      Connection: 'keep-alive',
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      Referer: previousUrl,
    };

    await this._session.fetch(redirectUrl, {
      headers,
      dispatcher: this._agent,
    });
  }

  private async eight(): Promise<{ accessToken?: string }> {
    const response = await this._session.fetch(
      'https://chat.openai.com/api/auth/session',
      {
        dispatcher: this._agent,
      },
    );

    return response.json();
  }
}
