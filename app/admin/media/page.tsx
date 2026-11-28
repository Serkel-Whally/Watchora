import type { Metadata } from "next";
import MediaStudio from "@/components/media-studio";

export const metadata: Metadata = {
  title: "Media studio | Watchora",
  robots: { index: false, follow: false },
};

export default function MediaStudioPage() {
  return <MediaStudio />;
}
