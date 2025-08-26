import Ajv from 'ajv';
import bot, { Bot } from './services/bot';
import addFormats from 'ajv-formats';
import AutoLoad from '@fastify/autoload';
import { join } from 'path';
import type { FastifyInstance, FastifyPluginOptions, FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { API_BASE_URL as WEBEX_API_BASE_URL, VALID_ACCESS_TOKEN } from '$lib/constants/webex';
import type { SensibleOptions } from '@fastify/sensible';
import type { FastifyEnvOptions as EnvOptions } from '@fastify/env';
import type { FastifyStaticOptions as StaticOptions } from '@fastify/static';
import type { AutoloadPluginOptions } from '@fastify/autoload';

export type AppOptions = {
  server?: FastifyServerOptions;
  routes: AutoloadPluginOptions;
  plugins: AutoloadPluginOptions & {
    options: { env: EnvOptions; static: StaticOptions; sensible?: SensibleOptions };
  };
};

const ajv = addFormats(
  new Ajv({ allErrors: true, removeAdditional: true, useDefaults: true, coerceTypes: true, allowUnionTypes: true })
);

const schema = {
  type: 'object',
  required: [
    'PORT',
    'WEBEX_BOT_EMAIL',
    'WEBEX_BOT_ID',
    'WEBEX_BOT_TOKEN',
    'ISE_USERNAME',
    'ISE_PASSWORD',
    'ISE_CLIENT_ID',
    'ISE_CLIENT_PROFILE_ID',
    'ISE_API_BASE_URL'
  ],
  properties: {
    PORT: { type: 'number', default: 3000 },
    WEBEX_API_BASE_URL: { type: 'string', format: 'uri', default: WEBEX_API_BASE_URL },
    WEBEX_BOT_EMAIL: { type: 'string', format: 'email' },
    WEBEX_BOT_ID: { type: 'string' },
    WEBEX_BOT_TOKEN: { type: 'string', format: 'password', pattern: VALID_ACCESS_TOKEN.source },
    WEBEX_PERSON_EMAIL_REGEX_BASE64: { type: 'string', default: 'Lio' },
    ISE_USERNAME: { type: 'string' },
    ISE_PASSWORD: { type: 'string' },
    ISE_CLIENT_ID: { type: 'string' },
    ISE_CLIENT_PROFILE_ID: { type: 'string' },
    ISE_API_BASE_URL: { type: 'string', format: 'uri', default: WEBEX_API_BASE_URL }
  }
};

const provisionOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['ip', 'mac'],
      additionalProperties: false,
      properties: {
        ip: { type: 'string' },
        mac: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          result: { type: 'string' }
        }
      }
    }
  }
};

// Pass --options via CLI arguments in command to enable these options.
const appOptions: AppOptions = {
  server: { logger: true },
  routes: { dir: join(__dirname, 'routes') },
  plugins: {
    dir: join(__dirname, 'plugins'),
    options: { static: { root: join(__dirname, '../public') }, env: { dotenv: true, expandEnv: true, ajv, schema } }
  }
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> => {
  // load plugins
  void fastify.register(AutoLoad, options.plugins);

  console.log('options.routes', options.routes);
  // load routes
  void fastify.register(AutoLoad, options.routes);

  let webexBot: Bot;
  fastify.post<{ Body: { ip: string; mac: string } }>('/provision', provisionOpts, async function (request, reply) {
   
    const device = request.body;
    try{
      const result = await fastify.validateDevice(device)
      reply.status(200).send({result});
      webexBot.sendTest('wimills@cisco.com', 'Provisioning Device: '+device.ip)
    }catch(error){
      reply.status(404).send({error});
      webexBot.sendTest('wimills@cisco.com', 'Could not connect to Device: '+device.ip)
    }
    
    
  });

  fastify.addHook('onReady', async () => {
    // Some code
    const personEmailRegexBase64 = Buffer.from(fastify.config.WEBEX_PERSON_EMAIL_REGEX_BASE64, 'base64');
    const personEmailRegex = new RegExp(personEmailRegexBase64.toString());
    const webex = {
      baseUrl: fastify.config.WEBEX_API_BASE_URL,
      botId: fastify.config.WEBEX_BOT_ID,
      botToken: fastify.config.WEBEX_BOT_TOKEN,
      personEmailRegex
    };

    const ise = {
      baseUrl: fastify.config.ISE_API_BASE_URL,
      username: fastify.config.ISE_USERNAME,
      password: fastify.config.ISE_PASSWORD,
      clientId: fastify.config.ISE_CLIENT_ID,
      clientProfileId: fastify.config.ISE_CLIENT_PROFILE_ID
    };

    webexBot = bot(webex, ise, fastify.log);
    webexBot.initialize();

    //await bot.sendTest('wimills@cisco.com', 'test message')
  });
};

export default (fastify: FastifyInstance) => app(fastify, appOptions);
