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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  position: z.string().min(1, "Position is required"),
  jerseyNumber: z.number().min(0),
  fitnessStatus: z.string().default("Fit"), // Changed from status to fitnessStatus
  keyPlayer: z.boolean().optional(),
  // Personal info
  hometown: z.string().optional(),
  year: z.string().optional(),
  height: z.string().optional(),
  // Account fields
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  dateOfBirth: z.string().optional(),
  accountStatus: z.enum(["Draft", "Active", "Suspended", "Retired"]).default("Active"), // Separate user account status
});

type CreatePlayerFormData = z.infer<typeof createPlayerSchema>;

interface PlayerCreateDialogProps {
  teamId: string;
  onSave: (data: CreatePlayerFormData) => void;
  children: React.ReactNode;
}

export function PlayerCreateDialog({ teamId, onSave, children }: PlayerCreateDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreatePlayerFormData>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: {
      teamId,
      firstName: "",
      lastName: "",
      position: "",
      jerseyNumber: 0,
      fitnessStatus: "Fit",
      accountStatus: "Active",
      keyPlayer: false,
      hometown: "",
      year: "",
      height: "",
      email: "",
      phone: "",
      emergencyContact: "",
      gender: undefined,
      dateOfBirth: "",
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jerseyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-jersey-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keyPlayer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Key Player</FormLabel>
                    </div>
                    <FormControl>
                      <input 
                        type="checkbox" 
                        checked={field.value} 
                        onChange={field.onChange}
                        data-testid="checkbox-key-player"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="Defender">Center Back</SelectItem>
                        <SelectItem value="Defender">Left Back</SelectItem>
                        <SelectItem value="Defender">Right Back</SelectItem>
                        <SelectItem value="Midfield">Center Midfield</SelectItem>
                        <SelectItem value="Midfield">Defensive Midfield</SelectItem>
                        <SelectItem value="Midfield">Attacking Midfield</SelectItem>
                        <SelectItem value="Midfield">Left Midfield</SelectItem>
                        <SelectItem value="Midfield">Right Midfield</SelectItem>
                        <SelectItem value="Forward">Striker</SelectItem>
                        <SelectItem value="Forward">Left Wing</SelectItem>
                        <SelectItem value="Forward">Right Wing</SelectItem>
                        <SelectItem value="Forward">Center Forward</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectTrigger data-testid="select-status">
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

            {/* Personal Information Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hometown"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hometown</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter hometown" {...field} data-testid="input-hometown" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year/Age Group</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Freshman, U18" {...field} data-testid="input-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5'8&quot;" {...field} data-testid="input-height" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and phone number" {...field} data-testid="input-emergency-contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Account Information</h3>
              
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

              <div className="grid grid-cols-3 gap-4">
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
                  name="accountStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>
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