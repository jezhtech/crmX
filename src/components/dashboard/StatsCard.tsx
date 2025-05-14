import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "compact";
}

const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  variant = "default"
}: StatsCardProps) => {
  // Compact variant has less padding and smaller text
  const isCompact = variant === "compact";
  
  return (
    <div className={`bg-white ${isCompact ? 'p-3' : 'p-6'} rounded-lg ${!isCompact && 'shadow-sm'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium text-gray-500`}>{title}</p>
          <p className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  trend === "up"
                    ? "text-green-600"
                    : trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
