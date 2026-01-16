import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, FileText, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageDetailsPanel } from "./shared-requirements-panel";

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
    queryKey: ['/api/fm/work-items'],
    enabled: open,
  });

  const currentPage = pages.find(p => p.route === location);
  const isLoading = pagesLoading || workItemsLoading;

  const buildPageData = () => {
    if (!currentPage) return null;

    const pageEpic = workItems.find(w => w.type === 'epic' && w.pageId === currentPage.id);
    const pageFRs = workItems.filter(w => w.type === 'FR' && pageEpic && w.parentId === pageEpic.id);
    const pageACs = workItems.filter(w => w.type === 'AC' && pageFRs.some(fr => fr.id === w.parentId));

    return {
      id: currentPage.id,
      title: currentPage.title,
      route: currentPage.route,
      section: currentPage.section,
      overview: currentPage.overview,
      epicOverview: currentPage.epicOverview,
      epic: pageEpic ? { id: pageEpic.id, title: pageEpic.title, description: pageEpic.description } : null,
      functionalRequirements: pageFRs.map(fr => ({
        id: fr.id,
        title: fr.title,
        description: fr.description,
      })),
      acceptanceCriteria: pageACs.map(ac => ({
        id: ac.id,
        description: ac.title,
        parentFrId: ac.parentId,
      })),
    };
  };

  const pageData = buildPageData();

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
            ) : !pageData ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No requirements found for this page.</p>
                <p className="text-sm text-muted-foreground mt-2">Route: {location}</p>
              </div>
            ) : (
              <PageDetailsPanel page={pageData} />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
