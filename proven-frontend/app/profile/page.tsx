'use client';

import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { getUserActiveChallenges, getUserCompletedChallenges, UserChallenge } from "../../src/services/userChallenge"
import { getUserProfile, updateUserProfile, signOutUser,  UserProfile } from "../../src/services/user";
import { getTransactionHistory, TransactionHistory } from "../../src/services/transactionHistoryService";
import { ActiveIcon, CompletedIcon } from "@/components/ui/customicons";
import { ImageUpload } from "../../src/components/ui/ImageUpload";
import { uploadProfileImage } from "../../utils/storage";


// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';



export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, signOut: authSignOut } = useAuth();
  const router = useRouter();
  
  // State for profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for user challenges
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<UserChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  
  // State for transactions
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'achievement' | 'transactions'>('achievement');
  
  // Wallet functionality is handled by the SolanaProviders in layout.tsx
  
  // Local state for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image: ''
  });
  
  // Image upload state
  const [isImageEditing, setIsImageEditing] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');

  // Prevent duplicate API calls in React Strict Mode
  const fetchingProfileRef = useRef(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Fetch profile data using the user service
  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await getUserProfile();
      
      if (profileData) {
        setProfile(profileData);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update profile data using the user service
  const updateProfile = async (data: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProfile = await updateUserProfile(data);
      
      if (updatedProfile) {
        setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
        return updatedProfile;
      }
      return null;
    } catch (err: any) {
      
      setError('Failed to update profile. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Call fetchProfile when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      // Guard: prevent duplicate calls
      if (fetchingProfileRef.current) return;
      if (!isAuthenticated) return;

      fetchingProfileRef.current = true;
      try {
        await fetchProfile();
      } finally {
        fetchingProfileRef.current = false;
      }
    };

    loadProfile();
  }, [isAuthenticated]);
  
  // Load user challenges
  useEffect(() => {
    const loadChallenges = async () => {
      if (user && user.id) {
        setLoadingChallenges(true);
        try {
          // ✅ OPTIMIZATION: Parallelize independent API calls
          const [active, completed] = await Promise.all([
            getUserActiveChallenges(user.id),
            getUserCompletedChallenges(user.id)
          ]);

          setActiveChallenges(active);
          setCompletedChallenges(completed);
        } catch (err) {
          // Error handled by fallback to empty state
        } finally {
          setLoadingChallenges(false);
        }
      }
    };

    if (user && user.id) {
      loadChallenges();
    }
  }, [user]);
  
  // Load transaction history
  useEffect(() => {
    const loadTransactions = async () => {
      if (isAuthenticated) {
        setLoadingTransactions(true);
        try {
          const history = await getTransactionHistory();
          setTransactions(history);
        } catch (err) {
          setTransactions([]);
        } finally {
          setLoadingTransactions(false);
        }
      }
    };

    if (isAuthenticated && activeTab === 'transactions') {
      loadTransactions();
    }
  }, [isAuthenticated, activeTab]);
  
  // Update local form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        image: profile.image || ''
      });
    }
  }, [profile]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image editing
  const handleImageEdit = () => {
    setIsImageEditing(true);
    setTempImageUrl(profile?.image || '');
  };

  const handleImageSave = async () => {
    if (!tempImageUrl) {
      setIsImageEditing(false);
      return;
    }

    try {
      // Update the profile with the new image
      const updatedProfile = await updateUserProfile({ image: tempImageUrl });
      
      if (updatedProfile) {
        // Update local profile state
        setProfile(updatedProfile);
        setFormData(prev => ({ ...prev, image: tempImageUrl }));
        setIsImageEditing(false);
      } else {
        setError('Failed to update profile image');
      }
    } catch (error) {
      setError('An error occurred while updating your profile image');
    }
  };

  const handleImageCancel = () => {
    setTempImageUrl(profile?.image || '');
    setIsImageEditing(false);
  };
  
  const handleSaveProfile = async () => {
    // Create an object with only the fields that have been changed
    const updatedFields: Record<string, string> = {};
    
    // Only include fields that have been modified
    if (profile?.name !== formData.name && formData.name.trim() !== '') {
      updatedFields.name = formData.name.trim();
    }
    
    if (profile?.bio !== formData.bio) {
      updatedFields.bio = formData.bio.trim();
    }
    
    if (profile?.image !== formData.image) {
      updatedFields.image = formData.image.trim();
    }
    
    // Only make the API call if there are changes to save
    if (Object.keys(updatedFields).length > 0) {
      try {
        const result = await updateProfile(updatedFields);
        if (result) {
          setIsEditing(false);
          // Refresh profile data to ensure we have the latest
          fetchProfile();
        }
      } catch (err) {
        // Error is already set in the updateProfile function
      }
    } else {
      // No changes to save, just exit edit mode
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        image: profile.image || ''
      });
    }
    setIsEditing(false);
    setIsImageEditing(false);
    setError(null);
  };
  
  const handleSignOut = async () => {
    try {
      const success = await signOutUser();
      if (success) {
        // Clear local auth state
        authSignOut();
        // Redirect to home page
        router.push('/');
      } else {
        setError('Failed to sign out. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while signing out. Please try again.');
    }
  };

  // Wallet connect/disconnect handled by WalletMultiButton
  
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#010001]">
        <p className="text-[#c4c2c9]">Loading...</p>
      </div>
    );
  }
  
  return (
    <>
    <div className="flex flex-col h-full bg-[#121214]">
      {/* Profile Header */}
      <div className="">
        <div className="rounded-lg p-6 relative">
          
          {/* Edit Button - Top Right */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 p-2 bg-[#252329] hover:bg-[#FF5757] text-[#c4c2c9] hover:text-white rounded-lg transition-colors"
              title="Edit Profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          <div className="flex flex-col items-center">
            {/* Profile Image Section */}
            <div className="mb-4 relative">
              {isImageEditing ? (
                <div className="flex flex-col items-center space-y-3">
                  <ImageUpload
                    onUpload={async (file, onProgress) => {
                      if (!user?.id) {
                        return { success: false, error: 'User not authenticated' };
                      }
                      
                      const result = await uploadProfileImage(file, user.id, onProgress);
                      if (result.success && result.url) {
                        setTempImageUrl(result.url);
                      }
                      return result;
                    }}
                    currentImageUrl={tempImageUrl}
                    placeholder="Upload profile picture"
                    maxSize={5}
                    className="max-w-xs"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleImageSave}
                      className="px-4 py-2 bg-[#FF5757] text-white rounded-lg text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleImageCancel}
                      className="px-4 py-2 bg-[#252329] text-[#c4c2c9] rounded-lg text-sm font-medium border border-[#333]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  {profile?.image ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF5757]">
                      <Image
                        src={profile.image}
                        alt={profile.name || 'User'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[#252329] text-[#c4c2c9] text-2xl font-bold border-2 border-[#FF5757]">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  {isEditing && (
                    <button
                      onClick={handleImageEdit}
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs font-medium">Edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-[#8a8891]">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FF5757]"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1 text-[#8a8891]">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FF5757] resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-[#FF5757] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-3 bg-[#252329] text-[#c4c2c9] rounded-lg font-semibold border border-[#333]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-[#c4c2c9]">
                    {profile?.name || 'No name set'}
                  </h2>
                  <p className="text-[#8a8891] mt-1">{profile?.email}</p>
                  {profile?.bio && (
                    <p className="text-[#c4c2c9] mt-2 text-sm max-w-md">{profile.bio}</p>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center mt-6">
            <div>
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-[#18181B] p-2 flex items-center justify-center">
                  <CompletedIcon />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#c4c2c9]">
                {completedChallenges.length}
              </p>
              <p className="text-sm mt-1 text-[#8a8891]">Completed</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-[#18181B] p-2 flex items-center justify-center">
                  <ActiveIcon />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#c4c2c9]">
                {activeChallenges.length || 0}
              </p>
              <p className="text-sm mt-1 text-[#8a8891]">Active</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className=" flex-grow justify-between items-center overflow-auto">
        {/* Tabs */}
        <div className="flex mb-6 border-b border-[#333] justify-center">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'achievement' ? 'text-[#FF5757] border-b-2 border-[#FF5757]' : 'text-[#8a8891]'}`}
            onClick={() => setActiveTab('achievement')}
          >
            Achievement
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'transactions' ? 'text-[#FF5757] border-b-2 border-[#FF5757]' : 'text-[#8a8891]'}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>
        
        {/* Achievement Tab */}
        {activeTab === 'achievement' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-[#FF5757]/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#FF5757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#c4c2c9] mb-2 text-center">Achievement Badges</h3>
            <p className="text-[#8a8891] text-center max-w-sm text-sm leading-relaxed">
              Your achievement badges will appear here when you complete challenges. 
              Earn badges like &quot;10k Steps for 30 days&quot; when you successfully finish your commitments.
            </p>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="py-8 px-4">
            {loadingTransactions ? (
              <div className="text-center py-4">
                <p className="text-[#8a8891]">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#FF5757]/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#FF5757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#c4c2c9] mb-2">Transaction History</h3>
                <p className="text-[#8a8891] max-w-sm text-sm leading-relaxed">
                  No transactions yet. Your transaction history will appear here when you join challenges,
                  stake tokens, or receive rewards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => {
                  const isReward = txn.transactionType === 'REWARD';
                  const amount = `${isReward ? '+' : '-'}${txn.amount.toFixed(2)} USDC`;
                  const amountColor = isReward ? 'text-green-400' : 'text-[#FF5757]';
                  const signatureFromMetadata =
                    txn.metadata && typeof txn.metadata === 'object' && 'transactionSignature' in txn.metadata
                      ? (txn.metadata as { transactionSignature?: string | null }).transactionSignature
                      : undefined;
                  const signature = txn.transactionSignature || signatureFromMetadata || null;
                  const explorerUrl = signature
                    ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
                    : null;
                  const signatureLabel = signature
                    ? `${signature.slice(0, 4)}…${signature.slice(-4)}`
                    : null;
                  return (
                    <div
                      key={`${txn.challengeId}-${txn.timestamp}-${txn.transactionType}`}
                      className="flex items-start justify-between rounded-lg border border-[#2a2a2a] bg-[#121214] p-4"
                    >
                      <div>
                        <p className="text-sm text-[#c4c2c9] font-medium">
                          {txn.challenge?.title || 'Challenge payout'}
                        </p>
                        <p className="text-xs text-[#8a8891] capitalize mt-1">
                          {txn.transactionType.toLowerCase()} · {new Date(txn.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-[#8a8891] mt-1">Status: {txn.status.toLowerCase()}</p>
                        {signature ? (
                          <a
                            href={explorerUrl ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#FF8A34] mt-2 hover:underline"
                          >
                            On-chain tx: {signatureLabel}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <p className="text-xs text-[#8a8891] mt-2">Awaiting on-chain confirmation</p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${amountColor}`}>{amount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
