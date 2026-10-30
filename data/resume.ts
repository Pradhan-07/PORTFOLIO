import { rawProjects, Project } from "./projects";
import { stats } from "./stats";

export interface EducationData {
  institution: string;
  location: string;
  degree: string;
  period: string;
  cgpa: string;
  semester: string;
  coursework: string;
}

export interface CertificationData {
  title: string;
  issuer: string;
  date: string;
  verificationUrl?: string;
  todoNote?: string;
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface ResumeData {
  headerLabel: string;
  title: string;
  subtitle: string;
  pdfUrl: string; // /Karan-Kumar-Pradhan-Resume.pdf in /public
  email: string;
  summary: string;
  education: EducationData;
  certifications: CertificationData[];
  skills: SkillCategory[];
  activity: {
    githubStreakRecord: string;
    totalSeptContributions: number;
    leetcodeStartDate: string;
  };
}

// Map project IDs to relevant resume projects from data/projects.ts
export function getResumeProjects(): Project[] {
  const ids = [
    "agriflow",
    "study-detection",
    "indstate",
    "resolutions-tracker",
    "dsa-cpp",
    "this-portfolio",
  ];

  return ids
    .map((id) => rawProjects.find((p) => p.id === id))
    .filter(Boolean) as Project[];
}

export const resumeData: ResumeData = {
  headerLabel: "[ RESUME // CV ]",
  title: "Resume",
  subtitle: "One page. Honest numbers. Updated Oct 2026.",
  // TODO: Export latest PDF and place at /public/Karan-Kumar-Pradhan-Resume.pdf
  pdfUrl: "/Karan-Kumar-Pradhan-Resume.pdf",
  email: stats.email,
  summary:
    "Second-year Computer Science student with a strong DSA foundation in C++ and hands-on experience building web apps, computer-vision tools and IoT prototypes. Hedera-certified developer. Consistent builder: 21-day GitHub contribution streak and 29 LeetCode problems solved in C++. Open to internships and collaborations.",
  education: {
    institution: "VIT-AP University",
    location: "Amaravati, Andhra Pradesh",
    degree: "B.Tech in Computer Science Engineering",
    period: "2025 to 2029",
    cgpa: `${stats.cgpa} / ${stats.cgpaScale}`,
    semester: "Currently in 3rd semester",
    coursework: "First-year coursework: Java, Python, basic electronics.",
  },
  certifications: [
    {
      title: "Hedera Certified Foundation (HCF)",
      issuer: "Hashgraph Association",
      date: "Jun 2026",
      todoNote: "TODO: Add verification credential link once available.",
    },
    {
      title: "Hedera Certified Developer Associate (HCDA)",
      issuer: "Hashgraph Association",
      date: "Jun 2026",
      todoNote: "TODO: Add verification credential link once available.",
    },
  ],
  skills: [
    {
      category: "Languages",
      skills: ["C++", "Java", "Python", "TypeScript", "JavaScript", "HTML", "CSS"],
    },
    {
      category: "Web",
      skills: ["React", "Next.js", "Vite", "Tailwind CSS", "Flask", "Supabase"],
    },
    {
      category: "CV & IoT",
      skills: ["OpenCV", "MediaPipe", "YOLO", "ESP32", "Arduino"],
    },
    {
      category: "Core CS",
      skills: ["Data Structures and Algorithms", "OOP"],
    },
    {
      category: "Tools",
      skills: ["Git", "GitHub", "VS Code", "Vercel"],
    },
  ],
  activity: {
    githubStreakRecord: "21-day GitHub contribution streak (13 Sep to 3 Oct 2026, 58 contributions)",
    totalSeptContributions: 84,
    leetcodeStartDate: "Aug 2026",
  },
};

