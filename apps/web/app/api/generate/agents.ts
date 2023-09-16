// Definitions of various "agents", which are really different prompts that we can use to generate text.

export const AGENTS = {
  ProofreaderPal: {
    name: "ProofreaderPal",
    messages: [
      {
        role: "system",
        content:
          "Edit the following text and correct only spelling, punctuation, and grammar errors. Output the full edited text not changing it otherwise:",
      },
    ],
  },
  JokingJenny: {
    name: "JokingJenny",
    messages: [
      {
        role: "system",
        content:
          "Tell me a brief and corny joke related to the following content:",
      },
    ],
  },
};

// Note from Novel: we're disabling markdown for now until we can figure out a way to
// stream markdown text with proper formatting: https://github.com/steven-tey/novel/discussions/7
// "Use Markdown formatting when appropriate.",
