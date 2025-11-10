import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

// Base schema for all user creation
const baseUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  shirtName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.string().default("Player"),
  status: z.string().default("Active"),
});

// Schema for DevOps (includes club selection)
const devOpsUserSchema = baseUserSchema.extend({
  clubId: z.string().min(1, "Club selection is required"),
});

type CreateUserFormData = z.infer<typeof devOpsUserSchema>;

interface UserCreateDialogProps {
  children: React.ReactNode;
  clubId?: string;
  onSave: (data: CreateUserFormData) => void;
}

export function UserCreateDialog({ children, clubId, onSave }: UserCreateDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Determine if this is DevOps mode (no specific club selected)
  const isDevOpsMode = !clubId || clubId.trim() === "";
  
  // Fetch clubs for DevOps mode
  const { data: clubs = [] } = useQuery<any[]>({ 
    queryKey: ["/api/clubs"],
    enabled: isDevOpsMode
  });

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(isDevOpsMode ? devOpsUserSchema : baseUserSchema),
    defaultValues: {
      ...(isDevOpsMode && { clubId: "" }),
      firstName: "",
      lastName: "",
      shirtName: "",
      dateOfBirth: "",
      age: "",
      gender: "",
      email: "",
      phone: "",
      role: "Player",
      status: "Active",
    },
  });

  // Calculate age when date of birth changes
  const dateOfBirth = form.watch("dateOfBirth");
  const role = form.watch("role");
  
  // Determine if player-specific fields should be disabled
  const isNonPlayerRole = role === "Coach" || role === "Admin";
  
  useEffect(() => {
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age >= 0 && age <= 150) {
        form.setValue("age", age.toString());
      }
    } else {
      form.setValue("age", "");
    }
  }, [dateOfBirth, form]);

  const handleSubmit = (data: CreateUserFormData) => {
    // Transform empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      shirtName: data.shirtName || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      age: data.age || undefined,
      gender: data.gender || undefined,
      phone: data.phone || undefined,
    };
    
    // In non-DevOps mode, add the clubId from props
    const submitData = isDevOpsMode ? cleanedData : { ...cleanedData, clubId };
    onSave(submitData);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Add a new user to the Club.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* CLUB SELECTION - Only for DevOps mode */}
            {isDevOpsMode && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">CLUB SELECTION</h3>
                <FormField
                  control={form.control}
                  name="clubId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-club">
                            <SelectValue placeholder="Select club" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clubs.map((club: any) => (
                            <SelectItem key={club.id} value={club.id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ROLE AND STATUS - 2 columns */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">ROLE AND STATUS</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Player" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Coach">Coach</SelectItem>
                          <SelectItem value="Player">Player</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Active" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                          <SelectItem value="Retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* NAME INFORMATION - 3 columns */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">NAME INFORMATION</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shirtName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shirt Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter shirt name" 
                          {...field} 
                          disabled={isNonPlayerRole}
                          data-testid="input-shirt-name" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* PERSONAL INFORMATION - 3 columns */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">PERSONAL INFORMATION</h3>
              <div className="grid grid-cols-3 gap-4">
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
                          disabled={isNonPlayerRole}
                          data-testid="input-date-of-birth"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter age (calculated)" 
                          {...field} 
                          readOnly
                          disabled={isNonPlayerRole}
                          data-testid="input-age"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CONTACT INFORMATION - 2 columns, 2 rows */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">CONTACT INFORMATION</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isDevOpsMode ? !form.watch("clubId") : !clubId}
                data-testid="button-save"
              >
                Add User
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}