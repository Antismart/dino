"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNotification } from '@coinbase/onchainkit/minikit';
import { gameController, GameScore, GameChallenge } from '../../lib/game-controller';
import { Button } from './DemoComponents';

interface LeaderboardProps {
  className?: string;
}

export function Leaderboard({ className = '' }: LeaderboardProps) {
  const { address } = useAccount();
  const [scores, setScores] = useState<GameScore[]>([]);
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [challengeScore, setChallengeScore] = useState<number>(50);
  const [challengeFriend, setChallengeFriend] = useState<string>('');
  const [friendAddresses, setFriendAddresses] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');
  const [challengeSuccess, setChallengeSuccess] = useState<boolean | null>(null);
  const sendNotification = useNotification();

  // Set the current player when the address changes
  useEffect(() => {
    if (address) {
      gameController.setCurrentPlayer(address, 'Player'); // In a real app, get username from Farcaster
      
      // Fetch user challenges
      setChallenges(gameController.getUserChallenges());
      
      // In a real implementation, this would fetch friend addresses from Farcaster
      setFriendAddresses(['0x123...', '0x456...']);
    }
  }, [address]);

  // Fetch scores based on the current view mode
  useEffect(() => {
    if (viewMode === 'global') {
      setScores(gameController.getLeaderboard());
    } else {
      setScores(gameController.getFriendLeaderboard(friendAddresses));
    }
  }, [viewMode, friendAddresses]);

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !challengeFriend || challengeScore <= 0) return;
    
    setChallengeSuccess(null); // Reset message
    
    try {
      const result = await gameController.createChallenge(challengeFriend, challengeScore);
      
      if (result) {
        // Send notification about the challenge
        await sendNotification({
          title: 'DinoRun Challenge Sent!',
          body: `You challenged ${challengeFriend} to beat a score of ${challengeScore}!`,
        });
        
        // Show success message
        setChallengeSuccess(true);
        
        // Reset form after a short delay
        setTimeout(() => {
          setChallengeScore(50);
          setChallengeFriend('');
          setChallengeSuccess(null);
        }, 3000);
      } else {
        setChallengeSuccess(false);
      }
    } catch (error) {
      console.error("Failed to send challenge:", error);
      setChallengeSuccess(false);
    }
  };

  return (
    <div className={`bg-[var(--app-card-bg)] rounded-xl p-5 shadow-lg border border-[var(--app-card-border)] ${className}`}>
      <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-4">DinoRun Leaderboard</h2>
      
      <div className="flex space-x-2 mb-4">
        <Button 
          variant={viewMode === 'global' ? 'primary' : 'outline'}
          onClick={() => setViewMode('global')}
          size="sm"
        >
          Global
        </Button>
        <Button 
          variant={viewMode === 'friends' ? 'primary' : 'outline'}
          onClick={() => setViewMode('friends')}
          size="sm"
        >
          Friends
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between font-medium text-[var(--app-foreground-muted)] pb-2 border-b border-[var(--app-card-border)]">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Player</div>
          <div className="w-20 text-right">Score</div>
        </div>
        
        {scores.length === 0 ? (
          <div className="py-4 text-center text-[var(--app-foreground-muted)]">
            No scores yet. Be the first to play!
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {scores.map((score, index) => (
              <div key={`${score.playerAddress}-${score.timestamp}`} 
                   className={`flex justify-between items-center py-2 border-b border-[var(--app-card-border)] ${score.playerAddress === address ? 'bg-[var(--app-accent-light)]' : ''}`}>
                <div className="w-12 text-center font-medium">{index + 1}</div>
                <div className="flex-1 truncate">{score.playerUsername || score.playerAddress.substring(0, 6) + '...'}</div>
                <div className="w-20 text-right font-bold">{score.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {address && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Your Challenges</h3>
            {challenges.length === 0 ? (
              <div className="py-2 text-center text-[var(--app-foreground-muted)]">
                No active challenges
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto">
                {challenges.map((challenge, index) => (
                  <div key={index} className={`p-2 mb-2 rounded-md ${
                    challenge.status === 'completed' ? 'bg-green-100' : 
                    challenge.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {challenge.challengerUsername || challenge.challengerId.substring(0, 6) + '...'}
                      </span>
                      <span className="text-sm">
                        {challenge.status === 'completed' ? '✅ Completed' : 
                        challenge.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--app-foreground-muted)]">
                      Score to beat: {challenge.targetScore}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Challenge a Friend</h3>
            
            {challengeSuccess === true && (
              <div className="mb-3 p-2 bg-green-100 text-green-800 rounded-md">
                Challenge sent successfully! Your friend will be notified.
              </div>
            )}
            
            {challengeSuccess === false && (
              <div className="mb-3 p-2 bg-red-100 text-red-800 rounded-md">
                Failed to send challenge. Please try again.
              </div>
            )}
            
            <form onSubmit={handleChallengeSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--app-foreground-muted)] mb-1">
                  Friend's Address or FID:
                </label>
                <input 
                  type="text" 
                  value={challengeFriend} 
                  onChange={(e) => setChallengeFriend(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)]"
                  placeholder="0x... or FID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-[var(--app-foreground-muted)] mb-1">
                  Score to Beat: {challengeScore}
                </label>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="5" 
                  value={challengeScore} 
                  onChange={(e) => setChallengeScore(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <Button type="submit" variant="primary">
                Send Challenge
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}