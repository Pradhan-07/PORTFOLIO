import React from "react";
import type { Metadata } from "next";
import { ResumeClient } from "./ResumeClient";

export const metadata: Metadata = {
  title: "Resume · Karan Kumar Pradhan",
  description:
    "One page resume of Karan Kumar Pradhan: 2nd-year B.Tech CSE student at VIT-AP University. CGPA 8.10/10, C++ DSA, full-stack web apps, IoT, and Hedera certifications.",
  openGraph: {
    title: "Resume · Karan Kumar Pradhan",
    description:
      "One page resume of Karan Kumar Pradhan: 2nd-year B.Tech CSE student at VIT-AP University. CGPA 8.10/10, C++ DSA, full-stack web apps, IoT, and Hedera certifications.",
    url: "https://karan-pradhan.vercel.app/resume",
    type: "website",
  },
};

export default function ResumePage() {
  return <ResumeClient />;
}

