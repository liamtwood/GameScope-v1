import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info, FileText, Loader2, Layers, CheckCircle2, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface PageRequirement {
  id: string;
  title: string;
  route: string;
  section: string;
  overview?: string;
  epicOverview?: string;
  displayOrder?: number;
}

interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  status?: string;
  parentId?: string;
  pageId?: string;
}

export function PageRequirementsDialog() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  
  const { data: pages = [], isLoading: pagesLoading } = useQuery<PageRequirement[]>({
    queryKey: ['/api/devops/requirements'],
    enabled: open,
  });

  const { data: workItems = [], isLoading: workItemsLoading } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items'],
    enabled: open,
  });

  const normalizeRoute = (route: string) => {
    return route.replace(/\/$/, '').replace(/\?.*$/, '') || '/';
  };

  const currentPage = pages.find(p => normalizeRoute(p.route) === normalizeRoute(location));
  const isLoading = pagesLoading || workItemsLoading;

  const pageEpic = currentPage 
    ? workItems.find(w => w.type === 'epic' && w.pageId === currentPage.id)
    : null;
  
  const pageFRs = pageEpic
    ? workItems.filter(w => w.type === 'FR' && w.parentId === pageEpic.id)
    : [];

  const pageACs = pageFRs.length > 0
    ? workItems.filter(w => w.type === 'AC' && pageFRs.some(fr => fr.id === w.parentId))
    : [];

  if (location === '/requirements' || location.startsWith('/requirements?')) {
    return null;
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0"
        data-testid="button-page-requirements"
        onClick={() => setOpen(true)}
      >
        <Info className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Page Details
            </SheetTitle>
            <SheetDescription>
              Requirements and specifications for this page
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !currentPage ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No requirements found for this page.</p>
                <p className="text-sm text-muted-foreground mt-2">Route: {location}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{currentPage.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-xs">{currentPage.id}</Badge>
                    <Badge variant="secondary" className="text-xs">{currentPage.section}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">{currentPage.route}</p>
                </div>

                {currentPage.overview && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Overview</h4>
                    <p className="text-sm">{currentPage.overview}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Epic</h4>
                  {pageEpic ? (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600" />
                      <Badge variant="outline" className="font-mono text-xs">{pageEpic.id}</Badge>
                      <span className="font-medium text-sm">{pageEpic.title}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No epic assigned to this page.</p>
                  )}
                  {currentPage.epicOverview && (
                    <p className="text-sm text-muted-foreground mt-2">{currentPage.epicOverview}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Functional Requirements ({pageFRs.length})
                  </h4>
                  {pageFRs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No functional requirements defined.</p>
                  ) : (
                    <div className="space-y-2">
                      {pageFRs.map(fr => {
                        const frACs = pageACs.filter(ac => ac.parentId === fr.id);
                        return (
                          <div key={fr.id} className="border rounded-lg p-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs shrink-0">{fr.id}</Badge>
                                <span className="font-medium text-sm">{fr.title}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">{frACs.length} AC</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Acceptance Criteria ({pageACs.length})
                  </h4>
                  {pageACs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No acceptance criteria defined.</p>
                  ) : (
                    <div className="space-y-2">
                      {pageACs.map(ac => (
                        <div key={ac.id} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
                          <Circle className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                          <span>
                            <Badge variant="secondary" className="text-xs font-mono mr-1">{ac.id}</Badge>
                            {ac.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
