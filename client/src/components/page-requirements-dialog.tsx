import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useLocation } from "wouter";

export function PageRequirementsDialog() {
  const [location, setLocation] = useLocation();

  const handleClick = () => {
    const encodedRoute = encodeURIComponent(location);
    setLocation(`/requirements?route=${encodedRoute}`);
  };

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
