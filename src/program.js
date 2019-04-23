import fs from 'fs';
import { promisify } from 'util';
import logger from './logger';
import MichelinCrawler from './crawler';
// import Utilities from './utilities';

const writeFile = promisify(fs.writeFile);

export default async () => {
  const restaurants = await MichelinCrawler.run();

  await writeFile('output.json', JSON.stringify(restaurants), 'utf8');

  // const csv = Utilities.serializeToCsv(restaurants);

  // await writeFile('output.csv', JSON.stringify(csv), 'utf8');

  logger.info('Finished');
};
