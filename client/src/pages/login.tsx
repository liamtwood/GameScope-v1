import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Crosshair, Eye, EyeOff, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import type { Team, Club } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  clubId: z.string().min(1, "Please select a club"),
  teamId: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | 'selection'>('credentials');
  const { selectTeam } = useTeam();
  const { selectClub } = useClub();

  // Fetch clubs and teams for selection
  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      clubId: "",
      teamId: "",
    },
  });

  const watchedClubId = form.watch("clubId");
  const watchedUsername = form.watch("username");
  
  // Filter clubs based on user access
  const userClubs = clubs.filter(club => {
    if (watchedUsername === 'player@gs.com') {
      return club.name === 'England'; // Only allow England club for player@gs.com
    }
    return true; // For other users, allow all clubs
  });
  
  const availableTeams = allTeams.filter(team => team.clubId === watchedClubId);

  const onCredentialsSubmit = async (data: LoginFormData) => {
    try {
      console.log("Login attempt:", { username: data.username, password: data.password });
      console.log("Form errors:", form.formState.errors);
      
      // For now, check credentials against our test user
      if (data.username === 'player@gs.com' && data.password === 'gamescope') {
        console.log("Authentication successful, moving to selection step");
        // Authentication successful, move to selection step
        setLoginStep('selection');
      } else {
        // Authentication failed
        console.error("Invalid credentials - got:", data.username, data.password);
        alert("Invalid credentials. Please use player@gs.com / gamescope");
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login error (show error message, etc.)
    }
  };

  const onSelectionSubmit = async (data: LoginFormData) => {
    try {
      // Set selected club and team
      const selectedClub = userClubs.find(club => club.id === data.clubId);
      const selectedTeam = availableTeams.find(team => team.id === data.teamId);

      if (selectedClub) {
        selectClub(selectedClub);
      }
      
      if (selectedTeam) {
        selectTeam(selectedTeam);
      }

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Selection failed:", error);
    }
  };

  const handleBack = () => {
    setLoginStep('credentials');
  };

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <Crosshair className="h-8 w-8" style={{ color: '#486D8D' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#486D8D' }}>GameScope</h1>
              <p className="text-sm text-slate-400">AI Video Analysis</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          {loginStep === 'credentials' ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-white">Welcome Back</CardTitle>
                <CardDescription className="text-center text-slate-400">
                  Enter your credentials to access GameScope
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit((data) => {
                  console.log("Form submitted with:", data);
                  onCredentialsSubmit(data);
                })} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your username"
                            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                            data-testid="input-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 pr-12"
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                      data-testid="button-login"
                    >
                      Sign In
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-white"
                      onClick={handleBackToLanding}
                      data-testid="button-back-to-landing"
                    >
                      Back to Landing
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-white">Select Your Team</CardTitle>
                <CardDescription className="text-center text-slate-400">
                  Choose your club and team to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSelectionSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="clubId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Select Club
                        </FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("teamId", ""); // Reset team selection when club changes
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-club">
                              <SelectValue placeholder="Choose your club" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {userClubs.map((club) => (
                              <SelectItem key={club.id} value={club.id} className="text-white hover:bg-slate-600">
                                <div className="flex items-center gap-2">
                                  {club.logoPath ? (
                                    <img 
                                      src={club.logoPath} 
                                      alt={`${club.name} logo`}
                                      className="w-5 h-5 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 bg-slate-600 rounded flex items-center justify-center text-xs">
                                      {club.shortName}
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium">{club.name}</span>
                                    <span className="text-xs text-slate-400">{club.shortName}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedClubId && availableTeams.length > 0 && (
                    <FormField
                      control={form.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            Select Team (Optional)
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-team">
                                <SelectValue placeholder="Choose your team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              {availableTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id} className="text-white hover:bg-slate-600">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{team.name}</span>
                                    <span className="text-xs text-slate-400">{team.shortName} • {team.ageGroup}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedClubId && availableTeams.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-slate-400 text-sm">No teams found for this club</p>
                    </div>
                  )}

                  <div className="space-y-4 pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                      disabled={!watchedClubId}
                      data-testid="button-continue-to-dashboard"
                    >
                      Continue to Dashboard
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-white"
                      onClick={handleBack}
                      data-testid="button-back"
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </Form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Don't have an account? Contact your club administrator
          </p>
        </div>
      </div>
    </div>
  );
}