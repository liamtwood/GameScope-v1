import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useLocation } from "wouter";

export function PageRequirementsDialog() {
  const [location, setLocation] = useLocation();
  
  // Navigate to FM page with the current route as parameter
  const handleClick = () => {
    // Encode the current route to pass to FM page
    const encodedRoute = encodeURIComponent(location);
    setLocation(`/requirements?route=${encodedRoute}`);
  };

  // Don't show on the requirements page itself
  if (location === '/requirements' || location.startsWith('/requirements?')) {
    return null;
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0"
      data-testid="button-page-requirements"
      onClick={handleClick}
    >
      <Info className="h-5 w-5 text-muted-foreground hover:text-foreground" />
    </Button>
  );
}
