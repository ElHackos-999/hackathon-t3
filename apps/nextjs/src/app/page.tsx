import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default function HomePage() {
  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Hello world!
        </h1>
      </main>
    </HydrateClient>
  );
}
