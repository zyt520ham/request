import qs from 'qs';
import FormData from 'form-data';
import { isArray, isFile } from './typeof';
import { CONTENT_TYPE } from './constant';
import type { ContentTypeValue } from './constant';

export async function transformRequestData(data: any, contentType: ContentTypeValue) {
  // application/json类型不处理
  let result = data;
  // application/x-www-form-urlencoded类型转换
  if (contentType === CONTENT_TYPE.formUrlencoded) {
    result = qs.stringify(data);
  }
  // multipart/form-data类型转换
  if (contentType === CONTENT_TYPE.formData) {
    result = await handleFormData(data);
  }

  return result;
}

/**
 * 转换multipart/form-data类型的数据
 * @param data 请求体的数据
 */
async function handleFormData(data: Record<string, any>) {
  const formData = new FormData();
  const entries = Object.entries(data);

  entries.forEach(async ([key, value]) => {
    const isFileType = isFile(value) || isFileArray(value);

    if (isFileType) {
      await transformFile(formData, key, value);
    } else {
      formData.append(key, value);
    }
  });

  return formData;
}

/**
 * 接口为上传文件的类型时数据转换
 * @param key - 文件的属性名
 * @param file - 单文件或多文件
 */
async function transformFile(formData: FormData, key: string, file: File[] | File) {
  if (isArray(file)) {
    // 多文件
    await Promise.all(
      file.map(item => {
        formData.append(key, item);
        return true;
      })
    );
  } else {
    // 单文件
    formData.append(key, file);
  }
}

function isFileArray<T extends File[]>(value: T | unknown): value is T {
  return isArray(value) && value.length > 0 && isFile(value[0]);
}
