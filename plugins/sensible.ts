import fp from 'fastify-plugin';
import fastifySensible, { type SensibleOptions } from '@fastify/sensible';

/**
 * These plugins add some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp<{ sensible?: SensibleOptions }>(async (fastify, opts) => {
  fastify.register(fastifySensible, opts.sensible);
});