import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, FileText, CheckCircle2, ChevronRight, Home, Users, Landmark, Settings } from "lucide-react";
import { 
  requirementsRegistry, 
  buildHierarchy, 
  sectionTitles,
  type PageRequirements,
  type PageWithChildren 
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

function RequirementCard({ page, depth = 0 }: { page: PageWithChildren; depth?: number }) {
  const isChild = depth > 0;
  const marginClass = depth > 0 ? `ml-${Math.min(depth * 6, 12)}` : "";
  
  return (
    <>
      <AccordionItem 
        value={page.id} 
        className={isChild ? `${marginClass} border-l-2 border-muted pl-4` : ""}
        style={depth > 0 ? { marginLeft: `${depth * 1.5}rem` } : {}}
      >
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            {isChild && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <div>
              <div className="font-medium">{page.title}</div>
              <div className="text-xs text-muted-foreground">{page.route}</div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{page.overview}</p>
            
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Functional Requirements ({page.functionalRequirements.length})
              </h4>
              <div className="space-y-2">
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
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Acceptance Criteria ({page.acceptanceCriteria.length})
              </h4>
              <div className="space-y-1">
                {page.acceptanceCriteria.map((ac) => (
                  <div key={ac.id} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
                    <Badge variant="secondary" className="text-xs font-mono shrink-0">
                      {ac.id}
                    </Badge>
                    <span>{ac.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      {page.children.map((child) => (
        <RequirementCard key={child.id} page={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function Requirements() {
  const [searchQuery, setSearchQuery] = useState("");

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

  const totalRequirements = requirementsRegistry.reduce(
    (acc, page) => acc + page.functionalRequirements.length + page.acceptanceCriteria.length,
    0
  );

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
              {requirementsRegistry.length} Pages
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {totalFRs} Functional Requirements
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {totalACs} Acceptance Criteria
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {sections.map((section) => {
            const hierarchy = getFilteredHierarchy(section);
            if (hierarchy.length === 0) return null;
            
            const SectionIcon = sectionIcons[section];
            const sectionColor = sectionColors[section];
            
            return (
              <Card key={section} data-testid={`card-section-${section}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${sectionColor}`}>
                      <SectionIcon className="h-5 w-5 text-white" />
                    </div>
                    <span>{sectionTitles[section]}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {hierarchy.length + hierarchy.reduce((acc, h) => acc + h.children.length, 0)} pages
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <Accordion type="multiple" className="w-full">
                      {hierarchy.map((page) => (
                        <RequirementCard key={page.id} page={page} />
                      ))}
                    </Accordion>
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
      </div>
    </MainLayout>
  );
}
