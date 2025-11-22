/* eslint-disable @typescript-eslint/no-unsafe-argument */

"use server";

import OpenAI from "openai";

import { env } from "../env";

// Mock Data (Same as before)
const MOCK_USERS = [
  { id: "u1", name: "Alice Johnson", wallet: "0x123...abc" },
  { id: "u2", name: "Bob Smith", wallet: "0x456...def" },
  { id: "u3", name: "Charlie Brown", wallet: "0x789...ghi" },
];

const MOCK_COURSES = {
  u1: [
    { id: "c1", name: "Blockchain Basics", code: "BC101" },
    { id: "c2", name: "Smart Contract Security", code: "SC201" },
  ],
  u2: [{ id: "c1", name: "Blockchain Basics", code: "BC101" }],
  u3: [],
};

// Tools implementation
const tools = {
  getUsers: async ({ query }: { query?: string }) => {
    if (!query) return MOCK_USERS;
    const lowerQuery = query.toLowerCase();
    return MOCK_USERS.filter((u) => u.name.toLowerCase().includes(lowerQuery));
  },
  getUserCourses: async ({ userId }: { userId: string }) => {
    return MOCK_COURSES[userId as keyof typeof MOCK_COURSES];
  },
  verifyCertificate: async ({ courseId }: { courseId: string }) => {
    // Mock verification logic
    const isValid = Math.random() > 0.2;
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    return {
      valid: isValid,
      expiresAt: isValid ? expirationDate.toISOString() : null,
      courseId,
    };
  },
};

export async function sendMessage(message: string) {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are a helpful assistant for a Course Completion NFT Platform. 
  Your ONLY job is to help users verify certifications. 
  You have access to tools to look up users, their courses, and verify specific certificates.
  
  Follow this flow:
  1. If the user asks to verify a certificate, ask for the user's name if not provided.
  2. Use 'getUsers' to find the user. If the user asks for a list of users, provide it using 'getUsers' with an empty query. If multiple found, ask to clarify. If one found, confirm and proceed.
  3. Once a user is identified, use 'getUserCourses' to list their courses.
  4. Ask the user which course they want to verify.
  5. Once a course is identified, use 'verifyCertificate' to check its validity.
  6. Report the result clearly (Valid/Invalid/Expired) and the expiration date if applicable.
  
  If the user asks about anything else, politely decline and remind them you are here for verification only.
  Keep responses concise and professional.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ];

  // First call to OpenAI to see if it wants to call a tool
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "getUsers",
          description: "Search for users by name",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The name to search for" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getUserCourses",
          description: "Get list of courses for a specific user ID",
          parameters: {
            type: "object",
            properties: {
              userId: { type: "string", description: "The ID of the user" },
            },
            required: ["userId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "verifyCertificate",
          description: "Verify the validity of a certificate for a course ID",
          parameters: {
            type: "object",
            properties: {
              courseId: { type: "string", description: "The ID of the course" },
            },
            required: ["courseId"],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  const responseMessage = response.choices[0]?.message;

  // Handle tool calls
  if (responseMessage?.tool_calls) {
    messages.push(responseMessage); // Add the assistant's message with tool calls

    for (const toolCall of responseMessage.tool_calls) {
      // @ts-expect-error -- description
      const functionName = toolCall.function.name;
      // @ts-expect-error -- description
      const functionArgs = JSON.parse(toolCall.function.arguments);

      let functionResult;

      if (functionName === "getUsers") {
        functionResult = await tools.getUsers(functionArgs);
      } else if (functionName === "getUserCourses") {
        functionResult = await tools.getUserCourses(functionArgs);
      } else if (functionName === "verifyCertificate") {
        functionResult = await tools.verifyCertificate(functionArgs);
      }

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        content: JSON.stringify(functionResult),
      });
    }

    // Second call to OpenAI to get the final response after tool execution
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
    });

    return (
      secondResponse.choices[0]?.message.content ||
      "I encountered an error processing your request."
    );
  }

  return responseMessage?.content || "I'm sorry, I didn't understand that.";
}
