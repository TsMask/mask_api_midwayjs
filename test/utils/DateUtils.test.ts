import {
  parseStrToDate,
  parseDateToStr,
  diffSeconds,
  parseDatePath,
  YYYY_MM_DD,
} from '../../src/framework/utils/DateUtils';

describe('test/utils/DateUtils.test.ts', () => {

  it('should parseStrToDate', () => {
    const date = parseStrToDate("2022-10-14", YYYY_MM_DD);
    expect(typeof date === 'object').toBe(true);
  });


  it('should parseDateToStr', () => {
    const dateStr = parseDateToStr(new Date(), YYYY_MM_DD);
    expect(typeof dateStr === 'string').toBe(true);
  });


  it('should parseDatePath', () => {
    const datePath = parseDatePath();
    expect(datePath.includes('/')).toBe(true);

    const diff = 1000 * 60 * 60 * 24 * 365;
    const now = Date.now();
    const date = now - diff;
    const datePathDate = parseDatePath(date);
    expect(datePathDate.includes('/')).toBe(true);
  });

  it('should diffSeconds', () => {
    const diff = 1000 * 360;
    const endDate = Date.now();
    const startDate = endDate - diff;

    const value = diffSeconds(endDate, startDate);
    expect(value <= 360).toBe(true);

    const nona = diffSeconds(endDate, new Date("NAN"));
    expect(nona === 0).toBe(true);
  });
});
