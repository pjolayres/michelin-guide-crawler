import { JSDOM } from 'jsdom';
import _ from 'lodash';
import logger from './logger';
import Utilities from './utilities';

const BatchSize = 10;
const RetryCount = 5;

export default class MichelinCrawler {
  static async run2() {
    // const links = await MichelinCrawler.fetchHardLinks();
    const links = await MichelinCrawler.fetchLinks('https://gm.gnavi.co.jp/restaurant/list/tokyo');
    const restaurants = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const restaurant = await this.fetchRestaurantInfo(link); // eslint-disable-line no-await-in-loop

      restaurants.push(restaurant);
    }

    return restaurants;
  }

  static async run() {
    const links = await MichelinCrawler.fetchHardLinks();
    const linkBatches = _.chunk(links, BatchSize);
    const restaurantBatches = [];
    let count = 0;

    for (let i = 0; i < linkBatches.length; i++) {
      const linkBatch = linkBatches[i];
      const queryBatch = linkBatch.map(link => this.fetchRestaurantInfo(link));

      const restaurantBatch = await Promise.all(queryBatch); // eslint-disable-line no-await-in-loop
      const filteredBatch = restaurantBatch.filter(item => !!item);

      restaurantBatches.push(filteredBatch);

      count += filteredBatch.length;

      logger.info(`Total restaurants parsed: ${count}`);
    }

    const restaurants = _.flatten(restaurantBatches);

    return restaurants;
  }

  static async fetchHardLinks() {
    const listUrls = ['https://gm.gnavi.co.jp/restaurant/list/tokyo'];
    for (let i = 2; i <= 49; i++) {
      listUrls.push(`https://gm.gnavi.co.jp/restaurant/list/tokyo/all_area/all_small_area/all_food/all_star/p${i}/`);
    }

    const parseList = async url => {
      const dom = await JSDOM.fromURL(url);

      const pageLinks = Utilities.mapDOM(dom.window.document, '#restaurantList li.part .rname a', a => a.href);

      return pageLinks;
    };

    const routines = listUrls.map(url => parseList(url));
    const links = await Promise.all(routines);
    const result = _.flatten(links);

    return result;
  }

  static async fetchLinks(url) {
    let links = [];
    let currentUrl = url;

    do {
      const dom = await JSDOM.fromURL(currentUrl); // eslint-disable-line no-await-in-loop
      const currentLinks = Utilities.mapDOM(dom.window.document, '#restaurantList li.part .rname a', a => a.href);

      links = [...links, ...currentLinks];

      currentUrl = Utilities.firstOrDefaultDOM(dom.window.document, '#resultPager .pager li:nth-child(2) a', a => a.href);
    } while (currentUrl);

    return links;
  }

  static async fetchRestaurantInfo(url) {
    let retries = RetryCount;

    while (retries > 0) {
      try {
        const restaurant = {};

        const dom = await JSDOM.fromURL(url); // eslint-disable-line no-await-in-loop

        restaurant.michelinGuideUrl = url;
        restaurant.category = Utilities.firstOrDefaultDOM(dom.window.document, '#restaurantName .category', element => element.textContent);

        restaurant.internationalTitle = Utilities.firstOrDefaultDOM(
          dom.window.document,
          '#restaurantName .px26',
          element => [...element.childNodes]
            .filter(child => child.nodeName === '#text')
            .map(item => item.textContent)
            .join(' ')
        );

        restaurant.localTitle = Utilities.firstOrDefaultDOM(dom.window.document, '#restaurantName .px18', element => (element.textContent || '').trim());

        restaurant.isNewEntry = !!Utilities.firstOrDefaultDOM(dom.window.document, '#restaurantName .px26 .addIcon-S-new-r', element => (element.textContent || '').trim());

        restaurant.isPromoted = !!Utilities.firstOrDefaultDOM(dom.window.document, '#restaurantName .px26 .up', element => (element.textContent || '').trim());

        restaurant.openingHours = Utilities.firstOrDefaultDOM(dom.window.document, '#rInfo .hours dd', element => (element.textContent || '').trim());

        restaurant.holiday = Utilities.firstOrDefaultDOM(dom.window.document, '#rInfo .holiday dd', element => (element.textContent || '').trim());

        restaurant.price = Utilities.firstOrDefaultDOM(dom.window.document, '#rInfo .price dd', element => (element.textContent || '').trim());

        const prices = (restaurant.price || '').match(/[0-9,]+/g).map(x => parseInt(x.replace(',', ''), 10));
        restaurant.maxPrice = _.max(prices);
        restaurant.minPrice = _.min(prices);

        restaurant.address = Utilities.firstOrDefaultDOM(dom.window.document, '#rInfo .address dd', element => (element.textContent || '').trim());

        restaurant.url = Utilities.firstOrDefaultDOM(dom.window.document, '#rInfo .url dd a', element => element.href);

        restaurant.telephone = Utilities.firstOrDefaultDOM(dom.window.document, '#rInfo .tel dd', element => (element.textContent || '').trim());

        restaurant.properties = Utilities.mapDOM(dom.window.document, '#marksHints .marks li', element => (element.textContent || '').trim()).join(', ');

        restaurant.rating = Utilities.firstOrDefaultDOM(dom.window.document, '#stars .rating', element => (element.textContent || '').trim());

        const amenityClass = Utilities.firstOrDefaultDOM(dom.window.document, '#stars .amenity span', element => element.className);
        const [, num1, num2] = amenityClass.match(/restaurant_([0-9])(?:_([0-9]))?/);

        restaurant.ammenityScore = parseFloat([num1, num2].filter(item => !!item).join('.'));

        restaurant.ammenityDescription = Utilities.firstOrDefaultDOM(dom.window.document, '#stars .amenity', element => (element.textContent || '').trim());

        const mapUrl = `${url}map`;
        const { latitude, longitude, mapUri } = await MichelinCrawler.fetchRestaurantMapInfo(mapUrl); // eslint-disable-line no-await-in-loop

        restaurant.latitude = latitude;
        restaurant.longitude = longitude;
        restaurant.mapUri = mapUri;

        return restaurant;
      }
      catch (ex) {
        retries -= 1;

        logger.error(`Failed to parse restaurant info in ${url}. Retries left: ${retries}`);
        logger.error(ex);

        Utilities.sleep(1000);
      }
    }

    return null;
  }

  static async fetchRestaurantMapInfo(mapUrl) {
    let retries = RetryCount;

    while (retries > 0) {
      try {
        const mapDom = await JSDOM.fromURL(mapUrl); // eslint-disable-line no-await-in-loop

        const mapHtml = mapDom.serialize();
        const [, latitude] = mapHtml.match(/lat: ([0-9.]+),/);
        const [, longitude] = mapHtml.match(/lng: ([0-9.]+),/);
        const [, mapUri] = mapHtml.match(/mapuri:'([^']+)'/);

        const result = {
          latitude,
          longitude,
          mapUri
        };

        return result;
      }
      catch (ex) {
        retries -= 1;

        logger.error(`Failed to parse restaurant info in ${mapUrl}. Retries left: ${retries}`);
        logger.error(ex);

        Utilities.sleep(1000);
      }
    }

    return null;
  }
}
