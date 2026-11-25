import type { Metadata } from "next";
import ReviewModeration from "@/components/review-moderation";

export const metadata: Metadata = {
  title: "Review moderation | Watchora",
  robots: { index: false, follow: false },
};

export default function ReviewModerationPage() {
  return <ReviewModeration />;
}
