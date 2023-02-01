import {
  getUaInfo
} from '../../src/framework/utils/UAParserUtils';

describe('test/utils/UAParserUtils.test.ts', () => {

  const user_agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';

  it('should getUaInfo', () => {

    const ua = getUaInfo(user_agent);
    const uaInfo = ua.getResult();
    // use expect by jest
    expect(uaInfo.browser.name).toBe('Chrome');
    expect(uaInfo.browser.version).toBe('86.0.4240.198');
    expect(uaInfo.browser.major).toBe('86');

    expect(uaInfo.engine.name).toBe('Blink');
    expect(uaInfo.engine.version).toBe('86.0.4240.198');

    expect(uaInfo.os.name).toBe('Windows');
    expect(uaInfo.os.version).toBe('10');

    expect(uaInfo.cpu.architecture).toBe('amd64');
  });

});
