"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, RefreshCw, Copy, Bitcoin, Wallet } from "lucide-react";

// IC Interaction Imports
import { HttpAgent } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

export default function ProfilePage() {
  const { principal, status, logout, isLoading } = useAuth();

  const [icpBalance, setIcpBalance] = useState<string | null>(null);
  const [ckBalance, setCkBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showDeposit, setShowDeposit] = useState<"icp" | "btc" | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);

  const fetchICPBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({ host: "https://ic0.app" });
      const ledger = LedgerCanister.create({ agent, canisterId: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai") });
      const accountIdentifier = AccountIdentifier.fromPrincipal({ principal: userPrincipal });
      const balance = await ledger.accountBalance({ accountIdentifier: accountIdentifier.toHex() });
      setIcpBalance((Number(balance) / 100_000_000).toFixed(8));
    } catch (error) {
      console.error("Error fetching ICP balance:", error);
      setIcpBalance("0.00000000");
    }
  };

  const fetchCkBTCBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({ host: "https://ic0.app" });
      const ckBTCCanister = await import("@dfinity/ledger-icrc");
      const ledger = ckBTCCanister.IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText("mxzaz-hqaaa-aaaar-qaada-cai") });
      const balance = await ledger.balance({ owner: userPrincipal });
      setCkBalance((Number(balance) / 100_000_000).toFixed(8));
    } catch (error) {
      console.error("Error fetching ckBTC balance:", error);
      setCkBalance("0.00000000");
    }
  };

  useEffect(() => {
    if (principal) {
      const fetchAllBalances = async () => {
        setIsLoadingBalance(true);
        await Promise.all([fetchICPBalance(principal), fetchCkBTCBalance(principal)]);
        setIsLoadingBalance(false);
      };
      fetchAllBalances();
    }
  }, [principal]);

  const handleRefresh = async () => {
    if (!principal) return;
    setIsLoadingBalance(true);
    await Promise.all([fetchICPBalance(principal), fetchCkBTCBalance(principal)]);
    setIsLoadingBalance(false);
  };

  const handleDepositClick = async (type: "icp" | "btc") => {
    if (showDeposit === type) {
      setShowDeposit(null);
      return;
    }

    setShowDeposit(type);
    setDepositAddress(null);
    setIsGeneratingAddress(true);

    if (type === 'icp' && principal) {
        const accountIdentifier = AccountIdentifier.fromPrincipal({ principal });
        setDepositAddress(accountIdentifier.toHex());
    } else if (type === 'btc' && principal) {
        try {
            const agent = new HttpAgent({ host: "https://ic0.app" });
            const ckBTCMinter = await import("@dfinity/ckbtc");
            const minter = ckBTCMinter.CkBTCMinterCanister.create({ agent, canisterId: Principal.fromText("mqygn-kiaaa-aaaar-qaadq-cai") });
            const btcAddress = await minter.getBtcAddress({ owner: principal });
            setDepositAddress(btcAddress);
        } catch (error) {
            console.error("Error generating Bitcoin address:", error);
            setDepositAddress("Error generating address.");
        }
    }
    setIsGeneratingAddress(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Address copied!");
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Standard": return "text-green-400";
      case "Pro": return "text-yellow-400";
      case "Premium": return "text-pink-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
      <Navbar />

      <main className="flex flex-col flex-grow items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-4xl font-bold mb-2">User Area</h1>
              <p className="text-white/70 text-lg">
                View your information and manage your account.
              </p>
            </div>
            <button
              onClick={logout}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-8 space-y-6">
            <div>
              <p className="text-sm text-white/70 mb-1">Principal ID:</p>
              <p className="text-sm font-mono text-white break-all">
                {principal ? principal.toText() : "Loading..."}
              </p>
            </div>
            {status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-white/70 text-sm">Current Plan:</span>
                  <span className={`font-semibold text-lg ${getPlanColor(Object.keys(status.plan)[0] || "")}`}>
                    {Object.keys(status.plan)[0]}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/70 text-sm">Requests Left:</span>
                  <span className="text-white font-semibold text-lg">
                    {status.requestsLeft.toString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your Wallet</h2>
                <button onClick={handleRefresh} disabled={isLoadingBalance} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                    {isLoadingBalance ? "Refreshing..." : "Refresh"}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ICP Card */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-blue-400">ICP Balance</h3>
                    <p className="font-bold text-2xl text-white">{icpBalance ?? "..."}</p>
                  </div>
                  <button onClick={() => handleDepositClick('icp')} className="w-full flex justify-center items-center gap-2 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-300 font-semibold transition">
                    <Wallet className="w-4 h-4"/>
                    Deposit
                  </button>
                  {showDeposit === 'icp' && (
                    <div className="bg-black/20 p-4 rounded-lg space-y-2">
                        <p className="text-xs text-white/70">Your ICP address (Account ID):</p>
                        {isGeneratingAddress ? <p>Generating...</p> : (
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-mono break-all text-white/90">{depositAddress}</p>
                                <button onClick={() => copyToClipboard(depositAddress!)}><Copy className="w-4 h-4 text-white/70 hover:text-white"/></button>
                            </div>
                        )}
                    </div>
                  )}
              </div>

              {/* ckBTC Card */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-orange-400">ckBTC Balance</h3>
                    <p className="font-bold text-2xl text-white">{ckBalance ?? "..."}</p>
                  </div>
                  <button onClick={() => handleDepositClick('btc')} className="w-full flex justify-center items-center gap-2 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-300 font-semibold transition">
                    <Bitcoin className="w-4 h-4"/>
                    Deposit
                  </button>
                  {showDeposit === 'btc' && (
                     <div className="bg-black/20 p-4 rounded-lg space-y-2">
                        <p className="text-xs text-white/70">Your Bitcoin address:</p>
                        {isGeneratingAddress ? <p>Generating...</p> : (
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-mono break-all text-white/90">{depositAddress}</p>
                                <button onClick={() => copyToClipboard(depositAddress!)}><Copy className="w-4 h-4 text-white/70 hover:text-white"/></button>
                            </div>
                        )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <a href="/round" className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all duration-300 p-6 rounded-xl border border-white/10 shadow-lg">
              <div>
                <h3 className="text-xl font-semibold mb-1">📰 Verified News</h3>
                <p className="text-white/70 text-sm">Access news and content reviewed by experts.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </a>

            <a href="/chat" className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all duration-300 p-6 rounded-xl border border-white/10 shadow-lg">
              <div>
                <h3 className="text-xl font-semibold mb-1">🛡️ Fact Checking</h3>
                <p className="text-white/70 text-sm">Submit questions and receive truthfulness evaluations.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
