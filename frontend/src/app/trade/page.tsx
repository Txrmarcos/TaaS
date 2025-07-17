"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth"; // Presume-se que este hook forneça { principal, identity, agent }
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
  Clock
} from "lucide-react";

// Imports para interagir com a IC
import { HttpAgent, Actor } from "@dfinity/agent";
import { LedgerCanister } from "@dfinity/ledger-icp";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

// --- CONSTANTES DE CANISTERS ---
const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const CK_BTC_LEDGER_CANISTER_ID = "mxzaz-hqaaa-aaaar-qaada-cai";
// IMPORTANTE: Substitua pelo Canister ID do seu DEX/Swap de preferência (ex: ICPSwap, Sonic, etc.)
const SWAP_CANISTER_ID = "c3b2i-rqaaa-aaaak-qbfia-cai"; // Exemplo: ICPSwap Router

// --- DEFINIÇÃO DA INTERFACE (CANDID) DO CANISTER DE SWAP ---
// Esta é uma interface de exemplo. A interface real pode variar dependendo do DEX.
const swapCanisterIdl = ({ IDL }) => {
  const TransferArgs = IDL.Record({
      'to': IDL.Principal,
      'amount': IDL.Nat,
  });
  const Result = IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text });

  return IDL.Service({
    // Função para trocar tokens baseados em ICRC (como ckBTC)
    'swap_icrc_to_icp': IDL.Func([TransferArgs], [Result], []),
    // Função para trocar ICP por um token ICRC
    'swap_icp_to_icrc': IDL.Func([TransferArgs], [Result], []),
    // Função para obter o endereço de depósito de ICP do canister de swap
    'get_icp_deposit_address': IDL.Func([], [IDL.Text], ['query']),
  });
};


export default function TradingPage() {
  // O hook useAuth DEVE fornecer um 'agent' autenticado para assinar transações.
  const { principal, agent, isLoading: authLoading } = useAuth();

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

  // A taxa de câmbio deve ser obtida do canister de swap/DEX
  const [exchangeRate, setExchangeRate] = useState<number>(0.00002); // 1 ICP = 0.00002 BTC (exemplo)

  // --- LÓGICA DE BUSCA DE SALDOS ---
  const fetchBalances = async (userPrincipal: Principal, authAgent: HttpAgent) => {
    setIsLoadingBalance(true);
    try {
      // Fetch ICP Balance
      const icpLedger = LedgerCanister.create({ agent: authAgent, canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID) });
      const icpBalanceResult = await icpLedger.accountBalance({ accountIdentifier: userPrincipal.toAccountId().toHex() });
      setIcpBalance((Number(icpBalanceResult) / 1e8).toFixed(8));

      // Fetch ckBTC Balance
      const ckBTCLedger = IcrcLedgerCanister.create({ agent: authAgent, canisterId: Principal.fromText(CK_BTC_LEDGER_CANISTER_ID) });
      const ckBTCBalanceResult = await ckBTCLedger.balance({ owner: userPrincipal });
      setCkBalance((Number(ckBTCBalanceResult) / 1e8).toFixed(8));

    } catch (error) {
      console.error("Erro ao buscar saldos:", error);
      setIcpBalance("0.00000000");
      setCkBalance("0.00000000");
      setErrorMessage("Não foi possível carregar os saldos.");
      setSwapStatus("error");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Efeito para buscar saldos quando o principal do usuário estiver disponível
  useEffect(() => {
    if (principal && agent) {
      fetchBalances(principal, agent);
    }
  }, [principal, agent]);

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
    // Validações iniciais
    if (!agent || !principal || !amount || Number(amount) <= 0) {
      setErrorMessage("Por favor, conecte sua carteira e insira um valor válido.");
      return;
    }

    setIsSwapping(true);
    setSwapStatus("pending");
    setErrorMessage("");

    try {
      // Converte o valor para o formato BigInt com 8 casas decimais (e8s)
      const amountInE8s = BigInt(Math.floor(Number(amount) * 1e8));
      
      // Cria um ator para o canister de swap
      const swapActor = Actor.createActor(swapCanisterIdl, {
        agent,
        canisterId: Principal.fromText(SWAP_CANISTER_ID),
      });

      if (fromToken === 'ckbtc' && toToken === 'icp') {
        // --- LÓGICA PARA TROCAR ckBTC -> ICP ---
        
        // 1. Aprovar o canister de swap para gastar o ckBTC
        setErrorMessage("Aprovando a transação na sua carteira...");
        const ckBTCLedger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(CK_BTC_LEDGER_CANISTER_ID) });
        const approvalResult = await ckBTCLedger.approve({
          spender: Principal.fromText(SWAP_CANISTER_ID),
          amount: amountInE8s,
        });

        if ('Err' in approvalResult) {
          throw new Error(`Falha na aprovação do ckBTC: ${JSON.stringify(approvalResult.Err)}`);
        }

        // 2. Chamar a função de swap no canister DEX
        setErrorMessage("Processando a troca...");
        const swapResult = await swapActor.swap_icrc_to_icp({
            to: principal,
            amount: amountInE8s,
        });

        if ('Err' in swapResult) {
            throw new Error(`Erro no swap: ${swapResult.Err}`);
        }

      } else if (fromToken === 'icp' && toToken === 'ckbtc') {
        // --- LÓGICA PARA TROCAR ICP -> ckBTC ---
        
        // 1. Obter o endereço de depósito de ICP do canister de swap
        setErrorMessage("Obtendo endereço de depósito...");
        const depositAddress = await swapActor.get_icp_deposit_address();

        // 2. Transferir ICP para o endereço de depósito
        setErrorMessage("Transferindo ICP...");
        const icpLedger = LedgerCanister.create({ agent, canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID) });
        const blockHeight = await icpLedger.transfer({
            to: depositAddress,
            amount: amountInE8s,
            // Taxa padrão de transação do ICP
            fee: BigInt(10000), 
        });

        if (!blockHeight) {
            throw new Error("A transferência de ICP falhou.");
        }
        
        // 3. Notificar o canister de swap sobre o depósito para executar a troca
        setErrorMessage("Confirmando a troca...");
        const swapResult = await swapActor.swap_icp_to_icrc({
            to: principal,
            amount: amountInE8s, // O canister usará o depósito para validar
        });

        if ('Err' in swapResult) {
            throw new Error(`Erro na confirmação do swap: ${swapResult.Err}`);
        }
      }

      setSwapStatus("success");
      
      // Aguarda um pouco para a blockchain atualizar e busca os saldos novamente
      setTimeout(() => {
        fetchBalances(principal, agent);
        setAmount("");
        setEstimatedReceive("");
        setSwapStatus("idle");
      }, 3000);

    } catch (error) {
      console.error("Erro no swap:", error);
      setErrorMessage(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
      setSwapStatus("error");
    } finally {
      setIsSwapping(false);
    }
  };

  // Funções auxiliares para a UI
  const getTokenIcon = (token: "icp" | "ckbtc") => token === "icp" ? <Wallet className="w-5 h-5 text-blue-400" /> : <Bitcoin className="w-5 h-5 text-orange-400" />;
  const getTokenColor = (token: "icp" | "ckbtc") => token === "icp" ? "text-blue-400" : "text-orange-400";
  const getTokenBalance = (token: "icp" | "ckbtc") => token === "icp" ? icpBalance : ckBalance;

  const isSwapDisabled = !amount || Number(amount) <= 0 || isSwapping || !principal || !agent || authLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
      <Navbar />

      <main className="flex flex-col flex-grow items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-md">
          {/* Main Trading Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-2 text-center">Trocar Tokens</h1>
            <p className="text-white/70 text-center mb-6">
              Troque ICP e ckBTC de forma segura na blockchain.
            </p>
            
            {/* Saldos */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <span className="text-sm text-blue-400">Saldo ICP</span>
                <p className="font-mono font-bold text-lg">{isLoadingBalance ? "..." : (icpBalance || "0.00")}</p>
              </div>
              <div className="text-center">
                <span className="text-sm text-orange-400">Saldo ckBTC</span>
                <p className="font-mono font-bold text-lg">{isLoadingBalance ? "..." : (ckBalance || "0.00")}</p>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-2">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/70">De</span>
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
                <span className="text-white/70 text-xs mb-2 block">Para (Estimado)</span>
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
                    <span className="text-blue-400 text-sm">{errorMessage || "Processando transação..."}</span>
                  </div>
                )}
                {swapStatus === "success" && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm">Transação realizada com sucesso!</span>
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
                  Processando...
                </div>
              ) : (
                `Trocar`
              )}
            </button>
          </div>
        </div>  
      </main>

      <Footer />
    </div>
  );
}
