import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TOPICS = [
  {
    id: "topic-laptop-guide",
    title: "Laptop Buying Guide for Students",
    subtitle: "Best budget and performance laptops for coding, college and editing.",
    type: "YouTube Long",
    status: "idea",
    date: "5 Oct 2024",
    notes: "Cover specs: 16GB RAM minimum, SSD vs HDD, processor choices for programming.",
    thumbBg: "bg-gradient-to-br from-slate-900 to-indigo-950 text-indigo-300",
    thumbText: "LAPTOP GUIDE",
    description: "In-depth buyer guide for engineering and BCA students.",
  },
  {
    id: "topic-best-habits",
    title: "Best Habits for College Students",
    subtitle: "Daily consistency and study routines that pay off in placements.",
    type: "Standalone Reel",
    subType: "Standalone",
    status: "idea",
    date: "3 Oct 2024",
    notes: "30-second punchy reel: sleep, code every day, build public proof of work.",
    thumbBg: "bg-gradient-to-br from-purple-900 to-black text-purple-300",
    thumbText: "COLLEGE HABITS",
    description: "High-impact daily habits for undergraduate tech students.",
  },
  {
    id: "topic-english-interviews",
    title: "How to Improve English for Interviews",
    subtitle: "Practical tips to build speaking confidence for tech job interviews.",
    type: "LinkedIn",
    subType: "Informative",
    status: "idea",
    date: "2 Oct 2024",
    notes: "Focus on clear communication over fake accent; mock practice framework.",
    thumbBg: "bg-gradient-to-br from-sky-950 to-slate-900 text-sky-300",
    thumbText: "INTERVIEW ENGLISH",
    description: "Communication confidence breakdown for campus interview rounds.",
  },
  {
    id: "topic-first-internship",
    title: "How to Get Your First Tech Internship",
    subtitle: "Step-by-step roadmap for cold emailing, GitHub projects, and resumes.",
    type: "YouTube Long",
    status: "planning",
    date: "1 Oct 2024",
    notes: "Drafting script outline: resume bullet points, GitHub portfolio, cold outreach templates.",
    thumbBg: "bg-gradient-to-br from-blue-900 to-slate-950 text-blue-200",
    thumbText: "FIRST INTERNSHIP",
    description: "Complete guide on landing tech internships without campus placement support.",
    scriptOutline: "1. Resume structure\n2. 2 killer projects\n3. Cold emailing founders with proof of work\n4. Interview preparation",
  },
  {
    id: "topic-git-cheatsheet",
    title: "Essential Git Commands You Actually Need",
    subtitle: "Visual carousel breakdown of rebase, cherry-pick, stash, and squash.",
    type: "Carousel",
    status: "planning",
    date: "30 Sep 2024",
    notes: "10 slides visual design: git stash, git rebase vs merge, git reset soft vs hard.",
    thumbBg: "bg-gradient-to-br from-amber-950 to-slate-900 text-amber-300",
    thumbText: "GIT COMMANDS",
    description: "Visual quick-reference carousel for junior software engineers.",
  },
  {
    id: "topic-system-design-intro",
    title: "System Design for Beginners: Scalability 101",
    subtitle: "Load balancers, caching, CDN, and database sharding explained simply.",
    type: "YouTube Long",
    status: "in_progress",
    date: "28 Sep 2024",
    notes: "Shooting scheduled for Thursday evening. Thumbnail draft prepared.",
    thumbBg: "bg-gradient-to-br from-emerald-950 to-slate-900 text-emerald-300",
    thumbText: "SYSTEM DESIGN",
    description: "Beginner-friendly breakdown of core system design fundamentals.",
  },
];

const SEED_ASSETS = [
  {
    id: "asset-1-bca-job",
    title: "BCA ke baad Job Kaise Milegi?",
    type: "YouTube Long",
    workflowStatus: "editing",
    actionStatus: "in_progress",
    stage: "Editing",
    completedSteps: 3,
    totalSteps: 7,
    hasActive: true,
    source: "Standalone",
    isParentLink: true,
    duration: "12:34",
    thumbBg: "bg-gradient-to-br from-amber-950 via-slate-900 to-black text-amber-300",
    thumbText: "BCA CAREER GUIDE",
    lastUpdated: "Today",
  },
  {
    id: "asset-2-freelance-coding",
    title: "How I Made $2,000 Freelancing in College",
    type: "YouTube Long",
    workflowStatus: "shooting",
    actionStatus: "in_progress",
    stage: "Shooting",
    completedSteps: 2,
    totalSteps: 7,
    hasActive: true,
    source: "Standalone",
    isParentLink: true,
    duration: "15:10",
    thumbBg: "bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-blue-300",
    thumbText: "FREELANCING $2K",
    lastUpdated: "Yesterday",
  },
  {
    id: "asset-3-react-tips-reel",
    title: "3 Clean Code Tips for React Developers",
    type: "Standalone Reel",
    reelType: "Standalone",
    workflowStatus: "ready",
    actionStatus: "completed",
    stage: "Ready",
    completedSteps: 4,
    totalSteps: 6,
    hasActive: false,
    source: "Standalone",
    duration: "0:45",
    thumbBg: "bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 text-pink-300",
    thumbText: "REACT TIPS REEL",
    lastUpdated: "2 days ago",
  },
  {
    id: "asset-4-linkedin-growth",
    title: "Why Most Tech Resumes Get Rejected in 6 Seconds",
    type: "LinkedIn",
    subType: "Informative",
    workflowStatus: "ready",
    actionStatus: "completed",
    stage: "Ready",
    completedSteps: 2,
    totalSteps: 4,
    hasActive: false,
    source: "Standalone",
    thumbBg: "bg-gradient-to-br from-sky-950 via-slate-900 to-blue-950 text-sky-300",
    thumbText: "RESUME MISTAKES",
    lastUpdated: "3 days ago",
  },
  {
    id: "asset-5-docker-carousel",
    title: "Docker in 5 Minutes: Visual Architecture Guide",
    type: "Carousel",
    workflowStatus: "scheduled",
    actionStatus: "completed",
    stage: "Scheduled",
    completedSteps: 3,
    totalSteps: 4,
    hasActive: false,
    source: "Standalone",
    thumbBg: "bg-gradient-to-br from-cyan-950 via-slate-900 to-teal-950 text-cyan-300",
    thumbText: "DOCKER ARCHITECTURE",
    lastUpdated: "4 days ago",
  },
];

async function seed() {
  console.log("Seeding Neon database with verified initial data...");

  // 1. Settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      advanceBufferDays: 14,
      isCustomBuffer: false,
      maintainAutoBuffer: true,
      ytLongCount: 2,
      ytLongDays: "Tue,Fri",
      ytShortsCount: 7,
      igReelsCount: 7,
      igDerivedCount: 4,
      igStandaloneCount: 3,
      liPostsCount: 4,
      liInfCount: 2,
      liVidCount: 2,
      carTarget: 2,
      autoTaskGen: true,
      autoBufferCalc: true,
      dailyCapacity: "Auto",
      customCapacity: 5,
      priorityOrder: "Publishing deadlines,Buffer gaps,Current production steps",
      overallStartDate: "2026-10-16",
      currentSimulatedDate: "2026-10-10",
      useSimulatedDate: true,
      timezone: "Asia/Kolkata",
      youtubeDate: "2026-10-16",
      instagramDate: "2026-10-16",
      linkedinDate: "2026-10-16",
      minSchedulingGap: 2,
      maxSchedulingGap: 5,
      restrictSameDay: true,
    },
  });
  console.log("✔ Settings upserted");

  // 2. Topics
  for (const t of SEED_TOPICS) {
    await prisma.topic.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`✔ ${SEED_TOPICS.length} Topics seeded`);

  // 3. Assets
  for (const a of SEED_ASSETS) {
    await prisma.contentAsset.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    });
  }
  console.log(`✔ ${SEED_ASSETS.length} Content Assets seeded`);

  // 4. Distribution for scheduled carousel
  await prisma.platformDistribution.createMany({
    data: [
      {
        contentAssetId: "asset-5-docker-carousel",
        platform: "Carousel",
        scheduledDate: "2026-10-22",
        scheduledTime: "11:00 AM",
        workflowStatus: "Scheduled",
        internalStatus: "Scheduled",
      },
      {
        contentAssetId: "asset-3-react-tips-reel",
        platform: "Instagram",
        scheduledDate: "2026-10-20",
        scheduledTime: "06:00 PM",
        workflowStatus: "Scheduled",
        internalStatus: "Scheduled",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✔ Platform distributions seeded");

  console.log("DATABASE_SEED_COMPLETE");
}

seed()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
