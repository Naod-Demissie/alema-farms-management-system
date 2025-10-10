"use client"

import React, { useState } from "react"
import { Calendar, DatePicker } from "@/components/ui/calendar"
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter"

export function CalendarTest() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Ethiopian Calendar Test</h2>
        <p className="text-muted-foreground mb-4">
          Test the Ethiopian calendar to ensure it shows only days 1-30 for the selected month
          without mixing dates from different months.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar Component */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Calendar Component</h3>
          <Calendar
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* DatePicker Component */}
        <div>
          <h3 className="text-lg font-semibold mb-4">DatePicker Component</h3>
          <DatePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            placeholder="Select Ethiopian date"
          />
        </div>
      </div>

      {/* Selected Date Display */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Selected Date</h3>
        {selectedDate ? (
          <div className="space-y-2">
            <p><strong>Gregorian:</strong> {selectedDate.toLocaleDateString()}</p>
            <p><strong>Ethiopian:</strong> {EthiopianDateFormatter.formatForTable(selectedDate)}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">No date selected</p>
        )}
      </div>
    </div>
  )
}
