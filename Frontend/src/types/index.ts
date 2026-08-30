export type GameStatus = 'Playing' | 'Completed' | 'Dropped' | 'Plan to Play';

export interface Game {
  id: string;
  title: string;
  coverImage: string;
  developer: string;
  releaseDate: string;
  genres: string[];
}

export interface RatingAspect {
  aspect: string;
  score: number;  
}

export interface Review {
  id: string;
  gameId: string;
  status: GameStatus;
  aspectRatings: RatingAspect[];
  overallRating: number;
  content: string;
  dateAdded: string;
}