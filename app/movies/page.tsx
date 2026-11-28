import FormatCataloguePage from "@/components/format-catalogue-page";

export const metadata = { title: "Movies — Watchora", description: "Explore movies from around the world on Watchora." };

export default function MoviesPage() {
  return <FormatCataloguePage kind="Film" />;
}
