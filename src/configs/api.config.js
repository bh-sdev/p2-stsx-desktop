import axios from 'axios';

const _API_CONFIG = {
  baseURL: process.env.REACT_APP_API_ROOT,
};

const API_CONFIG = _API_CONFIG; //new Proxy(_API_CONFIG);

export const API_AXIOS_CONFIG = {};

export const updateBaseURL = (url) => {
  API_CONFIG.baseURL = url;
  updateAxiosBaseURL(url);
};

export const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
});

/**
 * @var {import('axios').AxiosInstance[]}
 */
const axioses = [];

// Function to update the baseURL of the Axios instance
const updateAxiosBaseURL = (newURL) => {
  axiosInstance.defaults.baseURL = newURL;
  // axios.defaults.baseURL = newURL;
  axioses.forEach((e) => (e.defaults.baseURL = newURL));
};

/**
 *
 * @param {import('axios').AxiosInstance} instance
 */
export const subscribeAxios = (instance) => {
  axioses.push(instance);
};

export default API_CONFIG;
