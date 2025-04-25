// Import using the Next.js path alias or relative path
import { sendFrameNotification } from "@/lib/notification-client";

export interface GameScore {
  playerAddress: string;
  playerUsername?: string;
  score: number;
  timestamp: number;
}

export interface GameChallenge {
  challengerId: string;
  challengerUsername?: string;
  targetScore: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

class GameController {
  private leaderboard: GameScore[] = [];
  private challenges: Record<string, GameChallenge[]> = {};
  private currentPlayerAddress?: string;
  private currentPlayerUsername?: string;
  
  setCurrentPlayer(address?: string, username?: string) {
    this.currentPlayerAddress = address;
    this.currentPlayerUsername = username;
  }
  
  async submitScore(score: number): Promise<boolean> {
    if (!this.currentPlayerAddress) return false;
    
    const newScore: GameScore = {
      playerAddress: this.currentPlayerAddress,
      playerUsername: this.currentPlayerUsername,
      score,
      timestamp: Date.now()
    };
    
    try {
      // Store the score and update leaderboard
      this.leaderboard.push(newScore);
      this.leaderboard.sort((a, b) => b.score - a.score);
      
      // Check if this completes any challenges
      this.checkChallengeCompletion(score);
      
      // Send notification to friends if it's a high score
      if (this.isHighScore(score)) {
        await this.notifyHighScore(score);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to submit score:', error);
      return false;
    }
  }
  
  private isHighScore(score: number): boolean {
    // Check if this is the player's personal best
    const playerScores = this.leaderboard
      .filter(entry => entry.playerAddress === this.currentPlayerAddress)
      .sort((a, b) => b.score - a.score);
    
    return playerScores.length === 1 || score >= playerScores[0].score;
  }
  
  async createChallenge(targetFriend: string, targetScore: number): Promise<boolean> {
    if (!this.currentPlayerAddress) return false;
    
    const challenge: GameChallenge = {
      challengerId: this.currentPlayerAddress,
      challengerUsername: this.currentPlayerUsername,
      targetScore,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    try {
      // Store the challenge
      if (!this.challenges[targetFriend]) {
        this.challenges[targetFriend] = [];
      }
      this.challenges[targetFriend].push(challenge);
      
      // Notify the friend about the challenge
      await this.notifyChallenge(targetFriend, targetScore);
      
      return true;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      return false;
    }
  }
  
  getLeaderboard(): GameScore[] {
    return [...this.leaderboard].slice(0, 10); // Top 10 scores
  }
  
  getFriendLeaderboard(friendAddresses: string[]): GameScore[] {
    return this.leaderboard
      .filter(score => 
        friendAddresses.includes(score.playerAddress) || 
        score.playerAddress === this.currentPlayerAddress
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  
  getUserChallenges(): GameChallenge[] {
    return this.currentPlayerAddress ? 
      this.challenges[this.currentPlayerAddress] || [] : [];
  }
  
  private checkChallengeCompletion(score: number) {
    if (!this.currentPlayerAddress) return;
    
    const userChallenges = this.challenges[this.currentPlayerAddress] || [];
    
    userChallenges.forEach(challenge => {
      if (challenge.status === 'pending' && score >= challenge.targetScore) {
        challenge.status = 'completed';
        
        // Notify the challenger that their challenge was completed
        this.notifyChallengeCompleted(
          challenge.challengerId, 
          score, 
          challenge.targetScore
        );
      }
    });
  }
  
  private async notifyHighScore(score: number) {
    if (!this.currentPlayerAddress || !this.currentPlayerUsername) return;
    
    try {
      // Note: In a real app, you would fetch friend FIDs from somewhere
      // For now, we're assuming friend FIDs would be available
      // This would need to be implemented for each friend separately
      // Here's a placeholder for how you might call it:
      /*
      for (const friendFid of friendFids) {
        await sendFrameNotification({
          fid: friendFid,
          title: "New High Score!",
          body: `${this.currentPlayerUsername} just scored ${score} in DinoRun! Can you beat it?`
        });
      }
      */
      console.log(`Would notify friends about high score: ${score}`);
    } catch (error) {
      console.error('Failed to send high score notification:', error);
    }
  }
  
  private async notifyChallenge(targetFriend: string, targetScore: number) {
    if (!this.currentPlayerUsername) return;
    
    try {
      // First try to convert targetFriend to a numeric FID
      const targetFid = parseInt(targetFriend, 10);
      
      if (!isNaN(targetFid)) {
        // If it's a valid numeric FID, send a notification
        await sendFrameNotification({
          fid: targetFid,
          title: "New DinoRun Challenge!",
          body: `${this.currentPlayerUsername} has challenged you to beat a score of ${targetScore} in DinoRun!`
        });
      } else {
        // If it's not a numeric FID (probably an Ethereum address)
        console.log(`Challenge created for address: ${targetFriend} to beat score: ${targetScore}`);
        // In a production app, you could use a different notification method for Ethereum addresses
        // or store the challenge in a database that the recipient can query
      }
      
      return true;  // Indicate success even for non-FID addresses
    } catch (error) {
      console.error('Failed to send challenge notification:', error);
      return false;
    }
  }
  
  private async notifyChallengeCompleted(
    challengerId: string, 
    achievedScore: number, 
    targetScore: number
  ) {
    if (!this.currentPlayerUsername) return;
    
    try {
      // Convert challengerId to a numeric FID if possible
      const challengerFid = parseInt(challengerId, 10);
      if (!isNaN(challengerFid)) {
        await sendFrameNotification({
          fid: challengerFid,
          title: "Challenge Completed!",
          body: `${this.currentPlayerUsername} completed your challenge by scoring ${achievedScore} (target: ${targetScore})!`
        });
      }
    } catch (error) {
      console.error('Failed to send challenge completion notification:', error);
    }
  }
}

// Export a singleton instance
export const gameController = new GameController();