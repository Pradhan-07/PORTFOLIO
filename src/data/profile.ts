import type { FocusArea, LearningItem } from '../types';

export const PROFILE = {
  name: 'Karan Kumar Pradhan',
  domain: 'karan.dev',
  handle: 'Pradhan-07',
  githubUrl: 'https://github.com/Pradhan-07',
  email: 'pradhankaran058@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/karan-kumar-pradhan-510062396/',
  linkedinDisplay: 'Karan Kumar Pradhan',
  university: 'VIT-AP University',
  education: 'B.Tech in Computer Science Engineering',
  subtitle: 'B.Tech CSE Student @ VIT-AP University',
  status: 'Second-year B.Tech CSE student @ VIT-AP University',
  tagline: 'Building with curiosity.',
  supportingLine: '// learning algorithms. exploring intelligence. building for the web.',
  heroDescription:
    "I'm a second-year B.Tech Computer Science Engineering student at VIT-AP University, currently strengthening my Data Structures and Algorithms skills in C++ while exploring Artificial Intelligence, Machine Learning, and Web Development.",
  aboutParagraphs: [
    "I'm Karan Kumar Pradhan, a second-year B.Tech Computer Science Engineering student at VIT-AP University with a strong interest in programming, problem-solving, and software development.",
    "I'm currently focusing on Data Structures and Algorithms using C++, improving my understanding of core computer science concepts, and exploring Artificial Intelligence, Machine Learning, and Web Development.",
    "I enjoy learning by building projects, experimenting with new technologies, and turning ideas into working applications. My goal is to become a capable software engineer by developing strong fundamentals and consistently creating meaningful projects.",
  ],
  contactHeading: "Let's connect.",
  contactDescription:
    "I'm always open to connecting with fellow developers, discussing technology, learning new things, and exploring interesting project ideas.",
  footerRole: 'B.Tech CSE Student · VIT-AP University',
  footerNote: '// building, learning, and improving.',
  primaryLanguage: 'C++',
  techStack: [
    { name: 'C++', category: 'Primary Language', level: 'Current Focus', note: 'DSA, STL, memory models, algorithmic problem solving' },
    { name: 'Python', category: 'Interests & AI/ML', level: 'Exploring', note: 'Computer vision, MediaPipe, OpenCV, script automation' },
    { name: 'JavaScript / TypeScript', category: 'Web Development', level: 'Exploring', note: 'Interactive UI, modern ECMAScript, reactive components' },
    { name: 'HTML5 & CSS3', category: 'Web Development', level: 'In Use', note: 'Semantic structure, canvas rendering, responsive typography' },
    { name: 'Git & GitHub', category: 'Tooling', level: 'Daily Workflow', note: 'Version control, commit hygiene, repository management' },
  ],
  terminalPrompt: 'karan@vit-ap:~$',
};

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'dsa',
    number: '01',
    title: 'Data Structures & Algorithms',
    subtitle: 'C++ · Problem Solving · Algorithmic Thinking',
    description:
      'Strengthening foundational computer science principles through rigorous problem-solving in C++. Focusing on time and space complexity optimizations, recursive patterns, graph algorithms, and dynamic programming.',
    topics: ['Arrays & Strings', 'Linked Lists & Trees', 'Graphs & Traversals', 'Dynamic Programming', 'C++ Standard Template Library (STL)'],
    status: 'Active Daily Practice',
  },
  {
    id: 'ai-ml',
    number: '02',
    title: 'Artificial Intelligence & Machine Learning',
    subtitle: 'Learning the fundamentals · Exploring practical applications',
    description:
      'Exploring how intelligent systems perceive and interact with real-world inputs. Experimenting with computer vision pipelines, real-time gesture recognition, and foundational mathematical intuition.',
    topics: ['Computer Vision (OpenCV)', 'Hand & Pose Tracking (MediaPipe)', 'Pattern Recognition', 'Mathematical Foundations'],
    status: 'Experimental Learning',
  },
  {
    id: 'web-dev',
    number: '03',
    title: 'Web Development',
    subtitle: 'Building interactive websites · Frontend development · Exploring full-stack development',
    description:
      'Designing digital engineering interfaces that prioritize speed, craft, and visual responsiveness. Experimenting with canvas-based graphics, minimalist aesthetics, and component architectures.',
    topics: ['Interactive Canvas Systems', 'Modern JavaScript / TypeScript', 'Component Architecture', 'Performance Optimization'],
    status: 'Project Building',
  },
];

export const LEARNING_JOURNEY: LearningItem[] = [
  {
    id: 'l1',
    title: 'Practising DSA in C++',
    domain: 'Core Computer Science',
    status: 'Practicing',
    tag: 'C++ / STL',
    notes: 'Solving algorithmic problems on competitive platforms; studying amortized complexity, tree balances, and graph search paradigms.',
  },
  {
    id: 'l2',
    title: 'Exploring AI and ML fundamentals',
    domain: 'Machine Intelligence',
    status: 'Exploring',
    tag: 'Python / Vision',
    notes: 'Investigating real-time visual streams, gesture inference pipelines, and foundational machine learning concepts.',
  },
  {
    id: 'l3',
    title: 'Building and experimenting with web development projects',
    domain: 'Software Engineering',
    status: 'In Progress',
    tag: 'Web / Canvas',
    notes: 'Crafting editor-inspired interfaces, responsive typography layouts, and minimal state controllers.',
  },
];
