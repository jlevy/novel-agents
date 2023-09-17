import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AGENTS } from "./agents";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Parse out the prompt, which will be of the form "@Jennifer can you edit this ?". Split out the recipient name if it begins with a @.
const parseRawPrompt = (rawPrompt: string) => {
  const lastAtSignIndex = rawPrompt.lastIndexOf("@");

  if (lastAtSignIndex === -1) {
    return { recipient: null, userRequest: null, contextText: rawPrompt };
  }

  const contextText = rawPrompt.substring(0, lastAtSignIndex).trim();
  const remainingText = rawPrompt.substring(lastAtSignIndex + 1).trim();

  const [recipient, ...userRequestParts] = remainingText.split(/\s+/);
  const userRequest = userRequestParts.join(" ");

  return { recipient, userRequest, contextText };
};

export const generateFromAgent = async (rawPrompt: string) => {
  console.log(`Generating from raw prompt:\n---\n${rawPrompt}\n---\n`);

  const { recipient, userRequest, contextText } = parseRawPrompt(rawPrompt);
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
  console.log("Content:", { recipient, userRequest, contextText });
  console.log("Using agent:", agent);

  const { messages } = agent;

  const fullPrompt = userRequest + "\n\n" + contextText;

  const apiRequest = {
    model: "gpt-3.5-turbo",
    messages: [
      ...messages,
      {
        role: "user",
        content: fullPrompt,
      },
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1,
  };

  console.log("Sending API request:", apiRequest);

  const response = await openai.chat.completions.create(apiRequest);

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
};
