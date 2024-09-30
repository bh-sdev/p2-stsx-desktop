import ServiceUserStorage from 'services/ServiceUserStorage';
import moment from 'moment';

export const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

export const noNullValues = (obj) => {
  for (let key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      obj[key] = noNullValues(obj[key]);
    }
    if (obj[key] === null || obj[key] === undefined) {
      obj[key] = '';
    }
  }
  return obj;
};

export const noEmptyStringValues = (obj) => {
  for (let key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      obj[key] = noEmptyStringValues(obj[key]);
    }
    if (obj[key] === '') {
      obj[key] = null;
    }
  }
  return obj;
};

export const noSpaceOnStart = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'string') {
      newObj[key] = obj[key].trim();
    } else {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

export const formatNumber = (number) => {
  if (!number) {
    return '';
  }
  return Math.round(parseFloat(number.replace(/,/g, '')) * 1000) / 1000;
};

export const trimStartEnd = (string) => {
  return string.trim();
};

export const trimAll = (string) => {
  return string.replace(/\s/g, '');
};

export const searchInArray = (arr, query) => {
  const lowerCaseQuery = (query || '').toLowerCase();
  return arr.filter((item) => item.toLowerCase().includes(lowerCaseQuery));
};

export const compareArrays = (a, b) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

export const validationNumberLength = (schema, length) =>
  schema.lazy((val) =>
    val === ''
      ? schema.string()
      : schema.number().test('len', '', (val) => {
          return String(val).replace(/,|\./g, '').length <= length;
        }),
  );
export const formatCol = (rowData, col) => {
  if (!rowData[col.Alias] && rowData[col.Alias] !== 0) {
    return '';
  }

  if (col.DataType === 'time') {
    return moment(rowData[col.Alias]).format('MM/DD/YYYY hh:mm A');
  }

  if (col.DataType === 'float') {
    return Math.round(rowData[col.Alias] * 1000) / 1000;
  }

  if (col.DataType === 'bool') {
    return rowData[col.Alias] ? 1 : 0;
  }

  return rowData[col.Alias];
};
export const formatNumberInput = (number) => {
  if (!number) {
    return '';
  }
  const resultNumber = number.toString().replace(/,/g, '');
  if (isNaN(resultNumber)) {
    return '';
  }

  return BigInt(resultNumber).toLocaleString();
};

export const getDocumentTitleInfo = () => {
  return `STS Desktop - ${ServiceUserStorage.getUserStringInfo()}`;
};
export const generateIntegerId = () => {
  const time = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return time + random;
};
export const truncateString = (str, length) => {
  return str.length > length ? str.substring(0, length) : str;
};

export const time = (time) => {
  let res = `${time} sec`;
  if (time > 60 && time / 60 < 60) {
    res = `${(time / 60).toFixed(1)} min`;
  } else if (time / 60 >= 60) {
    res = `${(time / 60 / 60).toFixed(1)} hrs`;
  }
  return res;
};

const NUM_MAP = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  0: 'zero',
};

export const convertNumbersToStringNames = (str) => {
  const numbers = str.replace(/\D/g, '').split('');
  return numbers.length ? numbers.map((num) => NUM_MAP[num]).join('') : str;
};

export const maxNumberLength = (length, value) => {
  if (typeof value !== 'number') return null;
  return Number(String(value).slice(0, length));
};
export const findNONE = (s) => {
  const regex = /none/gi;
  if (s) {
    const match = s?.match(regex);
    if (match) {
      return s.indexOf(match[0]);
    } else {
      return false;
    }
  } else {
    return false;
  }
};

const kgPerLbs = 0.45359237;

export const LbsToKg = (value) => value * kgPerLbs;

export const KgToLbs = (value) => value / kgPerLbs;
export const onCopy = (e) => {
  e.preventDefault();
  const text = e.target.innerText.trim().replace(/\s+/g, ' ');
  e.clipboardData.setData('text/plain', text);
};
