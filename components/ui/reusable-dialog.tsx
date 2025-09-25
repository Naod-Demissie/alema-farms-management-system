"use client";

import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

export interface DialogFormConfig<T extends z.ZodType> {
  schema: T;
  defaultValues: z.infer<T>;
  title: string;
  description: string;
  submitText: string;
  cancelText?: string;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
  onCancel?: () => void;
  children: (form: UseFormReturn<z.infer<T>>) => React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

interface ReusableDialogProps<T extends z.ZodType> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DialogFormConfig<T>;
  loading?: boolean;
  disabled?: boolean;
}

export function ReusableDialog<T extends z.ZodType>({
  open,
  onOpenChange,
  config,
  loading = false,
  disabled = false,
}: ReusableDialogProps<T>) {
  const {
    schema,
    defaultValues,
    title,
    description,
    submitText,
    cancelText = "Cancel",
    onSubmit,
    onCancel,
    children,
    maxWidth = "max-w-2xl",
    maxHeight = "max-h-[90vh]",
  } = config;

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    form.reset();
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${maxWidth} w-[95vw] ${maxHeight} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {children(form)}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button type="submit" disabled={loading || disabled}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Specialized dialog for quick actions (simpler form without react-hook-form)
interface SimpleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitText: string;
  cancelText?: string;
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  maxWidth?: string;
  maxHeight?: string;
}

export function SimpleDialog({
  open,
  onOpenChange,
  title,
  description,
  submitText,
  cancelText = "Cancel",
  onSubmit,
  onCancel,
  children,
  loading = false,
  disabled = false,
  maxWidth = "sm:max-w-[425px]",
  maxHeight = "",
}: SimpleDialogProps) {
  const handleSubmit = async () => {
    try {
      await onSubmit();
      onOpenChange(false);
    } catch (error) {
      console.error("Simple dialog submission error:", error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} ${maxHeight}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || disabled}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
