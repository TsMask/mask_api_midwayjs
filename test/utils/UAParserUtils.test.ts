import {
  getUaInfo
} from '../../src/framework/utils/UAParserUtils';

describe('test/utils/UAParserUtils.test.ts', () => {

  const user_agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';

  it('should getUaInfo', () => {

    const ua = getUaInfo(user_agent);

    // use expect by jest
    const browser = ua.getBrowser()
    expect(browser.name).toBe('Chrome');
    expect(browser.version).toBe('86.0.4240.198');
    expect(browser.major).toBe('86');

    const engine = ua.getEngine()
    expect(engine.name).toBe('Blink');
    expect(engine.version).toBe('86.0.4240.198');

    const os = ua.getOS()
    expect(os.name).toBe('Windows');
    expect(os.version).toBe('10');

    const cpu = ua.getCPU()
    expect(cpu.architecture).toBe('amd64');
  });

});
