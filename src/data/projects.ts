import type { Project } from '../types';

export const PROJECTS: Project[] = [
  {
    id: 'indstate',
    name: 'indstate',
    category: 'web',
    language: 'React',
    featured: true,
    description: 'Trusted Property Marketplace built with modern reactive frontend architecture and database persistence.',
    details: 'A comprehensive modern real estate and property marketplace application developed with React 19, Vite, and TypeScript. Implements interactive spatial map navigation via Leaflet, Supabase database integration for authentic listing persistence, responsive filter mechanics, and animated interaction workflows.',
    tech: ['React', 'TypeScript', 'Vite', 'Supabase', 'Leaflet Maps', 'Framer Motion'],
    githubUrl: 'https://github.com/Pradhan-07/indstate',
    stats: {
      status: 'Featured Repository',
      updated: 'Public repo',
    },
    features: [
      'Interactive spatial map integration with Leaflet',
      'Supabase database queries and listing management',
      'Property filtering by price, location, and property type',
      'Smooth micro-interactions and animated state transitions',
      'Fully responsive mobile and desktop architecture',
    ],
    snippet: `// indstate — Property data flow & spatial location query
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

export function usePropertyListings(filter: PropertyFilter) {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      const query = supabase.from('properties').select('*');
      if (filter.type) query.eq('type', filter.type);
      const { data, error } = await query;
      if (!error && data) setListings(data);
      setLoading(false);
    }
    fetchProperties();
  }, [filter]);

  return { listings, loading };
}`,
  },
  {
    id: 'dsa-cpp',
    name: 'DSA_CPP',
    category: 'c++',
    language: 'C++',
    description: 'Data Structures and Algorithms implementations in C++, focusing on memory efficiency and optimal asymptotic complexity.',
    details: 'A structured collection of algorithms implemented in modern C++. Contains implementations of Binary Search Trees, Graph traversals (BFS, DFS, Dijkstra), Sorting & Searching algorithms, and Dynamic Programming solutions with clean separation of logic.',
    tech: ['C++', 'STL', 'Algorithms', 'Data Structures'],
    githubUrl: 'https://github.com/Pradhan-07/DSA_CPP',
    stats: {
      status: 'Active Repository',
      updated: 'Recent commits',
    },
    snippet: `// DSA_CPP — Binary Search Tree & Traversal in C++
#include <iostream>
#include <vector>

template <typename T>
struct Node {
    T val;
    Node* left;
    Node* right;
    Node(T v) : val(v), left(nullptr), right(nullptr) {}
};

template <typename T>
class BST {
    Node<T>* root = nullptr;
public:
    void insert(T v) {
        root = insertRec(root, v);
    }
    Node<T>* insertRec(Node<T>* cur, T v) {
        if (!cur) return new Node<T>(v);
        if (v < cur->val) cur->left = insertRec(cur->left, v);
        else cur->right = insertRec(cur->right, v);
        return cur;
    }
};`,
  },
  {
    id: 'study-detection',
    name: 'study_detection',
    category: 'ai',
    language: 'Python',
    description: 'Computer vision and machine learning experiment analyzing facial landmarks and posture for study attentiveness.',
    details: 'A computer vision application built with Python and OpenCV that tracks gaze focus, face orientation, and physical presence during study sessions. Generates focus metrics to help monitor productive study intervals.',
    tech: ['Python', 'OpenCV', 'Computer Vision', 'Landmark Analysis'],
    githubUrl: 'https://github.com/Pradhan-07/study_detection',
    stats: {
      status: 'Experiment',
      updated: 'Public repo',
    },
    snippet: `# study_detection — Real-time focus & head-pose tracking
import cv2
import numpy as np

def analyze_focus(frame, face_cascade):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    attentive = len(faces) > 0
    status = "FOCUSED" if attentive else "AWAY"
    return status, faces`,
  },
  {
    id: 'magic-hand',
    name: 'magic_hand',
    category: 'ai',
    language: 'Python',
    description: 'Real-time hand gesture tracking and interaction system using computer vision techniques.',
    details: 'Experiments in camera-based spatial input. Captures 21 3D hand landmarks in real time and calculates Euclidean distances between fingertips to detect gestures like pinches, swipes, and counts.',
    tech: ['Python', 'MediaPipe', 'OpenCV', 'Gesture AI'],
    githubUrl: 'https://github.com/Pradhan-07/magic_hand',
    stats: {
      status: 'Experiment',
      updated: 'Public repo',
    },
    snippet: `# magic_hand — Fingertip distance gesture classifier
import math

def calculate_distance(p1, p2):
    return math.hypot(p1.x - p2.x, p1.y - p2.y)

def detect_pinch(thumb_tip, index_tip, threshold=0.05):
    dist = calculate_distance(thumb_tip, index_tip)
    return dist < threshold`,
  },
  {
    id: 'meme-gesture',
    name: 'meme_gesture',
    category: 'ai',
    language: 'Python',
    description: 'Interactive gesture classification experiment mapping physical hand movements to digital triggers.',
    details: 'A playful exploration of computer vision where recognized hand poses dynamically trigger audio cues and visual reactions, demonstrating low-latency gesture detection on edge video feeds.',
    tech: ['Python', 'Computer Vision', 'Gesture Inference'],
    githubUrl: 'https://github.com/Pradhan-07/meme_gesture',
    stats: {
      status: 'Experiment',
      updated: 'Public repo',
    },
    snippet: `# meme_gesture — Pose state classifier
class GestureTrigger:
    def __init__(self):
        self.last_state = None

    def trigger(self, gesture_id):
        if gesture_id != self.last_state:
            self.last_state = gesture_id
            print(f"[TRIGGER] Action registered: {gesture_id}")`,
  },
  {
    id: 'leetcode-qa',
    name: 'leetcode_question_answer',
    category: 'c++',
    language: 'C++',
    description: 'Algorithmic problem solutions in C++ with focus on time complexity and boundary edge cases.',
    details: 'Curated repository containing solutions to algorithmic challenges across two-pointer techniques, binary searches, sliding windows, monotonic stacks, and graph traversals.',
    tech: ['C++', 'Competitive Programming', 'LeetCode', 'DSA'],
    githubUrl: 'https://github.com/Pradhan-07/leetcode_question_answer',
    stats: {
      status: 'Active Practice',
      updated: 'Public repo',
    },
    snippet: `// Two-Pointer Optimal Traversal O(N)
#include <vector>
#include <algorithm>

int maxArea(std::vector<int>& height) {
    int l = 0, r = height.size() - 1;
    int maxWater = 0;
    while (l < r) {
        int h = std::min(height[l], height[r]);
        maxWater = std::max(maxWater, h * (r - l));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return maxWater;
}`,
  },
  {
    id: 'pradhan-music',
    name: 'PRADHAN-MUSIC',
    category: 'web',
    language: 'JavaScript',
    description: 'Interactive web music player featuring custom playback controllers and reactive audio state.',
    details: 'Frontend media application implementing custom HTML5 audio playback pipelines, playlist indexing, dynamic track seek bars, and animated volume controls.',
    tech: ['JavaScript', 'HTML5 Audio', 'CSS3', 'Web UI'],
    githubUrl: 'https://github.com/Pradhan-07/PRADHAN-MUSIC',
    stats: {
      status: 'Web App',
      updated: 'Public repo',
    },
    snippet: `// PRADHAN-MUSIC audio state controller
class MusicPlayer {
    constructor(audioElement) {
        this.audio = audioElement;
        this.isPlaying = false;
    }
    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
    }
}`,
  },
  {
    id: 'flowerglow',
    name: 'flowerglow',
    category: 'web',
    language: 'JavaScript',
    description: 'Creative frontend canvas visual experiment exploring glowing particle physics and cursor interactivity.',
    details: 'Canvas animation project exploring generative floral mathematics, sinusoidal pulsation, and neon illumination shaders on a 2D HTML5 canvas context.',
    tech: ['JavaScript', 'HTML5 Canvas', 'Math & Trig', 'CSS'],
    githubUrl: 'https://github.com/Pradhan-07/flowerglow',
    stats: {
      status: 'Visual Experiment',
      updated: 'Public repo',
    },
    snippet: `// flowerglow — Sine wave particle illumination
function drawGlowPetal(ctx, cx, cy, radius, angle, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(radius, 0, radius * 0.7, radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.restore();
}`,
  },
  {
    id: 'clientele',
    name: 'Clientele',
    category: 'web',
    language: 'JavaScript',
    description: 'Interactive web application designed for workflow tracking and client dashboard management.',
    details: 'A clean, responsive dashboard interface designed for managing client records, communications, and task statuses with client-side state handling.',
    tech: ['JavaScript', 'HTML5', 'CSS3', 'DOM Architecture'],
    githubUrl: 'https://github.com/Pradhan-07/Clientele',
    stats: {
      status: 'Web App',
      updated: 'Public repo',
    },
    snippet: `// Clientele — Record filtering & query dispatch
function filterClients(clients, query) {
    const q = query.toLowerCase().trim();
    return clients.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.tag.toLowerCase().includes(q)
    );
}`,
  },
  {
    id: 'resolutions-tracker',
    name: 'Resolutions_Tracker',
    category: 'web',
    language: 'CSS / JS',
    description: 'Minimalist habit and resolution tracker interface with local state persistence and dark mode aesthetic.',
    details: 'Structured tracking utility focused on daily consistency, progress visualization, and distraction-free logging of engineering milestones.',
    tech: ['CSS', 'HTML', 'JavaScript', 'Local Storage'],
    githubUrl: 'https://github.com/Pradhan-07/Resolutions_Tracker',
    stats: {
      status: 'Utility',
      updated: 'Public repo',
    },
    snippet: `// Resolutions_Tracker — Habit state persistence
function updateHabitState(habitId, completed) {
    const data = JSON.parse(localStorage.getItem('resolutions') || '{}');
    data[habitId] = { completed, timestamp: Date.now() };
    localStorage.setItem('resolutions', JSON.stringify(data));
}`,
  },
];
