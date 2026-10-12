export interface CodeLine {
  text: string;
  lang: string;
  tokens: { text: string; kind: 'keyword' | 'string' | 'number' | 'function' | 'type' | 'comment' | 'text' | 'member' }[];
}

export const CODE_WALL_SNIPPETS: CodeLine[] = [
  {
    text: '// karan.dev — Algorithms in C++, Intelligence, and Modern Web Systems',
    lang: 'cpp',
    tokens: [{ text: '// karan.dev — Algorithms in C++, Intelligence, and Modern Web Systems', kind: 'comment' }],
  },
  {
    text: '#include <iostream>',
    lang: 'cpp',
    tokens: [{ text: '#include', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: '<iostream>', kind: 'string' }],
  },
  {
    text: '#include <vector>',
    lang: 'cpp',
    tokens: [{ text: '#include', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: '<vector>', kind: 'string' }],
  },
  {
    text: '#include <queue>',
    lang: 'cpp',
    tokens: [{ text: '#include', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: '<queue>', kind: 'string' }],
  },
  {
    text: 'template <typename T>',
    lang: 'cpp',
    tokens: [{ text: 'template', kind: 'keyword' }, { text: ' <', kind: 'text' }, { text: 'typename', kind: 'keyword' }, { text: ' T>', kind: 'type' }],
  },
  {
    text: 'class BinarySearchTree {',
    lang: 'cpp',
    tokens: [{ text: 'class', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'BinarySearchTree', kind: 'type' }, { text: ' {', kind: 'text' }],
  },
  {
    text: '    struct Node {',
    lang: 'cpp',
    tokens: [{ text: '    struct', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'Node', kind: 'type' }, { text: ' {', kind: 'text' }],
  },
  {
    text: '        T data;',
    lang: 'cpp',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'T', kind: 'type' }, { text: ' data;', kind: 'text' }],
  },
  {
    text: '        Node *left, *right;',
    lang: 'cpp',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'Node', kind: 'type' }, { text: ' *left, *right;', kind: 'text' }],
  },
  {
    text: '        Node(T val) : data(val), left(nullptr), right(nullptr) {}',
    lang: 'cpp',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'Node', kind: 'function' }, { text: '(', kind: 'text' }, { text: 'T', kind: 'type' }, { text: ' val) : data(val), left(', kind: 'text' }, { text: 'nullptr', kind: 'keyword' }, { text: '), right(', kind: 'text' }, { text: 'nullptr', kind: 'keyword' }, { text: ') {}', kind: 'text' }],
  },
  {
    text: '    };',
    lang: 'cpp',
    tokens: [{ text: '    };', kind: 'text' }],
  },
  {
    text: '    Node* root = nullptr;',
    lang: 'cpp',
    tokens: [{ text: '    ', kind: 'text' }, { text: 'Node', kind: 'type' }, { text: '* root = ', kind: 'text' }, { text: 'nullptr', kind: 'keyword' }, { text: ';', kind: 'text' }],
  },
  {
    text: 'public:',
    lang: 'cpp',
    tokens: [{ text: 'public:', kind: 'keyword' }],
  },
  {
    text: '    void insert(const T& value) {',
    lang: 'cpp',
    tokens: [{ text: '    ', kind: 'text' }, { text: 'void', kind: 'type' }, { text: ' ', kind: 'text' }, { text: 'insert', kind: 'function' }, { text: '(', kind: 'text' }, { text: 'const', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'T', kind: 'type' }, { text: '& value) {', kind: 'text' }],
  },
  {
    text: '        root = insertRecursive(root, value);',
    lang: 'cpp',
    tokens: [{ text: '        root = ', kind: 'text' }, { text: 'insertRecursive', kind: 'function' }, { text: '(root, value);', kind: 'text' }],
  },
  {
    text: '    }',
    lang: 'cpp',
    tokens: [{ text: '    }', kind: 'text' }],
  },
  {
    text: '    bool search(const T& key) const {',
    lang: 'cpp',
    tokens: [{ text: '    ', kind: 'text' }, { text: 'bool', kind: 'type' }, { text: ' ', kind: 'text' }, { text: 'search', kind: 'function' }, { text: '(', kind: 'text' }, { text: 'const', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'T', kind: 'type' }, { text: '& key) ', kind: 'text' }, { text: 'const', kind: 'keyword' }, { text: ' {', kind: 'text' }],
  },
  {
    text: '        return searchRecursive(root, key) != nullptr;',
    lang: 'cpp',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'return', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'searchRecursive', kind: 'function' }, { text: '(root, key) != ', kind: 'text' }, { text: 'nullptr', kind: 'keyword' }, { text: ';', kind: 'text' }],
  },
  {
    text: '    }',
    lang: 'cpp',
    tokens: [{ text: '    }', kind: 'text' }],
  },
  {
    text: '// Dijkstra Shortest Path Algorithm O((V + E) log V)',
    lang: 'cpp',
    tokens: [{ text: '// Dijkstra Shortest Path Algorithm O((V + E) log V)', kind: 'comment' }],
  },
  {
    text: 'std::vector<int> dijkstra(int src, int V, const std::vector<std::vector<std::pair<int, int>>>& adj) {',
    lang: 'cpp',
    tokens: [{ text: 'std::vector<', kind: 'type' }, { text: 'int', kind: 'type' }, { text: '> ', kind: 'text' }, { text: 'dijkstra', kind: 'function' }, { text: '(', kind: 'text' }, { text: 'int', kind: 'type' }, { text: ' src, ', kind: 'text' }, { text: 'int', kind: 'type' }, { text: ' V, ...', kind: 'text' }],
  },
  {
    text: '    std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> pq;',
    lang: 'cpp',
    tokens: [{ text: '    std::priority_queue<std::pair<', kind: 'type' }, { text: 'int', kind: 'type' }, { text: ', ', kind: 'text' }, { text: 'int', kind: 'type' }, { text: '>> pq;', kind: 'text' }],
  },
  {
    text: '    std::vector<int> dist(V, 1e9);',
    lang: 'cpp',
    tokens: [{ text: '    std::vector<', kind: 'type' }, { text: 'int', kind: 'type' }, { text: '> dist(V, ', kind: 'text' }, { text: '1e9', kind: 'number' }, { text: ');', kind: 'text' }],
  },
  {
    text: '    dist[src] = 0;',
    lang: 'cpp',
    tokens: [{ text: '    dist[src] = ', kind: 'text' }, { text: '0', kind: 'number' }, { text: ';', kind: 'text' }],
  },
  {
    text: '    pq.push({0, src});',
    lang: 'cpp',
    tokens: [{ text: '    pq.', kind: 'text' }, { text: 'push', kind: 'function' }, { text: '({', kind: 'text' }, { text: '0', kind: 'number' }, { text: ', src});', kind: 'text' }],
  },
  {
    text: '    while (!pq.empty()) {',
    lang: 'cpp',
    tokens: [{ text: '    ', kind: 'text' }, { text: 'while', kind: 'keyword' }, { text: ' (!pq.', kind: 'text' }, { text: 'empty', kind: 'function' }, { text: '()) {', kind: 'text' }],
  },
  {
    text: '        auto [d, u] = pq.top(); pq.pop();',
    lang: 'cpp',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'auto', kind: 'keyword' }, { text: ' [d, u] = pq.', kind: 'text' }, { text: 'top', kind: 'function' }, { text: '(); pq.', kind: 'text' }, { text: 'pop', kind: 'function' }, { text: '();', kind: 'text' }],
  },
  {
    text: '        if (d > dist[u]) continue;',
    lang: 'cpp',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'if', kind: 'keyword' }, { text: ' (d > dist[u]) ', kind: 'text' }, { text: 'continue', kind: 'keyword' }, { text: ';', kind: 'text' }],
  },
  {
    text: '    }',
    lang: 'cpp',
    tokens: [{ text: '    }', kind: 'text' }],
  },
  {
    text: '# Python Computer Vision / Attention Tracking Pipeline',
    lang: 'python',
    tokens: [{ text: '# Python Computer Vision / Attention Tracking Pipeline', kind: 'comment' }],
  },
  {
    text: 'import cv2',
    lang: 'python',
    tokens: [{ text: 'import', kind: 'keyword' }, { text: ' cv2', kind: 'text' }],
  },
  {
    text: 'import numpy as np',
    lang: 'python',
    tokens: [{ text: 'import', kind: 'keyword' }, { text: ' numpy ', kind: 'text' }, { text: 'as', kind: 'keyword' }, { text: ' np', kind: 'text' }],
  },
  {
    text: 'class AttentionDetector:',
    lang: 'python',
    tokens: [{ text: 'class', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'AttentionDetector', kind: 'type' }, { text: ':', kind: 'text' }],
  },
  {
    text: '    def __init__(self, confidence=0.85):',
    lang: 'python',
    tokens: [{ text: '    def', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: '__init__', kind: 'function' }, { text: '(', kind: 'text' }, { text: 'self', kind: 'keyword' }, { text: ', confidence=', kind: 'text' }, { text: '0.85', kind: 'number' }, { text: '):', kind: 'text' }],
  },
  {
    text: '        self.threshold = confidence',
    lang: 'python',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'self', kind: 'keyword' }, { text: '.threshold = confidence', kind: 'text' }],
  },
  {
    text: '        self.gaze_vector = np.zeros(3)',
    lang: 'python',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'self', kind: 'keyword' }, { text: '.gaze_vector = np.', kind: 'text' }, { text: 'zeros', kind: 'function' }, { text: '(', kind: 'text' }, { text: '3', kind: 'number' }, { text: ')', kind: 'text' }],
  },
  {
    text: '    def process_frame(self, frame):',
    lang: 'python',
    tokens: [{ text: '    def', kind: 'keyword' }, { text: ' ', kind: 'text' }, { text: 'process_frame', kind: 'function' }, { text: '(', kind: 'text' }, { text: 'self', kind: 'keyword' }, { text: ', frame):', kind: 'text' }],
  },
  {
    text: '        h, w, _ = frame.shape',
    lang: 'python',
    tokens: [{ text: '        h, w, _ = frame.shape', kind: 'text' }],
  },
  {
    text: '        return {"status": "ACTIVE", "focus_score": 0.94}',
    lang: 'python',
    tokens: [{ text: '        ', kind: 'text' }, { text: 'return', kind: 'keyword' }, { text: ' {', kind: 'text' }, { text: '"status"', kind: 'string' }, { text: ': ', kind: 'text' }, { text: '"ACTIVE"', kind: 'string' }, { text: ', ', kind: 'text' }, { text: '"focus_score"', kind: 'string' }, { text: ': ', kind: 'text' }, { text: '0.94', kind: 'number' }, { text: '}', kind: 'text' }],
  },
];
