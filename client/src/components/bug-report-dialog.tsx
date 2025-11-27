import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug, Lightbulb, Loader2, HelpCircle, ListTodo } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/contexts/tab-context";

type ReportType = 'bug' | 'enhancement' | 'question' | 'action_item';

const typeConfig = {
  bug: { icon: Bug, color: "text-rose-500", label: "Bug", idPrefix: "BUG", title: "Report a Bug" },
  enhancement: { icon: Lightbulb, color: "text-cyan-500", label: "Enhancement", idPrefix: "ENH", title: "Suggest an Enhancement" },
  question: { icon: HelpCircle, color: "text-amber-500", label: "Question", idPrefix: "QST", title: "Ask a Question" },
  action_item: { icon: ListTodo, color: "text-violet-500", label: "Action Item", idPrefix: "ACT", title: "Create Action Item" },
};

export function BugReportDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { getFullArea } = useTab();
  
  const [formData, setFormData] = useState({
    id: "",
    date: new Date().toISOString().split('T')[0],
    type: "bug" as ReportType,
    area: "",
    description: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'critical',
    status: "open" as 'open' | 'in_progress' | 'resolved' | 'closed',
  });

  useEffect(() => {
    if (open) {
      const fullArea = getFullArea();
      setFormData(prev => ({
        ...prev,
        id: `${typeConfig[prev.type].idPrefix}-${String(Date.now()).slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        area: fullArea,
        description: "",
        priority: "medium",
        status: "open",
      }));
    }
  }, [open, getFullArea]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      id: `${typeConfig[prev.type].idPrefix}-${String(Date.now()).slice(-4)}`,
    }));
  }, [formData.type]);

  const getSuccessMessage = (type: ReportType) => {
    switch (type) {
      case 'bug': return "Bug reported";
      case 'enhancement': return "Enhancement suggested";
      case 'question': return "Question submitted";
      case 'action_item': return "Action item created";
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest('POST', '/api/devops/changelog', data);
    },
    onSuccess: () => {
      toast({ 
        title: getSuccessMessage(formData.type),
        description: "Your feedback has been recorded. Thank you!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/devops/changelog'] });
      setOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to submit", 
        description: "Please try again later.",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      toast({ 
        title: "Description required", 
        description: "Please describe the issue or suggestion.",
        variant: "destructive" 
      });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          data-testid="button-bug-report"
        >
          <Bug className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(() => {
              const config = typeConfig[formData.type];
              const Icon = config.icon;
              return <Icon className={`h-5 w-5 ${config.color}`} />;
            })()}
            {typeConfig[formData.type].title}
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues, asking questions, or tracking action items.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ReportType })}
              >
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(typeConfig) as [ReportType, typeof typeConfig.bug][]).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
              >
                <SelectTrigger data-testid="select-report-priority">
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="area">Area / Page</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="Which part of the app?"
              data-testid="input-report-area"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              {formData.type === 'bug' ? 'What went wrong?' : 
               formData.type === 'question' ? 'What would you like to know?' :
               formData.type === 'action_item' ? 'What needs to be done?' :
               'What would you like to see?'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                formData.type === 'bug' ? "Describe the issue you encountered..." :
                formData.type === 'question' ? "Ask your question here..." :
                formData.type === 'action_item' ? "Describe the action that needs to be completed..." :
                "Describe your suggestion or idea..."
              }
              rows={4}
              data-testid="textarea-report-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending}
            data-testid="btn-submit-report"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>Submit {typeConfig[formData.type].label}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
