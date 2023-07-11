import {
  generateHash,
  generateNumber,
  generateString,
} from '../../src/framework/utils/GenIdUtils';

describe('test/utils/GenIdUtils.test.ts', () => {

  it('should generateHash', () => {
    const genId = generateHash(8);
    // use expect by jest
    expect(genId).toHaveLength(8);

    const prefixGenId = generateHash(8, "GID");
    // use expect by jest
    expect(prefixGenId).toHaveLength(11);
  });


  it('should generateString', () => {
    const genId = generateString(8);
    // use expect by jest
    expect(genId).toHaveLength(8);

    const prefixGenId = generateString(8, "GID");
    // use expect by jest
    expect(prefixGenId).toHaveLength(11);
  });

  it('should generateNumber', () => {
    const num = generateNumber(8);

    // use expect by jest
    expect(num > 0).toBe(true);
  });
});
