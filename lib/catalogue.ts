export type TitleKind = "Film" | "Series" | "Anime" | "Documentary";

export type Film = {
  id: number;
  /** Database ID for titles managed in Admin Studio; public IDs use a separate namespace. */
  studioId?: number;
  title: string;
  year: number;
  kind: TitleKind;
  genre: string;
  country: string;
  rating: string;
  image: string;
  description: string;
  /** Optional fields populated by a future licensed metadata provider. */
  originalTitle?: string;
  releaseDate?: string;
  originalLanguage?: string;
  runtimeMinutes?: number;
  seasonCount?: number;
  ratingSource?: string;
};

export const films: Film[] = [
  { id: 1, title: "The Grand Budapest Hotel", year: 2014, kind: "Film", genre: "Comedy", country: "United States", rating: "8.1", image: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHwJZ1W7p4k.jpg", description: "A concierge and his young protégé become wrapped up in a story of art, inheritance and adventure.", originalLanguage: "en", runtimeMinutes: 99, ratingSource: "Illustrative sample" },
  { id: 2, title: "Past Lives", year: 2023, kind: "Film", genre: "Drama", country: "United States", rating: "7.8", image: "https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg", description: "Two childhood friends are pulled apart and brought together again across decades and continents.", originalLanguage: "en", runtimeMinutes: 106, ratingSource: "Illustrative sample" },
  { id: 3, title: "The Boy and the Heron", year: 2023, kind: "Film", genre: "Animation", country: "Japan", rating: "7.5", image: "https://image.tmdb.org/t/p/w500/f4oZTcfGrVTXKTWg157AwikXqmP.jpg", description: "A young boy enters a world shared by the living and the dead.", originalLanguage: "ja", runtimeMinutes: 124, ratingSource: "Illustrative sample" },
  { id: 4, title: "Perfect Days", year: 2023, kind: "Film", genre: "Drama", country: "Japan", rating: "7.9", image: "https://image.tmdb.org/t/p/w500/4p1N2Qrt8j0H8xMHMHvtRxv9weZ.jpg", description: "A quiet portrait of a Tokyo cleaner finding beauty in the rituals of everyday life.", originalLanguage: "ja", runtimeMinutes: 124, ratingSource: "Illustrative sample" },
  { id: 5, title: "The Bear", year: 2022, kind: "Series", genre: "Drama", country: "United States", rating: "8.6", image: "https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", description: "A young chef returns home to run his family's sandwich shop.", originalLanguage: "en", seasonCount: 4, ratingSource: "Illustrative sample" },
  { id: 6, title: "Parasite", year: 2019, kind: "Film", genre: "Thriller", country: "South Korea", rating: "8.5", image: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", description: "A struggling family becomes entangled with a wealthy household.", originalLanguage: "ko", runtimeMinutes: 132, ratingSource: "Illustrative sample" },
  { id: 7, title: "Aftersun", year: 2022, kind: "Film", genre: "Drama", country: "United Kingdom", rating: "7.7", image: "https://image.tmdb.org/t/p/w500/y89DU4x2Dk5V9tQyq2j5q8VQqQ.jpg", description: "A daughter looks back on a holiday with her father and what she could not understand then.", originalLanguage: "en", runtimeMinutes: 102, ratingSource: "Illustrative sample" },
  { id: 8, title: "RRR", year: 2022, kind: "Film", genre: "Action", country: "India", rating: "7.8", image: "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg", description: "Two legendary revolutionaries forge an unlikely friendship in a larger-than-life adventure.", originalLanguage: "te", runtimeMinutes: 187, ratingSource: "Illustrative sample" },
];

export const genres = ["All", "Drama", "Comedy", "Thriller", "Animation", "Action"];
