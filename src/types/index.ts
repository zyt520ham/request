import type { AxiosRequestConfig } from 'axios';

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
