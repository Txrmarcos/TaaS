"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "@/components/Navbar";
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
  EyeOff
} from "lucide-react";

// Imports para interagir com a IC
import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

// --- CONSTANTES DE CANISTERS ---
const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const CK_BTC_LEDGER_CANISTER_ID = "mxzaz-hqaaa-aaaar-qaada-cai";
const CK_BTC_MINTER_CANISTER_ID = "mqygn-kiaaa-aaaar-qaadq-cai";

// --- DEFINIÇÃO DA INTERFACE (CANDID) DO CANISTER DE SWAP ---
// Esta é uma interface de exemplo. A interface real pode variar dependendo do DEX.
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

  // Estados para o trading
  const [activeTab, setActiveTab] = useState<"wallet" | "trade" | "deposit">("wallet");
  const [fromToken, setFromToken] = useState<"icp" | "ckbtc">("ckbtc");
  const [toToken, setToToken] = useState<"icp" | "ckbtc">("icp");
  const [amount, setAmount] = useState<string>("");
  const [estimatedReceive, setEstimatedReceive] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // A taxa de câmbio deve ser obtida do canister de swap/DEX
  const [exchangeRate, setExchangeRate] = useState<number>(0.00002); // 1 ICP = 0.00002 BTC (exemplo)

  // --- LÓGICA DE BUSCA DE SALDOS ---
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

  // Função para gerar endereço ICP
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

  // Função para gerar endereço Bitcoin
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

  // Efeito para buscar saldos quando o principal do usuário estiver disponível
  useEffect(() => {
    if (isAuthenticated && principal) {
      fetchBalances();
      generateIcpDepositAddress(principal);
    }
  }, [isAuthenticated, principal]);

  // Efeito para calcular o valor estimado a receber
  useEffect(() => {
    if (amount && !isNaN(Number(amount)) && exchangeRate > 0) {
      const numAmount = Number(amount);
      let estimated = 0;
      
      if (fromToken === "ckbtc") {
        estimated = numAmount / exchangeRate; // ckBTC para ICP
      } else {
        estimated = numAmount * exchangeRate; // ICP para ckBTC
      }
      
      setEstimatedReceive(estimated.toFixed(8));
    } else {
      setEstimatedReceive("");
    }
  }, [amount, fromToken, exchangeRate]);


  // --- HANDLERS ---
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
      // Simulate swap - replace with actual swap logic
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

  // Funções auxiliares para a UI
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
        <Navbar />
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
    <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
      <Navbar />

      <main className="flex flex-col flex-grow items-center justify-start px-4 pt-32 pb-20">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <PiggyBank className="w-10 h-10 text-purple-400" />
              Financial Center
            </h1>
            <p className="text-white/70 text-lg">
              Manage your assets, make deposits and trade tokens
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-2 flex gap-2">
              <button
                onClick={() => setActiveTab("wallet")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "wallet"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Wallet className="w-5 h-5" />
                Wallet
              </button>
              <button
                onClick={() => setActiveTab("deposit")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "deposit"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Deposit
              </button>
              <button
                onClick={() => setActiveTab("trade")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "trade"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Trading
              </button>
            </div>
          </div>

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              {/* Balance Overview */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    Balance Overview
                  </h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowBalances(!showBalances)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={isLoadingBalance}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                      {isLoadingBalance ? "Updating..." : "Refresh"}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ICP Balance Card */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                          <span className="text-blue-400 font-bold text-xl">∞</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">ICP</h3>
                          <p className="text-white/60 text-sm">Internet Computer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">
                          {showBalances ? (icpBalance || "0.00000000") : "••••••"}
                        </p>
                        <p className="text-white/60 text-sm">ICP</p>
                      </div>
                    </div>
                  </div>

                  {/* ckBTC Balance Card */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-6 border border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mr-4">
                          <Bitcoin className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">ckBTC</h3>
                          <p className="text-white/60 text-sm">Chain-key Bitcoin</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-400">
                          {showBalances ? (ckBalance || "0.00000000") : "••••••"}
                        </p>
                        <p className="text-white/60 text-sm">ckBTC</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Principal Info */}
                <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/70 mb-2">Principal ID:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-mono break-all mr-2">
                      {principal?.toText()}
                    </p>
                    <button
                      onClick={() => copyToClipboard(principal?.toText() || "")}
                      className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded transition-all duration-200 text-xs whitespace-nowrap"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deposit Tab */}
          {activeTab === "deposit" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-green-400" />
                  Deposit Center
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ICP Deposit Card */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-400 font-bold">∞</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Deposit ICP</h3>
                          <p className="text-white/60 text-sm">Internet Computer Protocol</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDepositClick('icp')}
                      className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 font-semibold mb-4"
                    >
                      {showDeposit === 'icp' ? 'Hide Address' : 'Show Deposit Address'}
                    </button>

                    {showDeposit === 'icp' && icpDepositAddress && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-xs text-white/70 mb-2">Your ICP address (Account Identifier):</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white font-mono break-all mr-2">{icpDepositAddress}</p>
                          <button
                            onClick={() => copyToClipboard(icpDepositAddress)}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded transition-all duration-200 text-xs whitespace-nowrap"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-blue-400 text-sm font-semibold mb-2">ℹ️ Instructions:</p>
                          <div className="text-white/80 text-xs space-y-1">
                            <p>• Send ICP to the Account Identifier above</p>
                            <p>• Minimum amount: 0.0001 ICP</p>
                            <p>• Transactions are processed almost instantly</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bitcoin Deposit Card */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-6 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mr-3">
                          <Bitcoin className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Deposit Bitcoin</h3>
                          <p className="text-white/60 text-sm">Converted to ckBTC</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDepositClick('btc')}
                      disabled={isGeneratingAddress}
                      className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg transition-all duration-200 font-semibold mb-4 disabled:opacity-50"
                    >
                      {isGeneratingAddress ? 'Generating...' : (showDeposit === 'btc' ? 'Hide Address' : 'Generate Bitcoin Address')}
                    </button>

                    {showDeposit === 'btc' && bitcoinAddress && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-xs text-white/70 mb-2">Your Bitcoin address:</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white font-mono break-all mr-2">{bitcoinAddress}</p>
                          <button
                            onClick={() => copyToClipboard(bitcoinAddress)}
                            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded transition-all duration-200 text-xs whitespace-nowrap"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                          <p className="text-orange-400 text-sm font-semibold mb-2">ℹ️ Instructions:</p>
                          <div className="text-white/80 text-xs space-y-1">
                            <p>• Send Bitcoin to the address above</p>
                            <p>• Minimum amount: 0.001 BTC</p>
                            <p>• After confirmation, you will receive ckBTC</p>
                            <p>• Process may take a few hours</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trading Tab */}
          {activeTab === "trade" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-2 text-center flex items-center justify-center gap-3">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  Trading Center
                </h2>
                <p className="text-white/70 text-center mb-6">Trade ICP and ckBTC securely on the blockchain.</p>
                
                {/* From Token */}
                <div className="space-y-2">
                  <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-white/70">From</span>
                      <button onClick={handleMaxAmount} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-xs">
                        MAX
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-full bg-transparent text-2xl font-bold placeholder-white/40 outline-none"/>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                        {getTokenIcon(fromToken)}
                        <span className={`font-semibold ${getTokenColor(fromToken)}`}>{fromToken.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center py-2">
                    <button onClick={handleSwapTokens} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-transform duration-200 hover:rotate-180">
                      <ArrowUpDown className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* To Token */}
                  <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                    <span className="text-white/70 text-xs mb-2 block">To (Estimated)</span>
                    <div className="flex items-center gap-4">
                      <input type="text" value={estimatedReceive} readOnly placeholder="0.0" className="w-full bg-transparent text-2xl font-bold text-white/80 placeholder-white/40 outline-none"/>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                        {getTokenIcon(toToken)}
                        <span className={`font-semibold ${getTokenColor(toToken)}`}>{toToken.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {(swapStatus !== "idle" || errorMessage) && (
                  <div className="mt-6">
                    {swapStatus === "pending" && (
                      <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-blue-400 text-sm">{errorMessage || "Processing transaction..."}</span>
                      </div>
                    )}
                    {swapStatus === "success" && (
                      <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-green-400 text-sm">Transaction completed successfully!</span>
                      </div>
                    )}
                    {swapStatus === "error" && errorMessage && (
                      <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{errorMessage}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  disabled={isSwapDisabled}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    isSwapDisabled
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {isSwapping ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Trade`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
