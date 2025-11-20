import { createDirectus, rest, authentication, realtime } from "@directus/sdk";

export type DirectusUser = {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
};

export type Message = {
  id: string;
  text: string;
  date_created: string;
  user_created: DirectusUser;
};

interface MySchema {
  messages: Message[];
  directus_users: DirectusUser[];
}

const client = createDirectus<MySchema>(window.location.origin)
  .with(rest())
  .with(authentication())
  .with(realtime());

export default client;
