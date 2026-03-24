// components/dashboard/AdminDashboard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  TrendingUp, 
  Layers, 
  Award,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Settings,
  BarChart3,
  Activity
} from "lucide-react";

export function AdminDashboard() {
  const { data: session } = useSession();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/activities?limit=5");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const { data: systemHealth } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-health");
      if (!res.ok) throw new Error("Failed to fetch system health");
      return res.json();
    },
  });

  const quickActions = [
    {
      title: "Add New User",
      description: "Create student, teacher, or admin account",
      icon: Users,
      href: "/admin/users",
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-900/50"
    },
    {
      title: "Create Exam",
      description: "Build new assessment with subject wise questions",
      icon: BookOpen,
      href: "/admin/exams/create",
      color: "from-green-500 to-green-600",
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-900/50"
    },
    {
      title: "Add Question",
      description: "Expand question bank with new content",
      icon: FileQuestion,
      href: "/admin/questions/create",
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-900/50"
    },
    {
      title: "Manage Subjects",
      description: "Export Academic Subject Category List",
      icon: Layers,
      href: "/admin/subjects",
      color: "from-orange-500 to-orange-600",
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-900/50"
    },
  ];

  const systemMetrics = [
    {
      label: "System Uptime",
      value: systemHealth?.uptime || "99.9%",
      icon: Activity,
      trend: "+0.1%",
      trendUp: true,
    },
    {
      label: "Active Users",
      value: systemHealth?.activeUsers || stats?.totalUsers || 0,
      icon: Users,
      trend: "+12",
      trendUp: true,
    },
    {
      label: "Database Size",
      value: systemHealth?.dbSize || "2.4 GB",
      icon: BarChart3,
      trend: "Stable",
      trendUp: null,
    },
    {
      label: "Response Time",
      value: systemHealth?.responseTime || "245ms",
      icon: Clock,
      trend: "-32ms",
      trendUp: true,
    },
  ];

  const recentItems = [
    {
      title: "Recent Users",
      icon: Users,
      data: recentActivities?.users || [],
      viewAll: "/admin/users",
      emptyMessage: "No recent user activity",
      renderItem: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--accent)]">
              {item.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{item.username}</p>
            <p className="text-xs text-[var(--text2)]">{item.role}</p>
          </div>
        </div>
      )
    },
    {
      title: "Recent Exams",
      icon: BookOpen,
      data: recentActivities?.exams || [],
      viewAll: "/admin/exams",
      emptyMessage: "No recent exams",
      renderItem: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
            <BookOpen size={14} className="text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{item.examName}</p>
            <p className="text-xs text-[var(--text2)]">{item.duration} mins · {item.questions} Qs</p>
          </div>
        </div>
      )
    },
    {
      title: "Recent Questions",
      icon: FileQuestion,
      data: recentActivities?.questions || [],
      viewAll: "/admin/questions",
      emptyMessage: "No recent questions",
      renderItem: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
            <FileQuestion size={14} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate">{item.question}</p>
            <p className="text-xs text-[var(--text2)]">{item.subject}</p>
          </div>
        </div>
      )
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-[var(--surface)] rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Welcome back, {session?.user?.username}</h1>
          <p className="text-[var(--text2)] mt-2 text-lg">
            Here's what's happening with your platform today
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <Calendar size={18} className="text-[var(--accent)]" />
            <span className="text-sm text-[var(--text)]">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="relative">
              <CheckCircle size={18} className="text-[var(--green)]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--green)] rounded-full animate-pulse"></span>
            </div>
            <span className="text-sm text-[var(--text)]">System Online</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <div className="group relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${action.color}`} />
                
                {/* Icon */}
                <div className={`relative w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${action.text}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-[var(--text2)] mt-1">
                  {action.description}
                </p>
                
                {/* Arrow indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlusCircle className={`h-5 w-5 ${action.text}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* System Overview & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Card */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text)]">System Health</h2>
              <Settings size={20} className="text-[var(--text2)]" />
            </div>
            
            <div className="space-y-4">
              {systemMetrics.map((metric, index) => {
                const Icon = metric.icon;
                const trendColor = metric.trendUp === true ? 'text-[var(--green)]' : 
                                  metric.trendUp === false ? 'text-[var(--red)]' : 
                                  'text-[var(--text2)]';
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface2)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface)] flex items-center justify-center">
                        <Icon size={16} className="text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text2)]">{metric.label}</p>
                        <p className="text-sm font-semibold text-[var(--text)]">{metric.value}</p>
                      </div>
                    </div>
                    {metric.trend && (
                      <span className={`text-xs font-medium ${trendColor}`}>
                        {metric.trend}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Storage Usage */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text2)]">Storage Usage</span>
                <span className="text-xs font-medium text-[var(--text)]">45%</span>
              </div>
              <div className="h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
                <div className="h-full w-[45%] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dim)] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats Card */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Platform Overview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--surface2)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-[var(--text2)]">Total Users</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text)]">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-[var(--text2)] mt-1">
                  +{stats?.newUsers || 0} this month
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface2)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <BookOpen size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-[var(--text2)]">Total Exams</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text)]">{stats?.totalExams || 0}</p>
                <p className="text-xs text-[var(--text2)] mt-1">
                  {stats?.activeExams || 0} active
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface2)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileQuestion size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-[var(--text2)]">Questions</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text)]">{stats?.totalQuestions || 0}</p>
                <p className="text-xs text-[var(--text2)] mt-1">
                  +{stats?.newQuestions || 0} this week
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface2)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs text-[var(--text2)]">Attempts</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text)]">{stats?.totalAttempts || 0}</p>
                <p className="text-xs text-[var(--text2)] mt-1">
                  Avg. {stats?.avgScore || 0}% score
                </p>
              </div>
            </div>

            {/* Subject Distribution */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-[var(--text)] mb-3">Subject Distribution</h3>
              <div className="grid grid-cols-2 gap-3">
                {stats?.subjects?.slice(0, 4).map((subject: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>
                    <span className="text-xs text-[var(--text2)] flex-1">{subject.name}</span>
                    <span className="text-xs font-medium text-[var(--text)]">{subject.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[var(--accent-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle size={14} className="text-[var(--accent)]" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[var(--text)] mb-1">Admin Tips</h4>
            <p className="text-xs text-[var(--text2)]">
              You can create new exams by selecting questions from the question bank. Make sure to verify new user accounts and keep your subject hierarchy organized for better question filtering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}