import { createRequest } from '../src';

const request = createRequest(
  {},
  {
    codeKey: 'code',
    dataKey: 'data',
    msgKey: 'msg',
    onBackendSuccess(responseData) {
      const isObject = Object.prototype.toString.call(responseData) === '[Object object]';

      /** 后端自定义的成功code */
      const SUCCESS_CODE = '0000';

      const hasCodeKey = Object.keys(responseData).includes(this.codeKey);

      const isFailedByCode = responseData.code !== SUCCESS_CODE;

      return !(isObject && hasCodeKey && isFailedByCode) || true;
    }
  }
);

async function fetchSearchBook() {
  const data = await request('https://www.baidu.com', { responseType: 'arraybuffer' }).catch(err => {
    console.log(err);
  });
  console.log('data: ', data);
}

fetchSearchBook();
