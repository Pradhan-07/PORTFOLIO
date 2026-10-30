export interface QuickTake {
  id: string;
  quote: string;
  context?: string;
  date: string;
  tag?: string;
  isFeatured?: boolean;
}

export const quickTakes: QuickTake[] = [
  {
    id: "featured-quote",
    quote:
      "writing clean C++ pointers is 10% syntax, 20% logic, and 70% accepting that valgrind will humble you anyway.",
    context: "debugging linked lists at 1 AM",
    date: "Oct 2026",
    tag: "c++ / dsa",
    isFeatured: true,
  },
  {
    id: "take-1",
    quote:
      "a beginner who actually ships > a perfectionist with 40 unpushed local branches.",
    context: "daily dev mantra",
    date: "Sep 2026",
    tag: "shipping",
  },
  {
    id: "take-2",
    quote:
      "hardware has no 'console.log'. when the ESP32 doesn't blink, you stare into the oscilloscope and question reality.",
    context: "agriflow clinic labs",
    date: "Oct 2026",
    tag: "iot",
  },
  {
    id: "take-3",
    quote:
      "21 consecutive days of green squares doesn't make you Dijkstra, but it makes showing up tomorrow non-negotiable.",
    context: "github streak reflection",
    date: "Oct 2026",
    tag: "consistency",
  },
  {
    id: "take-4",
    quote:
      "monochrome design isn't lacking color; it forces typography and whitespace to do the heavy lifting.",
    context: "portfolio build",
    date: "Oct 2026",
    tag: "design",
  },
  {
    id: "take-5",
    quote:
      "first solve the problem on paper. then type the C++. never the other way around.",
    context: "leetcode grind",
    date: "Aug 2026",
    tag: "dsa",
  },
];
