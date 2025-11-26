import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, FileText, CheckCircle2, ChevronRight, ChevronDown, Home, Users, Landmark, Settings, Circle, History, Plus, Minus, RefreshCw, Wrench } from "lucide-react";
import { 
  requirementsRegistry, 
  changeLog,
  sectionTitles,
  type PageRequirements,
  type PageWithChildren,
  type ChangeLogEntry
} from "@/lib/requirements-registry";

const sectionIcons: Record<PageRequirements['section'], typeof Home> = {
  home: Home,
  team: Users,
  club: Landmark,
  devops: Settings,
};

const sectionColors: Record<PageRequirements['section'], string> = {
  home: "bg-blue-500",
  team: "bg-green-500",
  club: "bg-purple-500",
  devops: "bg-orange-500",
};

function PageTreeItem({ 
  page, 
  depth = 0, 
  onSelect,
  selectedId 
}: { 
  page: PageWithChildren; 
  depth?: number; 
  onSelect: (page: PageRequirements) => void;
  selectedId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = page.children.length > 0;
  const isSelected = selectedId === page.id;
  
  return (
    <div>
      <div 
        className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
          isSelected 
            ? "bg-primary/10 text-primary" 
            : "hover:bg-muted"
        }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
        onClick={() => onSelect(page)}
        data-testid={`tree-item-${page.id}`}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>{page.title}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {page.children.map((child) => (
            <PageTreeItem 
              key={child.id} 
              page={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const changeTypeConfig: Record<ChangeLogEntry['type'], { icon: typeof Plus; color: string; label: string }> = {
  added: { icon: Plus, color: "text-green-600 bg-green-100", label: "Added" },
  removed: { icon: Minus, color: "text-red-600 bg-red-100", label: "Removed" },
  changed: { icon: RefreshCw, color: "text-blue-600 bg-blue-100", label: "Changed" },
  fixed: { icon: Wrench, color: "text-amber-600 bg-amber-100", label: "Fixed" },
};

function ChangeLogItem({ entry }: { entry: ChangeLogEntry }) {
  const config = changeTypeConfig[entry.type];
  const Icon = config.icon;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20" data-testid={`changelog-${entry.id}`}>
      <div className={`p-1.5 rounded ${config.color}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-mono">{entry.id}</Badge>
          <Badge variant="secondary" className="text-xs">{entry.area}</Badge>
          <span className="text-xs text-muted-foreground ml-auto">{entry.date}</span>
        </div>
        <p className="text-sm">{entry.description}</p>
      </div>
    </div>
  );
}

function RequirementsPanel({ page }: { page: PageRequirements }) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="text-xs font-mono mb-2">
          {page.route}
        </Badge>
        <p className="text-sm text-muted-foreground">{page.overview}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Functional Requirements ({page.functionalRequirements.length})
        </h4>
        <div className="space-y-3">
          {page.functionalRequirements.map((req) => (
            <div key={req.id} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  {req.id}
                </Badge>
                <div>
                  <span className="font-medium text-sm">{req.title}</span>
                  <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Acceptance Criteria ({page.acceptanceCriteria.length})
        </h4>
        <div className="space-y-2">
          {page.acceptanceCriteria.map((ac) => (
            <div key={ac.id} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
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

export default function Requirements() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<PageRequirements | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections: PageRequirements['section'][] = ['home', 'team', 'club', 'devops'];

  const filteredRegistry = useMemo(() => {
    if (!searchQuery.trim()) return requirementsRegistry;
    
    const query = searchQuery.toLowerCase();
    return requirementsRegistry.filter(page => {
      const matchesTitle = page.title.toLowerCase().includes(query);
      const matchesRoute = page.route.toLowerCase().includes(query);
      const matchesFR = page.functionalRequirements.some(
        fr => fr.id.toLowerCase().includes(query) || 
              fr.title.toLowerCase().includes(query) ||
              fr.description.toLowerCase().includes(query)
      );
      const matchesAC = page.acceptanceCriteria.some(
        ac => ac.id.toLowerCase().includes(query) || 
              ac.description.toLowerCase().includes(query)
      );
      return matchesTitle || matchesRoute || matchesFR || matchesAC;
    });
  }, [searchQuery]);

  const getFilteredHierarchy = (section: PageRequirements['section']): PageWithChildren[] => {
    const sectionPages = filteredRegistry.filter(p => p.section === section);
    const pageIds = new Set(sectionPages.map(p => p.id));
    
    const buildTree = (page: PageRequirements): PageWithChildren => {
      const children = sectionPages.filter(p => p.parentId === page.id);
      return {
        ...page,
        children: children.map(child => buildTree(child)),
      };
    };
    
    const roots = sectionPages.filter(p => !p.parentId || !pageIds.has(p.parentId));
    return roots.map(root => buildTree(root));
  };

  const handleSelectPage = (page: PageRequirements) => {
    setSelectedPage(page);
    setSheetOpen(true);
  };

  const totalPages = requirementsRegistry.length;
  const totalFRs = requirementsRegistry.reduce(
    (acc, page) => acc + page.functionalRequirements.length,
    0
  );
  const totalACs = requirementsRegistry.reduce(
    (acc, page) => acc + page.acceptanceCriteria.length,
    0
  );

  return (
    <MainLayout title="Requirements" subtitle="View all page requirements and acceptance criteria">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by page name or requirement ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-requirements"
            />
          </div>
          <div className="flex gap-4">
            <Badge variant="outline" className="px-3 py-1">
              {totalPages} Pages
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {totalFRs} FRs
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {totalACs} ACs
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section) => {
            const hierarchy = getFilteredHierarchy(section);
            if (hierarchy.length === 0) return null;
            
            const SectionIcon = sectionIcons[section];
            const sectionColor = sectionColors[section];
            const pageCount = hierarchy.length + hierarchy.reduce(
              (acc, h) => acc + countChildren(h), 0
            );
            
            return (
              <Card key={section} data-testid={`card-section-${section}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className={`p-2 rounded-lg ${sectionColor}`}>
                      <SectionIcon className="h-4 w-4 text-white" />
                    </div>
                    <span>{sectionTitles[section]}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {pageCount}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[400px]">
                    {hierarchy.map((page) => (
                      <PageTreeItem 
                        key={page.id} 
                        page={page} 
                        onSelect={handleSelectPage}
                        selectedId={selectedPage?.id || null}
                      />
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredRegistry.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-changelog">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-slate-500">
                <History className="h-4 w-4 text-white" />
              </div>
              <span>Change Log</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {changeLog.length} changes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {changeLog.map((entry) => (
                <ChangeLogItem key={entry.id} entry={entry} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{selectedPage?.title}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-6 pr-4">
            {selectedPage && <RequirementsPanel page={selectedPage} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}

function countChildren(page: PageWithChildren): number {
  return page.children.reduce(
    (acc, child) => acc + 1 + countChildren(child), 0
  );
}
