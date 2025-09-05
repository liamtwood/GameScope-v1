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
  DialogTrigger,
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
import { InsertPlayer } from "@shared/schema";

const createPlayerSchema = z.object({
  teamId: z.string(),
  clubId: z.string().optional(),
  // Name Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  shirtName: z.string().optional(),
  // Personal Information
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  // Contact Information
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  status: z.enum(["Draft", "Active", "Suspended", "Retired"]).default("Active"),
  // Team Information
  position: z.enum(["Goalkeeper", "Defender", "Midfield", "Forward"], {
    required_error: "Position is required",
  }),
  jerseyNumber: z.number().min(0).nullable(),
  fitnessStatus: z.string().default("Fit"),
});

type CreatePlayerFormData = z.infer<typeof createPlayerSchema>;

interface PlayerCreateDialogProps {
  teamId: string;
  clubId?: string; // Add clubId prop
  onSave: (data: CreatePlayerFormData) => void;
  children: React.ReactNode;
}

export function PlayerCreateDialog({ teamId, clubId, onSave, children }: PlayerCreateDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreatePlayerFormData>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: {
      teamId,
      clubId,
      firstName: "",
      lastName: "",
      shirtName: "",
      dateOfBirth: "",
      gender: undefined,
      email: "",
      phone: "",
      emergencyContact: "",
      emergencyContactPhone: "",
      status: "Active",
      position: undefined,
      jerseyNumber: null,
      fitnessStatus: "Fit",
    },
  });

  const onSubmit = (data: CreatePlayerFormData) => {
    onSave(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the squad roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* NAME INFORMATION Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold">NAME INFORMATION</h3>
              
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
                        <Input placeholder="Enter shirt name" {...field} data-testid="input-shirt-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* TEAM INFORMATION Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs font-semibold">TEAM INFORMATION</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-position">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                          <SelectItem value="Defender">Defender</SelectItem>
                          <SelectItem value="Midfield">Midfield</SelectItem>
                          <SelectItem value="Forward">Forward</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jerseyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jersey Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter jersey number" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-jersey-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fitnessStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fitness Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-fitness-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fit">Fit</SelectItem>
                          <SelectItem value="Injured">Injured</SelectItem>
                          <SelectItem value="Retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* PERSONAL INFORMATION Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs font-semibold">PERSONAL INFORMATION</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>
            </div>

            {/* CONTACT INFORMATION Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs font-semibold">CONTACT INFORMATION</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
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
            </div>


            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save">
                Add Player
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}