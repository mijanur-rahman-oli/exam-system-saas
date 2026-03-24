// components/ui/badge-counter.tsx
import { Badge } from "./badge";

interface BadgeCounterProps {
  count: number;
  max?: number;
  variant?: "default" | "destructive" | "success" | "warning";
  className?: string;
}

export function BadgeCounter({ 
  count, 
  max = 99, 
  variant = "default",
  className 
}: BadgeCounterProps) {
  if (count === 0) return null;
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge variant={variant} className={className}>
      {displayCount}
    </Badge>
  );
}

// Usage
<BadgeCounter count={5} variant="success" />
<BadgeCounter count={150} max={99} variant="destructive" /> {/* Shows "99+" */}