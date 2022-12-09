import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import { CONTENT_TYPE, type ContentTypeValue } from './constant';
import type { RequestConfig, RequiredRequestConfig } from '../types';

export function createDefaultRequestConfig(requestConfig?: RequestConfig) {
  const configs: RequiredRequestConfig = {
    codeKey: 'code',
    dataKey: 'data',
    msgKey: 'message',
    onRequest: async config => config,
    onBackendSuccess: responseData => {
      const BACKEND_SUCCESS_CODE = 200;
      const { codeKey } = configs;
      return responseData[codeKey] === BACKEND_SUCCESS_CODE;
    },
    onBackendFail: async () => {},
    onError: async ({ error }) => {
      window.console.log(`code: ${error.code}, msg: ${error.msg}`);
    }
  };

  Object.assign(configs, requestConfig);

  return configs;
}

export function getRequestHeaderContentType(config: AxiosRequestConfig) {
  const contentType = (config?.headers?.['Content-Type'] || CONTENT_TYPE.json) as ContentTypeValue;

  return contentType;
}

/**
 * http是否请求成功
 * @param status http状态码
 */
export function isHttpSuccess(status: number) {
  const isSuccessCode = status >= 200 && status < 300;
  return isSuccessCode || status === 304;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getCustomRequestInstance(instance: AxiosInstance) {}
