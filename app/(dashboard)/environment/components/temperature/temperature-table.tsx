"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash, Thermometer, ArrowUpDown } from "lucide-react";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import { NoDataIcon } from "@/components/ui/no-data-icon";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { TemperatureDialog } from "./temperature-dialog";
import { deleteTemperatureRecord } from "../../server/temperature";
import { toast } from "sonner";
import { EnvironmentTableToolbar } from "../table/environment-table-toolbar";
import { TemperatureAggregates } from "../table/temperature-aggregates";
import { ConfirmDialog } from "@/components/confirm-dialog";

type TemperatureRecord = {
  id: string;
  flockId: string;
  date: Date;
  minTemp: number;
  maxTemp: number;
  avgTemp: number | null;
  notes: string | null;
  flock: {
    batchCode: string;
    currentCount: number;
  };
  recordedBy: {
    name: string;
  } | null;
};

type TemperatureTableProps = {
  records: TemperatureRecord[];
  flocks: Array<{ id: string; batchCode: string; currentCount: number }>;
  onSuccess: () => void;
};

export function TemperatureTable({ records, flocks, onSuccess }: TemperatureTableProps) {
  const t = useTranslations("environment.temperature");
  const [editRecord, setEditRecord] = useState<TemperatureRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    record: null as TemperatureRecord | null,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const handleDeleteClick = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (record) {
      setConfirmDialog({
        open: true,
        record: record,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.record) return;
    
    setDeleting(true);
    try {
      const result = await deleteTemperatureRecord(confirmDialog.record.id);
      
      if (result.success) {
        toast.success(t("deleteSuccess"));
        onSuccess();
        setConfirmDialog({ open: false, record: null });
      } else {
        toast.error(result.error || t("unexpectedError"));
      }
    } catch (error) {
      toast.error(t("unexpectedError"));
    } finally {
      setDeleting(false);
    }
  };

  // Define columns
  const columns: ColumnDef<TemperatureRecord>[] = [
    {
      id: "flock",
      accessorKey: "flock.batchCode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("flock")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.original.flock.batchCode}</div>,
      filterFn: (row, id, value) => {
        const flock = row.original.flock;
        return flock.batchCode.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      id: "flockId",
      accessorKey: "flockId",
      header: "",
      cell: () => null,
      enableHiding: true,
      filterFn: (row, id, value) => {
        const flock = row.original.flock;
        return flock.batchCode.toLowerCase().includes(value.toLowerCase()) ||
               row.original.flockId.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      id: "date",
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("date")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => EthiopianDateFormatter.formatForTable(new Date(row.original.date)),
      filterFn: (row, id, value) => {
        if (!value) return true;
        const rowDate = new Date(row.getValue(id));
        const filterDate = new Date(value.date);
        
        if (value.isMonthFilter) {
          return rowDate.getMonth() === filterDate.getMonth() &&
                 rowDate.getFullYear() === filterDate.getFullYear();
        } else {
          return rowDate.toDateString() === filterDate.toDateString();
        }
      },
    },
    {
      id: "minTemp",
      accessorKey: "minTemp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-end"
          >
            {t("minTemp")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-blue-600 font-semibold">
            {row.original.minTemp.toFixed(1)}°C
          </span>
        </div>
      ),
    },
    {
      id: "maxTemp",
      accessorKey: "maxTemp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-end"
          >
            {t("maxTemp")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-red-600 font-semibold">
            {row.original.maxTemp.toFixed(1)}°C
          </span>
        </div>
      ),
    },
    {
      id: "avgTemp",
      accessorKey: "avgTemp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-end"
          >
            {t("avgTemp")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-right">
          <span className="font-semibold">
            {(row.original.avgTemp || ((row.original.minTemp + row.original.maxTemp) / 2)).toFixed(1)}°C
          </span>
        </div>
      ),
    },
    {
      id: "recordedBy",
      accessorKey: "recordedBy.name",
      header: t("recordedBy"),
      cell: ({ row }) => row.original.recordedBy?.name || t("unknown"),
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions")}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditRecord(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(row.original.id)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableHiding: false,
    },
  ];

  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data: records,
    columns,
    state: {
      sorting,
      columnVisibility: mobileColumnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    enableSorting: true,
    enableFiltering: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
      columnVisibility: {
        flockId: false,
      },
    },
  });

  return (
    <>
      <div className="space-y-4">
        <EnvironmentTableToolbar
          table={table}
          flocks={flocks}
        />
        
        {/* Aggregates Display */}
        <TemperatureAggregates table={table} />
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <NoDataIcon 
                      icon={Thermometer}
                      title={t("noRecords")}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <DataTablePagination
          table={table}
          pageSize={10}
        />
      </div>

      {/* Edit Dialog */}
      <TemperatureDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        onSuccess={() => {
          setEditRecord(null);
          onSuccess();
        }}
        record={editRecord}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t("deleteTitle")}
        desc={t("deleteDescription")}
        confirmText={deleting ? t("deleting") : t("delete")}
        cancelBtnText={t("cancel")}
        destructive={true}
        handleConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
    </>
  );
}
