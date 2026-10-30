export interface SocialLink {
  name: string;
  href: string;
  username: string;
}

export interface SiteConfig {
  name: string;
  role: string;
  university: string;
  degree: string;
  studentId: string;
  showStudentIdChip: boolean; // Set to false to hide ID chip from badge
  email: string;
  socials: {
    github: SocialLink;
    linkedin: SocialLink;
    x: SocialLink;
    instagram: SocialLink;
    leetcode: SocialLink;
  };
}

export const siteConfig: SiteConfig = {
  name: "Karan Kumar Pradhan",
  role: "CSE Student · DSA + Web Developer",
  university: "VIT-AP University",
  degree: "B.Tech Computer Science Engineering (2025–29)",
  studentId: "25BCE7526",
  showStudentIdChip: true, // Configurable toggle for badge chip
  email: "pradhankaran058@gmail.com",
  socials: {
    github: {
      name: "GitHub",
      href: "https://github.com/Pradhan-07",
      username: "@Pradhan-07",
    },
    linkedin: {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/karan-kumar-pradhan-510062396/",
      username: "karan-kumar-pradhan",
    },
    x: {
      name: "X",
      href: "https://x.com/pradhankar65796",
      username: "@pradhankar65796",
    },
    instagram: {
      name: "Instagram",
      href: "https://www.instagram.com/pradhan___07",
      username: "@pradhan___07",
    },
    leetcode: {
      name: "LeetCode",
      href: "https://leetcode.com/u/pradhan_07/",
      username: "pradhan_07",
    },
  },
};

