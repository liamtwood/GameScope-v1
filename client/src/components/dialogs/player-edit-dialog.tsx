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
import { Player } from "@shared/schema";

const editPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  jerseyNumber: z.number().min(0),
  year: z.string().optional(),
  hometown: z.string().optional(),
  height: z.string().optional(),
  goals: z.number().min(0).optional(),
  assists: z.number().min(0).optional(),
  appearances: z.number().min(0).optional(),
});

type EditPlayerFormData = z.infer<typeof editPlayerSchema>;

interface PlayerEditDialogProps {
  player: Player;
  onSave: (playerId: string, data: Partial<EditPlayerFormData>) => void;
  children: React.ReactNode;
}

export function PlayerEditDialog({ player, onSave, children }: PlayerEditDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<EditPlayerFormData>({
    resolver: zodResolver(editPlayerSchema),
    defaultValues: {
      name: player.name,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      year: player.year || "",
      hometown: player.hometown || "",
      height: player.height || "",
      goals: player.goals || 0,
      assists: player.assists || 0,
      appearances: player.appearances || 0,
    },
  });

  const onSubmit = (data: EditPlayerFormData) => {
    onSave(player.id, data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update {player.name}'s information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter player name" {...field} data-testid="input-player-name" />
                    </FormControl>
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
                        <SelectItem value="GK">Goalkeeper</SelectItem>
                        <SelectItem value="CB">Center Back</SelectItem>
                        <SelectItem value="LB">Left Back</SelectItem>
                        <SelectItem value="RB">Right Back</SelectItem>
                        <SelectItem value="CM">Center Midfield</SelectItem>
                        <SelectItem value="CDM">Defensive Midfield</SelectItem>
                        <SelectItem value="CAM">Attacking Midfield</SelectItem>
                        <SelectItem value="LM">Left Midfield</SelectItem>
                        <SelectItem value="RM">Right Midfield</SelectItem>
                        <SelectItem value="ST">Striker</SelectItem>
                        <SelectItem value="LW">Left Wing</SelectItem>
                        <SelectItem value="RW">Right Wing</SelectItem>
                        <SelectItem value="CF">Center Forward</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Freshman, Sophomore" {...field} data-testid="input-year" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5'6&quot;" {...field} data-testid="input-height" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goals</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-goals"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assists"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assists</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-assists"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="appearances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appearances</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-appearances"
                      />
                    </FormControl>
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
                Update Player
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}