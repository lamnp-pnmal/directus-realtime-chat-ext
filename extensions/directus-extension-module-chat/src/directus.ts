import { createDirectus, rest, authentication, realtime } from "@directus/sdk";

const client = createDirectus(window.location.origin)
  .with(rest())
  .with(authentication())
  .with(realtime());

export default client;
