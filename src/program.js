import fs from 'fs';
import { promisify } from 'util';
import logger from './logger';
import MichelinCrawler from './crawler';

const writeFile = promisify(fs.writeFile);

export default async () => {
  const restaurants = await MichelinCrawler.run();

  await writeFile('output.json', JSON.stringify(restaurants), 'utf8');

  logger.info('Finished');
};
