import NodeTwitterClient from 'twitter-v2';
import Logger from '@infrastructure/logger/Logger';

export type Tweet = {
  id: string;
  createdAt: Date;
  text: string;
  author: Author;
};

export type Metrics = {
  followersCount: number;
  followingCount: number;
  tweetCount: number;
};

export type Author = {
  id: string;
  createdAt: Date;
  username: string;
  metrics: Metrics;
};

type ConstructorParams = {
  apiKey: string;
  apiKeySecret: string;
  bearerToken: string;
  verbose: boolean,
};

export type SearchRecentTweetsParams = {
  topic: string;
  startTime: Date;
};

class TwitterClient {
  private nodeTwitterClient: NodeTwitterClient;
  private logger = new Logger('TwitterClient');
  private verbose: boolean;

  constructor(params: ConstructorParams) {
    this.nodeTwitterClient = new NodeTwitterClient({
      consumer_key: params.apiKey,
      consumer_secret: params.apiKeySecret,
      bearer_token: params.bearerToken,
    });
    this.verbose = params.verbose;
  }

  async searchRecentTweets(query: SearchRecentTweetsParams): Promise<Array<Tweet>> {
    const userIdToUserMap = new Map<string, any>();
    const rawTweets: Array<any> = [];
    let nextToken = null;
    let page = 1;

    const startedAt = new Date();

    this.log('Running recent tweet search with params:', query);
    do {
      const params: Record<string, string> = {
        query: query.topic,
        max_results: '100',
        start_time: query.startTime.toISOString(),
        'tweet.fields': 'created_at',
        'user.fields': 'created_at,username,public_metrics',
        expansions: 'author_id,entities.mentions.username',
      };

      if (nextToken) {
        params.next_token = nextToken;
      }

      const { data, includes, meta } = await this.nodeTwitterClient.get<any>(
        'tweets/search/recent',
        params
      );

      rawTweets.push(...data);

      for (const user of includes.users) {
        userIdToUserMap.set(user.id, user);
      }

      if (!meta.next_token) {
        break;
      }

      const lastTweet = data[data.length - 1];
      this.log(`Collected ${rawTweets.length} tweets, page: ${page}, progress: ${this.calculateProgress(startedAt, new Date(lastTweet.created_at) ,query.startTime)} %`);

      nextToken = meta.next_token;
      page++;
    } while (true);

    this.log('..done');

    return rawTweets.map((rawTtweet: any) => {
      const user = userIdToUserMap.get(rawTtweet.author_id) as any;
      return this.prepareTweet(rawTtweet, user);
    });
  }

  private log(...args: any) {
    if (this.verbose) {
      this.logger.info(...args);
    }
  }

  private calculateProgress(
    startDate: Date,
    currentDate: Date,
    endDate: Date
  ): number {
    const progressInPercent = (currentDate.getTime() - startDate.getTime()) * 100 / (endDate.getTime() - startDate.getTime());
    return parseFloat(progressInPercent.toFixed(2));
  }

  private prepareTweet(rawTweet: any, user: any) {
    return {
      id: rawTweet.id,
      createdAt: new Date(rawTweet.created_at),
      text: rawTweet.text,
      author: {
        id: user.id,
        createdAt: new Date(user.created_at),
        username: user.username,
        metrics: {
          followersCount: user.public_metrics.followers_count,
          followingCount: user.public_metrics.following_count,
          tweetCount: user.public_metrics.tweet_count,
        },
      },
    };
  }
}

export default TwitterClient;
