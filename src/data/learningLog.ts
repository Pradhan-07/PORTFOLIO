export interface LearningLogEntry {
  id: string;
  category: 'dsa' | 'ai-ml' | 'web';
  title: string;
  domain: string;
  status: 'In Progress' | 'Practicing' | 'Exploring';
  tag: string;
  description: string;
  keyTopics: string[];
  updatedAt: string;
}

export const LEARNING_LOG: LearningLogEntry[] = [
  {
    id: 'log-dsa-cpp',
    category: 'dsa',
    title: 'Practising DSA in C++',
    domain: 'Core Computer Science & Competitive Programming',
    status: 'Practicing',
    tag: 'C++20 · STL · Algorithms',
    description:
      'Strengthening problem-solving fundamentals in modern C++. Solving algorithmic challenges on competitive platforms, analyzing asymptotic time and space complexities, and mastering STL containers and memory-efficient data structures.',
    keyTopics: [
      'Two-Pointer & Sliding Window Techniques',
      'Binary Search & Monotonic Conditions',
      'Binary Search Trees & Traversal Orders',
      'Graph Traversals (BFS, DFS, Dijkstra)',
      'Recursion & Dynamic Programming Patterns',
      'C++ STL (vector, unordered_map, priority_queue)',
    ],
    updatedAt: 'Daily consistency',
  },
  {
    id: 'log-ai-ml',
    category: 'ai-ml',
    title: 'Exploring AI & ML Fundamentals',
    domain: 'Machine Intelligence & Computer Vision',
    status: 'Exploring',
    tag: 'Python · OpenCV · MediaPipe',
    description:
      'Exploring how intelligent software interacts with spatial video feeds. Implementing edge computer vision pipelines, multi-point landmark regression for hand and face tracking, and understanding foundational mathematical principles behind gradient optimization.',
    keyTopics: [
      'Real-Time Frame Processing with OpenCV',
      'MediaPipe 21-Node 3D Hand Landmark Tracking',
      'Facial Posture & Attention Heuristics',
      'Vector Mathematics & Euclidean Distance Geometry',
      'Gradient Descent & Neural Activation Functions',
    ],
    updatedAt: 'Experimental weekly',
  },
  {
    id: 'log-web-dev',
    category: 'web',
    title: 'Building Web Development Projects',
    domain: 'Modern Frontend Engineering',
    status: 'In Progress',
    tag: 'React · TypeScript · Vite',
    description:
      'Building production-ready, interactive web applications with modern component design systems. Developing indstate (property marketplace) and creative UI experiences with HTML5 Canvas, responsive CSS, and state management.',
    keyTopics: [
      'Component Architecture & Custom Hooks',
      'HTML5 Canvas 60fps Generative Art & Waveforms',
      'Vite & TypeScript Tooling',
      'Responsive Minimalist Dark Aesthetic Design',
      'Supabase Database Integration & Real-time Flows',
    ],
    updatedAt: 'Active project development',
  },
];
