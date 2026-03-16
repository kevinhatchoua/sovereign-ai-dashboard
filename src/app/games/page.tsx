import { redirect } from "next/navigation";

/** Games page — redirects to catalog with games filter applied */
export default function GamesPage() {
  redirect("/?task=games");
}
