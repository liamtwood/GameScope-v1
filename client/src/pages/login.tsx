import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Crosshair, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClub } from "@/contexts/club-context";
import type { Club } from "@shared/schema";

const credentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { selectClub } = useClub();

  // Fetch clubs for selection
  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });


  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  

  const onCredentialsSubmit = async (data: CredentialsFormData) => {
    try {
      // For now, check credentials against our test user
      if (data.username === 'player@gs.com' && data.password === 'gamescope') {
        // Find and set the England club for this user
        const englandClub = clubs.find(club => club.name === 'England');
        if (englandClub) {
          selectClub(englandClub);
        }
        
        // Authentication successful, go directly to dashboard
        setLocation("/dashboard");
      } else {
        alert("Invalid credentials. Please use player@gs.com / gamescope");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
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

        <Form {...credentialsForm}>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white">Welcome Back</CardTitle>
              <CardDescription className="text-center text-slate-400">
                Enter your credentials to access GameScope
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-4">
                <FormField
                  control={credentialsForm.control}
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
                  control={credentialsForm.control}
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