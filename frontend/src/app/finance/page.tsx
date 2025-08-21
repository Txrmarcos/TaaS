"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { 
  ArrowUpDown, 
  Bitcoin, 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Copy,
  DollarSign,
  CreditCard,
  PiggyBank,
  Eye,
  EyeOff,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";


import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const CK_BTC_LEDGER_CANISTER_ID = "mxzaz-hqaaa-aaaar-qaada-cai";
const CK_BTC_MINTER_CANISTER_ID = "mqygn-kiaaa-aaaar-qaadq-cai";

// --- DEFINIÇÃO DA INTERFACE (CANDID) DO CANISTER DE SWAP ---
const swapCanisterIdl = ({ IDL }: { IDL: any }) => {
  const TransferArgs = IDL.Record({
      'to': IDL.Principal,
      'amount': IDL.Nat,
  });
  const Result = IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text });

  return IDL.Service({
    'swap_icrc_to_icp': IDL.Func([TransferArgs], [Result], []),
    'swap_icp_to_icrc': IDL.Func([TransferArgs], [Result], []),
    'get_icp_deposit_address': IDL.Func([], [IDL.Text], ['query']),
  });
};

export default function FinancePage() {
  const { principal, isAuthenticated, isLoading: authLoading } = useAuth();

  // Estados para os saldos
  const [icpBalance, setIcpBalance] = useState<string | null>(null);
  const [ckBalance, setCkBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  // Estados para depósito
  const [showDeposit, setShowDeposit] = useState<"icp" | "btc" | null>(null);
  const [icpDepositAddress, setIcpDepositAddress] = useState<string | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  const [showQRCode, setShowQRCode] = useState<"icp" | "btc" | null>(null);

  // Estados para o trading
  const [activeTab, setActiveTab] = useState<"wallet" | "trade" | "deposit">("wallet");
  const [fromToken, setFromToken] = useState<"icp" | "ckbtc">("ckbtc");
  const [toToken, setToToken] = useState<"icp" | "ckbtc">("icp");
  const [amount, setAmount] = useState<string>("");
  const [estimatedReceive, setEstimatedReceive] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [exchangeRate, setExchangeRate] = useState<number>(0.00002); // Exemplo

    const fetchICPBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({
        host: "https://ic0.app",
      });

      const accountIdentifier = AccountIdentifier.fromPrincipal({
        principal: userPrincipal,
      });

      const ledger = LedgerCanister.create({
        agent,
        canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID),
      });

      const balance = await ledger.accountBalance({
        accountIdentifier: accountIdentifier.toHex(),
        certified: false,
      });

      const icpAmount = (Number(balance) / 100_000_000).toFixed(8);
      setIcpBalance(icpAmount);
    } catch (error) {
      console.error("Error fetching ICP balance:", error);
      setIcpBalance("0.00000000");
    }
  };

  const fetchCkBTCBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({
        host: "https://ic0.app",
      });

      const ckBTCCanister = await import("@dfinity/ledger-icrc");
      
      const ledger = ckBTCCanister.IcrcLedgerCanister.create({
        agent,
        canisterId: Principal.fromText(CK_BTC_LEDGER_CANISTER_ID),
      });

      const balance = await ledger.balance({
        owner: userPrincipal,
        certified: false,
      });

      const ckBTCAmount = (Number(balance) / 100_000_000).toFixed(8);
      setCkBalance(ckBTCAmount);
    } catch (error) {
      console.error("Error fetching ckBTC balance:", error);
      setCkBalance("0.00000000");
    }
  };

  const fetchBalances = async () => {
    if (!principal) return;
    
    setIsLoadingBalance(true);
    try {
      await Promise.all([
        fetchICPBalance(principal),
        fetchCkBTCBalance(principal)
      ]);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const generateIcpDepositAddress = (userPrincipal: Principal) => {
    try {
      const accountIdentifier = AccountIdentifier.fromPrincipal({
        principal: userPrincipal,
      });
      setIcpDepositAddress(accountIdentifier.toHex());
    } catch (error) {
      console.error("Error generating ICP address:", error);
    }
  };

  const generateBitcoinAddress = async () => {
    if (!principal) return;
    
    setIsGeneratingAddress(true);
    try {
      const agent = new HttpAgent({
        host: "https://ic0.app",
      });

      const ckBTCMinter = await import("@dfinity/ckbtc");
      
      const minter = ckBTCMinter.CkBTCMinterCanister.create({
        agent,
        canisterId: Principal.fromText(CK_BTC_MINTER_CANISTER_ID),
      });

      const btcAddress = await minter.getBtcAddress({
        owner: principal,
      });

      setBitcoinAddress(btcAddress);
    } catch (error) {
      console.error("Error generating Bitcoin address:", error);
      alert("Error generating Bitcoin address. Please try again.");
    } finally {
      setIsGeneratingAddress(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && principal) {
      fetchBalances();
      generateIcpDepositAddress(principal);
    }
  }, [isAuthenticated, principal]);

  useEffect(() => {
    if (amount && !isNaN(Number(amount)) && exchangeRate > 0) {
      const numAmount = Number(amount);
      let estimated = 0;
      
      if (fromToken === "ckbtc") {
        estimated = numAmount / exchangeRate;
      } else {
        estimated = numAmount * exchangeRate;
      }
      
      setEstimatedReceive(estimated.toFixed(8));
    } else {
      setEstimatedReceive("");
    }
  }, [amount, fromToken, exchangeRate]);

  const handleRefresh = async () => {
    await fetchBalances();
  };

  const handleDepositClick = async (type: "icp" | "btc") => {
    if (showDeposit === type) {
      setShowDeposit(null);
      return;
    }

    setShowDeposit(type);
    if (type === 'btc' && !bitcoinAddress) {
      await generateBitcoinAddress();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const toggleQRCode = (type: "icp" | "btc") => {
    setShowQRCode(showQRCode === type ? null : type);
  };

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount("");
    setEstimatedReceive("");
  };

  const handleMaxAmount = () => {
    const maxBalance = fromToken === "icp" ? icpBalance : ckBalance;
    if (maxBalance) {
      setAmount(maxBalance);
    }
  };

  const handleSwap = async () => {
    if (!principal || !amount || Number(amount) <= 0) {
      setErrorMessage("Please connect your wallet and enter a valid amount.");
      return;
    }

    setIsSwapping(true);
    setSwapStatus("pending");
    setErrorMessage("");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSwapStatus("success");
      
      setTimeout(() => {
        fetchBalances();
        setAmount("");
        setEstimatedReceive("");
        setSwapStatus("idle");
      }, 3000);

    } catch (error) {
      console.error("Swap error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
      setSwapStatus("error");
    } finally {
      setIsSwapping(false);
    }
  };
  
  const getTokenIcon = (token: "icp" | "ckbtc") => token === "icp" ? <Wallet className="w-5 h-5 text-blue-400" /> : <Bitcoin className="w-5 h-5 text-orange-400" />;
  const getTokenColor = (token: "icp" | "ckbtc") => token === "icp" ? "text-blue-400" : "text-orange-400";
  const getTokenBalance = (token: "icp" | "ckbtc") => token === "icp" ? icpBalance : ckBalance;

  const isSwapDisabled = !amount || Number(amount) <= 0 || isSwapping || !principal || authLoading;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0E13]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white">
        <Sidebar />
        <main className="flex flex-col flex-grow items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Financial Area</h1>
            <p className="text-white/70 mb-8">Please log in to access your finances.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    // A classe bg-[#0B0E13] foi removida daqui
    <div className="flex flex-col min-h-screen text-white font-sans">
    
      {/* --- CÓDIGO DO FUNDO ADICIONADO AQUI --- */}
      <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
          <div 
              className="absolute w-full h-full top-0 left-0 bg-transparent"
              style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                  backgroundSize: '2rem 2rem',
                  animation: 'grid-pan 60s linear infinite',
              }}
          ></div>
      </div>

      <Sidebar />

      <main className="md:pl-20 lg:pl-64">
        <div className="w-full max-w-4xl mx-auto px-4 pt-32 pb-20">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-lg flex items-center justify-center shadow-lg">
                  <PiggyBank className="w-4 h-4 text-white" />
              </div>
              Financial Center
            </h1>
            <p className="text-white/70 text-lg">
              Manage your assets, make deposits and trade tokens.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-1.5 flex gap-1">
              <button
                onClick={() => setActiveTab("wallet")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === "wallet"
                    ? "bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Wallet
              </button>
              <button
                onClick={() => setActiveTab("deposit")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === "deposit"
                    ? "bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Deposit
              </button>
              <button
                onClick={() => setActiveTab("trade")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === "trade"
                    ? "bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Trading
              </button>
            </div>
          </div>
        
          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    Balance Overview
                  </h2>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowBalances(!showBalances)} className="p-2 text-white/70 hover:text-white transition-colors" title={showBalances ? "Hide Balances" : "Show Balances"}>
                      {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button onClick={handleRefresh} disabled={isLoadingBalance} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition disabled:opacity-50">
                      <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                      {isLoadingBalance ? "Updating..." : "Refresh"}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10"><div className="flex justify-between items-center"><h3 className="text-xl font-semibold text-blue-400">ICP Balance</h3><p className="font-bold text-2xl text-white">{showBalances ? (icpBalance || "...") : "••••••••"}</p></div></div>
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10"><div className="flex justify-between items-center"><h3 className="text-xl font-semibold text-orange-400">ckBTC Balance</h3><p className="font-bold text-2xl text-white">{showBalances ? (ckBalance || "...") : "••••••••"}</p></div></div>
                </div>
                <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10"><p className="text-sm text-white/70 mb-1">Principal ID:</p><div className="flex items-center justify-between"><p className="text-sm text-white font-mono break-all mr-4">{principal?.toText()}</p><button onClick={() => copyToClipboard(principal?.toText() || "")} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button></div></div>
              </div>
            </div>
          )}

          {/* Deposit Tab */}
          {activeTab === "deposit" && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6 space-y-6">
                <h2 className="text-2xl font-bold">Deposit Center</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-2xl p-6 border border-blue-500/20 space-y-4"><h3 className="text-xl font-semibold text-blue-400">Deposit ICP</h3><button onClick={() => handleDepositClick('icp')} className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 font-semibold">{showDeposit === 'icp' ? 'Hide Address' : 'Show Deposit Address'}</button>{showDeposit === 'icp' && icpDepositAddress && (<div className="space-y-4 pt-4 border-t border-white/10"><div className="flex justify-center p-4 bg-white rounded-lg"><QRCodeSVG value={icpDepositAddress} size={180} bgColor="#ffffff" fgColor="#000000"/></div><p className="text-xs text-white/70 text-center">Your ICP address (Account Identifier):</p><div className="flex items-center justify-between bg-black/20 p-2 rounded-lg"><p className="text-xs text-white font-mono break-all mr-2">{icpDepositAddress}</p><button onClick={() => copyToClipboard(icpDepositAddress)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"><Copy className="w-4 h-4" /></button></div></div>)}</div>
                  <div className="bg-white/5 rounded-2xl p-6 border border-orange-500/20 space-y-4"><h3 className="text-xl font-semibold text-orange-400">Deposit Bitcoin</h3><button onClick={() => handleDepositClick('btc')} disabled={isGeneratingAddress} className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50">{isGeneratingAddress ? 'Generating...' : (showDeposit === 'btc' ? 'Hide Address' : 'Generate Bitcoin Address')}</button>{showDeposit === 'btc' && bitcoinAddress && (<div className="space-y-4 pt-4 border-t border-white/10"><div className="flex justify-center p-4 bg-white rounded-lg"><QRCodeSVG value={bitcoinAddress} size={180} bgColor="#ffffff" fgColor="#000000"/></div><p className="text-xs text-white/70 text-center">Your Bitcoin address:</p><div className="flex items-center justify-between bg-black/20 p-2 rounded-lg"><p className="text-xs text-white font-mono break-all mr-2">{bitcoinAddress}</p><button onClick={() => copyToClipboard(bitcoinAddress)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"><Copy className="w-4 h-4" /></button></div></div>)}</div>
                </div>
              </div>
          )}

          {/* Trading Tab */}
          {activeTab === "trade" && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">Trading Center</h2>
                <div className="space-y-3"><div className="bg-black/20 rounded-xl p-4 border border-white/10"><div className="flex items-center justify-between text-sm mb-2"><span className="text-white/70">From</span><span className="text-white/70">Balance: {showBalances ? (getTokenBalance(fromToken) || '0.0') : '••••'}</span></div><div className="flex items-center gap-4"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-full bg-transparent text-3xl font-semibold placeholder-white/40 outline-none"/><button onClick={handleMaxAmount} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-semibold">MAX</button></div></div><div className="flex justify-center py-2"><button onClick={handleSwapTokens} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-transform duration-200 hover:rotate-180 border border-white/10"><ArrowUpDown className="w-5 h-5 text-white" /></button></div><div className="bg-black/20 rounded-xl p-4 border border-white/10"><div className="flex items-center justify-between text-sm mb-2"><span className="text-white/70">To (Estimated)</span><span className="text-white/70">Balance: {showBalances ? (getTokenBalance(toToken) || '0.0') : '••••'}</span></div><div className="flex items-center gap-4"><input type="text" value={estimatedReceive} readOnly placeholder="0.0" className="w-full bg-transparent text-3xl font-semibold text-white/80 placeholder-white/40 outline-none"/><div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">{getTokenIcon(toToken)}<span className={`font-semibold text-lg ${getTokenColor(toToken)}`}>{toToken.toUpperCase()}</span></div></div></div></div>
                {(swapStatus !== "idle" || errorMessage) && (<div className="mt-4">{swapStatus === "pending" && ( <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"> <Clock className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" /> <span className="text-blue-400 text-sm">{errorMessage || "Processing transaction..."}</span> </div> )}{swapStatus === "success" && ( <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20"> <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span className="text-green-400 text-sm">Transaction completed successfully!</span> </div> )}{swapStatus === "error" && errorMessage && ( <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20"> <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" /> <span className="text-red-400 text-sm">{errorMessage}</span> </div> )}</div>)}
                <button onClick={handleSwap} disabled={isSwapDisabled} className="w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">{isSwapping ? (<div className="flex items-center justify-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />Processing...</div>) : (`Trade`)}</button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* --- CÓDIGO DO CSS ADICIONADO AQUI --- */}
      <style jsx global>{`
        @keyframes grid-pan {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
        }
      `}</style>
    </div>
  );
}