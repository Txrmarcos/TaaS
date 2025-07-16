"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  ArrowUpDown, 
  Bitcoin, 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  TrendingUp,
  Clock
} from "lucide-react";

// Imports para interagir com a IC
import { HttpAgent } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

export default function TradingPage() {
  const { principal, isLoading: authLoading } = useAuth();

  // Estados para os saldos
  const [icpBalance, setIcpBalance] = useState<string | null>(null);
  const [ckBalance, setCkBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Estados para o trading
  const [fromToken, setFromToken] = useState<"icp" | "ckbtc">("ckbtc");
  const [toToken, setToToken] = useState<"icp" | "ckbtc">("icp");
  const [amount, setAmount] = useState<string>("");
  const [estimatedReceive, setEstimatedReceive] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Estado para simular taxa de câmbio (em produção, isso viria de uma API)
  const [exchangeRate, setExchangeRate] = useState<number>(0.00002); // 1 ICP = 0.00002 BTC (exemplo)

  // --- LÓGICA DE BUSCA DE SALDOS ---
  const fetchICPBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({ host: "https://ic0.app" });
      const ledger = LedgerCanister.create({ agent, canisterId: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai") });
      const accountIdentifier = AccountIdentifier.fromPrincipal({ principal: userPrincipal });
      const balance = await ledger.accountBalance({ accountIdentifier: accountIdentifier.toHex() });
      setIcpBalance((Number(balance) / 100_000_000).toFixed(8));
    } catch (error) {
      console.error("Erro ao buscar saldo ICP:", error);
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
      console.error("Erro ao buscar saldo ckBTC:", error);
      setCkBalance("0.00000000");
    }
  };

  // Efeito para buscar saldos
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

  // Efeito para calcular o valor estimado
  useEffect(() => {
    if (amount && !isNaN(Number(amount))) {
      const numAmount = Number(amount);
      let estimated = 0;
      
      if (fromToken === "ckbtc" && toToken === "icp") {
        estimated = numAmount / exchangeRate; // BTC para ICP
      } else if (fromToken === "icp" && toToken === "ckbtc") {
        estimated = numAmount * exchangeRate; // ICP para BTC
      }
      
      setEstimatedReceive(estimated.toFixed(8));
    } else {
      setEstimatedReceive("");
    }
  }, [amount, fromToken, toToken, exchangeRate]);

  // --- HANDLERS ---
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
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
    if (!amount || !principal) return;

    setIsSwapping(true);
    setSwapStatus("pending");
    setErrorMessage("");

    try {
      // Simular o processo de swap (em produção, isso seria uma transação real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o usuário tem saldo suficiente
      const availableBalance = fromToken === "icp" ? icpBalance : ckBalance;
      if (!availableBalance || Number(amount) > Number(availableBalance)) {
        throw new Error("Saldo insuficiente para realizar a transação");
      }

      // Simular sucesso (em produção, aqui seria feita a transação real)
      setSwapStatus("success");
      
      // Atualizar saldos após o swap
      setTimeout(() => {
        if (principal) {
          Promise.all([fetchICPBalance(principal), fetchCkBTCBalance(principal)]);
        }
        setAmount("");
        setEstimatedReceive("");
        setSwapStatus("idle");
      }, 2000);

    } catch (error) {
      console.error("Erro no swap:", error);
      setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido");
      setSwapStatus("error");
    } finally {
      setIsSwapping(false);
    }
  };

  const getTokenIcon = (token: "icp" | "ckbtc") => {
    return token === "icp" ? <Wallet className="w-5 h-5 text-blue-400" /> : <Bitcoin className="w-5 h-5 text-orange-400" />;
  };

  const getTokenColor = (token: "icp" | "ckbtc") => {
    return token === "icp" ? "text-blue-400" : "text-orange-400";
  };

  const getTokenBalance = (token: "icp" | "ckbtc") => {
    return token === "icp" ? icpBalance : ckBalance;
  };

  const isSwapDisabled = !amount || Number(amount) <= 0 || isSwapping || !principal;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
      <Navbar />

      <main className="flex flex-col flex-grow items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Trading</h1>
              <p className="text-white/70 text-lg">
                Troque seus tokens de forma rápida e segura
              </p>
            </div>
          </div>

          {/* Main Trading Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-8">
            
            {/* Saldos atuais */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold">ICP</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {isLoadingBalance ? "..." : (icpBalance || "0.00000000")}
                </p>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-semibold">ckBTC</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {isLoadingBalance ? "..." : (ckBalance || "0.00000000")}
                </p>
              </div>
            </div>

            {/* Taxa de câmbio */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white/70 text-sm">Taxa de Câmbio</span>
              </div>
              <p className="text-white">1 ICP = {exchangeRate} ckBTC</p>
            </div>

            {/* From Token */}
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/70">De</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm">Saldo:</span>
                    <span className="text-white font-semibold">
                      {getTokenBalance(fromToken) || "0.00000000"}
                    </span>
                    <button
                      onClick={handleMaxAmount}
                      className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-white/40 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    {getTokenIcon(fromToken)}
                    <span className={`font-semibold ${getTokenColor(fromToken)}`}>
                      {fromToken.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapTokens}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-105"
                >
                  <ArrowUpDown className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* To Token */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/70">Para</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm">Saldo:</span>
                    <span className="text-white font-semibold">
                      {getTokenBalance(toToken) || "0.00000000"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={estimatedReceive}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-white/40 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    {getTokenIcon(toToken)}
                    <span className={`font-semibold ${getTokenColor(toToken)}`}>
                      {toToken.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {swapStatus === "pending" && (
              <div className="flex items-center gap-2 mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-blue-400">Processando transação...</span>
              </div>
            )}

            {swapStatus === "success" && (
              <div className="flex items-center gap-2 mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Transação realizada com sucesso!</span>
              </div>
            )}

            {swapStatus === "error" && (
              <div className="flex items-center gap-2 mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{errorMessage || "Erro na transação"}</span>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={isSwapDisabled}
              className={`w-full mt-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isSwapDisabled
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isSwapping ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processando...
                </div>
              ) : (
                `Trocar ${fromToken.toUpperCase()} por ${toToken.toUpperCase()}`
              )}
            </button>

            {/* Transaction Details */}
            {amount && estimatedReceive && (
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-semibold mb-3">Detalhes da Transação</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Você envia:</span>
                    <span className="text-white font-semibold">
                      {amount} {fromToken.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Você recebe:</span>
                    <span className="text-white font-semibold">
                      {estimatedReceive} {toToken.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Taxa de câmbio:</span>
                    <span className="text-white font-semibold">
                      1 {fromToken.toUpperCase()} = {
                        fromToken === "icp" ? exchangeRate : (1 / exchangeRate).toFixed(8)
                      } {toToken.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Taxa de transação:</span>
                    <span className="text-white font-semibold">~0.001 ICP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">💡 Dicas de Trading</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Verifique sempre os saldos antes de fazer uma transação</li>
                <li>• As taxas de câmbio podem variar constantemente</li>
                <li>• Mantenha sempre uma reserva para taxas de transação</li>
                <li>• Transações na blockchain são irreversíveis</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-3 text-orange-400">🔒 Segurança</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Todas as transações são processadas na blockchain</li>
                <li>• Suas chaves privadas nunca saem do seu dispositivo</li>
                <li>• Verifique sempre os endereços de destino</li>
                <li>• Use conexões seguras (HTTPS) sempre</li>
              </ul>
            </div>
          </div>

          {/* Recent Transactions (Placeholder) */}
          <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">📊 Transações Recentes</h3>
            <div className="text-center py-8">
              <div className="text-white/40 mb-2">
                <Clock className="w-12 h-12 mx-auto mb-2" />
              </div>
              <p className="text-white/70">Nenhuma transação recente</p>
              <p className="text-white/50 text-sm mt-1">
                Suas transações aparecerão aqui após serem processadas
              </p>
            </div>
          </div>
        </div>  
      </main>

      <Footer />
    </div>
  );
}