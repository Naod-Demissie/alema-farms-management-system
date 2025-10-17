'use client';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const t = useTranslations('common');
  
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='ml-auto hidden h-8 lg:flex'
        >
          <MixerHorizontalIcon className='mr-2 h-4 w-4' />
          {t('view')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        <DropdownMenuLabel>{t('toggleColumns')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && 
              column.getCanHide() &&
              // Filter out columns with empty headers or hidden helper columns
              (typeof column.columnDef.header === 'string' ? column.columnDef.header.trim() !== '' : true)
          )
          .map((column) => {
            // Get the column label from header or fallback to column.id
            let columnLabel = '';
            if (typeof column.columnDef.header === 'string') {
              columnLabel = column.columnDef.header;
            } else {
              // For columns with React component headers, use a more descriptive fallback
              columnLabel = column.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            }
            
            // Skip if we still don't have a meaningful label
            if (!columnLabel || columnLabel.trim() === '') {
              return null;
            }
            
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnLabel}
              </DropdownMenuCheckboxItem>
            )
          })
          .filter(Boolean)} {/* Remove null entries */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
