import { UserChallenge } from './types';

const USER_CHALLENGES_KEY = 'lockin_user_challenges';

/**
 * Save a single user challenge to localStorage
 */
export const saveUserChallenge = (userChallenge: UserChallenge): void => {
  try {
    // Get existing challenges
    const challenges = getLocalUserChallenges();
    
    // Check if challenge already exists
    const index = challenges.findIndex(uc => uc.id === userChallenge.id);
    
    if (index !== -1) {
      // Update existing challenge
      challenges[index] = userChallenge;
    } else {
      // Add new challenge
      challenges.push(userChallenge);
    }
    
    // Save back to localStorage
    saveUserChallenges(challenges);
  } catch (error) {
  }
};

/**
 * Update a user challenge in localStorage
 */
export const updateLocalUserChallenge = (userChallenge: UserChallenge): void => {
  try {
    const challenges = getLocalUserChallenges();
    const index = challenges.findIndex(uc => uc.id === userChallenge.id);
    
    if (index !== -1) {
      challenges[index] = userChallenge;
      saveUserChallenges(challenges);
    }
  } catch (error) {
  }
};

/**
 * Save user challenges array to localStorage
 */
export const saveUserChallenges = (challenges: UserChallenge[]): void => {
  try {
    localStorage.setItem(USER_CHALLENGES_KEY, JSON.stringify(challenges));
  } catch (error) {
  }
};

/**
 * Get all user challenges from localStorage
 */
export const getLocalUserChallenges = (): UserChallenge[] => {
  try {
    const data = localStorage.getItem(USER_CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};
