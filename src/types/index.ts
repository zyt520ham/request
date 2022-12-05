import type { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';

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

/** 原始axios错误 */
export type RawError<T, D> = Pick<AxiosError<T, D>, 'message' | 'config' | 'response'> & {
  code: AxiosErrorCode | typeof BLANK_AXIOS_ERROR_CODE;
  request: XMLHttpRequest;
};

/** 自定义错误 */
export interface CustomError {
  /** 请求服务的错误类型 */
  type: RequestErrorType;
  /** 错误码 */
  code: string | number;
  /** 错误信息 */
  msg: string;
}

/** 请求错误 */
export interface RequestError<T, D> {
  /** 自定义的错误 */
  error: CustomError;
  /** 原始axios错误 */
  rawError: RawError<T, D>;
}

/** 自定义的请求配置 */
export interface RequestConfig {
  /** 表示后端请求状态码的属性字段 */
  codeKey: string;
  /** 表示后端请求数据的属性字段 */
  dataKey: string;
  /** 表示后端消息的属性字段 */
  msgKey: string;
  /** 后端业务上定义的成功请求的状态 */
  successCode: number | string;
  /**
   * 请求前的钩子函数
   * @param config 请求配置
   * @example 可以对请求头进行操作，如设置Token
   */
  onRequest(config: AxiosRequestConfig): AxiosRequestConfig;
  /**
   * http请求成功情况下，后端业务上表示请求成功的处理
   * @param responseData 请求后的数据 (response.data)
   */
  onBackendSuccess(responseData: any): boolean;
  /**
   * http请求成功情况下, 后端业务上表示请求失败的处理
   * @param response axios的相响应
   * @param axiosInstance axios实例
   */
  onBackendFail?(response: AxiosResponse, axiosInstance: AxiosInstance): Promise<AxiosResponse | void>;
}
