// Ethiopian calendar utility functions
import * as ethiopianDate from 'ethiopian-date';

export class EthiopianCalendarUtils {
  /**
   * Convert Gregorian date to Ethiopian date using the ethiopian-date package
   */
  static gregorianToEthiopian(date: Date): { year: number; month: number; day: number } {
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
    const gregorianDay = date.getDate();

    const [ethiopianYear, ethiopianMonth, ethiopianDay] = ethiopianDate.toEthiopian(
      gregorianYear, 
      gregorianMonth, 
      gregorianDay
    );

    return {
      year: ethiopianYear,
      month: ethiopianMonth,
      day: ethiopianDay
    };
  }

  /**
   * Convert Ethiopian date to Gregorian date using the ethiopian-date package
   */
  static ethiopianToGregorian(year: number, month: number, day: number): Date {
    const [gregorianYear, gregorianMonth, gregorianDay] = ethiopianDate.toGregorian(
      year, 
      month, 
      day
    );

    return new Date(gregorianYear, gregorianMonth - 1, gregorianDay); // JavaScript months are 0-indexed
  }

  /**
   * Get Ethiopian date object from Gregorian date
   */
  static getEthiopianDate(date: Date) {
    return this.gregorianToEthiopian(date);
  }

  /**
   * Create Ethiopian date from year, month, day
   */
  static createEthiopianDate(year: number, month: number, day: number): Date {
    return this.ethiopianToGregorian(year, month, day);
  }

  /**
   * Format Ethiopian date for display
   */
  static formatEthiopianDate(date: Date, includeYear: boolean = true): string {
    const ethiopian = this.gregorianToEthiopian(date);
    const monthName = ETHIOPIAN_MONTHS[ethiopian.month - 1];
    
    if (includeYear) {
      return `${ethiopian.day} ${monthName} ${ethiopian.year}`;
    }
    return `${ethiopian.day} ${monthName}`;
  }

  /**
   * Get Ethiopian month name
   */
  static getEthiopianMonthName(month: number): string {
    return ETHIOPIAN_MONTHS[month - 1] || '';
  }

  /**
   * Get Ethiopian day name
   */
  static getEthiopianDayName(dayOfWeek: number): string {
    return ETHIOPIAN_DAYS[dayOfWeek] || '';
  }

  /**
   * Check if Ethiopian year is leap year
   */
  static isEthiopianLeapYear(year: number): boolean {
    // Ethiopian leap year follows the same pattern as Gregorian
    // but offset by 8 years
    const gregorianYear = year + 8;
    return this.isGregorianLeapYear(gregorianYear);
  }

  /**
   * Get days in Ethiopian month
   */
  static getDaysInEthiopianMonth(year: number, month: number): number {
    if (month === 13) { // Pagumen
      return this.isEthiopianLeapYear(year) ? 6 : 5;
    }
    return 30; // All other months have 30 days
  }

  /**
   * Get current Ethiopian date
   */
  static getCurrentEthiopianDate() {
    return this.gregorianToEthiopian(new Date());
  }

  /**
   * Parse Ethiopian date string (format: "DD Month YYYY")
   */
  static parseEthiopianDate(dateString: string): Date | null {
    try {
      const parts = dateString.trim().split(' ');
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0]);
      const monthName = parts[1];
      const year = parseInt(parts[2]);

      const monthIndex = ETHIOPIAN_MONTHS.findIndex(m => m === monthName);
      if (monthIndex === -1) return null;

      return this.createEthiopianDate(year, monthIndex + 1, day);
    } catch {
      return null;
    }
  }

  /**
   * Helper function to check if a Gregorian year is a leap year
   */
  private static isGregorianLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Helper function to calculate days since Ethiopian New Year
   */
  private static getDaysSinceEthiopianNewYear(gregorianYear: number, gregorianMonth: number, gregorianDay: number): number {
    const isLeapYear = this.isGregorianLeapYear(gregorianYear);
    const ethiopianNewYearDay = isLeapYear ? 12 : 11;
    
    // Ethiopian New Year is September 11 (or 12 in leap years)
    const ethiopianNewYear = new Date(gregorianYear, 8, ethiopianNewYearDay); // September
    const currentDate = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
    
    // If current date is before Ethiopian New Year, use previous year's New Year
    if (currentDate < ethiopianNewYear) {
      const prevYearNewYear = new Date(gregorianYear - 1, 8, isLeapYear ? 12 : 11);
      return Math.floor((currentDate.getTime() - prevYearNewYear.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return Math.floor((currentDate.getTime() - ethiopianNewYear.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// Ethiopian month names in Amharic
export const ETHIOPIAN_MONTHS = [
  'መስከረም',    // Meskerem (September)
  'ጥቅምት',      // Tikimt (October)
  'ሕዳር',       // Hidar (November)
  'ታኅሣሥ',      // Tahsas (December)
  'ጥር',         // Tir (January)
  'የካቲት',      // Yekatit (February)
  'መጋቢት',      // Megabit (March)
  'ሚያዝያ',      // Miazia (April)
  'ግንቦት',      // Ginbot (May)
  'ሰኔ',         // Sene (June)
  'ሐምሌ',        // Hamle (July)
  'ነሐሴ',        // Nehase (August)
  'ጳጉሜን'       // Pagumen (6 days at end of year)
];

// Ethiopian day names in Amharic
export const ETHIOPIAN_DAYS = [
  'ሰኞ',         // Monday
  'ማክሰኞ',      // Tuesday
  'ረቡዕ',        // Wednesday
  'ሐሙስ',        // Thursday
  'አርብ',        // Friday
  'ቅዳሜ',        // Saturday
  'እሑድ'         // Sunday
];

// Short Ethiopian month names
export const ETHIOPIAN_MONTHS_SHORT = [
  'መስ', 'ጥቅ', 'ሕዳ', 'ታኅ', 'ጥር', 'የካ', 'መጋ', 'ሚያ', 'ግን', 'ሰኔ', 'ሐም', 'ነሐ', 'ጳጉ'
];

// Short Ethiopian day names
export const ETHIOPIAN_DAYS_SHORT = [
  'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'አር', 'ቅዳ', 'እሑ'
];

// Ethiopian calendar constants
export const ETHIOPIAN_CALENDAR = {
  MONTHS_PER_YEAR: 13,
  DAYS_PER_MONTH: 30,
  DAYS_IN_PAGUMEN: 6, // Last month has 6 days (5 in leap year)
  NEW_YEAR_MONTH: 1, // Meskerem
  NEW_YEAR_DAY: 1,
  EPOCH_YEAR: 8, // Ethiopian calendar starts 8 years before Gregorian
} as const;


