"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid hydration mismatch
const ConnectWallet = dynamic(
  () => import("./ConnectWallet").then((mod) => mod.ConnectWallet),
  { ssr: false }
);

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Proof of Certification
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">
            Blockchain-verified course completions. Earn NFT certificates,
            generate shareable proofs, and let employers verify your
            credentials instantly.
          </p>
        </div>

        {/* Features */}
        <div className="grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">NFT Certificates</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Receive ERC-1155 tokens as proof of course completion
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Shareable Proofs</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Generate unique links to verify your credentials
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Instant Verification</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Anyone can verify proofs without creating an account
            </p>
          </div>
        </div>

        {/* Sign In */}
        <div className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">
            Sign in to view your certificates and generate proofs
          </p>
          <ConnectWallet />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground border-t p-4 text-center text-sm">
        Built for Tanda Hackathon
      </footer>
    </div>
  );
}
