import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, FileText, CheckCircle2, ChevronRight, ChevronDown, Home, Users, Landmark, Settings, Circle, History, Plus, Minus, RefreshCw, Wrench, Database, Check, X, Edit, Trash2, Bug, Lightbulb, AlertTriangle, Loader2, HelpCircle, ListTodo, ClipboardList, Filter, Target, Layers, Puzzle, Link2, Download, Table2 as TableIcon, AppWindow, Component, Folder, PenTool, Rocket, FlaskConical } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { 
  requirementsRegistry, 
  changeLog as hardcodedChangeLog,
  dataModels as hardcodedDataModels,
  testCases as hardcodedTestCases,
  sectionTitles,
  type PageRequirements,
  type PageWithChildren,
  type ChangeLogEntry,
  type DataModel,
  type DataModelField,
  type TestCase
} from "@/lib/requirements-registry";
import type { WorkItem, WorkItemLink, TestRun, TestRunResult, FmApp, FmWidget } from "@shared/schema";

type ChangeLogType = 'added' | 'removed' | 'changed' | 'fixed' | 'bug' | 'enhancement' | 'question' | 'action_item';

type TestRunOutcome = 'passed' | 'failed' | 'blocked' | 'skipped';

const outcomeConfig: Record<TestRunOutcome, { color: string; icon: typeof Check; label: string }> = {
  passed: { color: "bg-green-100 text-green-700", icon: Check, label: "Passed" },
  failed: { color: "bg-red-100 text-red-700", icon: X, label: "Failed" },
  blocked: { color: "bg-gray-100 text-gray-700", icon: Circle, label: "Blocked" },
  skipped: { color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle, label: "Skipped" },
};

type APIChangeLogEntry = ChangeLogEntry;

interface APIDataModel extends DataModel {
  createdAt?: string;
  updatedAt?: string;
}

interface APIPageRequirement extends PageRequirements {
  createdAt?: string;
  updatedAt?: string;
}

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

const changeTypeConfig: Record<ChangeLogType, { icon: typeof Plus; color: string; label: string }> = {
  added: { icon: Plus, color: "text-green-600 bg-green-100", label: "Added" },
  removed: { icon: Minus, color: "text-red-600 bg-red-100", label: "Removed" },
  changed: { icon: RefreshCw, color: "text-blue-600 bg-blue-100", label: "Changed" },
  fixed: { icon: Wrench, color: "text-amber-600 bg-amber-100", label: "Fixed" },
  bug: { icon: Bug, color: "text-rose-600 bg-rose-100", label: "Bug" },
  enhancement: { icon: Lightbulb, color: "text-cyan-600 bg-cyan-100", label: "Enhancement" },
  question: { icon: HelpCircle, color: "text-amber-600 bg-amber-100", label: "Question" },
  action_item: { icon: ListTodo, color: "text-violet-600 bg-violet-100", label: "Action Item" },
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const testStatusConfig: Record<TestCase['status'], { color: string; icon: typeof Check; label: string }> = {
  passed: { color: "bg-green-100 text-green-700", icon: Check, label: "Passed" },
  failed: { color: "bg-red-100 text-red-700", icon: X, label: "Failed" },
  partial: { color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle, label: "Partial" },
  blocked: { color: "bg-gray-100 text-gray-700", icon: Circle, label: "Blocked" },
};

const workItemTypeConfig: Record<string, { icon: typeof Bug; color: string; label: string }> = {
  section: { icon: Folder, color: "text-slate-600 bg-slate-100", label: "Section" },
  page: { icon: FileText, color: "text-emerald-600 bg-emerald-100", label: "Page" },
  epoch: { icon: Target, color: "text-purple-600 bg-purple-100", label: "Epoch" },
  epic: { icon: Layers, color: "text-indigo-600 bg-indigo-100", label: "Epic" },
  FR: { icon: FileText, color: "text-blue-600 bg-blue-100", label: "Functional Requirement" },
  AC: { icon: CheckCircle2, color: "text-sky-600 bg-sky-100", label: "Acceptance Criteria" },
  feature: { icon: Puzzle, color: "text-violet-600 bg-violet-100", label: "Feature" },
  story: { icon: FileText, color: "text-blue-600 bg-blue-100", label: "Story" },
  bug: { icon: Bug, color: "text-rose-600 bg-rose-100", label: "Bug" },
  enhancement: { icon: Lightbulb, color: "text-cyan-600 bg-cyan-100", label: "Enhancement" },
  test_case: { icon: ClipboardList, color: "text-teal-600 bg-teal-100", label: "Test Case" },
  question: { icon: HelpCircle, color: "text-amber-600 bg-amber-100", label: "Question" },
  action_item: { icon: ListTodo, color: "text-orange-600 bg-orange-100", label: "Action Item" },
};

const workItemTypes = ['epoch', 'epic', 'FR', 'AC', 'feature', 'story', 'bug', 'enhancement', 'test_case', 'question', 'action_item'];

// Hierarchy types for tree view (Epic → FR → AC, plus TCs, Bugs, Enhancements)
const hierarchyTypes = ['epoch', 'epic', 'FR', 'AC', 'test_case', 'bug', 'enhancement'];

interface HierarchyNode {
  item: WorkItem;
  children: HierarchyNode[];
  nodeType?: 'section' | 'page' | 'workItem';
}

const sectionOrder = ['home', 'team', 'club', 'devops'];
const sectionLabels: Record<string, string> = {
  home: 'Home',
  team: 'Team',
  club: 'Club',
  devops: 'DevOps'
};

// Build hierarchy tree with sections and pages: Section → Page → Epic → FR → AC/TC/Bug
function buildHierarchyTree(items: WorkItem[], pages: PageRequirements[]): HierarchyNode[] {
  const hierarchyItems = items.filter(item => hierarchyTypes.includes(item.type));
  const itemMap = new Map<string, HierarchyNode>();
  
  // Create nodes for all hierarchy items
  hierarchyItems.forEach(item => {
    itemMap.set(item.id, { item, children: [], nodeType: 'workItem' });
  });
  
  // Build parent-child relationships for work items
  const epicsByPage = new Map<string, HierarchyNode[]>();
  hierarchyItems.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)!.children.push(node);
    } else if (item.type === 'epic' && item.pageId) {
      // Group epics by page
      if (!epicsByPage.has(item.pageId)) {
        epicsByPage.set(item.pageId, []);
      }
      epicsByPage.get(item.pageId)!.push(node);
    }
  });
  
  // Group pages by section
  const pagesBySection = new Map<string, PageRequirements[]>();
  pages.forEach(page => {
    if (!pagesBySection.has(page.section)) {
      pagesBySection.set(page.section, []);
    }
    pagesBySection.get(page.section)!.push(page);
  });
  
  // Build section nodes
  const roots: HierarchyNode[] = [];
  sectionOrder.forEach(sectionKey => {
    const sectionPages = pagesBySection.get(sectionKey) || [];
    if (sectionPages.length === 0) return;
    
    // Create page nodes for this section
    const pageNodes: HierarchyNode[] = sectionPages.map(page => {
      const pageEpics = epicsByPage.get(page.id) || [];
      // Sort epics by ID
      pageEpics.sort((a, b) => a.item.id.localeCompare(b.item.id));
      
      return {
        item: {
          id: page.id,
          type: 'page',
          title: page.title,
          status: 'active',
        } as WorkItem,
        children: pageEpics,
        nodeType: 'page' as const
      };
    });
    
    // Sort pages by title
    pageNodes.sort((a, b) => a.item.title.localeCompare(b.item.title));
    
    // Create section node
    const sectionNode: HierarchyNode = {
      item: {
        id: sectionKey,
        type: 'section',
        title: sectionLabels[sectionKey] || sectionKey,
        status: 'active',
      } as WorkItem,
      children: pageNodes,
      nodeType: 'section'
    };
    
    roots.push(sectionNode);
  });
  
  // Sort children recursively
  const sortChildren = (nodes: HierarchyNode[]) => {
    nodes.forEach(node => {
      if (node.nodeType === 'workItem') {
        node.children.sort((a, b) => a.item.id.localeCompare(b.item.id));
      }
      sortChildren(node.children);
    });
  };
  sortChildren(roots);
  
  return roots;
}

// Generate documentation markdown from all requirements data
function generateDocumentationMarkdown(
  requirements: PageRequirements[],
  dataModels: DataModel[],
  changeLog: ChangeLogEntry[],
  testCases: TestCase[]
): string {
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let md = `# GameScope Requirements Specification

Generated: ${now}

---

## Table of Contents
1. [Epic Requirements](#epic-requirements)
2. [Data Models](#data-models)
3. [Test Cases](#test-cases)
4. [Change Log](#change-log)

---

## Epic Requirements

`;

  // Group requirements by section
  const sections: Record<string, PageRequirements[]> = {
    home: [],
    team: [],
    club: [],
    devops: []
  };
  
  requirements.forEach(req => {
    if (sections[req.section]) {
      sections[req.section].push(req);
    }
  });

  const sectionNames: Record<string, string> = {
    home: 'HOME / LANDING',
    team: 'TEAM SECTION',
    club: 'CLUB SECTION',
    devops: 'DEVOPS SECTION'
  };

  for (const [section, pages] of Object.entries(sections)) {
    if (pages.length === 0) continue;
    
    md += `### ${sectionNames[section]}\n\n`;
    
    for (const page of pages) {
      md += `#### ${page.title}\n`;
      md += `**Route:** \`${page.route}\`  \n`;
      md += `**Section:** ${page.section}  \n`;
      if (page.parentId) {
        const parent = requirements.find(r => r.id === page.parentId);
        if (parent) md += `**Parent:** ${parent.title}  \n`;
      }
      md += `**Overview:** ${page.overview}\n\n`;
      
      if (page.functionalRequirements.length > 0) {
        md += `**Functional Requirements:**\n`;
        md += `| ID | Title | Description |\n`;
        md += `|----|-------|-------------|\n`;
        for (const fr of page.functionalRequirements) {
          md += `| ${fr.id} | ${fr.title} | ${fr.description.replace(/\|/g, '\\|')} |\n`;
        }
        md += '\n';
      }
      
      if (page.acceptanceCriteria.length > 0) {
        md += `**Acceptance Criteria:**\n`;
        for (const ac of page.acceptanceCriteria) {
          md += `- [${ac.id}] ${ac.description}\n`;
        }
        md += '\n';
      }
      
      // Handle tabs if present
      if (page.tabs && page.tabs.length > 0) {
        for (const tab of page.tabs) {
          md += `##### Tab: ${tab.name}\n`;
          md += `**Overview:** ${tab.overview}\n\n`;
          
          if (tab.functionalRequirements.length > 0) {
            md += `| ID | Title | Description |\n`;
            md += `|----|-------|-------------|\n`;
            for (const fr of tab.functionalRequirements) {
              md += `| ${fr.id} | ${fr.title} | ${fr.description.replace(/\|/g, '\\|')} |\n`;
            }
            md += '\n';
          }
          
          if (tab.acceptanceCriteria.length > 0) {
            md += `**Acceptance Criteria:**\n`;
            for (const ac of tab.acceptanceCriteria) {
              md += `- [${ac.id}] ${ac.description}\n`;
            }
            md += '\n';
          }
        }
      }
      
      md += `---\n\n`;
    }
  }

  // Data Models
  md += `## Data Models\n\n`;
  
  for (const model of dataModels) {
    md += `### ${model.name}\n`;
    md += `**Description:** ${model.description}\n\n`;
    md += `| Field | Type | Mandatory | Default | Values | Description |\n`;
    md += `|-------|------|-----------|---------|--------|-------------|\n`;
    
    for (const field of model.fields) {
      const values = field.listOfValues ? field.listOfValues.join(', ') : '-';
      const defaultVal = field.defaultValue || '-';
      md += `| ${field.name} | ${field.type} | ${field.mandatory ? 'Yes' : 'No'} | ${defaultVal} | ${values} | ${field.description || '-'} |\n`;
    }
    md += '\n---\n\n';
  }

  // Test Cases
  md += `## Test Cases\n\n`;
  
  for (const tc of testCases) {
    const statusEmoji = tc.status === 'passed' ? '✅' : tc.status === 'failed' ? '❌' : tc.status === 'partial' ? '⚠️' : '⏸️';
    md += `### ${tc.id}: ${tc.title} ${statusEmoji}\n`;
    md += `**Objective:** ${tc.objective}  \n`;
    md += `**Component:** ${tc.component || 'N/A'}  \n`;
    md += `**Status:** ${tc.status.toUpperCase()}  \n`;
    if (tc.associatedBug) md += `**Associated Bug:** ${tc.associatedBug}  \n`;
    md += `**Date:** ${tc.date}  \n`;
    md += `**Tester:** ${tc.tester}\n\n`;
    
    md += `**Steps:**\n`;
    for (let i = 0; i < tc.steps.length; i++) {
      md += `${i + 1}. ${tc.steps[i]}\n`;
    }
    md += '\n';
    
    md += `**Expected Result:** ${tc.expectedResult}  \n`;
    md += `**Actual Result:** ${tc.actualResult}\n\n`;
    md += `---\n\n`;
  }

  // Change Log
  md += `## Change Log\n\n`;
  md += `| ID | Date | Type | Area | Description |\n`;
  md += `|----|------|------|------|-------------|\n`;
  
  for (const entry of changeLog) {
    const typeLabel = entry.type.charAt(0).toUpperCase() + entry.type.slice(1).replace('_', ' ');
    md += `| ${entry.id} | ${entry.date} | ${typeLabel} | ${entry.area} | ${entry.description.replace(/\|/g, '\\|')} |\n`;
  }
  md += '\n';

  return md;
}

// Download documentation as markdown file
function downloadDocumentation(content: string, filename: string = 'GameScope-Requirements-Specification.md') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Hierarchy tree node component
function HierarchyTreeNode({ 
  node, 
  depth = 0,
  expandedNodes,
  onToggle,
  onSelectItem
}: { 
  node: HierarchyNode; 
  depth?: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onSelectItem?: (item: WorkItem) => void;
}) {
  const { item, children } = node;
  const isExpanded = expandedNodes.has(item.id);
  const hasChildren = children.length > 0;
  const typeConfig = workItemTypeConfig[item.type] || workItemTypeConfig.story;
  const TypeIcon = typeConfig.icon;
  const statusClass = item.status ? statusColors[item.status] || '' : '';
  
  return (
    <div className="select-none" data-testid={`hierarchy-node-${item.id}`}>
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && onToggle(item.id)}
      >
        {/* Expand/Collapse button */}
        <button 
          className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${hasChildren ? 'hover:bg-muted' : 'invisible'}`}
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(item.id); }}
        >
          {hasChildren && (isExpanded ? '−' : '+')}
        </button>
        
        {/* Type icon */}
        <div className={`p-1 rounded ${typeConfig.color}`}>
          <TypeIcon className={item.type === 'section' ? "h-4 w-4" : "h-3 w-3"} />
        </div>
        
        {/* ID badge - hide for sections since title is the display */}
        {item.type !== 'section' && (
          <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
            {item.id}
          </Badge>
        )}
        
        {/* Title - larger for sections */}
        <span 
          className={`flex-1 truncate ${item.type === 'section' ? 'text-base font-semibold' : 'text-sm hover:underline'}`}
          onClick={(e) => { e.stopPropagation(); if (item.type !== 'section') onSelectItem?.(item); }}
        >
          {item.title}
        </span>
        
        {/* Status badge */}
        {item.status && (
          <Badge className={`${statusClass} text-xs px-1.5 py-0`}>
            {item.status.replace('_', ' ')}
          </Badge>
        )}
        
        {/* Children count */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground">
            ({children.length})
          </span>
        )}
      </div>
      
      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="border-l ml-4 border-muted">
          {children.map(child => (
            <HierarchyTreeNode
              key={child.item.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCaseItem({ testCase, expanded, onToggle }: { testCase: TestCase; expanded: boolean; onToggle: () => void }) {
  const config = testStatusConfig[testCase.status];
  const StatusIcon = config.icon;
  
  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`testcase-${testCase.id}`}>
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <button className="p-0.5">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Badge variant="outline" className="font-mono text-xs">
          {testCase.id}
        </Badge>
        <span className="font-medium flex-1">{testCase.title}</span>
        <Badge className={config.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        {testCase.associatedBug && (
          <Badge variant="outline" className="text-rose-600 border-rose-300">
            <Bug className="h-3 w-3 mr-1" />
            {testCase.associatedBug}
          </Badge>
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/20 space-y-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase">Objective</span>
            <p className="text-sm mt-1">{testCase.objective}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase">Steps</span>
            <ol className="text-sm mt-1 list-decimal list-inside space-y-1">
              {testCase.steps.map((step, idx) => (
                <li key={idx} className="text-muted-foreground">{step}</li>
              ))}
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Expected Result</span>
              <p className="text-sm mt-1 text-green-700">{testCase.expectedResult}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Actual Result</span>
              <p className={`text-sm mt-1 ${testCase.status === 'passed' ? 'text-green-700' : 'text-red-700'}`}>
                {testCase.actualResult}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Tester: {testCase.tester}</span>
            <span>Date: {testCase.date}</span>
            {testCase.component && <span>Component: {testCase.component}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Test Run Item component with expandable results
function TestRunItem({ 
  run, 
  expanded, 
  onToggle,
  testCases,
}: { 
  run: TestRun; 
  expanded: boolean; 
  onToggle: () => void;
  testCases: TestCase[];
}) {
  const testers = (run.testers as string[]) || [];
  
  // Fetch results for this run when expanded
  const { data: results = [] } = useQuery<TestRunResult[]>({
    queryKey: ['/api/test-runs', run.id, 'results'],
    enabled: expanded,
  });

  // Calculate summary from results
  const summary = {
    total: results.length,
    passed: results.filter(r => r.outcome === 'passed').length,
    failed: results.filter(r => r.outcome === 'failed').length,
    blocked: results.filter(r => r.outcome === 'blocked').length,
    skipped: results.filter(r => r.outcome === 'skipped').length,
  };

  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`testrun-${run.id}`}>
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <button className="p-0.5">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Badge variant="outline" className="font-mono text-xs bg-indigo-50">
          Run #{run.runNumber}
        </Badge>
        <span className="font-medium flex-1">{run.name || `Test Run ${run.runNumber}`}</span>
        <span className="text-xs text-muted-foreground">{run.date}</span>
        <Badge className={run.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
          {run.status === 'completed' ? 'Completed' : 'In Progress'}
        </Badge>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/20 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Testers</span>
              <p className="text-sm mt-1">{testers.length > 0 ? testers.join(', ') : 'Not specified'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Build Info</span>
              <p className="text-sm mt-1">{run.buildInfo || 'Not specified'}</p>
            </div>
          </div>
          
          {run.notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Notes</span>
              <p className="text-sm mt-1">{run.notes}</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Test Results</span>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700">{summary.passed} Passed</Badge>
                  <Badge className="bg-red-100 text-red-700">{summary.failed} Failed</Badge>
                  {summary.blocked > 0 && <Badge className="bg-gray-100 text-gray-700">{summary.blocked} Blocked</Badge>}
                  {summary.skipped > 0 && <Badge className="bg-yellow-100 text-yellow-700">{summary.skipped} Skipped</Badge>}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Test Case</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[100px]">Outcome</TableHead>
                      <TableHead className="w-[120px]">Executed By</TableHead>
                      <TableHead className="w-[150px]">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => {
                      const tc = testCases.find(t => t.id === result.testCaseId);
                      const outcomeConf = outcomeConfig[result.outcome as TestRunOutcome] || outcomeConfig.skipped;
                      const OutcomeIcon = outcomeConf.icon;
                      return (
                        <TableRow key={result.id}>
                          <TableCell className="font-mono text-xs">{result.testCaseId}</TableCell>
                          <TableCell className="text-sm">{tc?.title || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={outcomeConf.color}>
                              <OutcomeIcon className="h-3 w-3 mr-1" />
                              {outcomeConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{result.executedBy || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{result.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No test results recorded for this run</p>
          )}
        </div>
      )}
    </div>
  );
}

function WorkItemCard({ 
  item, 
  expanded, 
  onToggle, 
  onConvert,
  linkedItems,
  isConverting 
}: { 
  item: WorkItem; 
  expanded: boolean; 
  onToggle: () => void;
  onConvert: (id: string, newType: string) => void;
  linkedItems?: WorkItem[];
  isConverting?: boolean;
}) {
  const typeConfig = workItemTypeConfig[item.type] || workItemTypeConfig.enhancement;
  const TypeIcon = typeConfig.icon;
  const priorityClass = item.priority ? priorityColors[item.priority] : '';
  const statusClass = item.status ? statusColors[item.status] || '' : '';
  
  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`workitem-${item.id}`}>
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <button className="p-0.5">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <div className={`p-1.5 rounded ${typeConfig.color}`}>
          <TypeIcon className="h-3 w-3" />
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {item.id}
        </Badge>
        <span className="font-medium flex-1 truncate">{item.title}</span>
        {item.priority && (
          <Badge className={`text-xs ${priorityClass}`}>
            {item.priority}
          </Badge>
        )}
        {statusClass && (
          <Badge className={`text-xs ${statusClass}`}>
            {item.status?.replace('_', ' ')}
          </Badge>
        )}
        {item.area && (
          <Badge variant="secondary" className="text-xs">
            {item.area}
          </Badge>
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/20 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">Type:</span>
            <Select
              value={item.type}
              onValueChange={(value) => onConvert(item.id, value)}
              disabled={isConverting}
            >
              <SelectTrigger className="w-[150px] h-7 text-xs" data-testid={`select-type-${item.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workItemTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {workItemTypeConfig[type]?.label || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {item.convertedFrom && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-1" />
                from {item.convertedFrom}
              </Badge>
            )}
          </div>
          
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase">Description</span>
            <p className="text-sm mt-1">{item.description}</p>
          </div>
          
          {item.steps && Array.isArray(item.steps) && (item.steps as string[]).length > 0 ? (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Steps</span>
              <ol className="text-sm mt-1 list-decimal list-inside space-y-1">
                {(item.steps as string[]).map((step: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
          
          {(item.expectedResult || item.actualResult) && (
            <div className="grid grid-cols-2 gap-4">
              {item.expectedResult && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Expected</span>
                  <p className="text-sm mt-1 text-green-700">{item.expectedResult}</p>
                </div>
              )}
              {item.actualResult && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Actual</span>
                  <p className="text-sm mt-1 text-red-700">{item.actualResult}</p>
                </div>
              )}
            </div>
          )}
          
          {linkedItems && linkedItems.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Linked Items</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {linkedItems.map(linked => {
                  const linkedConfig = workItemTypeConfig[linked.type] || workItemTypeConfig.enhancement;
                  return (
                    <Badge key={linked.id} variant="outline" className={linkedConfig.color}>
                      {linked.id}: {linked.title.substring(0, 30)}...
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
            {item.tester && <span>Tester: {item.tester}</span>}
            {item.date && <span>Date: {item.date}</span>}
            {item.createdAt && <span className="ml-auto">Created: {new Date(item.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function PageTreeItem({ 
  page, 
  depth = 0, 
  onSelect,
  onEdit,
  onDelete,
  selectedId 
}: { 
  page: PageWithChildren; 
  depth?: number; 
  onSelect: (page: PageRequirements) => void;
  onEdit: (page: PageRequirements) => void;
  onDelete: (page: PageRequirements) => void;
  selectedId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = page.children.length > 0;
  const isSelected = selectedId === page.id;
  
  return (
    <div>
      <div 
        className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors group ${
          isSelected 
            ? "bg-primary/10 text-primary" 
            : "hover:bg-muted"
        }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
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
        <span 
          className={`text-sm flex-1 ${isSelected ? "font-medium" : ""}`}
          onClick={() => onSelect(page)}
        >
          {page.title}
        </span>
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(page); }}
            className="p-1 hover:bg-muted rounded"
            data-testid={`btn-edit-req-${page.id}`}
          >
            <Edit className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(page); }}
            className="p-1 hover:bg-destructive/10 rounded"
            data-testid={`btn-delete-req-${page.id}`}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {page.children.map((child) => (
            <PageTreeItem 
              key={child.id} 
              page={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeLogItem({ 
  entry, 
  onEdit, 
  onDelete 
}: { 
  entry: APIChangeLogEntry; 
  onEdit: (entry: APIChangeLogEntry) => void;
  onDelete: (entry: APIChangeLogEntry) => void;
}) {
  const config = changeTypeConfig[entry.type] || changeTypeConfig.changed;
  const Icon = config.icon;
  const isTrackableItem = entry.type === 'bug' || entry.type === 'enhancement' || entry.type === 'question' || entry.type === 'action_item';
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 group" data-testid={`changelog-${entry.id}`}>
      <div className={`p-1.5 rounded ${config.color}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className="text-xs font-mono">{entry.id}</Badge>
          <Badge variant="secondary" className="text-xs">{entry.area}</Badge>
          {isTrackableItem && entry.priority && (
            <Badge className={`text-xs ${priorityColors[entry.priority]}`}>
              {entry.priority}
            </Badge>
          )}
          {isTrackableItem && entry.status && (
            <Badge className={`text-xs ${statusColors[entry.status]}`}>
              {entry.status.replace('_', ' ')}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{entry.date}</span>
        </div>
        <p className="text-sm">{entry.description}</p>
      </div>
      <div className="hidden group-hover:flex items-center gap-1">
        <button
          onClick={() => onEdit(entry)}
          className="p-1 hover:bg-muted rounded"
          data-testid={`btn-edit-changelog-${entry.id}`}
        >
          <Edit className="h-3 w-3 text-muted-foreground" />
        </button>
        <button
          onClick={() => onDelete(entry)}
          className="p-1 hover:bg-destructive/10 rounded"
          data-testid={`btn-delete-changelog-${entry.id}`}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </button>
      </div>
    </div>
  );
}

function DataModelCard({ 
  model, 
  onSelect, 
  onEdit, 
  onDelete 
}: { 
  model: DataModel; 
  onSelect: (model: DataModel) => void;
  onEdit: (model: DataModel) => void;
  onDelete: (model: DataModel) => void;
}) {
  return (
    <div 
      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
      data-testid={`datamodel-${model.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium flex-1" onClick={() => onSelect(model)}>{model.name}</span>
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(model); }}
            className="p-1 hover:bg-muted rounded"
            data-testid={`btn-edit-model-${model.id}`}
          >
            <Edit className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(model); }}
            className="p-1 hover:bg-destructive/10 rounded"
            data-testid={`btn-delete-model-${model.id}`}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
        <Badge variant="outline" className="text-xs">{model.fields.length} fields</Badge>
      </div>
      <p className="text-xs text-muted-foreground" onClick={() => onSelect(model)}>{model.description}</p>
    </div>
  );
}

function DataModelPanel({ model }: { model: DataModel }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{model.description}</p>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Field Name</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold text-center">Required</TableHead>
              <TableHead className="text-xs font-semibold">Default</TableHead>
              <TableHead className="text-xs font-semibold">Values</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.fields.map((field) => (
              <TableRow key={field.name}>
                <TableCell className="font-mono text-xs">
                  {field.name}
                  {field.description && (
                    <p className="text-muted-foreground font-sans mt-0.5">{field.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-xs">{field.type}</TableCell>
                <TableCell className="text-center">
                  {field.mandatory ? (
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {field.defaultValue || "-"}
                </TableCell>
                <TableCell className="text-xs">
                  {field.listOfValues ? (
                    <div className="flex flex-wrap gap-1">
                      {field.listOfValues.map((val) => (
                        <Badge key={val} variant="secondary" className="text-xs">
                          {val}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RequirementsPanel({ page, selectedFrId }: { page: PageRequirements; selectedFrId?: string | null }) {
  const filteredFRs = selectedFrId 
    ? page.functionalRequirements.filter(fr => fr.id === selectedFrId)
    : page.functionalRequirements;
  
  const filteredACs = selectedFrId
    ? page.acceptanceCriteria.filter(ac => ac.parentFrId === selectedFrId)
    : page.acceptanceCriteria;

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
          Functional Requirements ({filteredFRs.length}{selectedFrId ? ` of ${page.functionalRequirements.length}` : ''})
        </h4>
        <div className="space-y-3">
          {filteredFRs.map((req) => (
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
          Acceptance Criteria ({filteredACs.length}{selectedFrId ? ` for ${selectedFrId}` : ''})
        </h4>
        <div className="space-y-2">
          {filteredACs.map((ac) => (
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
          {filteredACs.length === 0 && selectedFrId && (
            <p className="text-xs text-muted-foreground">No acceptance criteria linked to this FR</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangeLogDialog({ 
  open, 
  onOpenChange, 
  entry, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  entry: APIChangeLogEntry | null;
  onSave: (data: Partial<APIChangeLogEntry>) => void;
}) {
  const [formData, setFormData] = useState({
    id: "",
    date: new Date().toISOString().split('T')[0],
    type: "added" as ChangeLogType,
    area: "",
    description: "",
    priority: undefined as 'low' | 'medium' | 'high' | 'critical' | undefined,
    status: "open" as 'open' | 'in_progress' | 'resolved' | 'closed',
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        id: entry.id,
        date: entry.date,
        type: entry.type,
        area: entry.area,
        description: entry.description,
        priority: entry.priority,
        status: entry.status || "open",
      });
    } else {
      setFormData({
        id: `CL-${String(Date.now()).slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        type: "added",
        area: "",
        description: "",
        priority: undefined,
        status: "open",
      });
    }
  }, [entry, open]);

  const isTrackableItem = formData.type === 'bug' || formData.type === 'enhancement' || formData.type === 'question' || formData.type === 'action_item';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Change Log Entry" : "Add Change Log Entry"}</DialogTitle>
          <DialogDescription>
            {entry ? "Update the change log entry details." : "Create a new change log entry, bug, or enhancement."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="CL-001"
                data-testid="input-changelog-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-changelog-date"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ChangeLogType })}
              >
                <SelectTrigger data-testid="select-changelog-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="added">Added</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                  <SelectItem value="changed">Changed</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="action_item">Action Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Fixtures, Squad"
                data-testid="input-changelog-area"
              />
            </div>
          </div>
          {isTrackableItem && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority || ""}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger data-testid="select-changelog-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger data-testid="select-changelog-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the change, bug, or enhancement..."
              rows={3}
              data-testid="textarea-changelog-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(formData)} data-testid="btn-save-changelog">
            {entry ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DataModelDialog({ 
  open, 
  onOpenChange, 
  model, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  model: DataModel | null;
  onSave: (data: Partial<DataModel>) => void;
}) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    fields: [] as DataModelField[],
  });
  const [newField, setNewField] = useState({
    name: "",
    type: "",
    mandatory: false,
    defaultValue: "",
    description: "",
    listOfValues: "",
  });

  useEffect(() => {
    if (model) {
      setFormData({
        id: model.id,
        name: model.name,
        description: model.description,
        fields: model.fields,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        description: "",
        fields: [],
      });
    }
  }, [model, open]);

  const addField = () => {
    if (!newField.name || !newField.type) return;
    const field: DataModelField = {
      name: newField.name,
      type: newField.type,
      mandatory: newField.mandatory,
      defaultValue: newField.defaultValue || undefined,
      description: newField.description || undefined,
      listOfValues: newField.listOfValues ? newField.listOfValues.split(',').map(v => v.trim()) : undefined,
    };
    setFormData({ ...formData, fields: [...formData.fields, field] });
    setNewField({ name: "", type: "", mandatory: false, defaultValue: "", description: "", listOfValues: "" });
  };

  const removeField = (index: number) => {
    setFormData({ ...formData, fields: formData.fields.filter((_, i) => i !== index) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? "Edit Data Model" : "Add Data Model"}</DialogTitle>
          <DialogDescription>
            {model ? "Update the data model details and fields." : "Create a new data model with fields."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model-id">ID</Label>
              <Input
                id="model-id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., fixture"
                data-testid="input-model-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-name">Name</Label>
              <Input
                id="model-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fixture"
                data-testid="input-model-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model-description">Description</Label>
            <Textarea
              id="model-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the data model..."
              rows={2}
              data-testid="textarea-model-description"
            />
          </div>
          
          <div className="space-y-3">
            <Label>Fields ({formData.fields.length})</Label>
            <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
              <div className="grid grid-cols-6 gap-2">
                <Input
                  placeholder="Name"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="text-sm"
                  data-testid="input-field-name"
                />
                <Input
                  placeholder="Type"
                  value={newField.type}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                  className="text-sm"
                  data-testid="input-field-type"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newField.mandatory}
                    onChange={(e) => setNewField({ ...newField, mandatory: e.target.checked })}
                    id="field-mandatory"
                  />
                  <Label htmlFor="field-mandatory" className="text-xs">Required</Label>
                </div>
                <Input
                  placeholder="Default"
                  value={newField.defaultValue}
                  onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                  className="text-sm"
                  data-testid="input-field-default"
                />
                <Input
                  placeholder="Values (comma-sep)"
                  value={newField.listOfValues}
                  onChange={(e) => setNewField({ ...newField, listOfValues: e.target.value })}
                  className="text-sm"
                  data-testid="input-field-values"
                />
                <Button size="sm" onClick={addField} data-testid="btn-add-field">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.fields.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {formData.fields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs p-2 bg-background rounded border">
                      <span className="font-mono">{field.name}</span>
                      <Badge variant="outline" className="text-xs">{field.type}</Badge>
                      {field.mandatory && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      <button
                        onClick={() => removeField(index)}
                        className="ml-auto p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(formData)} data-testid="btn-save-model">
            {model ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const widgetCategories = ['form', 'display', 'navigation', 'action', 'container', 'data', 'feedback', 'general'];

function WidgetDialog({ 
  open, 
  onOpenChange, 
  widget, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  widget: FmWidget | null;
  onSave: (data: Partial<FmWidget>) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general",
    isReusable: true,
    props: "",
    events: "",
  });

  useEffect(() => {
    if (widget) {
      setFormData({
        name: widget.name,
        description: widget.description || "",
        category: widget.category || "general",
        isReusable: widget.isReusable ?? true,
        props: Array.isArray(widget.props) ? (widget.props as string[]).join(", ") : "",
        events: Array.isArray(widget.events) ? (widget.events as string[]).join(", ") : "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        category: "general",
        isReusable: true,
        props: "",
        events: "",
      });
    }
  }, [widget, open]);

  const handleSave = () => {
    onSave({
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      isReusable: formData.isReusable,
      props: formData.props ? formData.props.split(",").map(p => p.trim()).filter(Boolean) : [],
      events: formData.events ? formData.events.split(",").map(e => e.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{widget ? "Edit Widget" : "Add Widget"}</DialogTitle>
          <DialogDescription>
            {widget ? "Update the widget details." : "Create a new reusable UI component to track across screens."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="widget-name">Name</Label>
            <Input
              id="widget-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., DataTable, SearchBar, PlayerCard"
              data-testid="input-widget-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="widget-category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger id="widget-category" data-testid="select-widget-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {widgetCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isReusable}
                  onChange={(e) => setFormData({ ...formData, isReusable: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Reusable component</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="widget-description">Description</Label>
            <Textarea
              id="widget-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the widget's purpose and usage..."
              rows={2}
              data-testid="textarea-widget-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widget-props">Props (comma-separated)</Label>
            <Input
              id="widget-props"
              value={formData.props}
              onChange={(e) => setFormData({ ...formData, props: e.target.value })}
              placeholder="e.g., data, columns, onRowClick, isLoading"
              data-testid="input-widget-props"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widget-events">Events (comma-separated)</Label>
            <Input
              id="widget-events"
              value={formData.events}
              onChange={(e) => setFormData({ ...formData, events: e.target.value })}
              placeholder="e.g., onClick, onSubmit, onSelect"
              data-testid="input-widget-events"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="btn-save-widget">
            {widget ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const sizeOptions = ['S', 'M', 'L', 'XL'] as const;
const sectionTypeOptions = ['section', 'tab', 'nested-tab', 'modal', 'drawer', 'dropdown'] as const;
const pageSectionOptions = ['home', 'team', 'club', 'devops'] as const;

function RequirementDialog({ 
  open, 
  onOpenChange, 
  requirement, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  requirement: APIPageRequirement | null;
  onSave: (data: Partial<APIPageRequirement>) => void;
}) {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    route: "",
    section: "home" as string,
    overview: "",
    parentId: "",
  });

  useEffect(() => {
    if (requirement) {
      setFormData({
        id: requirement.id,
        title: requirement.title,
        route: requirement.route || "",
        section: requirement.section || "home",
        overview: requirement.overview || "",
        parentId: requirement.parentId || "",
      });
    } else {
      setFormData({
        id: "",
        title: "",
        route: "",
        section: "home",
        overview: "",
        parentId: "",
      });
    }
  }, [requirement, open]);

  const handleSave = () => {
    onSave({
      id: formData.id,
      title: formData.title,
      route: formData.route || undefined,
      section: formData.section as 'home' | 'team' | 'club' | 'devops',
      overview: formData.overview || undefined,
      parentId: formData.parentId || undefined,
      functionalRequirements: requirement?.functionalRequirements || [],
      acceptanceCriteria: requirement?.acceptanceCriteria || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{requirement ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
          <DialogDescription>
            {requirement ? "Update the page requirement details." : "Create a new page/screen requirement."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="req-id">ID</Label>
              <Input
                id="req-id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., dashboard"
                disabled={!!requirement}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-section">Section</Label>
              <Select value={formData.section} onValueChange={(v) => setFormData({ ...formData, section: v })}>
                <SelectTrigger id="req-section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {pageSectionOptions.map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-title">Title</Label>
            <Input
              id="req-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Dashboard Overview"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-route">Route</Label>
            <Input
              id="req-route"
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              placeholder="e.g., /dashboard"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-parent">Parent ID (optional)</Label>
            <Input
              id="req-parent"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              placeholder="e.g., home for nested pages"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-overview">Overview</Label>
            <Textarea
              id="req-overview"
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              placeholder="Brief description of this page/screen..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            {requirement ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
const workItemStatusOptions = ['new', 'defined', 'in_progress', 'qc', 'complete'] as const;
const workItemPriorityOptions = ['low', 'medium', 'high', 'critical'] as const;

function WorkItemDialog({ 
  open, 
  onOpenChange, 
  workItem, 
  onSave,
  pages,
  widgets
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  workItem: WorkItem | null;
  onSave: (data: Partial<WorkItem>) => void;
  pages: { id: string; title: string }[];
  widgets: { id: string; name: string }[];
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "new" as string,
    priority: "medium" as string,
    assignedTo: "",
    priorityRank: "" as string,
    size: "" as string,
    effort: "" as string,
    pageId: "" as string,
    widgetId: "" as string,
    sectionTitle: "",
    sectionOrder: "" as string,
    sectionType: "" as string,
  });

  useEffect(() => {
    if (workItem) {
      setFormData({
        title: workItem.title,
        description: workItem.description || "",
        status: workItem.status || "new",
        priority: workItem.priority || "medium",
        assignedTo: workItem.assignedTo || "",
        priorityRank: workItem.priorityRank?.toString() || "",
        size: workItem.size || "",
        effort: workItem.effort?.toString() || "",
        pageId: workItem.pageId || "",
        widgetId: workItem.widgetId || "",
        sectionTitle: workItem.sectionTitle || "",
        sectionOrder: workItem.sectionOrder?.toString() || "",
        sectionType: workItem.sectionType || "",
      });
    }
  }, [workItem, open]);

  const handleSave = () => {
    onSave({
      title: formData.title,
      description: formData.description || null,
      status: formData.status || null,
      priority: formData.priority || null,
      assignedTo: formData.assignedTo || null,
      priorityRank: formData.priorityRank ? parseInt(formData.priorityRank) : null,
      size: formData.size || null,
      effort: formData.effort ? parseInt(formData.effort) : null,
      pageId: formData.pageId || null,
      widgetId: formData.widgetId || null,
      sectionTitle: formData.sectionTitle || null,
      sectionOrder: formData.sectionOrder ? parseInt(formData.sectionOrder) : null,
      sectionType: formData.sectionType || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Work Item: {workItem?.id}</DialogTitle>
          <DialogDescription>
            Update work item details including assignment, estimation, and section placement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="wi-title">Title</Label>
            <Input
              id="wi-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              data-testid="input-wi-title"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wi-status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger id="wi-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {workItemStatusOptions.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wi-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger id="wi-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {workItemPriorityOptions.map(p => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wi-assigned">Assigned To</Label>
              <Input
                id="wi-assigned"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Username"
              />
            </div>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Estimation</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wi-priority-rank">Priority Rank</Label>
                <Input
                  id="wi-priority-rank"
                  type="number"
                  value={formData.priorityRank}
                  onChange={(e) => setFormData({ ...formData, priorityRank: e.target.value })}
                  placeholder="Sprint order"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wi-size">Size</Label>
                <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                  <SelectTrigger id="wi-size">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {sizeOptions.map(s => (
                      <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wi-effort">Effort (hours)</Label>
                <Input
                  id="wi-effort"
                  type="number"
                  value={formData.effort}
                  onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
                  placeholder="Hours"
                />
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Section Placement</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wi-page">Screen/Page</Label>
                <Select value={formData.pageId} onValueChange={(v) => setFormData({ ...formData, pageId: v })}>
                  <SelectTrigger id="wi-page">
                    <SelectValue placeholder="Select screen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {pages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wi-widget">Widget</Label>
                <Select value={formData.widgetId} onValueChange={(v) => setFormData({ ...formData, widgetId: v })}>
                  <SelectTrigger id="wi-widget">
                    <SelectValue placeholder="Select widget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {widgets.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="wi-section-title">Section Title</Label>
                <Input
                  id="wi-section-title"
                  value={formData.sectionTitle}
                  onChange={(e) => setFormData({ ...formData, sectionTitle: e.target.value })}
                  placeholder="e.g., Header, Actions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wi-section-order">Order</Label>
                <Input
                  id="wi-section-order"
                  type="number"
                  value={formData.sectionOrder}
                  onChange={(e) => setFormData({ ...formData, sectionOrder: e.target.value })}
                  placeholder="0, 10, 20..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wi-section-type">Section Type</Label>
                <Select value={formData.sectionType} onValueChange={(v) => setFormData({ ...formData, sectionType: v })}>
                  <SelectTrigger id="wi-section-type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {sectionTypeOptions.map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 border-t pt-4 mt-2">
            <Label htmlFor="wi-description">Description</Label>
            <Textarea
              id="wi-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="btn-save-workitem">
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestCaseDialog({ 
  open, 
  onOpenChange, 
  onSave,
  existingTCs,
  frs
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: string; title: string; description?: string; steps?: string; expectedResult?: string; parentId?: string }) => void;
  existingTCs: number;
  frs: { id: string; title: string }[];
}) {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    steps: "",
    expectedResult: "",
    parentId: "",
  });

  useEffect(() => {
    if (open) {
      const nextId = `TC-${String(existingTCs + 1).padStart(3, '0')}`;
      setFormData({
        id: nextId,
        title: "",
        description: "",
        steps: "",
        expectedResult: "",
        parentId: "",
      });
    }
  }, [open, existingTCs]);

  const handleSave = () => {
    if (!formData.id || !formData.title) return;
    onSave({
      id: formData.id,
      title: formData.title,
      description: formData.description || undefined,
      steps: formData.steps || undefined,
      expectedResult: formData.expectedResult || undefined,
      parentId: formData.parentId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Test Case</DialogTitle>
          <DialogDescription>
            Create a new test case. Link it to a functional requirement for traceability.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tc-id">TC ID</Label>
              <Input
                id="tc-id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., TC-009"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tc-fr">Linked FR (optional)</Label>
              <Select value={formData.parentId} onValueChange={(v) => setFormData({ ...formData, parentId: v })}>
                <SelectTrigger id="tc-fr">
                  <SelectValue placeholder="Select FR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {frs.map(fr => (
                    <SelectItem key={fr.id} value={fr.id}>{fr.id} - {fr.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tc-title">Title</Label>
            <Input
              id="tc-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Verify login with valid credentials"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tc-description">Description</Label>
            <Textarea
              id="tc-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this test verifies..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tc-steps">Steps (one per line)</Label>
            <Textarea
              id="tc-steps"
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              placeholder="Navigate to login page&#10;Enter valid username&#10;Enter valid password&#10;Click login button"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tc-expected">Expected Result</Label>
            <Textarea
              id="tc-expected"
              value={formData.expectedResult}
              onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
              placeholder="User is logged in and redirected to dashboard"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!formData.id || !formData.title}>
            Create TC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestRunDialog({ 
  open, 
  onOpenChange, 
  onSave,
  existingRuns
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; date?: string; testers?: string[]; buildInfo?: string; notes?: string }) => void;
  existingRuns: number;
}) {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    testers: "",
    buildInfo: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      setFormData({
        name: `Test Run ${existingRuns + 1}`,
        date: today,
        testers: "",
        buildInfo: "",
        notes: "",
      });
    }
  }, [open, existingRuns]);

  const handleSave = () => {
    if (!formData.name) return;
    onSave({
      name: formData.name,
      date: formData.date || undefined,
      testers: formData.testers ? formData.testers.split(',').map(t => t.trim()) : undefined,
      buildInfo: formData.buildInfo || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Test Run</DialogTitle>
          <DialogDescription>
            Create a new test run to track test execution results.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tr-name">Name</Label>
            <Input
              id="tr-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sprint 5 Regression"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tr-date">Date</Label>
              <Input
                id="tr-date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="MM-DD-YYYY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-build">Build Info</Label>
              <Input
                id="tr-build"
                value={formData.buildInfo}
                onChange={(e) => setFormData({ ...formData, buildInfo: e.target.value })}
                placeholder="e.g., v1.2.0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tr-testers">Testers (comma-separated)</Label>
            <Input
              id="tr-testers"
              value={formData.testers}
              onChange={(e) => setFormData({ ...formData, testers: e.target.value })}
              placeholder="e.g., John, Jane, QA Team"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tr-notes">Notes</Label>
            <Textarea
              id="tr-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this test run..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!formData.name}>
            Create Test Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Requirements() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<PageRequirements | null>(null);
  const [selectedFrId, setSelectedFrId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<DataModel | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [changeLogDialogOpen, setChangeLogDialogOpen] = useState(false);
  const [editingChangeLog, setEditingChangeLog] = useState<APIChangeLogEntry | null>(null);
  const [dataModelDialogOpen, setDataModelDialogOpen] = useState(false);
  const [editingDataModel, setEditingDataModel] = useState<DataModel | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'changelog' | 'datamodel' | 'requirement' | 'widget'; item: any } | null>(null);
  const [activeTab, setActiveTab] = useState("changelog");
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const [requirementDialogOpen, setRequirementDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<APIPageRequirement | null>(null);
  const [editingWidget, setEditingWidget] = useState<FmWidget | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<FmWidget | null>(null);
  const [widgetSheetOpen, setWidgetSheetOpen] = useState(false);
  const [workItemDialogOpen, setWorkItemDialogOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [testRunDialogOpen, setTestRunDialogOpen] = useState(false);
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set());
  const [expandedWorkItems, setExpandedWorkItems] = useState<Set<string>>(new Set());
  const [expandedHierarchyNodes, setExpandedHierarchyNodes] = useState<Set<string>>(new Set(['EPOCH-001'])); // Start with first epoch expanded
  const [testCaseFilter, setTestCaseFilter] = useState<TestCase['status'] | 'all'>('all');
  const [workItemTypeFilter, setWorkItemTypeFilter] = useState<string>('all');
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    return localStorage.getItem('fm_selected_app') || 'gamescope';
  });

  const handleAppChange = (appId: string) => {
    setSelectedAppId(appId);
    localStorage.setItem('fm_selected_app', appId);
  };

  const sections: PageRequirements['section'][] = ['home', 'team', 'club', 'devops'];
  
  const toggleTestCase = (id: string) => {
    setExpandedTestCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleWorkItem = (id: string) => {
    setExpandedWorkItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleHierarchyNode = (id: string) => {
    setExpandedHierarchyNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Fetch apps for app selector
  const { data: fmApps = [] } = useQuery<FmApp[]>({
    queryKey: ['/api/fm/apps'],
  });

  // Fetch widgets for the selected app
  const { data: fmWidgets = [], refetch: refetchWidgets } = useQuery<FmWidget[]>({
    queryKey: ['/api/fm/widgets', selectedAppId],
    queryFn: async () => {
      const res = await fetch(`/api/fm/widgets?appId=${selectedAppId}`);
      return res.json();
    },
    enabled: !!selectedAppId,
  });

  // Fetch data from API with fallback to hardcoded data
  const { data: apiRequirements = [], isLoading: reqLoading, refetch: refetchReqs } = useQuery<APIPageRequirement[]>({
    queryKey: ['/api/devops/requirements'],
  });

  const { data: apiDataModels = [], isLoading: modelsLoading, refetch: refetchModels } = useQuery<APIDataModel[]>({
    queryKey: ['/api/devops/data-models'],
  });

  const { data: apiChangeLog = [], isLoading: changeLogLoading, refetch: refetchChangeLog } = useQuery<APIChangeLogEntry[]>({
    queryKey: ['/api/devops/changelog'],
  });

  // Fetch unified work items
  const { data: workItems = [], isLoading: workItemsLoading, refetch: refetchWorkItems } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items'],
  });

  const { data: workItemLinks = [], refetch: refetchWorkItemLinks } = useQuery<WorkItemLink[]>({
    queryKey: ['/api/work-item-links'],
  });

  // Fetch test runs
  const { data: testRuns = [], isLoading: testRunsLoading, refetch: refetchTestRuns } = useQuery<TestRun[]>({
    queryKey: ['/api/test-runs'],
  });

  // State for expanded test runs
  const [expandedTestRuns, setExpandedTestRuns] = useState<Set<string>>(new Set());

  const toggleTestRun = (id: string) => {
    setExpandedTestRuns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Extract test cases from work items
  const workItemTestCases = workItems.filter(item => item.type === 'test_case');
  const workItemBugs = workItems.filter(item => item.type === 'bug');
  const workItemEnhancements = workItems.filter(item => item.type === 'enhancement');

  // Convert work item to test case format for display
  const workItemToTestCase = (item: WorkItem): TestCase => ({
    id: item.id,
    title: item.title,
    objective: item.description || '',
    steps: Array.isArray(item.steps) ? item.steps : [],
    expectedResult: item.expectedResult || '',
    actualResult: item.actualResult || '',
    status: item.status as TestCase['status'],
    tester: item.tester || '',
    date: item.date || '',
    associatedBug: workItemLinks.find(link => link.sourceId === item.id)?.targetId || undefined,
    component: item.area || undefined,
  });

  // Use work items for test cases if available, fallback to hardcoded
  const testCaseData = workItemTestCases.length > 0 
    ? workItemTestCases.map(workItemToTestCase) 
    : hardcodedTestCases;
  
  const filteredTestCases = testCaseFilter === 'all' 
    ? testCaseData 
    : testCaseData.filter(tc => tc.status === testCaseFilter);
  
  const testCaseSummary = {
    total: testCaseData.length,
    passed: testCaseData.filter(tc => tc.status === 'passed').length,
    failed: testCaseData.filter(tc => tc.status === 'failed').length,
    partial: testCaseData.filter(tc => tc.status === 'partial').length,
    blocked: testCaseData.filter(tc => tc.status === 'blocked').length,
  };

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/devops/seed');
    },
    onSuccess: () => {
      toast({ title: "Data seeded successfully" });
      refetchReqs();
      refetchModels();
      refetchChangeLog();
    },
    onError: () => {
      toast({ title: "Failed to seed data", variant: "destructive" });
    },
  });

  // Use API data if available, otherwise fallback to hardcoded
  const requirementsData = apiRequirements.length > 0 ? apiRequirements : requirementsRegistry;
  const dataModelsData = apiDataModels.length > 0 ? apiDataModels : hardcodedDataModels;
  const changeLogData = apiChangeLog.length > 0 ? apiChangeLog : hardcodedChangeLog.map(e => ({ ...e, type: e.type as ChangeLogType }));

  // Build hierarchy tree from work items (must be after requirementsData is defined)
  const hierarchyTree = useMemo(() => buildHierarchyTree(workItems, requirementsData), [workItems, requirementsData]);

  // Mutations for CRUD
  const createChangeLogMutation = useMutation({
    mutationFn: async (data: Partial<APIChangeLogEntry>) => {
      await apiRequest('POST', '/api/devops/changelog', { ...data, appId: selectedAppId });
    },
    onSuccess: () => {
      toast({ title: "Change log entry created" });
      refetchChangeLog();
      setChangeLogDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create entry", variant: "destructive" });
    },
  });

  const updateChangeLogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<APIChangeLogEntry> }) => {
      await apiRequest('PATCH', `/api/devops/changelog/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Change log entry updated" });
      refetchChangeLog();
      setChangeLogDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update entry", variant: "destructive" });
    },
  });

  const deleteChangeLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/devops/changelog/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Change log entry deleted" });
      refetchChangeLog();
    },
    onError: () => {
      toast({ title: "Failed to delete entry", variant: "destructive" });
    },
  });

  const createDataModelMutation = useMutation({
    mutationFn: async (data: Partial<DataModel>) => {
      await apiRequest('POST', '/api/devops/data-models', data);
    },
    onSuccess: () => {
      toast({ title: "Data model created" });
      refetchModels();
      setDataModelDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create data model", variant: "destructive" });
    },
  });

  const updateDataModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DataModel> }) => {
      await apiRequest('PATCH', `/api/devops/data-models/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Data model updated" });
      refetchModels();
      setDataModelDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update data model", variant: "destructive" });
    },
  });

  const deleteDataModelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/devops/data-models/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Data model deleted" });
      refetchModels();
    },
    onError: () => {
      toast({ title: "Failed to delete data model", variant: "destructive" });
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: Partial<APIPageRequirement>) => {
      await apiRequest('POST', '/api/devops/requirements', data);
    },
    onSuccess: () => {
      toast({ title: "Requirement created" });
      refetchReqs();
      setRequirementDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create requirement", variant: "destructive" });
    },
  });

  const updateRequirementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<APIPageRequirement> }) => {
      await apiRequest('PATCH', `/api/devops/requirements/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Requirement updated" });
      refetchReqs();
      setRequirementDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update requirement", variant: "destructive" });
    },
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/devops/requirements/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Requirement deleted" });
      refetchReqs();
    },
    onError: () => {
      toast({ title: "Failed to delete requirement", variant: "destructive" });
    },
  });

  const createWidgetMutation = useMutation({
    mutationFn: async (data: Partial<FmWidget>) => {
      await apiRequest('POST', '/api/fm/widgets', { ...data, appId: selectedAppId });
    },
    onSuccess: () => {
      toast({ title: "Widget created" });
      refetchWidgets();
      setWidgetDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create widget", variant: "destructive" });
    },
  });

  const updateWidgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FmWidget> }) => {
      await apiRequest('PATCH', `/api/fm/widgets/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Widget updated" });
      refetchWidgets();
      setWidgetDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update widget", variant: "destructive" });
    },
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/fm/widgets/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Widget deleted" });
      refetchWidgets();
    },
    onError: () => {
      toast({ title: "Failed to delete widget", variant: "destructive" });
    },
  });

  const updateWorkItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkItem> }) => {
      await apiRequest('PATCH', `/api/work-items/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Work item updated" });
      refetchWorkItems();
      setWorkItemDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update work item", variant: "destructive" });
    },
  });

  // Work item type conversion mutation
  const convertWorkItemMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      await apiRequest('POST', `/api/work-items/${id}/convert`, { type });
    },
    onSuccess: () => {
      toast({ title: "Work item type converted" });
      refetchWorkItems();
    },
    onError: () => {
      toast({ title: "Failed to convert work item type", variant: "destructive" });
    },
  });

  // Create test case mutation
  const createTestCaseMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description?: string; steps?: string; expectedResult?: string; parentId?: string }) => {
      await apiRequest('POST', '/api/work-items', {
        ...data,
        type: 'test_case',
        appId: selectedAppId,
        status: 'new',
      });
    },
    onSuccess: () => {
      toast({ title: "Test case created" });
      refetchWorkItems();
      setTestCaseDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create test case", variant: "destructive" });
    },
  });

  // Create test run mutation
  const createTestRunMutation = useMutation({
    mutationFn: async (data: { name: string; date?: string; testers?: string[]; buildInfo?: string; notes?: string }) => {
      const existingRuns = testRuns || [];
      const nextRunNumber = existingRuns.length > 0 
        ? Math.max(...existingRuns.map(r => r.runNumber || 0)) + 1 
        : 1;
      await apiRequest('POST', '/api/test-runs', {
        ...data,
        appId: selectedAppId,
        runNumber: nextRunNumber,
        status: 'planned',
      });
    },
    onSuccess: () => {
      toast({ title: "Test run created" });
      refetchTestRuns();
      setTestRunDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create test run", variant: "destructive" });
    },
  });

  // Helper to get linked items for a work item
  const getLinkedItemsFor = (itemId: string): WorkItem[] => {
    const linkIds = workItemLinks
      .filter(link => link.sourceId === itemId || link.targetId === itemId)
      .map(link => link.sourceId === itemId ? link.targetId : link.sourceId);
    return workItems.filter(item => linkIds.includes(item.id));
  };

  // Filter work items by type
  const filteredWorkItems = workItemTypeFilter === 'all'
    ? workItems
    : workItems.filter(item => item.type === workItemTypeFilter);

  // Work item summary
  const workItemSummary = {
    total: workItems.length,
    epochs: workItems.filter(item => item.type === 'epoch').length,
    epics: workItems.filter(item => item.type === 'epic').length,
    frs: workItems.filter(item => item.type === 'FR').length,
    acs: workItems.filter(item => item.type === 'AC').length,
    features: workItems.filter(item => item.type === 'feature').length,
    stories: workItems.filter(item => item.type === 'story').length,
    bugs: workItemBugs.length,
    enhancements: workItemEnhancements.length,
    testCases: workItemTestCases.length,
    questions: workItems.filter(item => item.type === 'question').length,
    actionItems: workItems.filter(item => item.type === 'action_item').length,
  };

  const filteredRegistry = useMemo(() => {
    if (!searchQuery.trim()) return requirementsData;
    
    const query = searchQuery.toLowerCase();
    return requirementsData.filter(page => {
      const matchesTitle = page.title.toLowerCase().includes(query);
      const matchesRoute = page.route.toLowerCase().includes(query);
      const fr = page.functionalRequirements as Array<{ id: string; title: string; description: string }>;
      const ac = page.acceptanceCriteria as Array<{ id: string; description: string }>;
      const matchesFR = fr.some(
        req => req.id.toLowerCase().includes(query) || 
              req.title.toLowerCase().includes(query) ||
              req.description.toLowerCase().includes(query)
      );
      const matchesAC = ac.some(
        item => item.id.toLowerCase().includes(query) || 
              item.description.toLowerCase().includes(query)
      );
      return matchesTitle || matchesRoute || matchesFR || matchesAC;
    });
  }, [searchQuery, requirementsData]);

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

  const handleSelectPage = (page: PageRequirements, frId?: string) => {
    setSelectedPage(page);
    setSelectedFrId(frId || null);
    setSheetOpen(true);
  };

  const handleEditPage = (page: PageRequirements) => {
    toast({ title: "Edit epic requirements", description: "Full epic editing coming soon" });
  };

  const handleDeletePage = (page: PageRequirements) => {
    setItemToDelete({ type: 'requirement', item: page });
    setDeleteConfirmOpen(true);
  };

  const handleSelectModel = (model: DataModel) => {
    setSelectedModel(model);
    setModelSheetOpen(true);
  };

  const handleEditModel = (model: DataModel) => {
    setEditingDataModel(model);
    setDataModelDialogOpen(true);
  };

  const handleDeleteModel = (model: DataModel) => {
    setItemToDelete({ type: 'datamodel', item: model });
    setDeleteConfirmOpen(true);
  };

  const handleEditChangeLog = (entry: APIChangeLogEntry) => {
    setEditingChangeLog(entry);
    setChangeLogDialogOpen(true);
  };

  const handleDeleteChangeLog = (entry: APIChangeLogEntry) => {
    setItemToDelete({ type: 'changelog', item: entry });
    setDeleteConfirmOpen(true);
  };

  const handleSaveChangeLog = (data: Partial<APIChangeLogEntry>) => {
    if (editingChangeLog) {
      updateChangeLogMutation.mutate({ id: editingChangeLog.id, data });
    } else {
      createChangeLogMutation.mutate(data);
    }
  };

  const handleSaveDataModel = (data: Partial<DataModel>) => {
    if (editingDataModel) {
      updateDataModelMutation.mutate({ id: editingDataModel.id, data });
    } else {
      createDataModelMutation.mutate(data);
    }
  };

  const handleSelectWidget = (widget: FmWidget) => {
    setSelectedWidget(widget);
    setWidgetSheetOpen(true);
  };

  const handleEditWidget = (widget: FmWidget) => {
    setEditingWidget(widget);
    setWidgetDialogOpen(true);
  };

  const handleDeleteWidget = (widget: FmWidget) => {
    setItemToDelete({ type: 'widget', item: widget });
    setDeleteConfirmOpen(true);
  };

  const handleSaveWidget = (data: Partial<FmWidget>) => {
    if (editingWidget) {
      updateWidgetMutation.mutate({ id: editingWidget.id, data });
    } else {
      createWidgetMutation.mutate(data);
    }
  };

  const handleSaveRequirement = (data: Partial<APIPageRequirement>) => {
    if (editingRequirement) {
      updateRequirementMutation.mutate({ id: editingRequirement.id, data });
    } else {
      createRequirementMutation.mutate(data);
    }
  };

  const handleSelectWorkItem = (item: WorkItem) => {
    setSelectedWorkItem(item);
    setWorkItemDialogOpen(true);
  };

  const handleSaveWorkItem = (data: Partial<WorkItem>) => {
    if (selectedWorkItem) {
      updateWorkItemMutation.mutate({ id: selectedWorkItem.id, data });
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    switch (itemToDelete.type) {
      case 'changelog':
        deleteChangeLogMutation.mutate(itemToDelete.item.id);
        break;
      case 'datamodel':
        deleteDataModelMutation.mutate(itemToDelete.item.id);
        break;
      case 'requirement':
        deleteRequirementMutation.mutate(itemToDelete.item.id);
        break;
      case 'widget':
        deleteWidgetMutation.mutate(itemToDelete.item.id);
        break;
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const totalPages = requirementsData.length;
  const totalFRs = requirementsData.reduce(
    (acc, page) => acc + (page.functionalRequirements as any[]).length,
    0
  );
  const totalACs = requirementsData.reduce(
    (acc, page) => acc + (page.acceptanceCriteria as any[]).length,
    0
  );

  const issueTypes = ['bug', 'enhancement', 'question', 'action_item'];
  const issues = changeLogData.filter(e => issueTypes.includes(e.type));
  const regularChanges = changeLogData.filter(e => !issueTypes.includes(e.type));

  const isLoading = reqLoading || modelsLoading || changeLogLoading || workItemsLoading;
  const hasNoData = apiRequirements.length === 0 && apiDataModels.length === 0 && apiChangeLog.length === 0;

  return (
    <MainLayout title="Feature Management" subtitle="View and manage epic requirements and documentation">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <AppWindow className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedAppId} onValueChange={handleAppChange}>
              <SelectTrigger className="w-[180px]" data-testid="select-app">
                <SelectValue placeholder="Select app" />
              </SelectTrigger>
              <SelectContent>
                {fmApps.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 items-center">
            {hasNoData && !isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                data-testid="btn-seed-data"
              >
                {seedMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Load Initial Data
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Design"
            value={`${sections.length}-${totalPages}-${workItems.filter(w => w.type?.toLowerCase() === 'epic' && w.appId === selectedAppId).length}`}
            icon={PenTool}
            iconColor="text-purple-600"
            subtitle="Sections-Pages-Epics"
          />
          <StatsCard
            title="Features"
            value={`${workItems.filter(w => w.type?.toUpperCase() === 'FR' && w.appId === selectedAppId).length}-${workItems.filter(w => w.type?.toUpperCase() === 'AC' && w.appId === selectedAppId).length}`}
            icon={Layers}
            iconColor="text-blue-600"
            subtitle="FRs-ACs"
          />
          <StatsCard
            title="Testing"
            value={`${testCaseData.length}-${testRuns.length}-${workItems.filter(w => w.type?.toLowerCase() === 'bug' && w.status !== 'closed' && w.appId === selectedAppId).length}`}
            icon={FlaskConical}
            iconColor="text-teal-600"
            subtitle="TCs-Runs-Open Bugs"
          />
          <StatsCard
            title="Release"
            value="—"
            icon={Rocket}
            iconColor="text-orange-600"
            subtitle="Coming soon"
          />
        </div>

        <h2 className="text-lg font-semibold">Pages</h2>
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
                        onEdit={handleEditPage}
                        onDelete={handleDeletePage}
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

        <Card data-testid="card-requirements-spreadsheet">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-emerald-500">
                <TableIcon className="h-4 w-4 text-white" />
              </div>
              <span>Functional Requirements</span>
              <div className="flex gap-2 items-center ml-auto">
                <Badge variant="secondary" className="text-xs">
                  {totalFRs} FRs
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {totalACs} ACs
                </Badge>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingRequirement(null);
                  setRequirementDialogOpen(true);
                }}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Complete list of all Functional Requirements and Acceptance Criteria across the application</p>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="fr" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="fr" data-testid="tab-fr-spreadsheet">
                  Functional Requirements ({totalFRs})
                </TabsTrigger>
                <TabsTrigger value="ac" data-testid="tab-ac-spreadsheet">
                  Acceptance Criteria ({totalACs})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="fr">
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] sticky top-0 bg-background">Section</TableHead>
                          <TableHead className="w-[150px] sticky top-0 bg-background">Epic</TableHead>
                          <TableHead className="w-[100px] sticky top-0 bg-background">ID</TableHead>
                          <TableHead className="w-[180px] sticky top-0 bg-background">Title</TableHead>
                          <TableHead className="w-[60px] sticky top-0 bg-background text-center">ACs</TableHead>
                          <TableHead className="w-[100px] sticky top-0 bg-background">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requirementsData.flatMap((epic) => 
                          (epic.functionalRequirements as Array<{ id: string; title: string; description: string; status?: string }>).map((fr) => {
                            const allACs = epic.acceptanceCriteria as Array<{ id: string; parentFrId?: string }>;
                            const acCount = allACs.filter(ac => ac.parentFrId === fr.id).length;
                            return (
                            <TableRow key={`${epic.id}-${fr.id}`} data-testid={`row-fr-${fr.id}`}>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {epic.section}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm font-medium">{epic.title}</TableCell>
                              <TableCell>
                                <button
                                  className="font-mono text-xs text-primary hover:underline cursor-pointer"
                                  onClick={() => handleSelectPage(epic, fr.id)}
                                  data-testid={`btn-open-fr-${fr.id}`}
                                >
                                  {fr.id}
                                </button>
                              </TableCell>
                              <TableCell className="text-sm">{fr.title}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={acCount > 0 ? "default" : "outline"} className="text-xs">
                                  {acCount}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {fr.status || 'New'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );})
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </TabsContent>
              <TabsContent value="ac">
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] sticky top-0 bg-background">Section</TableHead>
                          <TableHead className="w-[150px] sticky top-0 bg-background">Epic</TableHead>
                          <TableHead className="w-[120px] sticky top-0 bg-background">ID</TableHead>
                          <TableHead className="sticky top-0 bg-background">Description</TableHead>
                          <TableHead className="w-[100px] sticky top-0 bg-background">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requirementsData.flatMap((epic) => 
                          (epic.acceptanceCriteria as Array<{ id: string; description: string; status?: string }>).map((ac) => (
                            <TableRow key={`${epic.id}-${ac.id}`} data-testid={`row-ac-${ac.id}`}>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {epic.section}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm font-medium">{epic.title}</TableCell>
                              <TableCell>
                                <button
                                  className="font-mono text-xs text-primary hover:underline cursor-pointer"
                                  onClick={() => handleSelectPage(epic)}
                                  data-testid={`btn-open-ac-${ac.id}`}
                                >
                                  {ac.id}
                                </button>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{ac.description}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {ac.status || 'New'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card data-testid="card-datamodels">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-indigo-500">
                <Database className="h-4 w-4 text-white" />
              </div>
              <span>Data Models</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {dataModelsData.length} objects
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingDataModel(null); setDataModelDialogOpen(true); }}
                data-testid="btn-add-datamodel"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataModelsData.map((model) => (
                <DataModelCard 
                  key={model.id} 
                  model={model} 
                  onSelect={handleSelectModel}
                  onEdit={handleEditModel}
                  onDelete={handleDeleteModel}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-widgets">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-violet-500">
                <Component className="h-4 w-4 text-white" />
              </div>
              <span>Widgets</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {fmWidgets.length} components
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingWidget(null); setWidgetDialogOpen(true); }}
                data-testid="btn-add-widget"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Reusable UI components tracked across screens</p>
          </CardHeader>
          <CardContent className="pt-0">
            {fmWidgets.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fmWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleSelectWidget(widget)}
                    data-testid={`widget-${widget.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{widget.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{widget.description}</div>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">{widget.category || 'general'}</Badge>
                          {widget.isReusable && <Badge className="text-xs bg-green-100 text-green-700">Reusable</Badge>}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleEditWidget(widget); }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget); }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No widgets defined yet. Add reusable components to track them across screens.</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-testruns">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-indigo-600">
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              <span>Test Runs</span>
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary" className="text-xs">
                  {testRuns.length} runs
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestRunDialogOpen(true)}
                  className="h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Test executions against specific builds with individual outcomes</p>
          </CardHeader>
          <CardContent className="pt-0">
            {testRunsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : testRuns.length > 0 ? (
              <div className="space-y-2">
                {testRuns.map((run) => (
                  <TestRunItem
                    key={run.id}
                    run={run}
                    expanded={expandedTestRuns.has(run.id)}
                    onToggle={() => toggleTestRun(run.id)}
                    testCases={testCaseData}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No test runs recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-testcases">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-teal-500">
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              <span>Test Cases</span>
              <div className="flex gap-2 ml-auto">
                <Badge className="bg-green-100 text-green-700">{testCaseSummary.passed} Passed</Badge>
                <Badge className="bg-red-100 text-red-700">{testCaseSummary.failed} Failed</Badge>
                {testCaseSummary.partial > 0 && <Badge className="bg-yellow-100 text-yellow-700">{testCaseSummary.partial} Partial</Badge>}
                {testCaseSummary.blocked > 0 && <Badge className="bg-gray-100 text-gray-700">{testCaseSummary.blocked} Blocked</Badge>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestCaseDialogOpen(true)}
                  className="h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-4">
              <Button
                variant={testCaseFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestCaseFilter('all')}
                data-testid="btn-filter-all"
              >
                All ({testCaseSummary.total})
              </Button>
              <Button
                variant={testCaseFilter === 'passed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestCaseFilter('passed')}
                className={testCaseFilter === 'passed' ? '' : 'text-green-600'}
                data-testid="btn-filter-passed"
              >
                <Check className="h-3 w-3 mr-1" />
                Passed
              </Button>
              <Button
                variant={testCaseFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestCaseFilter('failed')}
                className={testCaseFilter === 'failed' ? '' : 'text-red-600'}
                data-testid="btn-filter-failed"
              >
                <X className="h-3 w-3 mr-1" />
                Failed
              </Button>
              <Button
                variant={testCaseFilter === 'partial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestCaseFilter('partial')}
                className={testCaseFilter === 'partial' ? '' : 'text-yellow-600'}
                data-testid="btn-filter-partial"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Partial
              </Button>
            </div>
            <div className="space-y-2">
              {filteredTestCases.map((tc) => (
                <TestCaseItem
                  key={tc.id}
                  testCase={tc}
                  expanded={expandedTestCases.has(tc.id)}
                  onToggle={() => toggleTestCase(tc.id)}
                />
              ))}
              {filteredTestCases.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No test cases match the filter</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-hierarchy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span>Requirements Hierarchy</span>
              <div className="flex gap-2 ml-auto flex-wrap">
                <Badge className="bg-slate-100 text-slate-700">4 Sections</Badge>
                <Badge className="bg-emerald-100 text-emerald-700">{requirementsData.length} Pages</Badge>
                <Badge className="bg-indigo-100 text-indigo-700">{workItemSummary.epics} Epics</Badge>
                <Badge className="bg-blue-100 text-blue-700">{workItemSummary.frs} FRs</Badge>
                <Badge className="bg-sky-100 text-sky-700">{workItemSummary.acs} ACs</Badge>
                <Badge className="bg-teal-100 text-teal-700">{workItemSummary.testCases} TCs</Badge>
                <Badge className="bg-rose-100 text-rose-700">{workItemSummary.bugs} Bugs</Badge>
              </div>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Click + to expand: Section → Page → Epic → FR → AC/TC/Bug</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border rounded-lg p-2 bg-muted/20">
              {hierarchyTree.length > 0 ? (
                hierarchyTree.map(node => (
                  <HierarchyTreeNode
                    key={node.item.id}
                    node={node}
                    expandedNodes={expandedHierarchyNodes}
                    onToggle={toggleHierarchyNode}
                    onSelectItem={handleSelectWorkItem}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No hierarchy items found. Add Epics, FRs, ACs, TCs, Bugs, or Enhancements.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-workitems">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-gradient-to-r from-rose-500 to-cyan-500">
                <ListTodo className="h-4 w-4 text-white" />
              </div>
              <span>Work Items</span>
              <div className="flex gap-2 ml-auto flex-wrap">
                <Badge className="bg-indigo-100 text-indigo-700">{workItemSummary.epics} Epics</Badge>
                <Badge className="bg-blue-100 text-blue-700">{workItemSummary.frs} FRs</Badge>
                <Badge className="bg-sky-100 text-sky-700">{workItemSummary.acs} ACs</Badge>
                <Badge className="bg-teal-100 text-teal-700">{workItemSummary.testCases} TCs</Badge>
                <Badge className="bg-rose-100 text-rose-700">{workItemSummary.bugs} Bugs</Badge>
                <Badge className="bg-cyan-100 text-cyan-700">{workItemSummary.enhancements} Enhancements</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={workItemTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('all')}
                data-testid="btn-filter-workitems-all"
              >
                All
              </Button>
              <Button
                variant={workItemTypeFilter === 'epic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('epic')}
                className={workItemTypeFilter === 'epic' ? '' : 'text-indigo-600'}
                data-testid="btn-filter-workitems-epic"
              >
                <Layers className="h-3 w-3 mr-1" />
                Epics ({workItemSummary.epics})
              </Button>
              <Button
                variant={workItemTypeFilter === 'FR' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('FR')}
                className={workItemTypeFilter === 'FR' ? '' : 'text-blue-600'}
                data-testid="btn-filter-workitems-fr"
              >
                <FileText className="h-3 w-3 mr-1" />
                FRs ({workItemSummary.frs})
              </Button>
              <Button
                variant={workItemTypeFilter === 'AC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('AC')}
                className={workItemTypeFilter === 'AC' ? '' : 'text-sky-600'}
                data-testid="btn-filter-workitems-ac"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                ACs ({workItemSummary.acs})
              </Button>
              <Button
                variant={workItemTypeFilter === 'test_case' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('test_case')}
                className={workItemTypeFilter === 'test_case' ? '' : 'text-teal-600'}
                data-testid="btn-filter-workitems-testcase"
              >
                <ClipboardList className="h-3 w-3 mr-1" />
                TCs ({workItemSummary.testCases})
              </Button>
              <Button
                variant={workItemTypeFilter === 'bug' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('bug')}
                className={workItemTypeFilter === 'bug' ? '' : 'text-rose-600'}
                data-testid="btn-filter-workitems-bug"
              >
                <Bug className="h-3 w-3 mr-1" />
                Bugs ({workItemSummary.bugs})
              </Button>
              <Button
                variant={workItemTypeFilter === 'enhancement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('enhancement')}
                className={workItemTypeFilter === 'enhancement' ? '' : 'text-cyan-600'}
                data-testid="btn-filter-workitems-enhancement"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Enhancements ({workItemSummary.enhancements})
              </Button>
            </div>
            <div className="space-y-2">
              {filteredWorkItems
                .filter(item => workItemTypeFilter !== 'all' ? true : !hierarchyTypes.includes(item.type))
                .map((item) => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  expanded={expandedWorkItems.has(item.id)}
                  onToggle={() => toggleWorkItem(item.id)}
                  onConvert={(id, newType) => convertWorkItemMutation.mutate({ id, type: newType })}
                  linkedItems={getLinkedItemsFor(item.id)}
                  isConverting={convertWorkItemMutation.isPending}
                />
              ))}
              {filteredWorkItems
                .filter(item => workItemTypeFilter !== 'all' ? true : !hierarchyTypes.includes(item.type))
                .length === 0 && (
                <p className="text-muted-foreground text-center py-8">No work items match the filter</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-changelog">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-slate-500">
                <History className="h-4 w-4 text-white" />
              </div>
              <span>Change Log & Issues</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {changeLogData.length} items
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingChangeLog(null); setChangeLogDialogOpen(true); }}
                data-testid="btn-add-changelog"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="changelog">
                  Changes ({regularChanges.length})
                </TabsTrigger>
                <TabsTrigger value="issues">
                  Issues ({issues.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="changelog">
                <div className="space-y-3">
                  {regularChanges.map((entry) => (
                    <ChangeLogItem 
                      key={entry.id} 
                      entry={entry} 
                      onEdit={handleEditChangeLog}
                      onDelete={handleDeleteChangeLog}
                    />
                  ))}
                  {regularChanges.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No change log entries yet</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="issues">
                <div className="space-y-3">
                  {issues.map((entry) => (
                    <ChangeLogItem 
                      key={entry.id} 
                      entry={entry}
                      onEdit={handleEditChangeLog}
                      onDelete={handleDeleteChangeLog}
                    />
                  ))}
                  {issues.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No issues tracked yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setSelectedFrId(null); }}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Page Details
            </SheetTitle>
            <SheetDescription className="space-y-2">
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="font-mono text-xs">
                  Section: {selectedPage?.section ? sectionTitles[selectedPage.section as keyof typeof sectionTitles] : '—'}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  Page: {selectedPage?.id || '—'}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  Epic: {selectedPage?.epicId || `EPIC-${selectedPage?.id?.replace('P-', '') || '—'}`}
                </Badge>
              </div>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 border-b pb-3">
            <h3 className="text-lg font-semibold">{selectedPage?.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{selectedPage?.overview}</p>
          </div>
          {selectedFrId && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Showing single requirement</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedFrId(null)}
                className="h-6 px-2 text-xs"
                data-testid="btn-show-all-frs"
              >
                Show all FRs
              </Button>
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-200px)] mt-4 pr-4">
            {selectedPage && <RequirementsPanel page={selectedPage} selectedFrId={selectedFrId} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={modelSheetOpen} onOpenChange={setModelSheetOpen}>
        <SheetContent className="w-[700px] sm:max-w-[700px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {selectedModel?.name}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-6 pr-4">
            {selectedModel && <DataModelPanel model={selectedModel} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ChangeLogDialog
        open={changeLogDialogOpen}
        onOpenChange={(open) => {
          setChangeLogDialogOpen(open);
          if (!open) setEditingChangeLog(null);
        }}
        entry={editingChangeLog}
        onSave={handleSaveChangeLog}
      />

      <DataModelDialog
        open={dataModelDialogOpen}
        onOpenChange={(open) => {
          setDataModelDialogOpen(open);
          if (!open) setEditingDataModel(null);
        }}
        model={editingDataModel}
        onSave={handleSaveDataModel}
      />

      <WidgetDialog
        open={widgetDialogOpen}
        onOpenChange={(open) => {
          setWidgetDialogOpen(open);
          if (!open) setEditingWidget(null);
        }}
        widget={editingWidget}
        onSave={handleSaveWidget}
      />

      <RequirementDialog
        open={requirementDialogOpen}
        onOpenChange={(open) => {
          setRequirementDialogOpen(open);
          if (!open) setEditingRequirement(null);
        }}
        requirement={editingRequirement}
        onSave={handleSaveRequirement}
      />

      <WorkItemDialog
        open={workItemDialogOpen}
        onOpenChange={(open) => {
          setWorkItemDialogOpen(open);
          if (!open) setSelectedWorkItem(null);
        }}
        workItem={selectedWorkItem}
        onSave={handleSaveWorkItem}
        pages={requirementsData.map(p => ({ id: p.id, title: p.title }))}
        widgets={fmWidgets.map(w => ({ id: w.id, name: w.name }))}
      />

      <TestCaseDialog
        open={testCaseDialogOpen}
        onOpenChange={setTestCaseDialogOpen}
        onSave={(data) => createTestCaseMutation.mutate(data)}
        existingTCs={workItemSummary.testCases}
        frs={workItems.filter(w => w.type === 'FR').map(fr => ({ id: fr.id, title: fr.title }))}
      />

      <TestRunDialog
        open={testRunDialogOpen}
        onOpenChange={setTestRunDialogOpen}
        onSave={(data) => createTestRunMutation.mutate(data)}
        existingRuns={testRuns.length}
      />

      <Sheet open={widgetSheetOpen} onOpenChange={setWidgetSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Component className="h-5 w-5" />
              {selectedWidget?.name}
            </SheetTitle>
            <SheetDescription>
              {selectedWidget?.description || "Widget details"}
            </SheetDescription>
          </SheetHeader>
          {selectedWidget && (
            <div className="mt-6 space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{selectedWidget.category || 'general'}</Badge>
                {selectedWidget.isReusable && <Badge className="bg-green-100 text-green-700">Reusable</Badge>}
              </div>
              {Array.isArray(selectedWidget.props) && selectedWidget.props.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Props</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedWidget.props.map((prop: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{prop}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(selectedWidget.events) && selectedWidget.events.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Events</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedWidget.events.map((event: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{event}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWidgetSheetOpen(false);
                    handleEditWidget(selectedWidget);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Widget
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function countChildren(page: PageWithChildren): number {
  return page.children.reduce(
    (acc, child) => acc + 1 + countChildren(child), 0
  );
}
