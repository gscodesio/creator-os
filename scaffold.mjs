import fs from 'fs';
import path from 'path';

const dirs = [
  'src/components/ui',
  'src/app/(dashboard)/topics',
  'src/app/(dashboard)/topics/[id]',
  'src/app/(dashboard)/content',
  'src/app/(dashboard)/content/[id]',
  'src/app/(dashboard)/calendar',
  'src/app/(dashboard)/tasks',
  'src/app/(dashboard)/settings'
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

const files = {
  'src/components/ui/button.tsx': `
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`,
  'src/components/ui/badge.tsx': `
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-yellow-100 text-yellow-800",
        info: "border-transparent bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  )
}

export { Badge, badgeVariants }
`,
  'src/app/(dashboard)/topics/page.tsx': `
import React from 'react';
import { Plus, Search, Filter, MoreHorizontal, MessageSquare, Play, Video, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import styles from './topics.module.css';

const MOCK_TOPICS = [
  { id: 1, title: 'How to build a SaaS in 2024', platform: 'YouTube', status: 'Scripting', date: 'Oct 8, 2024', icon: Play, color: 'text-red-500' },
  { id: 2, title: 'Top 5 React hooks', platform: 'Reels', status: 'Idea', date: 'Oct 9, 2024', icon: Video, color: 'text-pink-500' },
  { id: 3, title: 'Why I stopped using Redux', platform: 'LinkedIn', status: 'Ready', date: 'Oct 10, 2024', icon: MessageSquare, color: 'text-blue-600' },
  { id: 4, title: 'Design System Best Practices', platform: 'Carousel', status: 'Designing', date: 'Oct 11, 2024', icon: LayoutTemplate, color: 'text-yellow-500' }
];

export default function TopicsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Topics</h1>
          <p className={styles.subtitle}>Manage your content ideas and upcoming topics.</p>
        </div>
        <Button className="bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Add Topic</Button>
      </div>

      <div className={styles.controls}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-4 py-1.5 cursor-pointer bg-slate-200">All</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">YouTube</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">Reels</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">LinkedIn</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">Carousel</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search topics..." className="pl-9 pr-4 py-2 border rounded-md text-sm w-64" />
          </div>
          <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Topic Title</th>
              <th>Platform / Type</th>
              <th>Status</th>
              <th>Date Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TOPICS.map(topic => (
              <tr key={topic.id}>
                <td className="font-medium">{topic.title}</td>
                <td>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <topic.icon className={\`w-4 h-4 \${topic.color}\`} />
                    {topic.platform}
                  </div>
                </td>
                <td>
                  <Badge variant={topic.status === 'Ready' ? 'success' : 'secondary'}>{topic.status}</Badge>
                </td>
                <td className="text-sm text-slate-500">{topic.date}</td>
                <td className="text-right">
                  <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`,
  'src/app/(dashboard)/topics/topics.module.css': `
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.title {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0f172a;
}
.subtitle {
  color: #64748b;
  margin-top: 0.25rem;
}
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tableContainer {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}
.table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}
.table tr:last-child td {
  border-bottom: none;
}
.table tr:hover {
  background: #f8fafc;
}
`,
  'src/app/(dashboard)/content/page.tsx': `
import React from 'react';
import { Plus, Search, Filter, MoreHorizontal, Play, Video, MessageSquare, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import styles from './content.module.css';

const MOCK_CONTENT = [
  { id: 1, title: 'SaaS Architecture 101', type: 'YouTube Long Video', prodStatus: 'Editing', distStatus: 'Not Scheduled', icon: Play, color: 'text-red-500' },
  { id: 2, title: 'React Hooks Explained', type: 'Standalone Reel', prodStatus: 'Ready', distStatus: 'Instagram Scheduled', icon: Video, color: 'text-pink-500' },
  { id: 3, title: 'Redux vs Context', type: 'LinkedIn Post', prodStatus: 'Ready', distStatus: 'Published', icon: MessageSquare, color: 'text-blue-600' }
];

export default function ContentPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Content</h1>
          <p className={styles.subtitle}>Track production and distribution of your content assets.</p>
        </div>
        <Button className="bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Add Content</Button>
      </div>

      <div className={styles.controls}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-4 py-1.5 cursor-pointer bg-slate-200">All</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">YouTube</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">Reels</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">LinkedIn</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">Carousel</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search content..." className="pl-9 pr-4 py-2 border rounded-md text-sm w-64" />
          </div>
          <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Content Title</th>
              <th>Asset Type</th>
              <th>Production Status</th>
              <th>Distribution</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CONTENT.map(item => (
              <tr key={item.id}>
                <td className="font-medium">{item.title}</td>
                <td>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <item.icon className={\`w-4 h-4 \${item.color}\`} />
                    {item.type}
                  </div>
                </td>
                <td>
                  <Badge variant={item.prodStatus === 'Ready' ? 'success' : 'secondary'}>{item.prodStatus}</Badge>
                </td>
                <td>
                  <span className="text-sm text-slate-500">{item.distStatus}</span>
                </td>
                <td className="text-right">
                  <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`,
  'src/app/(dashboard)/content/content.module.css': `
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.title {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0f172a;
}
.subtitle {
  color: #64748b;
  margin-top: 0.25rem;
}
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tableContainer {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}
.table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}
.table tr:last-child td {
  border-bottom: none;
}
.table tr:hover {
  background: #f8fafc;
}
`,
  'src/app/(dashboard)/calendar/page.tsx': `
import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import styles from './calendar.module.css';

export default function CalendarPage() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grid = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Publishing Calendar</h1>
          <p className={styles.subtitle}>Plan and visualize your cross-platform content schedule.</p>
        </div>
        <Button className="bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Schedule Content</Button>
      </div>

      <div className={styles.controls}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-4 py-1.5 cursor-pointer bg-slate-200">Month</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">Week</Badge>
          <Badge variant="outline" className="px-4 py-1.5 cursor-pointer">Year</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-lg">October 2024</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {days.map(d => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
        {grid.map(day => (
          <div key={day} className={styles.dayCell}>
            <span className={styles.dayNumber}>{day <= 31 ? day : ''}</span>
            {day === 15 && (
              <div className="mt-2 space-y-1">
                <div className="text-xs bg-red-100 text-red-800 rounded px-1.5 py-0.5 truncate border border-red-200">YT: SaaS Architecture</div>
                <div className="text-xs bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 truncate border border-blue-200">LI: Top 5 Hooks</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  'src/app/(dashboard)/calendar/calendar.module.css': `
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.title {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0f172a;
}
.subtitle {
  color: #64748b;
  margin-top: 0.25rem;
}
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.calendarGrid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}
.dayHeader {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #475569;
}
.dayCell {
  background: white;
  min-height: 120px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
}
.dayNumber {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  align-self: flex-end;
}
`,
  'src/app/(dashboard)/tasks/page.tsx': `
import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import styles from './tasks.module.css';

const MOCK_TASKS = [
  { id: 1, action: 'Edit YouTube Video', topic: 'SaaS Architecture 101', reason: 'Due for Friday publish', priority: 'High', status: 'pending' },
  { id: 2, action: 'Write LinkedIn Post', topic: 'React Hooks Explained', reason: 'Buffer gap detected on Wednesday', priority: 'Medium', status: 'pending' },
  { id: 3, action: 'Schedule Reel', topic: 'Why I stopped using Redux', reason: 'Asset ready for distribution', priority: 'Low', status: 'completed' },
];

export default function TasksPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>Your prioritized daily action plan driven by the Task Engine.</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <div className={styles.tabActive}>Today</div>
        <div className={styles.tab}>Upcoming</div>
        <div className={styles.tab}>Completed</div>
      </div>

      <div className={styles.taskList}>
        {MOCK_TASKS.filter(t => t.status === 'pending').map(task => (
          <div key={task.id} className={styles.taskCard}>
            <div className="flex items-start gap-4">
              <Circle className="w-6 h-6 text-slate-300 mt-1 cursor-pointer" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{task.action}</h3>
                  <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                </div>
                <p className="text-slate-600 mb-2">Content: <span className="font-medium text-slate-900">{task.topic}</span></p>
                <div className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                  <AlertCircle className="w-4 h-4" />
                  Reason: {task.reason}
                </div>
              </div>
              <Button variant="outline">Start Task</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  'src/app/(dashboard)/tasks/tasks.module.css': `
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.title {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0f172a;
}
.subtitle {
  color: #64748b;
  margin-top: 0.25rem;
}
.tabs {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0px;
}
.tab {
  padding: 0.75rem 0;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tabActive {
  padding: 0.75rem 0;
  font-weight: 600;
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
  cursor: pointer;
}
.taskList {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.taskCard {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
`,
  'src/app/(dashboard)/settings/page.tsx': `
import React from 'react';
import { Settings, RefreshCw, Calendar, Clock, Share2, ListTodo } from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const MENU = [
    { icon: Settings, title: 'General', desc: 'Workspace and profile settings' },
    { icon: RefreshCw, title: 'Publishing Frequency', desc: 'Target volume per platform' },
    { icon: Clock, title: 'Advance Buffer', desc: 'Rolling planning window' },
    { icon: Calendar, title: 'Scheduling Rules', desc: 'Validation and platform gaps' },
    { icon: Share2, title: 'Connected Platforms', desc: 'Account integrations' },
    { icon: ListTodo, title: 'Task Preferences', desc: 'Engine logic and workload' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your CREATOR OS configuration and rules.</p>
      </div>

      <div className={styles.grid}>
        {MENU.map(item => (
          <div key={item.title} className={styles.card}>
            <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
              <item.icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
            <p className="text-slate-500 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  'src/app/(dashboard)/settings/settings.module.css': `
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.header {
  display: flex;
  flex-direction: column;
}
.title {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0f172a;
}
.subtitle {
  color: #64748b;
  margin-top: 0.25rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
.card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
`
};

Object.entries(files).forEach(([filepath, content]) => {
  fs.writeFileSync(path.resolve(filepath), content.trim());
});
console.log('Scaffolding complete.');
