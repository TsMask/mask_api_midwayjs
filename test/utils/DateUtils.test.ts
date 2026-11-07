import {
  parseStrToDate,
  parseDateToStr,
  parseDatePath,
} from '../../src/internal/shared/date/date';

describe('test/utils/DateUtils.test.ts', () => {
  it('should parseStrToDate', () => {
    const date = parseStrToDate('2022-10-14', "YYYY-MM-DD");
    expect(typeof date === 'object').toBe(true);
  });

  it('should parseDateToStr', () => {
    const dateStr = parseDateToStr(new Date(), "YYYY-MM-DD");
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
});
