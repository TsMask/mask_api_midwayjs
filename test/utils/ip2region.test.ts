import {
  realAddressByIp,
  regionSearchByIp,
} from '../../src/framework/ip2region/ip2region';

describe('test/utils/ip2region.test.ts', () => {
  it('should realAddressByIp', async () => {
    const addr = await realAddressByIp('119.29.29.29');
    // use expect by jest
    expect(addr).toBe('北京 北京市');

    const innerAddr = await realAddressByIp('127.0.0.1');
    // use expect by jest
    expect(innerAddr).toBe('内网IP');

    const noAddr = await realAddressByIp('129.0.0.1');
    // use expect by jest
    expect(noAddr).toBe('未知');
  });

  it('should regionSearchByIp', async () => {
    const addr = await regionSearchByIp('119.29.29.29');
    // use expect by jest
    expect(addr.region).toBe('中国|0|北京|北京市|腾讯');

    const innerAddr = await regionSearchByIp('127.0.0.1');
    // use expect by jest
    expect(innerAddr.region).toBe('0|0|0|内网IP|内网IP');

    const noAddr = await regionSearchByIp('129.0.0.1');
    // use expect by jest
    expect(noAddr.region).toBe('喀麦隆|0|0|0|0');
  });
});
