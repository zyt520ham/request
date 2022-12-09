import axios from 'axios';
import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import {
  createDefaultRequestConfig,
  getRequestHeaderContentType,
  transformRequestData,
  isHttpSuccess,
  handleAxiosError,
  handleHttpError,
  handleBackendError
} from './shared';
import type { RequestConfig, RequiredRequestConfig } from './types';

class Request {
  axiosInstance: AxiosInstance;

  requestConfig: RequiredRequestConfig;

  constructor(axiosConfig: AxiosRequestConfig, requestConfig?: RequestConfig) {
    this.axiosInstance = axios.create(axiosConfig);
    this.setInterceptor();

    this.requestConfig = createDefaultRequestConfig(requestConfig);
  }

  /** 设置请求拦截器 */
  setInterceptor() {
    this.axiosInstance.interceptors.request.use(
      async config => {
        const conf: AxiosRequestConfig = { ...config };

        const contentType = getRequestHeaderContentType(conf);

        conf.data = await transformRequestData(config.data, contentType);

        const handledConf = await this.requestConfig.onRequest(conf);

        Object.assign(conf, handledConf);

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

/**
 * 创建请求
 * @param axiosConfig axios配置
 * @param requestConfig 请求配置
 * @param isRaw 是否返回原始的axios实例, (默认返回自定义的请求实例)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createRequest(axiosConfig: AxiosRequestConfig, requestConfig?: RequestConfig, isRaw = false) {
  const request = new Request(axiosConfig, requestConfig);

  return request.axiosInstance;
}
