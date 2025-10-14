"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useStaff } from "../../context/staff-context";
import { createInvite } from "@/app/(dashboard)/staff/server/staff-invites";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

const getInviteFormSchema = (t: any) => z.object({
  email: z.string().email(t('invites.dialogs.invite.validation.invalidEmail')),
  role: z.enum(["ADMIN", "VETERINARIAN"]),
});

export function StaffInviteDialog() {
  const t = useTranslations('staff');
  const { isInviteDialogOpen, setIsInviteDialogOpen, refreshStaff, refreshInvites } = useStaff();
  const [isLoading, setIsLoading] = useState(false);

  const inviteFormSchema = getInviteFormSchema(t);
  type InviteFormValues = z.infer<typeof inviteFormSchema>;

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "VETERINARIAN",
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setIsLoading(true);
    try {
      const result = await createInvite(data);
      
      if (result.success) {
        toast.success(t('invites.dialogs.invite.successMessage'));
        form.reset();
        setIsInviteDialogOpen(false);
        refreshStaff();
        refreshInvites();
      } else {
        toast.error(result.message || t('invites.dialogs.invite.errorMessage'));
      }
    } catch (error) {
      toast.error(t('invites.dialogs.invite.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('invites.dialogs.invite.title')}</DialogTitle>
          <DialogDescription>
            {t('invites.dialogs.invite.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invites.dialogs.invite.email')} <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('invites.dialogs.invite.emailPlaceholder')}
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invites.dialogs.invite.role')} <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('invites.dialogs.invite.selectRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t('directory.roles.admin')}</SelectItem>
                      <SelectItem value="VETERINARIAN">{t('directory.roles.veterinarian')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isLoading}
              >
                {t('invites.dialogs.invite.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t('invites.dialogs.invite.sending') : t('invites.dialogs.invite.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}