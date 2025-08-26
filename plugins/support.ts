import fp from 'fastify-plugin';

export interface SupportOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<{ support?: SupportOptions }>(async (fastify, opts) => {
  fastify.decorate('someSupport', () => 'hugs');
});

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    someSupport(): string;
  }
}