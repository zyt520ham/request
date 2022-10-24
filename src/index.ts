import axios from 'axios';
import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import { CONTENT_TYPE, transformRequestData } from './shared';
import type { ContentTypeValue } from './shared';

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
   * 设置请求头的钩子函数(在请求拦截器执行)
   * @param headers 请求头
   */
  onEditHeaders: (headers: NonNullable<AxiosRequestConfig['headers']>) => void;
  /**
   * 弹窗展示错误信息的钩子函数
   * @param msg 弹窗信息
   * @param duration 弹窗信息的延迟时间
   */
  onShowMsg: (msg: string, duration: number) => void;
}

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
    this.axiosInstance.interceptors.request.use(async config => {
      const handleConfig = { ...config };

      if (handleConfig.headers) {
        // 数据转换
        const contentType = (handleConfig.headers['Content-Type'] || CONTENT_TYPE.json) as ContentTypeValue;
        handleConfig.data = await transformRequestData(config.data, contentType);

        // 设置请求头(配置token等操作)
        this.requestConfig.onEditHeaders(handleConfig.headers);
      }

      return handleConfig;
    });
    this.axiosInstance.interceptors.response.use(config => config);
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

  return request;
}
