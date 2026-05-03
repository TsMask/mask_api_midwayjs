import {
  generateCode,
  generateNumber,
  generateString,
} from '../../src/framework/utils/generate/generate';

describe('test/utils/GenIdUtils.test.ts', () => {
  it('should generateHash', () => {
    const genId = generateCode(8);
    // use expect by jest
    expect(genId).toHaveLength(8);
  });

  it('should generateString', () => {
    const genId = generateString(8);
    // use expect by jest
    expect(genId).toHaveLength(8);
  });

  it('should generateNumber', () => {
    const num = generateNumber(8);

    // use expect by jest
    expect(Number(num) > 0).toBe(true);
  });
});
