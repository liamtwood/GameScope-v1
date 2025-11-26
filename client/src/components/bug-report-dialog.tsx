import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug, Lightbulb, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BugReportDialogProps {
  pageTitle: string;
}

type ReportType = 'bug' | 'enhancement';

export function BugReportDialog({ pageTitle }: BugReportDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    id: "",
    date: new Date().toISOString().split('T')[0],
    type: "bug" as ReportType,
    area: pageTitle,
    description: "",
    priority: "medium" as 'low' | 'medium' | 'high' | 'critical',
    status: "open" as 'open' | 'in_progress' | 'resolved' | 'closed',
  });

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        id: `${prev.type === 'bug' ? 'BUG' : 'ENH'}-${String(Date.now()).slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        area: pageTitle,
        description: "",
        priority: "medium",
        status: "open",
      }));
    }
  }, [open, pageTitle]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      id: `${prev.type === 'bug' ? 'BUG' : 'ENH'}-${String(Date.now()).slice(-4)}`,
    }));
  }, [formData.type]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest('POST', '/api/devops/changelog', data);
    },
    onSuccess: () => {
      toast({ 
        title: formData.type === 'bug' ? "Bug reported" : "Enhancement suggested",
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
            {formData.type === 'bug' ? (
              <Bug className="h-5 w-5 text-rose-500" />
            ) : (
              <Lightbulb className="h-5 w-5 text-cyan-500" />
            )}
            {formData.type === 'bug' ? 'Report a Bug' : 'Suggest an Enhancement'}
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues or suggesting new features.
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
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4 text-rose-500" />
                      Bug
                    </div>
                  </SelectItem>
                  <SelectItem value="enhancement">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-cyan-500" />
                      Enhancement
                    </div>
                  </SelectItem>
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
              {formData.type === 'bug' ? 'What went wrong?' : 'What would you like to see?'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={formData.type === 'bug' 
                ? "Describe the issue you encountered..." 
                : "Describe your suggestion or idea..."
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
              <>Submit {formData.type === 'bug' ? 'Bug Report' : 'Suggestion'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
