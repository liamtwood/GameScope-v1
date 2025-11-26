import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Info, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { getRequirementsByRoute } from "@/lib/requirements-registry";

export function PageRequirementsDialog() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  
  const requirements = getRequirementsByRoute(location);

  if (!requirements) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          data-testid="button-page-requirements"
        >
          <Info className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {requirements.title}
            <Badge variant="outline" className="text-xs font-mono">
              {requirements.route}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">OVERVIEW</h3>
              <p className="text-sm">{requirements.overview}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                FUNCTIONAL REQUIREMENTS ({requirements.functionalRequirements.length})
              </h3>
              <div className="space-y-3">
                {requirements.functionalRequirements.map((req) => (
                  <div key={req.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {req.id}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-sm">{req.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                ACCEPTANCE CRITERIA ({requirements.acceptanceCriteria.length})
              </h3>
              <div className="space-y-2">
                {requirements.acceptanceCriteria.map((ac) => (
                  <div key={ac.id} className="flex items-start gap-2 text-sm">
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>
                      <Badge variant="secondary" className="text-xs font-mono mr-1">
                        {ac.id}
                      </Badge>
                      {ac.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
