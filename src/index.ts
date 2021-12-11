import TwitterClient from '@infrastructure/twitter-client/TwitterClient';
import ReportTrendingCryptosQuery from '@application/ReportTrendingCryptosQuery';
import config from './config';
import Logger from '@infrastructure/logger/Logger';

(async () => {
  const twitterClient = new TwitterClient({
    apiKey :config.api.apiKey,
    apiKeySecret :config.api.apiKeySecret,
    bearerToken :config.api.bearerToken,
    verbose: config.api.verbose,
  });

  const reportTrendingCryptosQuery = new ReportTrendingCryptosQuery(twitterClient);
  const logger = new Logger('index');

  while (true) {
    try {
      const reports = await reportTrendingCryptosQuery.run('5m');
      logger.info(`----------- Report --------`);
      for (const report of reports) {
        logger.info(`${report.ticker} / reach: ${report.totalFollowersReached} / unique users: ${Array.from(report.uniqueUsernames.values())}`);
      }
      logger.info('----------------------------');
    } catch (err) {
      logger.error(err);
    }

    await sleep(30 * 60000);
  }
})();

function sleep(msec: number) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}
