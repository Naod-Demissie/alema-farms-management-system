import { EthiopianCalendarUtils, ETHIOPIAN_MONTHS, ETHIOPIAN_DAYS, ETHIOPIAN_MONTHS_SHORT, ETHIOPIAN_DAYS_SHORT } from './ethiopian-calendar';

/**
 * Date formatter utilities for displaying Ethiopian dates in tables and forms
 */
export class EthiopianDateFormatter {
  /**
   * Get current Ethiopian date
   */
  static getCurrentEthiopianDate(): Date {
    return new Date();
  }

  /**
   * Format date for table display (short format)
   */
  static formatForTable(date: Date): string {
    const ethiopian = EthiopianCalendarUtils.gregorianToEthiopian(date);
    const monthName = ETHIOPIAN_MONTHS[ethiopian.month - 1];
    // Desired format: "15 መስከረም 2016 ዓ.ም"
    return `${ethiopian.day} ${monthName} ${ethiopian.year} ዓ.ም`;
  }

  /**
   * Format date for form display (full format)
   */
  static formatForForm(date: Date): string {
    return EthiopianCalendarUtils.formatEthiopianDate(date, true);
  }

  /**
   * Format date for card/header display
   */
  static formatForCard(date: Date): string {
    const ethiopian = EthiopianCalendarUtils.gregorianToEthiopian(date);
    const monthName = ETHIOPIAN_MONTHS[ethiopian.month - 1];
    const dayOfWeek = ETHIOPIAN_DAYS[date.getDay()];
    
    return `${dayOfWeek}, ${ethiopian.day} ${monthName} ${ethiopian.year}`;
  }

  /**
   * Format date range for display
   */
  static formatDateRange(startDate: Date, endDate: Date): string {
    const startEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(startDate);
    const endEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(endDate);
    
    const startMonth = ETHIOPIAN_MONTHS_SHORT[startEthiopian.month - 1];
    const endMonth = ETHIOPIAN_MONTHS_SHORT[endEthiopian.month - 1];
    
    if (startEthiopian.year === endEthiopian.year && startEthiopian.month === endEthiopian.month) {
      return `${startEthiopian.day}-${endEthiopian.day} ${startMonth} ${startEthiopian.year}`;
    } else if (startEthiopian.year === endEthiopian.year) {
      return `${startEthiopian.day} ${startMonth} - ${endEthiopian.day} ${endMonth} ${startEthiopian.year}`;
    } else {
      return `${startEthiopian.day} ${startMonth} ${startEthiopian.year} - ${endEthiopian.day} ${endMonth} ${endEthiopian.year}`;
    }
  }

  /**
   * Format relative date (e.g., "2 days ago", "next week")
   */
  static formatRelative(date: Date): string {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'ዛሬ'; // Today
    if (diffDays === 1) return 'ነገ'; // Tomorrow
    if (diffDays === -1) return 'ትላንት'; // Yesterday
    if (diffDays > 1) return `በ${diffDays} ቀናት`; // In X days
    if (diffDays < -1) return `${Math.abs(diffDays)} ቀናት በፊት`; // X days ago
    
    return EthiopianCalendarUtils.formatEthiopianDate(date, false);
  }

  /**
   * Format date for input placeholder
   */
  static getInputPlaceholder(): string {
    const today = EthiopianCalendarUtils.getCurrentEthiopianDate();
    const monthName = ETHIOPIAN_MONTHS[today.month - 1];
    return `ለምሳሌ: ${today.day} ${monthName} ${today.year}`;
  }

  /**
   * Format month and year for month picker
   */
  static formatMonthYear(year: number, month: number): string {
    const monthName = ETHIOPIAN_MONTHS[month - 1];
    return `${monthName} ${year}`;
  }

  /**
   * Format year for year picker
   */
  static formatYear(year: number): string {
    return `${year} ዓ.ም`; // Ethiopian Era
  }

  /**
   * Format time with Ethiopian date
   */
  static formatDateTime(date: Date): string {
    const ethiopianDate = EthiopianCalendarUtils.formatEthiopianDate(date, true);
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `${ethiopianDate} ${time}`;
  }

  /**
   * Format date for export (CSV, Excel)
   */
  static formatForExport(date: Date): string {
    const ethiopian = EthiopianCalendarUtils.gregorianToEthiopian(date);
    return `${ethiopian.year}-${ethiopian.month.toString().padStart(2, '0')}-${ethiopian.day.toString().padStart(2, '0')}`;
  }

  /**
   * Parse Ethiopian date from various input formats
   */
  static parseInput(input: string): Date | null {
    // Try different formats
    const formats = [
      /^(\d{1,2})\s+(\w+)\s+(\d{4})$/, // "15 መስከረም 2016"
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // "15/1/2016"
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // "15-1-2016"
    ];

    for (const format of formats) {
      const match = input.match(format);
      if (match) {
        const [, day, monthOrName, year] = match;
        
        let month: number;
        if (isNaN(Number(monthOrName))) {
          // Month name
          const monthIndex = ETHIOPIAN_MONTHS.findIndex(m => m === monthOrName);
          if (monthIndex === -1) continue;
          month = monthIndex + 1;
        } else {
          // Month number
          month = Number(monthOrName);
        }

        return EthiopianCalendarUtils.createEthiopianDate(Number(year), month, Number(day));
      }
    }

    return null;
  }
}

/**
 * Hook for Ethiopian date formatting
 */
export function useEthiopianDateFormatter() {
  return {
    formatForTable: EthiopianDateFormatter.formatForTable,
    formatForForm: EthiopianDateFormatter.formatForForm,
    formatForCard: EthiopianDateFormatter.formatForCard,
    formatDateRange: EthiopianDateFormatter.formatDateRange,
    formatRelative: EthiopianDateFormatter.formatRelative,
    formatMonthYear: EthiopianDateFormatter.formatMonthYear,
    formatYear: EthiopianDateFormatter.formatYear,
    formatDateTime: EthiopianDateFormatter.formatDateTime,
    formatForExport: EthiopianDateFormatter.formatForExport,
    parseInput: EthiopianDateFormatter.parseInput,
    getInputPlaceholder: EthiopianDateFormatter.getInputPlaceholder,
  };
}


