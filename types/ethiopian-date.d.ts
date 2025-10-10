declare module 'ethiopian-date' {
  /**
   * Convert Gregorian date to Ethiopian date
   * @param year Gregorian year
   * @param month Gregorian month (1-12)
   * @param day Gregorian day
   * @returns Array [ethiopianYear, ethiopianMonth, ethiopianDay]
   */
  export function toEthiopian(year: number, month: number, day: number): [number, number, number];

  /**
   * Convert Ethiopian date to Gregorian date
   * @param year Ethiopian year
   * @param month Ethiopian month (1-13)
   * @param day Ethiopian day
   * @returns Array [gregorianYear, gregorianMonth, gregorianDay]
   */
  export function toGregorian(year: number, month: number, day: number): [number, number, number];
}
