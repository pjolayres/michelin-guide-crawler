
const Utilities = {
  mapDOM(document, selector, map) {
    const elements = [...document.querySelectorAll(selector)];
    const result = elements.map(map || (item => item));

    return result;
  },
  firstOrDefaultDOM(document, selector, map) {
    const items = Utilities.mapDOM(document, selector, map);
    if (!items || items.length === 0) {
      return null;
    }

    const result = items[0];

    return result;
  },
  sleep(durationInMs) {
    return new Promise(resolve => setTimeout(resolve, durationInMs));
  }
};

export default Utilities;
