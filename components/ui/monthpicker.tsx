"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { EthiopianCalendarUtils, ETHIOPIAN_MONTHS } from "@/lib/ethiopian-calendar";

type EthiopianMonth = {
    number: number;
    name: string;
};

const ETHIOPIAN_MONTHS_GRID: EthiopianMonth[][] = [
    [
        { number: 1, name: ETHIOPIAN_MONTHS[0] },  // መስከረም
        { number: 2, name: ETHIOPIAN_MONTHS[1] },  // ጥቅምት
        { number: 3, name: ETHIOPIAN_MONTHS[2] },  // ሕዳር
        { number: 4, name: ETHIOPIAN_MONTHS[3] },  // ታኅሣሥ
    ],
    [
        { number: 5, name: ETHIOPIAN_MONTHS[4] },  // ጥር
        { number: 6, name: ETHIOPIAN_MONTHS[5] },  // የካቲት
        { number: 7, name: ETHIOPIAN_MONTHS[6] },  // መጋቢት
        { number: 8, name: ETHIOPIAN_MONTHS[7] },  // ሚያዝያ
    ],
    [
        { number: 9, name: ETHIOPIAN_MONTHS[8] },  // ግንቦት
        { number: 10, name: ETHIOPIAN_MONTHS[9] }, // ሰኔ
        { number: 11, name: ETHIOPIAN_MONTHS[10] }, // ሐምሌ
        { number: 12, name: ETHIOPIAN_MONTHS[11] }, // ነሐሴ
    ],
    [
        { number: 13, name: ETHIOPIAN_MONTHS[12] }, // ጳጉሜን
    ],
];

type MonthCalProps = {
    selectedMonth?: Date;
    onMonthSelect?: (date: Date) => void;
    onYearForward?: () => void;
    onYearBackward?: () => void;
    callbacks?: {
        yearLabel?: (year: number) => string;
        monthLabel?: (month: EthiopianMonth) => string;
    };
    variant?: {
        calendar?: {
            main?: ButtonVariant;
            selected?: ButtonVariant;
        };
        chevrons?: ButtonVariant;
    };
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: Date[];
};

type ButtonVariant = "default" | "outline" | "ghost" | "link" | "destructive" | "secondary" | null | undefined;

function MonthPicker({
    onMonthSelect,
    selectedMonth,
    minDate,
    maxDate,
    disabledDates,
    callbacks,
    onYearBackward,
    onYearForward,
    variant,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & MonthCalProps) {
    return (
        <div className={cn("min-w-[200px] w-[280px] p-3", className)} {...props}>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0">
                <div className="space-y-4 w-full">
                    <MonthCal
                        onMonthSelect={onMonthSelect}
                        callbacks={callbacks}
                        selectedMonth={selectedMonth}
                        onYearBackward={onYearBackward}
                        onYearForward={onYearForward}
                        variant={variant}
                        minDate={minDate}
                        maxDate={maxDate}
                        disabledDates={disabledDates}
                    ></MonthCal>
                </div>
            </div>
        </div>
    );
}

function MonthCal({ selectedMonth, onMonthSelect, callbacks, variant, minDate, maxDate, disabledDates, onYearBackward, onYearForward }: MonthCalProps) {
    // Get current Ethiopian date
    const currentEthiopian = EthiopianCalendarUtils.getCurrentEthiopianDate();
    
    // Convert selected month to Ethiopian if provided
    const selectedEthiopian = selectedMonth ? EthiopianCalendarUtils.gregorianToEthiopian(selectedMonth) : currentEthiopian;
    
    const [year, setYear] = React.useState<number>(selectedEthiopian.year);
    const [month, setMonth] = React.useState<number>(selectedEthiopian.month);
    const [menuYear, setMenuYear] = React.useState<number>(year);

    if (minDate && maxDate && minDate > maxDate) minDate = maxDate;

    const disabledDatesMapped = disabledDates?.map((d) => {
        return EthiopianCalendarUtils.gregorianToEthiopian(d);
    });

    return (
        <>
            <div className="flex justify-center pt-1 relative items-center">
                <div className="text-sm font-medium">
                    {callbacks?.yearLabel ? callbacks?.yearLabel(menuYear) : `${menuYear} ዓ.ም`}
                </div>
                <div className="space-x-1 flex items-center">
                    <button
                        onClick={() => {
                            setMenuYear(menuYear - 1);
                            if (onYearBackward) onYearBackward();
                        }}
                        className={cn(buttonVariants({ variant: variant?.chevrons ?? "outline" }), "inline-flex items-center justify-center h-7 w-7 p-0 absolute left-1")}
                    >
                        <ChevronLeft className="opacity-50 h-4 w-4" />
                    </button>
                    <button
                        onClick={() => {
                            setMenuYear(menuYear + 1);
                            if (onYearForward) onYearForward();
                        }}
                        className={cn(buttonVariants({ variant: variant?.chevrons ?? "outline" }), "inline-flex items-center justify-center h-7 w-7 p-0 absolute right-1")}
                    >
                        <ChevronRight className="opacity-50 h-4 w-4" />
                    </button>
                </div>
            </div>
            <table className="w-full border-collapse space-y-1">
                <tbody>
                    {ETHIOPIAN_MONTHS_GRID.map((monthRow, a) => {
                        return (
                            <tr key={"row-" + a} className="flex w-full mt-2">
                                {monthRow.map((m) => {
                                    const isDisabled = 
                                        (maxDate ? menuYear > EthiopianCalendarUtils.gregorianToEthiopian(maxDate).year || 
                                         (menuYear === EthiopianCalendarUtils.gregorianToEthiopian(maxDate).year && m.number > EthiopianCalendarUtils.gregorianToEthiopian(maxDate).month) : false) ||
                                        (minDate ? menuYear < EthiopianCalendarUtils.gregorianToEthiopian(minDate).year || 
                                         (menuYear === EthiopianCalendarUtils.gregorianToEthiopian(minDate).year && m.number < EthiopianCalendarUtils.gregorianToEthiopian(minDate).month) : false) ||
                                        (disabledDatesMapped ? disabledDatesMapped?.some((d) => d.year === menuYear && d.month === m.number) : false);

                                    return (
                                        <td
                                            key={m.number}
                                            className="h-10 w-1/4 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                                        >
                                            <button
                                                onClick={() => {
                                                    setMonth(m.number);
                                                    setYear(menuYear);
                                                    if (onMonthSelect) {
                                                        // Create Ethiopian date and convert to Gregorian
                                                        const ethiopianDate = EthiopianCalendarUtils.createEthiopianDate(menuYear, m.number, 1);
                                                        onMonthSelect(ethiopianDate);
                                                    }
                                                }}
                                                disabled={isDisabled}
                                                className={cn(
                                                    buttonVariants({ 
                                                        variant: month === m.number && menuYear === year ? 
                                                            variant?.calendar?.selected ?? "default" : 
                                                            variant?.calendar?.main ?? "ghost" 
                                                    }),
                                                    "h-full w-full p-0 font-normal aria-selected:opacity-100"
                                                )}
                                            >
                                                {callbacks?.monthLabel ? callbacks.monthLabel(m) : m.name}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );
}

MonthPicker.displayName = "MonthPicker";

export { MonthPicker };
