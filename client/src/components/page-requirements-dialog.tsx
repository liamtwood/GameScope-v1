import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Circle, FileText, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { getRequirementsByRoute, type TabRequirements } from "@/lib/requirements-registry";
import { useTab } from "@/contexts/tab-context";

function TabRequirementsPanel({ tab }: { tab: TabRequirements }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{tab.overview}</p>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Functional Requirements ({tab.functionalRequirements.length})
        </h4>
        <div className="space-y-2">
          {tab.functionalRequirements.map((req) => (
            <div key={req.id} className="border rounded-lg p-2 bg-muted/30">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  {req.id}
                </Badge>
                <div>
                  <span className="font-medium text-sm">{req.title}</span>
                  <p className="text-xs text-muted-foreground">{req.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Acceptance Criteria ({tab.acceptanceCriteria.length})
        </h4>
        <div className="space-y-1">
          {tab.acceptanceCriteria.map((ac) => (
            <div key={ac.id} className="flex items-start gap-2 text-sm">
              <Circle className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
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
  );
}

export function PageRequirementsDialog() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { activeTab } = useTab();
  
  const requirements = getRequirementsByRoute(location);

  if (!requirements) {
    return null;
  }

  const hasTabs = requirements.tabs && requirements.tabs.length > 0;
  const currentTabReqs = hasTabs && activeTab 
    ? requirements.tabs?.find(t => t.name.toLowerCase() === activeTab.toLowerCase())
    : null;
  
  // Controlled tab value: show specific tab's requirements if user is on that tab
  const [selectedReqTab, setSelectedReqTab] = useState<string>("page");
  
  // Update selected tab when dialog opens or activeTab changes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && currentTabReqs) {
      setSelectedReqTab(currentTabReqs.id);
    } else if (isOpen) {
      setSelectedReqTab("page");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
            {requirements.title}
            {currentTabReqs && (
              <>
                <span className="text-muted-foreground">&gt;</span>
                <span>{currentTabReqs.name}</span>
              </>
            )}
            <Badge variant="outline" className="text-xs font-mono">
              {requirements.route}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {hasTabs ? (
            <Tabs value={selectedReqTab} onValueChange={setSelectedReqTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="page">Page Overview</TabsTrigger>
                {requirements.tabs?.map(tab => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                  >
                    {tab.name}
                    {currentTabReqs?.id === tab.id && (
                      <span className="ml-1 text-xs text-primary">(current)</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="page">
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
              </TabsContent>
              
              {requirements.tabs?.map(tab => (
                <TabsContent key={tab.id} value={tab.id}>
                  <TabRequirementsPanel tab={tab} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
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
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
