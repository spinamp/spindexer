import axios, { Axios, AxiosError } from 'axios';

const isRetryable = (error: AxiosError) => {
  return !!(
    // must be a response error
    error.response &&
    // must be a rate limit error
    error.response.status === 429 &&
    // must have a Retry-After header
    error.response.headers['retry-after']
  )
}

const wait = (time: number) => {
  console.info(`Rate limit hit, waiting ${time} seconds`);
  return new Promise(
    resolve => setTimeout(resolve, time * 1000)
  );
}

const retry = (axios: Axios, error: AxiosError) => {
  if (!error.config) {
    throw error
  } else {
    return axios.request(error.config)
  }
}

const init = async () => {
  axios.interceptors.response.use((response) => response, async (error: AxiosError) => {
    if (isRetryable(error)) {
      const seconds = parseInt(error.response!.headers['retry-after']);
      if (isNaN(seconds)) {
        return Promise.reject(error);
      }
      await wait(seconds);
      return retry(axios, error);
    } else {
      return Promise.reject(error);
    }
  });
  return axios;
}

export default { init };
