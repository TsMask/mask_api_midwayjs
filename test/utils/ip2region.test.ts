import {
  getRealAddressByIp,
  getRegionSearchByIp,
} from '../../src/framework/utils/ip2region';

describe('test/utils/ip2region.test.ts', () => {

  it('should getRealAddressByIp', async () => {
    const addr = await getRealAddressByIp('119.29.29.29');
    // use expect by jest
    expect(addr).toBe('北京 北京市');

    const innerAddr = await getRealAddressByIp('127.0.0.1');
    // use expect by jest
    expect(innerAddr).toBe('内网IP');
    
    const noAddr = await getRealAddressByIp('129.0.0.1');
    // use expect by jest
    expect(noAddr).toBe('未知');
  });

  it('should getRegionSearchByIp', async () => {
    const addr = await getRegionSearchByIp('119.29.29.29');
    // use expect by jest
    expect(addr.region).toBe('中国|0|北京|北京市|腾讯');

    const innerAddr = await getRegionSearchByIp('127.0.0.1');
    // use expect by jest
    expect(innerAddr.region).toBe("0|0|0|内网IP|内网IP");

    const noAddr = await getRegionSearchByIp('129.0.0.1');
    // use expect by jest
    expect(noAddr.region).toBe("喀麦隆|0|0|0|0");
  });

});
