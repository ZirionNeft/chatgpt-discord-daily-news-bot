import process from 'node:process';
import type { SafeParseSuccess, ZodError } from 'zod';
import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  LOG_PRETTY: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  DISCORD_TOKEN: z.string(),
  DISCORD_MAX_MESSAGE_LENGTH: z.string().transform((v) => parseInt(v)),
  DISCORD_API_REQ_LIMIT: z.string().transform((v) => parseInt(v)),
  GUILD_ID: z.string(),
  CHANNELS_IDS: z.string().transform((s) => s.split(',')),
  OPENAI_API_KEY: z.string(),
  GPT_MODEL: z.string(),
  GPT_TOKEN_COST: z.string().transform((v) => parseFloat(v)),
  GPT_TIMEOUT_MS: z.string().transform((v) => parseInt(v)),
  GPT_TEMPERATURE: z.string().transform((v) => parseFloat(v)),
  GPT_MODEL_TOKENS: z.string().transform((v) => parseInt(v)),
  GPT_COMPLETION_TOKENS: z.string().transform((v) => parseInt(v)),
  GPT_MIN_TOKENS_TO_ANALYZE: z.string().transform((v) => parseInt(v)),
  DAYJS_LOCALE: z.string(),
  RESULT_LANGUAGE: z.string(),
  GUILD_SCHEDULED_CHANNELS: z.string().transform((s) => s.split(',')).optional(),
});

type SuccessResult<
  S extends z.ZodObject<any>,
  R extends ReturnType<S['safeParse']> = ReturnType<S['safeParse']>,
> = R extends SafeParseSuccess<any> ? R['data'] : never;

export class ConfigService<S extends z.ZodObject<any>> {
  validationResult!: SuccessResult<S>;

  constructor(schema: S) {
    this.#validate(schema);
  }

  get<
    T extends keyof typeof this.validationResult,
    D extends NonNullable<(typeof this.validationResult)[T]>,
  >(name: T, defaultValue?: D): (typeof this.validationResult)[T] {
    const values = this.validationResult!;

    if (typeof values[name] === 'undefined') {
      return defaultValue as D;
    }
    return values[name];
  }

  #validate(schema: S) {
    const res = schema.safeParse(process.env);

    if (!res.success) {
      const { errors } = res.error as ZodError;
      throw new Error('Environment variables validation failed', {
        cause: errors.map((e: any) => {
          e.path = e.path.join('/');
          return e;
        }),
      });
    }

    this.validationResult = res.data as SuccessResult<S>;
  }
}

const config = new ConfigService(ConfigSchema);

export default config;
