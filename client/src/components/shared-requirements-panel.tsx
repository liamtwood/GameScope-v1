import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, FileText, Layers } from "lucide-react";

interface FunctionalRequirement {
  id: string;
  title: string;
  description?: string;
}

interface AcceptanceCriteria {
  id: string;
  description: string;
  parentFrId?: string;
}

interface Epic {
  id: string;
  title: string;
  description?: string;
}

interface PageData {
  id: string;
  title: string;
  route: string;
  section: string;
  overview?: string;
  epicOverview?: string;
  epic?: Epic | null;
  functionalRequirements: FunctionalRequirement[];
  acceptanceCriteria: AcceptanceCriteria[];
}

interface SharedRequirementsPanelProps {
  page: PageData;
  selectedFrId?: string | null;
}

export function SharedRequirementsPanel({ page, selectedFrId }: SharedRequirementsPanelProps) {
  const epicLevelACs = page.acceptanceCriteria.filter(ac => !ac.parentFrId);
  
  const getAcCountForFr = (frId: string) => {
    return page.acceptanceCriteria.filter(ac => ac.parentFrId === frId).length;
  };

  const filteredFRs = selectedFrId 
    ? page.functionalRequirements.filter(fr => fr.id === selectedFrId)
    : page.functionalRequirements;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Acceptance Criteria ({epicLevelACs.length})
        </h4>
        <div className="space-y-2">
          {epicLevelACs.map((ac) => (
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
          {epicLevelACs.length === 0 && (
            <p className="text-xs text-muted-foreground">No epic-level acceptance criteria</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Functional Requirements ({filteredFRs.length}{selectedFrId ? ` of ${page.functionalRequirements.length}` : ''})
        </h4>
        <div className="space-y-2">
          {filteredFRs.map((req) => (
            <div key={req.id} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {req.id}
                  </Badge>
                  <span className="font-medium text-sm">{req.title}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getAcCountForFr(req.id)} AC
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PageDetailsPanelProps {
  page: PageData;
}

export function PageDetailsPanel({ page }: PageDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{page.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="font-mono text-xs">{page.id}</Badge>
          <Badge variant="secondary" className="text-xs">{page.section}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{page.route}</p>
      </div>

      {page.overview && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Overview</h4>
          <p className="text-sm">{page.overview}</p>
        </div>
      )}

      {page.epic && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Epic</h4>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <Badge variant="outline" className="font-mono text-xs">{page.epic.id}</Badge>
            <span className="font-medium text-sm">{page.epic.title}</span>
          </div>
          {page.epicOverview && (
            <p className="text-sm text-muted-foreground mt-2">{page.epicOverview}</p>
          )}
        </div>
      )}

      <Separator />

      <SharedRequirementsPanel page={page} />
    </div>
  );
}
