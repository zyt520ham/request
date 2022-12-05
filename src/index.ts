import axios from 'axios';
import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import {
  CONTENT_TYPE,
  transformRequestData,
  isHttpSuccess,
  handleAxiosError,
  handleHttpError,
  handleBackendError
} from './shared';
import type { ContentTypeValue } from './shared';
import type { RequestConfig } from './types';

class Request {
  axiosInstance: AxiosInstance;

  requestConfig: RequestConfig;

  constructor(axiosConfig: AxiosRequestConfig, requestConfig: RequestConfig) {
    this.axiosInstance = axios.create(axiosConfig);
    this.setInterceptor();

    this.requestConfig = requestConfig;
  }

  /** 设置请求拦截器 */
  setInterceptor() {
    this.axiosInstance.interceptors.request.use(
      async config => {
        const conf = { ...config };

        if (conf.headers) {
          // 数据转换
          const contentType = (conf.headers['Content-Type'] || CONTENT_TYPE.json) as ContentTypeValue;
          conf.data = await transformRequestData(config.data, contentType);
        }

        Object.assign(conf, this.requestConfig.onRequest(conf));

        return conf;
      },
      error => handleAxiosError(error)
    );
    this.axiosInstance.interceptors.response.use(
      async response => {
        if (isHttpSuccess(response.status)) {
          const { codeKey, msgKey } = this.requestConfig;

          if (this.requestConfig.onBackendSuccess(response.data)) {
            return Promise.resolve(response);
          }

          if (this.requestConfig.onBackendFail) {
            const fail = await this.requestConfig.onBackendFail(response, this.axiosInstance);
            if (fail) {
              return fail;
            }
          }

          // 后端定义的业务上的错误
          return Promise.reject(handleBackendError(response, { codeKey, msgKey }));
        }

        return Promise.reject(handleHttpError(response));
      },
      error => handleAxiosError(error)
    );
  }
}

export function createRequest(axiosConfig: AxiosRequestConfig, requestConfig?: Partial<RequestConfig>) {
  const configs: RequestConfig = {
    codeKey: 'code',
    dataKey: 'data',
    msgKey: 'message',
    successCode: 200,
    onRequest: config => config,
    onBackendSuccess: responseData => {
      const { codeKey, successCode } = configs;
      return responseData[codeKey] === successCode;
    }
  };
  Object.assign(configs, requestConfig);

  const request = new Request(axiosConfig, configs);

  return request.axiosInstance;
}
