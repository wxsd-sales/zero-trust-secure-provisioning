declare global {
    namespace App {}
  
    export { HttpMethod } from './lib/types/http-method';
    export { JsonValue, JsonArray, JsonObject, ToJson, Json } from './lib/types/json';
  }
  
  export {};