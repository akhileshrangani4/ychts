/**
 * User Profile for Bid Scoring
 * 
 * This defines the contractor's profile used to calculate
 * personalized match scores for government bids.
 */

export interface UserProfile {
  /** Trades the contractor performs */
  trades: string[];
  
  /** Qualifications, licenses, and certifications held */
  qualifications: string[];
  
  /** Minimum preferred project budget */
  preferredBudgetMin: number;
  
  /** Maximum preferred project budget */
  preferredBudgetMax: number;
}

/**
 * Default static user profile for scoring.
 * TODO: Replace with dynamic profile from user settings/localStorage
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
  trades: [
    'General Construction',
    'Plumbing',
    'Roofing',
    'Field Work',
  ],
  qualifications: [
    'Licensed Contractor',
    'Bonded',
  ],
  preferredBudgetMin: 10000,   // $10K
  preferredBudgetMax: 300000,  // $300K
};
