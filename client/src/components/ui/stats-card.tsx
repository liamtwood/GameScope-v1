import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    label: string;
    positive?: boolean;
  };
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = "text-blue-600",
  trend 
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center ${iconColor.replace('text-', 'bg-')}`}>
            <Icon className={`text-xl ${iconColor}`} />
          </div>
        </div>
        {(trend || subtitle) && (
          <div className="mt-4 flex items-center space-x-2">
            {trend && (
              <>
                <span className={`text-sm ${trend.positive !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.value}
                </span>
                <span className="text-muted-foreground text-sm">{trend.label}</span>
              </>
            )}
            {subtitle && !trend && (
              <span className="text-muted-foreground text-sm">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
