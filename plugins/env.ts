import fp from 'fastify-plugin';
import fastifyEnv, { type FastifyEnvOptions as EnvOptions } from '@fastify/env';

/**
 * This plugins to check environment variables
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp<{ env?: EnvOptions }>(async (fastify, opts) => {
  fastify.register(fastifyEnv, opts.env);
});