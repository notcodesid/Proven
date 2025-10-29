/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  name: string;
  bio: string | null;
  email: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    active: number;
    completed: number;
  };
}
