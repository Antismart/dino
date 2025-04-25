"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/DemoComponents";
import { Icon } from "./components/DemoComponents";
import DinoGame from './components/Game';
import { Leaderboard } from './components/Leaderboard';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("dinorun");
  const [gameMode, setGameMode] = useState("solo");

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="z-10">
                <ConnectWallet>
                  <Name className="text-inherit" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center mb-8">
            <div className="flex bg-[var(--app-card-bg)] rounded-lg p-1 border border-[var(--app-card-border)]">
              <button
                className="px-4 py-2 rounded-md bg-[var(--app-accent)] text-white"
              >
                DinoRun
              </button>
            </div>
          </div>

          <div className="my-6">
            <div className="animate-fade-in space-y-6">
              <h1 className="text-3xl font-bold text-center text-[var(--app-foreground)] mb-6">
                DinoRun - Social Onchain Game
              </h1>
              
              <div className="flex justify-center mb-4">
                <div className="flex bg-[var(--app-card-bg)] rounded-lg p-1 border border-[var(--app-card-border)]">
                  <button
                    onClick={() => setGameMode("solo")}
                    className={`px-4 py-2 rounded-md transition-colors ${gameMode === "solo" 
                      ? "bg-[var(--app-accent)] text-white" 
                      : "text-[var(--app-foreground)] hover:bg-[var(--app-card-border)]"}`}
                  >
                    Solo Play
                  </button>
                  <button
                    onClick={() => setGameMode("challenge")}
                    className={`px-4 py-2 rounded-md transition-colors ${gameMode === "challenge" 
                      ? "bg-[var(--app-accent)] text-white" 
                      : "text-[var(--app-foreground)] hover:bg-[var(--app-card-border)]"}`}
                  >
                    Challenge Friends
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <DinoGame gameMode={gameMode} />
                <div className="text-center mt-2 text-[var(--app-foreground-muted)] text-sm">
                  Press SPACE to jump, DOWN to duck. On mobile, tap the top half to jump, bottom half to duck.
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[var(--app-foreground)]">
                    About DinoRun
                  </h2>
                  <p className="text-[var(--app-foreground-muted)]">
                    DinoRun is a social onchain game where you can compete with friends on Farcaster, challenge them to beat your high score, and even mint your best runs as NFTs on Base.
                  </p>
                  <p className="text-[var(--app-foreground-muted)]">
                    The longer you run, the higher your score. But watch out - the game speeds up over time! Can you become the DinoRun champion among your friends?
                  </p>
                </div>
                
                {gameMode === "challenge" && <Leaderboard />}
                {gameMode === "solo" && (
                  <div className="bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg p-4">
                    <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-4">Your High Score</h2>
                    <div className="text-center p-4">
                      <div className="text-4xl font-bold text-[var(--app-accent)]">
                        {typeof window !== 'undefined' ? localStorage.getItem('dinoHighScore') || '0' : '0'}
                      </div>
                      <p className="text-[var(--app-foreground-muted)] mt-2">
                        Keep playing to beat your record!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
