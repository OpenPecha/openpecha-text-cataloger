import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  gradient?: boolean;
}

const StatCard = ({ icon: Icon, title, value, description, gradient }: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            gradient ? "gradient-primary" : "bg-muted"
          }`}>
            <Icon className={`w-6 h-6 ${gradient ? "text-primary-foreground" : "text-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
