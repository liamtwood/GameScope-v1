import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const accountEditSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female"]).optional(),
  dateOfBirth: z.string().optional(),
  accountStatus: z.enum(["Draft", "Active", "Suspended", "Retired"]).optional(),
});

type AccountEditFormData = z.infer<typeof accountEditSchema>;

interface AccountEditDialogProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountEditDialog({ player, open, onOpenChange }: AccountEditDialogProps) {
  const { toast } = useToast();

  const form = useForm<AccountEditFormData>({
    resolver: zodResolver(accountEditSchema),
    defaultValues: {
      email: player.email || "",
      gender: player.gender as "Male" | "Female" | undefined,
      dateOfBirth: player.dateOfBirth ? format(new Date(player.dateOfBirth), "yyyy-MM-dd") : "",
      accountStatus: (player.accountStatus as "Draft" | "Active" | "Suspended" | "Retired") || "Draft",
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/players/${player.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", player.teamId] });
      onOpenChange(false);
      form.reset();
      toast({
        title: "Success",
        description: "Player account updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountEditFormData) => {
    const updateData: any = {
      email: data.email || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      accountStatus: data.accountStatus,
    };
    updatePlayerMutation.mutate(updateData);
  };

  const handleCancel = () => {
    form.reset({
      email: player.email || "",
      gender: player.gender as "Male" | "Female" | undefined,
      dateOfBirth: player.dateOfBirth ? format(new Date(player.dateOfBirth), "yyyy-MM-dd") : "",
      accountStatus: (player.accountStatus as "Draft" | "Active" | "Suspended" | "Retired") || "Draft",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Account Information</DialogTitle>
          <DialogDescription>
            Update {player.name}'s account details and status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                      data-testid="input-email" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-date-of-birth" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-account-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePlayerMutation.isPending}
                data-testid="button-save"
              >
                {updatePlayerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}