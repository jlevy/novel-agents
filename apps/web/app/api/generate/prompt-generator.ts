import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AGENTS } from "./agents";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Parse out the prompt, which will be of the form "@Jennifer can you edit this ?". Split out the recipient name if it begins with a @.
const parseRawPrompt = (rawPrompt: string) => {
  // Take the _last_ @ mention in case we are recieiving extra, earlier context in a doc.
  if (!rawPrompt.includes("@")) {
    return { recipient: null, prompt: rawPrompt };
  }
  // Extract everything after the _last_ @
  rawPrompt = "@" + (rawPrompt.split("@").pop() || "");

  const recipientRegex = /@(\S+)(.*)/g;
  const recipientMatch = recipientRegex.exec(rawPrompt);
  const recipient = recipientMatch?.[1];
  const prompt = recipientMatch?.[2];
  return { recipient, prompt };
};

export const generateFromAgent = async (rawPrompt: string) => {
  console.log("Generating from raw prompt:", rawPrompt);

  const { recipient, prompt } = parseRawPrompt(rawPrompt);
  if (!recipient) {
    return new Response("No agent name found.", {
      status: 400,
    });
  }

  const agent = AGENTS[recipient];
  if (!agent) {
    return new Response(`No agent ${recipient} found.`, {
      status: 400,
    });
  }
  console.log("Using agent:", agent);

  const { messages } = agent;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      ...messages,
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
};
