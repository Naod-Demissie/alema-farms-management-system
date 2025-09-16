/**
 * Export utilities for reports and analytics
 */

export interface ExportOptions {
  format: 'csv' | 'pdf';
  filename?: string;
  data: any[];
  columns?: string[];
}

/**
 * Export data as CSV
 */
export function exportToCSV(options: ExportOptions): void {
  const { data, columns, filename = 'export' } = options;
  
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get column names from data if not provided
  const columnNames = columns || Object.keys(data[0]);
  
  // Create CSV header
  const header = columnNames.join(',');
  
  // Create CSV rows
  const rows = data.map(row => 
    columnNames.map(col => {
      const value = row[col];
      // Handle values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  // Combine header and rows
  const csvContent = [header, ...rows].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as PDF (placeholder - would need a PDF library like jsPDF)
 */
export function exportToPDF(options: ExportOptions): void {
  const { data, filename = 'export' } = options;
  
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // For now, just show an alert - in a real implementation, you would use a PDF library
  alert(`PDF export for ${filename} would be implemented here. Data contains ${data.length} records.`);
  
  // Example implementation with jsPDF (commented out):
  /*
  import jsPDF from 'jspdf';
  import 'jspdf-autotable';
  
  const doc = new jsPDF();
  doc.autoTable({
    head: [Object.keys(data[0])],
    body: data.map(row => Object.values(row)),
  });
  doc.save(`${filename}.pdf`);
  */
}

/**
 * Generic export function that routes to the appropriate format
 */
export function exportData(options: ExportOptions): void {
  switch (options.format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'pdf':
      exportToPDF(options);
      break;
    default:
      console.warn(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Helper function to format data for export
 */
export function formatDataForExport(data: any[], columns?: string[]): any[] {
  if (!data || data.length === 0) return [];
  
  if (columns) {
    return data.map(row => {
      const formattedRow: any = {};
      columns.forEach(col => {
        formattedRow[col] = row[col] || '';
      });
      return formattedRow;
    });
  }
  
  return data;
}

/**
 * Helper function to get column names from data
 */
export function getColumnNames(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]);
}
