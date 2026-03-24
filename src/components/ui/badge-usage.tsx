// examples/badge-usage.tsx
import { Badge } from "@/components/ui/badge";
import { BadgeEnhanced } from "@/components/ui/badge-enhanced";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Award, 
  BookOpen,
  Users,
  Star,
  Trophy
} from "lucide-react";

export function BadgeExamples() {
  return (
    <div className="space-y-8 p-8">
      {/* Basic Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Badges</h3>
        <div className="flex gap-4 flex-wrap">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="purple">Purple</Badge>
        </div>
      </div>

      {/* Badge Sizes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Badge Sizes</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <BadgeEnhanced size="sm">Small</BadgeEnhanced>
          <BadgeEnhanced size="md">Medium</BadgeEnhanced>
          <BadgeEnhanced size="lg">Large</BadgeEnhanced>
        </div>
      </div>

      {/* Badges with Icons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="flex gap-4 flex-wrap">
          <BadgeEnhanced variant="success" icon={<CheckCircle className="h-3 w-3" />}>
            Completed
          </BadgeEnhanced>
          <BadgeEnhanced variant="warning" icon={<AlertCircle className="h-3 w-3" />}>
            Pending
          </BadgeEnhanced>
          <BadgeEnhanced variant="info" icon={<Clock className="h-3 w-3" />}>
            In Progress
          </BadgeEnhanced>
          <BadgeEnhanced variant="purple" icon={<Award className="h-3 w-3" />}>
            Achieved
          </BadgeEnhanced>
          <BadgeEnhanced variant="default" icon={<BookOpen className="h-3 w-3" />}>
            Mathematics
          </BadgeEnhanced>
          <BadgeEnhanced variant="secondary" icon={<Users className="h-3 w-3" />}>
            24 Students
          </BadgeEnhanced>
        </div>
      </div>

      {/* Removable Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Removable Badges</h3>
        <div className="flex gap-4 flex-wrap">
          <BadgeEnhanced 
            variant="info" 
            onRemove={() => console.log('remove filter')}
          >
            Filter: Mathematics
          </BadgeEnhanced>
          <BadgeEnhanced 
            variant="success" 
            onRemove={() => console.log('remove tag')}
          >
            Tag: Important
          </BadgeEnhanced>
          <BadgeEnhanced 
            variant="warning" 
            onRemove={() => console.log('remove category')}
          >
            Category: Exams
          </BadgeEnhanced>
        </div>
      </div>

      {/* Status Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
        <div className="flex gap-4 flex-wrap">
          <BadgeEnhanced variant="success" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online
          </BadgeEnhanced>
          <BadgeEnhanced variant="warning" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            Away
          </BadgeEnhanced>
          <BadgeEnhanced variant="destructive" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Offline
          </BadgeEnhanced>
        </div>
      </div>

      {/* Difficulty Badges (for your exam system) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Question Difficulty</h3>
        <div className="flex gap-4 flex-wrap">
          <BadgeEnhanced 
            variant="success" 
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium"
            icon={<Star className="h-3 w-3 fill-current" />}
          >
            Easy
          </BadgeEnhanced>
          <BadgeEnhanced 
            variant="warning" 
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium"
            icon={<Star className="h-3 w-3 fill-current" />}
          >
            Medium
          </BadgeEnhanced>
          <BadgeEnhanced 
            variant="destructive" 
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium"
            icon={<Trophy className="h-3 w-3" />}
          >
            Hard
          </BadgeEnhanced>
        </div>
      </div>

      {/* Role Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">User Roles</h3>
        <div className="flex gap-4 flex-wrap">
          <BadgeEnhanced variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Admin
          </BadgeEnhanced>
          <BadgeEnhanced variant="info" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            Question Setter
          </BadgeEnhanced>
          <BadgeEnhanced variant="success" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            Student
          </BadgeEnhanced>
        </div>
      </div>

      {/* Custom Styled Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Styles</h3>
        <div className="flex gap-4 flex-wrap">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            Gradient
          </Badge>
          <Badge className="bg-black text-white dark:bg-white dark:text-black border-0">
            Black/White
          </Badge>
          <Badge variant="outline" className="border-dashed border-blue-500 text-blue-500">
            Draft
          </Badge>
          <Badge className="border-2 border-yellow-500 bg-transparent text-yellow-500 font-bold">
            Featured
          </Badge>
        </div>
      </div>
    </div>
  );
}