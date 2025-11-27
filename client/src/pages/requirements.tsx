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
import { Search, FileText, CheckCircle2, ChevronRight, ChevronDown, Home, Users, Landmark, Settings, Circle, History, Plus, Minus, RefreshCw, Wrench, Database, Check, X, Edit, Trash2, Bug, Lightbulb, AlertTriangle, Loader2, HelpCircle, ListTodo, ClipboardList, Filter, Target, Layers, Puzzle, Link2 } from "lucide-react";
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
import type { WorkItem, WorkItemLink } from "@shared/schema";

type ChangeLogType = 'added' | 'removed' | 'changed' | 'fixed' | 'bug' | 'enhancement' | 'question' | 'action_item';

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
  epoch: { icon: Target, color: "text-purple-600 bg-purple-100", label: "Epoch" },
  epic: { icon: Layers, color: "text-indigo-600 bg-indigo-100", label: "Epic" },
  feature: { icon: Puzzle, color: "text-violet-600 bg-violet-100", label: "Feature" },
  story: { icon: FileText, color: "text-blue-600 bg-blue-100", label: "Story" },
  bug: { icon: Bug, color: "text-rose-600 bg-rose-100", label: "Bug" },
  enhancement: { icon: Lightbulb, color: "text-cyan-600 bg-cyan-100", label: "Enhancement" },
  test_case: { icon: ClipboardList, color: "text-teal-600 bg-teal-100", label: "Test Case" },
  question: { icon: HelpCircle, color: "text-amber-600 bg-amber-100", label: "Question" },
  action_item: { icon: ListTodo, color: "text-orange-600 bg-orange-100", label: "Action Item" },
};

const workItemTypes = ['epoch', 'epic', 'feature', 'story', 'bug', 'enhancement', 'test_case', 'question', 'action_item'];

// Hierarchy types for tree view
const hierarchyTypes = ['epoch', 'epic', 'feature', 'story'];

interface HierarchyNode {
  item: WorkItem;
  children: HierarchyNode[];
}

// Build hierarchy tree from flat work items list
function buildHierarchyTree(items: WorkItem[]): HierarchyNode[] {
  const hierarchyItems = items.filter(item => hierarchyTypes.includes(item.type));
  const itemMap = new Map<string, HierarchyNode>();
  
  // Create nodes for all hierarchy items
  hierarchyItems.forEach(item => {
    itemMap.set(item.id, { item, children: [] });
  });
  
  // Build parent-child relationships
  const roots: HierarchyNode[] = [];
  hierarchyItems.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)!.children.push(node);
    } else if (!item.parentId || !itemMap.has(item.parentId)) {
      // Items without parents or with non-hierarchy parents go to root
      if (item.type === 'epoch') {
        roots.push(node);
      }
    }
  });
  
  // Sort children by ID
  const sortChildren = (nodes: HierarchyNode[]) => {
    nodes.sort((a, b) => a.item.id.localeCompare(b.item.id));
    nodes.forEach(node => sortChildren(node.children));
  };
  sortChildren(roots);
  
  return roots;
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
          <TypeIcon className="h-3 w-3" />
        </div>
        
        {/* ID badge */}
        <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
          {item.id}
        </Badge>
        
        {/* Title */}
        <span 
          className="flex-1 text-sm truncate hover:underline"
          onClick={(e) => { e.stopPropagation(); onSelectItem?.(item); }}
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
          
          {item.steps && Array.isArray(item.steps) && item.steps.length > 0 && (() => {
            const stepsArray = item.steps as string[];
            return (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Steps</span>
                <ol className="text-sm mt-1 list-decimal list-inside space-y-1">
                  {stepsArray.map((step, idx) => (
                    <li key={idx} className="text-muted-foreground">{step}</li>
                  ))}
                </ol>
              </div>
            );
          })()}
          
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

export default function Requirements() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<PageRequirements | null>(null);
  const [selectedModel, setSelectedModel] = useState<DataModel | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [changeLogDialogOpen, setChangeLogDialogOpen] = useState(false);
  const [editingChangeLog, setEditingChangeLog] = useState<APIChangeLogEntry | null>(null);
  const [dataModelDialogOpen, setDataModelDialogOpen] = useState(false);
  const [editingDataModel, setEditingDataModel] = useState<DataModel | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'changelog' | 'datamodel' | 'requirement'; item: any } | null>(null);
  const [activeTab, setActiveTab] = useState("changelog");
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set());
  const [expandedWorkItems, setExpandedWorkItems] = useState<Set<string>>(new Set());
  const [expandedHierarchyNodes, setExpandedHierarchyNodes] = useState<Set<string>>(new Set(['EPOCH-001'])); // Start with first epoch expanded
  const [testCaseFilter, setTestCaseFilter] = useState<TestCase['status'] | 'all'>('all');
  const [workItemTypeFilter, setWorkItemTypeFilter] = useState<string>('all');

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

  // Build hierarchy tree from work items
  const hierarchyTree = useMemo(() => buildHierarchyTree(workItems), [workItems]);

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

  // Extract test cases from work items
  const workItemTestCases = workItems.filter(item => item.type === 'test_case');
  const workItemBugs = workItems.filter(item => item.type === 'bug');
  const workItemEnhancements = workItems.filter(item => item.type === 'enhancement');

  // Convert work item to test case format for display
  const workItemToTestCase = (item: WorkItem): TestCase => ({
    id: item.id,
    title: item.title,
    objective: item.description || '',
    steps: (item.steps as string[]) || [],
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

  // Mutations for CRUD
  const createChangeLogMutation = useMutation({
    mutationFn: async (data: Partial<APIChangeLogEntry>) => {
      await apiRequest('POST', '/api/devops/changelog', data);
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

  const handleSelectPage = (page: PageRequirements) => {
    setSelectedPage(page);
    setSheetOpen(true);
  };

  const handleEditPage = (page: PageRequirements) => {
    toast({ title: "Edit page requirements", description: "Full page editing coming soon" });
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
    <MainLayout title="Requirements" subtitle="View and manage page requirements and documentation">
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
                <Badge className="bg-purple-100 text-purple-700">{workItemSummary.epochs} Epochs</Badge>
                <Badge className="bg-indigo-100 text-indigo-700">{workItemSummary.epics} Epics</Badge>
                <Badge className="bg-violet-100 text-violet-700">{workItemSummary.features} Features</Badge>
                <Badge className="bg-blue-100 text-blue-700">{workItemSummary.stories} Stories</Badge>
              </div>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Click + to expand levels: Epoch → Epic → Feature → Story</p>
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
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No hierarchy items found. Add Epochs, Epics, Features, or Stories.</p>
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
                <Badge className="bg-rose-100 text-rose-700">{workItemSummary.bugs} Bugs</Badge>
                <Badge className="bg-cyan-100 text-cyan-700">{workItemSummary.enhancements} Enhancements</Badge>
                <Badge className="bg-teal-100 text-teal-700">{workItemSummary.testCases} Tests</Badge>
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
              <Button
                variant={workItemTypeFilter === 'test_case' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkItemTypeFilter('test_case')}
                className={workItemTypeFilter === 'test_case' ? '' : 'text-teal-600'}
                data-testid="btn-filter-workitems-testcase"
              >
                <ClipboardList className="h-3 w-3 mr-1" />
                Tests ({workItemSummary.testCases})
              </Button>
            </div>
            <div className="space-y-2">
              {filteredWorkItems.filter(item => !hierarchyTypes.includes(item.type)).map((item) => (
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
              {filteredWorkItems.filter(item => !hierarchyTypes.includes(item.type)).length === 0 && (
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
