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
        const handleConfig = { ...config };

        if (handleConfig.headers) {
          // 数据转换
          const contentType = (handleConfig.headers['Content-Type'] || CONTENT_TYPE.json) as ContentTypeValue;
          handleConfig.data = await transformRequestData(config.data, contentType);

          // 设置请求头(配置token等操作)
          this.requestConfig.onEditHeaders(handleConfig.headers);
        }

        return handleConfig;
      },
      error => handleAxiosError(error)
    );
    this.axiosInstance.interceptors.response.use(
      response => {
        if (isHttpSuccess(response.status)) {
          const backend = response.data as Record<string, any>;
          const { codeKey, successCode, msgKey } = this.requestConfig;
          // 后端定义的业务上的请求成功
          if (backend[codeKey] === successCode) {
            return Promise.resolve(response);
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
    onEditHeaders() {},
    onShowMsg() {}
  };
  Object.assign(configs, requestConfig);

  const request = new Request(axiosConfig, configs);

  return request.axiosInstance;
}
