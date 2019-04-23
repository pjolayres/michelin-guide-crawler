
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
  },
  serializeToCsv(array) {
    if (!array || array.length === 0) {
      return '';
    }

    const lines = [];
    const columns = Object.keys(array[0]);
    lines.push(columns.join('\t'));

    array.forEach(item => {
      const line = [];

      columns.forEach(column => {
        const value = item[column];
        let serializedValue = null;

        if (value instanceof Array) {
          serializedValue = value.join(', ');
        }
        else if (typeof value === 'string') {
          serializedValue = `"${value}"`;
        }
        else {
          serializedValue = value;
        }

        line.push(serializedValue);
      });

      lines.push(line.join('\t'));
    });

    const result = lines.join('\n');

    return result;
  }
};

export default Utilities;
