import TwitterClient from '@infrastructure/twitter-client/TwitterClient';
import moment, { DurationInputArg2 } from 'moment';

type Report = {
  ticker: string;
  totalMentions: number;
  totalFollowersReached: number;
  uniqueUsernames: Set<string>;
};

class ReportTrendingCryptosQuery {
  constructor(
    private twitterClient: TwitterClient
  ) {}

  async run(duration: string): Promise<Array<Report>> {
    const durationAmount = parseInt(duration);
    const durationUnit = duration[duration.length - 1] as DurationInputArg2;

    const tweets = await this.twitterClient.searchRecentTweets({
      topic: 'crypto',
      startTime: moment().subtract(durationAmount, durationUnit).toDate(),
    });

    const reportMap: Map<string, Report> = new Map();
    for (const tweet of tweets) {
      for (const ticker of this.extractMentionedTickers(tweet.text)) {
        const report: Report = reportMap.get(ticker) || {
          ticker,
          totalMentions: 0,
          totalFollowersReached: 0,
          uniqueUsernames: new Set(),
        };

        report.totalMentions++;
        report.totalFollowersReached += tweet.author.metrics.followersCount;
        report.uniqueUsernames.add(tweet.author.username);
        reportMap.set(ticker, report);
      }
    }

    return this.sortReports(Array.from(reportMap.values()));
  }

  private sortReports(reports: Array<Report>): Array<Report> {
    return reports.sort(
      (r1, r2) => r2.totalFollowersReached - r1.totalFollowersReached
    );
  }

  private extractMentionedTickers(text: string): Array<string> {
    const tickerRegex = /\$[A-Z]{3,5}/g;
    const match = text.match(tickerRegex);
    if (!match) {
      return [];
    }

    const uniqueTickers: Array<string> = [];
    for (const ticker of match) {
      const originalTicker = this.getTickerAlias(ticker) || ticker;
      if (!uniqueTickers.includes(originalTicker)) {
        uniqueTickers.push(originalTicker);
      }
    }

    return uniqueTickers;
  }

  private getTickerAlias(ticker: string) {
    const aliasMap = new Map([['$SHIBA', '$SHIB']]);

    return aliasMap.get(ticker);
  }
}

export default ReportTrendingCryptosQuery;
