import fp from 'fastify-plugin';
import fastifyStatic, { type FastifyStaticOptions as StaticOptions } from '@fastify/static';

/**
 * This plugins to check environment variables
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp<{ static: StaticOptions }>(async (fastify, opts) => {
  fastify.register(fastifyStatic, opts.static);
});