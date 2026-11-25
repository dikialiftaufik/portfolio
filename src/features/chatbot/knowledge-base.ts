import { profile } from '@/shared/lib/profile';

export interface KnowledgeEntry {
  keywords: readonly string[];
  answer: string;
}

// Static, hand-written answers. Facts that live elsewhere (email, skills)
// come from `profile` so they cannot drift from the rest of the site.
export const knowledgeBase: readonly KnowledgeEntry[] = [
  // Greetings
  {
    keywords: [
      'hi',
      'hello',
      'halo',
      'hey',
      'greetings',
      'selamat',
      'morning',
      'afternoon',
      'evening',
    ],
    answer: "Hello! I'm Diki's virtual assistant. Ready to answer your questions!",
  },
  {
    keywords: ['who are you', 'what are you', 'bot'],
    answer:
      "I'm a simple keyword-based assistant built with React for this portfolio. I answer from a fixed list of questions, so I'm not a generative AI.",
  },

  // Personal basics
  { keywords: ['name', 'who is diki', 'full name'], answer: `My name is ${profile.name}.` },
  {
    keywords: ['old', 'age', 'birthday', 'born'],
    answer: "I'm currently in my 20s, always leveling up my skills.",
  },
  {
    keywords: ['from', 'live', 'location', 'country', 'where', 'stay', 'address', 'city'],
    answer: `I am based in ${profile.location}, but I work effectively with global teams remotely.`,
  },

  // Professional / work
  {
    keywords: ['job', 'hire', 'work', 'available', 'opportunity', 'open to work', 'freelance'],
    answer:
      "I'm open to projects if my schedule allows. Let's discuss your needs and see if I can help!",
  },
  {
    keywords: ['intern'],
    answer: 'Yes, I am looking for internship opportunities to apply my skills in the real world.',
  },
  {
    keywords: ['remote'],
    answer: 'Remote work is perfect for me as it fits around my university schedule.',
  },
  {
    keywords: ['cv', 'resume', 'curriculum vitae', 'download'],
    answer: "You can download my CV by clicking the 'Download CV' button in the navigation bar.",
  },
  {
    keywords: ['contact', 'email', 'reach', 'phone', 'whatsapp'],
    answer: `Reach me at ${profile.email}.`,
  },
  {
    keywords: ['rate', 'salary', 'price', 'cost'],
    answer: "My rates are competitive and depend on project scope. Let's discuss via email.",
  },
  {
    keywords: ['experience', 'years', 'background'],
    answer:
      'I have experience in Full Stack Web Development, working on various projects from e-commerce to school admission.',
  },

  // Tech & skills
  {
    keywords: ['skill', 'stack', 'technology', 'tech', 'program', 'code'],
    answer: `I mostly work with ${profile.skills.join(', ')}. The Tech Stack tab shows the full list.`,
  },
  {
    keywords: ['language'],
    answer: 'I speak Indonesian (Native), English (Professional), and I write JavaScript & Python.',
  },
  {
    keywords: ['os', 'operating system', 'linux', 'windows', 'mac'],
    answer: 'I mostly develop on Windows. The tools matter more to me than the operating system.',
  },
  {
    keywords: ['editor', 'ide', 'vscode', 'vim'],
    answer: "VS Code is my daily driver. It's versatile and powerful.",
  },

  // Favorites
  {
    keywords: ['color', 'colour'],
    answer: 'Cyan (#00F0FF) is my favorite. It represents the future and technology.',
  },
  {
    keywords: ['quote', 'motto', 'philosophy', 'QOTD'],
    answer: '"The only way to do great work is to love what you do." - Steve Jobs.',
  },
  {
    keywords: ['hobby', 'interest', 'free time'],
    answer: 'I enjoy football match and exploring new tech.',
  },
  {
    keywords: ['movie', 'film', 'cinema'],
    answer: 'Interstellar and The Matrix. I love mind-bending sci-fi.',
  },
  {
    keywords: ['music', 'song', 'listen', 'band'],
    answer: 'Lo-Fi beats and Synthwave help me focus while coding.',
  },
  {
    keywords: ['series', 'tv', 'show', 'netflix'],
    answer: 'Mr. Robot and Silicon Valley are top tier for devs!',
  },
  {
    keywords: ['sport', 'club', 'team', 'football'],
    answer: "Persib Bandung, without a doubt. I've supported them since I was a kid.",
  },
  {
    keywords: ['food', 'eat', 'meal'],
    answer: 'My absolute favorite is blood clam. Nothing beats them with a spicy sauce!',
  },
  {
    keywords: ['coffee', 'tea', 'drink'],
    answer: 'Coffee. Definitely coffee. It converts caffeine into code.',
  },

  // Personality & random
  {
    keywords: ['joke', 'funny', 'laugh'],
    answer: 'Why do programmers prefer dark mode? Because light attracts bugs!',
  },
  {
    keywords: ['secret', 'hidden'],
    answer: 'There is no secret. Just hard work and a lot of Googling.',
  },
  {
    keywords: ['education', 'degree', 'university', 'study', 'school'],
    answer:
      "I'm currently pursuing a Diploma in Information Systems at Telkom University, Bandung. I expect to graduate on time in 2027.",
  },
  {
    keywords: ['strength', 'good at'],
    answer: 'I learn fast and adapt quickly to new technologies.',
  },
  {
    keywords: ['weakness', 'bad at'],
    answer: 'I often spend extra time making sure the interface looks absolutely flawless.',
  },
  {
    keywords: ['goal', 'future', 'dream'],
    answer: 'My goal is to build impactful software that solves real human problems.',
  },
  { keywords: ['dark mode', 'theme'], answer: "Dark mode all the way. It's better for the eyes." },
  {
    keywords: ['personality', 'MBTI', 'mbti'],
    answer:
      "I'm an ISTJ 5w4. In simple terms: I am highly organized and logical (ISTJ), but I also love analyzing complex problems deeply (5w4).",
  },
  {
    keywords: ['why hire', 'why you'],
    answer:
      "I don't just write code; I build solutions. I care about user experience and scalable architecture.",
  },
];
