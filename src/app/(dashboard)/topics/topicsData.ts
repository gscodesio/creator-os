import type { TopicWorkflowStatus } from '@/lib/domain/contentWorkflow';

export interface Topic {
  id: string;
  title: string;
  subtitle?: string;
  type: 'YouTube Long' | 'Standalone Reel' | 'Long Video Derived' | 'LinkedIn' | 'Carousel';
  subType?: 'Informative' | 'Long Video Related' | 'Standalone' | 'Long Video Derived';
  status: TopicWorkflowStatus;
  date: string;
  notes?: string;
  thumbBg?: string;
  thumbText?: string;
  thumbSub?: string;
  tag?: string;
  description?: string;
  scriptOutline?: string;
  nextActionTitle?: string;
  nextActionDesc?: string;
  nextActionButton?: string;
  currentStepIndex?: number;
  contentAssetId?: string; // Stable ID link to created ContentAsset
}

export const ALL_TOPICS: Topic[] = [
  // 1. IDEA COLUMN (Quick capture bank - matches reference screenshot)
  {
    id: 'topic-laptop-guide',
    title: 'Laptop Buying Guide for Students',
    subtitle: 'Best budget and performance laptops for coding, college and editing.',
    type: 'YouTube Long',
    status: 'idea',
    date: '5 Oct 2024',
    notes: 'Cover specs: 16GB RAM minimum, SSD vs HDD, processor choices for programming.',
    thumbBg: 'bg-gradient-to-br from-slate-900 to-indigo-950 text-indigo-300',
    thumbText: 'LAPTOP GUIDE',
    description: 'In-depth buyer guide for engineering and BCA students.',
  },
  {
    id: 'topic-best-habits',
    title: 'Best Habits for College Students',
    subtitle: 'Daily consistency and study routines that pay off in placements.',
    type: 'Standalone Reel',
    subType: 'Standalone',
    status: 'idea',
    date: '3 Oct 2024',
    notes: '30-second punchy reel: sleep, code every day, build public proof of work.',
    thumbBg: 'bg-gradient-to-br from-purple-900 to-black text-purple-300',
    thumbText: 'COLLEGE HABITS',
    description: 'High-impact daily habits for undergraduate tech students.',
  },
  {
    id: 'topic-english-interviews',
    title: 'How to Improve English for Interviews',
    subtitle: 'Practical tips to build speaking confidence for tech job interviews.',
    type: 'LinkedIn',
    subType: 'Informative',
    status: 'idea',
    date: '2 Oct 2024',
    notes: 'Focus on clear communication over fake accent; mock practice framework.',
    thumbBg: 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-300',
    thumbText: 'INTERVIEW ENGLISH',
    description: 'Actionable steps to communicate technical solutions with confidence.',
  },
  {
    id: 'topic-freelancing-bca',
    title: 'Freelancing vs Job after BCA',
    subtitle: 'Comparison slide deck weighing stability vs client independence.',
    type: 'Carousel',
    status: 'idea',
    date: '28 Sep 2024',
    notes: 'Pros, cons, income potential, risk analysis, and hybrid approach.',
    thumbBg: 'bg-gradient-to-br from-amber-900 to-yellow-950 text-amber-300',
    thumbText: 'FREELANCE VS JOB',
    description: '10-slide carousel breaking down post-degree career paths.',
  },
  {
    id: 'topic-study-routine',
    title: 'My Daily Study Routine',
    subtitle: 'Relatable time management breakdown for students.',
    type: 'Standalone Reel',
    subType: 'Standalone',
    status: 'idea',
    date: '25 Sep 2024',
    notes: 'Pomodoro blocks, distraction control, project building slots.',
    thumbBg: 'bg-gradient-to-br from-pink-900 to-rose-950 text-rose-300',
    thumbText: 'STUDY ROUTINE',
    description: 'Realistic study schedule for students learning full-stack development.',
  },
  {
    id: 'topic-react-nextjs-simple',
    title: 'React vs Next.js (Simple Explanation)',
    subtitle: 'Easy-to-understand breakdown for beginners.',
    type: 'Standalone Reel',
    subType: 'Standalone',
    status: 'idea',
    date: '24 Sep 2024',
    notes: 'Client-side rendering vs Server-side rendering in 40 seconds.',
    thumbBg: 'bg-gradient-to-br from-cyan-950 to-black text-cyan-300',
    thumbText: 'REACT VS NEXTJS',
    description: 'Clear analogies explaining when to pick React and when Next.js.',
  },

  // 2. PLANNING COLUMN (Selected shortlist - matches reference screenshot)
  {
    id: '1',
    title: 'BCA ke baad Job Kaise Milegi?',
    subtitle: 'Career guidance for final-year BCA students',
    type: 'YouTube Long',
    status: 'planning',
    date: '7 Oct 2024',
    notes: 'Complete guide: skills, roadmap, job opportunities',
    thumbBg: 'bg-gradient-to-br from-amber-900 to-black text-amber-300',
    thumbText: 'JOB?',
    thumbSub: 'BCA',
    description: 'Career roadmap for BCA students who want software jobs.',
    scriptOutline: 'Hook → Why BCA students struggle → Skills to learn → Projects → Job strategy → Final roadmap',
  },
  {
    id: '5',
    title: 'Best Projects for BCA Students',
    subtitle: 'Projects that actually help during placements.',
    type: 'LinkedIn',
    subType: 'Informative',
    status: 'planning',
    date: '6 Oct 2024',
    notes: 'Include real project examples with resources',
    thumbBg: 'bg-gradient-to-br from-yellow-950 to-black text-yellow-400',
    thumbText: 'BCA PROJECTS',
    thumbSub: 'PLACEMENT',
    description: 'Top 5-7 resume-ready project architectures for BCA graduates.',
  },
  {
    id: '10',
    title: 'Day in My Life as a Developer',
    subtitle: 'Simple and relatable developer routine.',
    type: 'Standalone Reel',
    subType: 'Standalone',
    status: 'planning',
    date: '6 Oct 2024',
    notes: 'Show real daily routine, tools and habits',
    thumbBg: 'bg-gradient-to-br from-sky-950 to-black text-sky-300',
    thumbText: 'DAILY ROUTINE',
    thumbSub: 'DEV LIFE',
    description: 'Realistic day-in-the-life showcasing deep work and balance.',
  },

  // 3. IN PROGRESS COLUMN (Actively researching/preparing - matches reference screenshot)
  {
    id: '6',
    title: 'Study Motivation – Short',
    subtitle: 'Short motivational content for students.',
    type: 'Standalone Reel',
    subType: 'Standalone',
    status: 'in_progress',
    date: '4 Oct 2024',
    notes: 'Share simple motivation tips for daily study',
    thumbBg: 'bg-gradient-to-br from-rose-900 to-black text-rose-300',
    thumbText: 'STUDY MOTIVATION',
    thumbSub: 'DISCIPLINE',
    description: 'Daily consistency and focus triggers for tech students.',
  },
  {
    id: '7',
    title: 'How to Choose a Career?',
    subtitle: 'Simple framework for students deciding between different tech career paths.',
    type: 'LinkedIn',
    subType: 'Informative',
    status: 'in_progress',
    date: '3 Oct 2024',
    notes: 'Include comparison, pros/cons and action steps',
    thumbBg: 'bg-gradient-to-br from-indigo-900 to-purple-950 text-indigo-300',
    thumbText: 'TECH CAREER?',
    thumbSub: 'FRAMEWORK',
    description: 'Step-by-step career path decision matrix for developers.',
  },

  // 4. DONE COLUMN (Converted into Content Asset - matches reference screenshot)
  {
    id: '2',
    title: 'React vs Next.js for Jobs',
    subtitle: 'Beginner-friendly comparison with career perspective.',
    type: 'YouTube Long',
    status: 'converted',
    date: '20 Sep 2024',
    notes: 'Compare both with pros, cons and job scope. Content Asset created.',
    thumbBg: 'bg-gradient-to-br from-slate-900 to-cyan-950 text-cyan-400',
    thumbText: 'React vs Next.js',
    thumbSub: 'PROS & CONS',
    description: 'Beginner-friendly comparison between React and Next.js.',
    contentAssetId: '2', // Linked to Content Asset 2
  },

  // Extra Idea Bank Topics for robust depth
  {
    id: '8',
    title: 'Remote Jobs for BCA Students',
    subtitle: 'Where to find remote opportunities and how to apply.',
    type: 'YouTube Long',
    status: 'idea',
    date: '2 Oct 2026',
    notes: 'Best platforms, resume tips and real examples',
    thumbBg: 'bg-gradient-to-br from-violet-950 to-black text-purple-300',
    thumbText: 'REMOTE JOBS',
    thumbSub: 'GUIDE',
    description: 'Navigating international remote work opportunities from college.',
  },
  {
    id: '9',
    title: 'MERN Stack in 2026 — Still Worth Learning?',
    subtitle: 'Current demand, opportunities and realistic expectations.',
    type: 'YouTube Long',
    status: 'idea',
    date: '1 Oct 2026',
    notes: 'Market demand, salary, future scope',
    thumbBg: 'bg-gradient-to-br from-emerald-950 to-black text-emerald-400',
    thumbText: 'MERN 2026',
    thumbSub: 'CAREER',
    description: 'Analyzing the MongoDB, Express, React, Node ecosystem in 2026.',
  },
  {
    id: '11',
    title: 'How I Would Learn Full Stack Development in 2026',
    subtitle: 'A practical roadmap for beginners.',
    type: 'YouTube Long',
    status: 'idea',
    date: '29 Sep 2026',
    notes: 'Step-by-step learning path',
    thumbBg: 'bg-gradient-to-br from-amber-950 to-neutral-900 text-amber-400',
    thumbText: 'FULL STACK ROADMAP',
    thumbSub: '2026',
    description: 'Pragmatic 6-month roadmap from HTML to microservices.',
  },
  {
    id: '21',
    title: 'BCA Roadmap: 1st Year to Job',
    subtitle: 'Step-by-step roadmap showing what BCA students should focus on each year.',
    type: 'Carousel',
    status: 'idea',
    date: '28 Sep 2026',
    notes: 'Cover 1st year to final year + placement preparation',
    thumbBg: 'bg-gradient-to-br from-amber-950 to-yellow-950 text-amber-300',
    thumbText: 'BCA ROADMAP',
    thumbSub: '1ST YR TO JOB',
    description: 'Slide-by-slide 4-year undergraduate execution plan.',
  },
];
