import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info, FileText, Loader2 } from "lucide-react";
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
    queryKey: ['/api/devops/page-requirements'],
    enabled: open,
  });

  const { data: workItems = [], isLoading: workItemsLoading } = useQuery<WorkItem[]>({
    queryKey: ['/api/fm/work-items'],
    enabled: open,
  });

  const currentPage = pages.find(p => p.route === location);
  const isLoading = pagesLoading || workItemsLoading;

  const pageEpics = currentPage 
    ? workItems.filter(w => w.type === 'epic' && w.pageId === currentPage.id)
    : [];
  
  const pageFRs = currentPage
    ? workItems.filter(w => w.type === 'FR' && pageEpics.some(e => e.id === w.parentId))
    : [];

  const pageACs = currentPage
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
                  <p className="text-sm text-muted-foreground mt-1">{currentPage.route}</p>
                </div>

                {currentPage.overview && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Overview</h4>
                    <p className="text-sm">{currentPage.overview}</p>
                  </div>
                )}

                {currentPage.epicOverview && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Epic Overview</h4>
                    <p className="text-sm">{currentPage.epicOverview}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Epics ({pageEpics.length})
                  </h4>
                  {pageEpics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No epics defined for this page.</p>
                  ) : (
                    <div className="space-y-2">
                      {pageEpics.map(epic => (
                        <div key={epic.id} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">{epic.id}</Badge>
                            <div>
                              <span className="font-medium text-sm">{epic.title}</span>
                              {epic.description && (
                                <p className="text-xs text-muted-foreground mt-1">{epic.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Functional Requirements ({pageFRs.length})
                  </h4>
                  {pageFRs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No functional requirements defined.</p>
                  ) : (
                    <div className="space-y-2">
                      {pageFRs.map(fr => (
                        <div key={fr.id} className="border rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">{fr.id}</Badge>
                            <div>
                              <span className="font-medium text-sm">{fr.title}</span>
                              {fr.description && (
                                <p className="text-xs text-muted-foreground mt-1">{fr.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Acceptance Criteria ({pageACs.length})
                  </h4>
                  {pageACs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No acceptance criteria defined.</p>
                  ) : (
                    <div className="space-y-2">
                      {pageACs.map(ac => (
                        <div key={ac.id} className="flex items-start gap-2 text-sm p-2 border rounded">
                          <Badge variant="secondary" className="font-mono text-xs shrink-0">{ac.id}</Badge>
                          <span>{ac.title}</span>
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
