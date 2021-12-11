import { config } from 'dotenv';

config();

export default {
  api: {
    appId: process.env.TWITTER_APP_ID as string,
    apiKey: process.env.TWITTER_API_KEY as string,
    apiKeySecret: process.env.TWITTER_API_KEY_SECRET as string,
    bearerToken: process.env.TWITTER_BEARER_TOKEN as string,
    verbose: false,
  },
};
