import type { Metadata } from "next";
import CatalogueImportReview from "@/components/catalogue-import-review";

export const metadata: Metadata = {
  title: "Catalogue import review — Watchora",
  description: "Validate and review a Watchora catalogue JSON import locally.",
  robots: { index: false, follow: false },
};

export default function CatalogueReviewPage() {
  return <CatalogueImportReview />;
}
