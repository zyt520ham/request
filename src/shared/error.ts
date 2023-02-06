import type { AxiosResponse } from 'axios';
import {
  DEFAULT_REQUEST_ERROR_CODE,
  DEFAULT_REQUEST_ERROR_MSG,
  NETWORK_ERROR_CODE,
  NETWORK_ERROR_MSG,
  REQUEST_TIMEOUT_CODE,
  REQUEST_TIMEOUT_MSG,
  BLANK_AXIOS_ERROR_CODE,
  ERROR_STATUS
} from './constant';
import { getNetworkIsOnline } from './network';
import type { ErrorStatus } from './constant';
import type { CustomError, RawError, RequestError, RequestConfig } from '../types';

function updateCustomError(error: CustomError, update: Partial<CustomError>) {
  Object.assign(error, update);
}

/**
 * 处理axios请求失败的错误
 * @param rawError
 */
export function handleAxiosError<T, D>(rawError: RawError<T, D>): RequestError<T, D> {
  const error: CustomError = {
    type: 'axios',
    code: DEFAULT_REQUEST_ERROR_CODE,
    msg: DEFAULT_REQUEST_ERROR_MSG
  };

  const actions: [boolean, () => void][] = [
    [
      // 网路错误
      !getNetworkIsOnline() || rawError.message === 'Network Error',
      () => {
        updateCustomError(error, { code: NETWORK_ERROR_CODE, msg: NETWORK_ERROR_MSG });
      }
    ],
    [
      // 超时错误
      rawError.code === REQUEST_TIMEOUT_CODE && rawError.message.includes('timeout'),
      () => {
        updateCustomError(error, { code: REQUEST_TIMEOUT_CODE, msg: REQUEST_TIMEOUT_MSG });
      }
    ],
    [
      // 请求不成功的错误
      Boolean(rawError.response),
      () => {
        const errorCode: ErrorStatus = (rawError.response?.status as ErrorStatus) || 'DEFAULT';
        const msg = ERROR_STATUS[errorCode];
        updateCustomError(error, { code: errorCode, msg });
      }
    ]
  ];

  actions.some(item => {
    const [flag, callback] = item;
    if (flag) {
      callback();
    }
    return flag;
  });

  return {
    error,
    rawError
  };
}

/**
 * 处理请求成功后但是http状态不成功的错误
 * @param response
 */
export function handleHttpError<T, D>(response: AxiosResponse<T, D>): RequestError<T, D> {
  const error: CustomError = {
    type: 'axios',
    code: DEFAULT_REQUEST_ERROR_CODE,
    msg: DEFAULT_REQUEST_ERROR_MSG
  };

  if (!getNetworkIsOnline()) {
    // 网路错误
    updateCustomError(error, { code: NETWORK_ERROR_CODE, msg: NETWORK_ERROR_MSG });
  } else {
    // 请求成功的状态码非200的错误
    const errorCode: ErrorStatus = response.status as ErrorStatus;
    const msg = ERROR_STATUS[errorCode] || DEFAULT_REQUEST_ERROR_MSG;
    updateCustomError(error, { type: 'http', code: errorCode, msg });
  }

  const rawError: RawError<T, D> = {
    message: '',
    code: BLANK_AXIOS_ERROR_CODE,
    config: response.config,
    request: response.request,
    response
  };

  return {
    error,
    rawError
  };
}

/**
 * 处理后端返回的错误(业务错误)
 * @param response
 */
export function handleBackendError<T, D>(
  response: AxiosResponse<T, D>,
  config: Pick<RequestConfig, 'codeKey' | 'msgKey'>
): RequestError<T, D> {
  const { codeKey, msgKey } = config;

  const backendResult = response.data as Record<string, any>;

  const error: CustomError = {
    type: 'backend',
    code: backendResult[codeKey],
    msg: backendResult[msgKey]
  };

  const rawError: RawError<T, D> = {
    message: '',
    code: BLANK_AXIOS_ERROR_CODE,
    config: response.config,
    request: response.request,
    response
  };

  return {
    error,
    rawError
  };
}
