import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface DashboardActionsProps {
  onExport: () => void;
}

export const DashboardActions = ({ onExport }: DashboardActionsProps) => {
  return (
    <div className="flex items-center justify-end mb-6">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          onExport();
          toast.success("Sales report downloaded successfully");
        }}
      >
        <Download className="h-4 w-4" />
        Export Data
      </Button>
    </div>
  );
};
