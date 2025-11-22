"use client";

import { useState } from "react";
import { ChatInterface } from "@acme/ui/chat-interface";
import { ThreeBackground } from "@acme/ui/three-background";

export default function HomePage() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight text-center drop-shadow-lg">
          Ask to AI
        </h1>

        <div className="relative w-full max-w-2xl overflow-hidden rounded-xl">
          <ThreeBackground isSpeaking={isSpeaking} />

          <ChatInterface onSpeakingChange={setIsSpeaking} />
        </div>
      </div>
    </main>
  );
}
