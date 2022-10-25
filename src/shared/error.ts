import type { AxiosError, AxiosResponse } from 'axios';
import {
  DEFAULT_REQUEST_ERROR_CODE,
  DEFAULT_REQUEST_ERROR_MSG,
  NETWORK_ERROR_CODE,
  NETWORK_ERROR_MSG,
  REQUEST_TIMEOUT_CODE,
  REQUEST_TIMEOUT_MSG,
  ERROR_STATUS
} from './constant';
import type { ErrorStatus } from './constant';
import type { RequestConfig } from '../types';

/**
 * 请求的错误类型：
 * - axios: axios错误：网络错误, 请求超时, 默认的兜底错误
 * - http: 请求成功，响应的http状态码非200的错误
 * - backend: 请求成功，响应的http状态码为200，由后端定义的业务错误
 */
export type RequestErrorType = 'axios' | 'http' | 'backend';

type AxiosErrorCode =
  | 'ERR_FR_TOO_MANY_REDIRECTS'
  | 'ERR_BAD_OPTION_VALUE'
  | 'ERR_BAD_OPTION'
  | 'ERR_NETWORK'
  | 'ERR_DEPRECATED'
  | 'ERR_BAD_RESPONSE'
  | 'ERR_BAD_REQUEST'
  | 'ERR_NOT_SUPPORT'
  | 'ERR_INVALID_URL'
  | 'ERR_CANCELED'
  | 'ECONNABORTED'
  | 'ETIMEDOUT';

const BLANK_AXIOS_ERROR_CODE = '';

type RawError<T, D> = Pick<AxiosError<T, D>, 'message' | 'config' | 'response'> & {
  code: AxiosErrorCode | typeof BLANK_AXIOS_ERROR_CODE;
  request: XMLHttpRequest;
};

interface CustomError {
  /** 请求服务的错误类型 */
  type: RequestErrorType;
  /** 错误码 */
  code: string | number;
  /** 错误信息 */
  msg: string;
}

/** 请求错误 */
interface RequestError<T, D> {
  /** 自定义的错误 */
  error: CustomError;
  /** 原始请求错误 */
  rawError: RawError<T, D>;
}

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
      !window.navigator.onLine || rawError.message === 'Network Error',
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

  if (!window.navigator.onLine) {
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
