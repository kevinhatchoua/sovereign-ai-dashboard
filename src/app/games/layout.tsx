import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games | Sovereign AI",
  description:
    "Open source games built with AI models from our catalog. NPC dialogue, procedural content, text adventures, and interactive experiences. Filter by category, source, and model.",
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
