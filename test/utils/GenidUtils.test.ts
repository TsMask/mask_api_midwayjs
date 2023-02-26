import {
  generateID,
  generateNumber,
  generateUUID,
} from '../../src/framework/utils/GenIdUtils';

describe('test/utils/GenIdUtils.test.ts', () => {

  it('should generateID', () => {
    const genId = generateID(8);
    // use expect by jest
    expect(genId).toHaveLength(8);

    const prefixGenId = generateID(8, "GID");
    // use expect by jest
    expect(prefixGenId).toHaveLength(11);
  });


  it('should generateNumber', () => {
    const genId = generateUUID(8);
    // use expect by jest
    expect(genId).toHaveLength(8);

    const prefixGenId = generateUUID(8, "GID");
    // use expect by jest
    expect(prefixGenId).toHaveLength(11);
  });

  it('should generateNumber', () => {
    const num = generateNumber(8);

    // use expect by jest
    expect(num > 0).toBe(true);
  });
});
