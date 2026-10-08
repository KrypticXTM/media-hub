import { redirect } from "next/navigation";

// The public front door is the shop. The Library lives at /library.
export default function HomePage() {
  redirect("/shop");
}
