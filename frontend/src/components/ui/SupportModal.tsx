"use client";
import React from "react";
import { X, HandCoins, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Ed25519KeyIdentity } from "@dfinity/identity";

// --- MOCKS E IDs ---
const mockIdentity = Ed25519KeyIdentity.generate();
const mockUserPrincipal = mockIdentity.getPrincipal().toText();
const CKBTC_LEDGER_ID = "mxzaz-hqaaa-aaaar-qaada-cai";

// ETAPA 1: CRIAR UMA FUNÇÃO AUXILIAR PARA O JSON.stringify
// Esta função ensina o JSON a converter BigInt para string.
function jsonReplacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

function formatCkBTC(v: number) {
  if (!Number.isFinite(v)) return "—";
  // mostra 6 casas, cai pra notação científica se for muito pequeno
  return v < 0.000001 ? v.toExponential(2) : v.toFixed(6);
}

function CopyPrincipalBtn({ principal }: { principal: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition"
      title="Copy principal"
      aria-live="polite"
    >
      {copied ? (
        // Check
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-400" fill="currentColor">
          <path d="M9 16.17l-3.88-3.88L4 13.41 9 18.41 20.59 6.83 19.17 5.41z"/>
        </svg>
      ) : (
        // Copy
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/70" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      )}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// --- IDL FACTORY PARA O LEDGER CKBTC ---
const ckbtcIdlFactory = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    'owner': IDL.Principal,
    'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  return IDL.Service({
    'icrc1_transfer': IDL.Func(
      [IDL.Record({ 
        'to': Account,
        'amount': IDL.Nat, 
        'fee': IDL.Opt(IDL.Nat), 
        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)), 
        'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)), 
        'created_at_time': IDL.Opt(IDL.Nat64) 
      })], 
      [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Variant({
        'GenericError': IDL.Record({'message': IDL.Text, 'error_code': IDL.Nat}),
        'TemporarilyUnavailable': IDL.Null,
        'BadBurn': IDL.Record({'min_burn_amount': IDL.Nat}),
        'Duplicate': IDL.Record({'duplicate_of': IDL.Nat}),
        'BadFee': IDL.Record({'expected_fee': IDL.Nat}),
        'CreatedInFuture': IDL.Record({'ledger_time': IDL.Nat64}),
        'TooOld': IDL.Null,
        'InsufficientFunds': IDL.Record({'balance': IDL.Nat}),
      }) })], 
      []
    )
  });
};

// --- FUNÇÃO DE TRANSFERÊNCIA CKBTC ---
async function transferCkBTC(userIdentity: any, toPrincipal: string, amountE8s: bigint) {
  const agent = new HttpAgent({ host: "https://icp0.io", identity: userIdentity });
  if (process.env.NODE_ENV !== "production") {
    await agent.fetchRootKey().catch(console.warn);
  }
  
  const ledger = Actor.createActor(ckbtcIdlFactory, { agent, canisterId: CKBTC_LEDGER_ID });
  
  return await ledger.icrc1_transfer({ 
    to: {
      owner: Principal.fromText(toPrincipal),
      subaccount: [],
    }, 
    amount: amountE8s, 
    fee: [], 
    memo: [], 
    from_subaccount: [], 
    created_at_time: [] 
  });
}

// --- COMPONENTE ---
type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';

type Props = {
  open: boolean;
  onClose: () => void;
  recipientPrincipal: string;
  userIdentity?: any;
  userPrincipalId?: string;
  quickAmounts?: number[];
  defaultAmount?: number;
  supporters?: number;
  goal?: number;
  url?: string;
  onSupportSuccess?: (amount: number, txId: any) => void;
  onSupportError?: (error: string) => void;
  id?: string | number; 
  onConfirm?: (amount: number) => Promise<void>;
  processing?: boolean;
};

export default function SupportModal({
  open,
  onClose,
  recipientPrincipal,
  userIdentity = mockIdentity,
  userPrincipalId = mockUserPrincipal,
  quickAmounts = [2, 5, 10],
  defaultAmount = 5,
  supporters = 0,
  goal = 0,
  url,
  onSupportSuccess,
  onSupportError,
}: Props) {
  const [amount, setAmount] = React.useState<number>(defaultAmount);
  const [custom, setCustom] = React.useState<string>("");
  const [status, setStatus] = React.useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      setAmount(defaultAmount);
      setCustom("");
      setStatus('idle');
      setErrorMessage("");
    }
  }, [open, defaultAmount]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const chosen = custom.trim() !== "" ? Math.max(1, Number(custom.trim())) : amount;
  const progress = goal > 0 ? Math.min(100, Math.round(((supporters ?? 0) / goal) * 100)) : 0;
  const brandGradient = "bg-gradient-to-r from-[#FF007A] to-[#FF4D00] text-white";

  const usdToCkBTC = (usdAmount: number): bigint => {
    const ckBtcPrice = 68000;
    const ckBtcAmount = usdAmount / ckBtcPrice;
    return BigInt(Math.floor(ckBtcAmount * 100_000_000));
  };

  const handleSupport = async () => {
    if (!userIdentity || !recipientPrincipal) {
      setErrorMessage("Required information is missing (user or recipient).");
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMessage("");

    try {
      const amountE8s = usdToCkBTC(chosen);
      if (amountE8s <= 1000 ) {
        throw new Error("Amount is too small for a ckBTC transfer.");
      }

      console.log(`Attempting to transfer ${amountE8s} e8s to ${recipientPrincipal}`);
      const transferResult: any = await transferCkBTC(userIdentity, recipientPrincipal, amountE8s);
      
      if ('Err' in transferResult) {
        const errorKey = Object.keys(transferResult.Err)[0];
        const errorDetails = transferResult.Err[errorKey];

        // ETAPA 2: USAR A FUNÇÃO AUXILIAR AQUI
        const errorDetailsString = JSON.stringify(errorDetails, jsonReplacer);
        
        throw new Error(`ckBTC Transfer Failed: ${errorKey} - ${errorDetailsString}`);
      }
      
      const ckbtcTxId = transferResult.Ok;
      console.log(`ckBTC Transfer Successful! TxId: ${ckbtcTxId}`);

      setStatus('success');
      onSupportSuccess?.(chosen, ckbtcTxId);
      
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(errorMsg);
      setStatus('error');
      onSupportError?.(errorMsg);
    }
  };

  const renderContent = () => {
    if (status === 'success') {
      return (
        <div className="px-4 pb-4 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Support Sent!</h4>
            <p className="text-sm text-white/80">
              Your ${chosen} support has been successfully transferred.
            </p>
          </div>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Transaction Failed</span>
          </div>
          <p className="text-sm text-white/70 text-center break-words">{errorMessage}</p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/15 transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="px-4 pb-4 space-y-4">
        {goal > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>{supporters ?? 0} supporters</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF007A] to-[#FF4D00]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-sm text-white/80">
          Choose an amount or enter a custom value:
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => { setAmount(q); setCustom(""); }}
              disabled={status === 'processing'}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${amount === q && custom === "" ? brandGradient : "bg-white/10 text-white/80 hover:bg-white/15"} ${status === 'processing' ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              ${q}
            </button>
          ))}

          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1.5">
            <span className="text-xs text-white/60">$</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
              disabled={status === 'processing'}
              className="w-20 bg-transparent outline-none text-xs text-white placeholder-white/40 disabled:opacity-50"
            />
          </div>
        </div>

        {userPrincipalId && (
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Card: Autenticação */}
            <section className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* ShieldCheck */}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400" fill="currentColor">
                    <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4zm0 2.2L7 6.5v5.4c0 3.9 2.7 7.3 5 8.3 2.3-1 5-4.4 5-8.3V6.5l-5-2.3z"/><path d="M10.5 12.8l-1.7-1.7-1.1 1.1 2.8 2.8 5-5-1.1-1.1z"/>
                  </svg>
                  <span className="text-xs font-semibold text-white/80">Authenticated</span>
                </div>

                {/* Copiar principal */}
                <CopyPrincipalBtn principal={userPrincipalId} />
              </div>

              <p className="mt-1 font-mono text-xs text-white/70 break-all">
                {userPrincipalId.slice(0, 8)}...{userPrincipalId.slice(-8)}
              </p>
            </section>

            {/* Card: Conversão para ckBTC */}
            <section className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                {/* Coins */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="currentColor">
                  <path d="M12 2C7.58 2 4 3.79 4 6s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zm0 6c-3.31 0-6-.9-6-2s2.69-2 6-2 6 .9 6 2-2.69 2-6 2z"/><path d="M4 10v4c0 2.21 3.58 4 8 4s8-1.79 8-4v-4c-1.74 1.51-5.01 2-8 2s-6.26-.49-8-2zm0 6v2c0 2.21 3.58 4 8 4s8-1.79 8-4v-2c-1.74 1.51-5.01 2-8 2s-6.26-.49-8-2z"/>
                </svg>
                <span className="text-xs font-semibold text-white/80">Conversion</span>
              </div>

              <p className="mt-1 text-sm text-white/90">
                ${chosen}
                <span className="mx-1 text-white/50">≈</span>
                {formatCkBTC(Number(usdToCkBTC(chosen)) / 100_000_000)} ckBTC
              </p>

              <p className="text-[11px] text-white/50 mt-1">
                Network fees not included.
              </p>
            </section>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white underline underline-offset-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Read original
            </a>
          ) : <span />}

          <button
            onClick={handleSupport}
            disabled={status === 'processing' || !userIdentity}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition active:scale-95 ${brandGradient} ${status === 'processing' || !userIdentity ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <HandCoins className="w-4 h-4" />
            {status === 'processing' ? "Processing…" : !userIdentity ? "Please Login" : `Support $${chosen}`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
        disabled={status === 'processing'}
      />

      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-[22px] p-[2px] bg-gradient-to-br from-[#FF007A] to-[#FF4D00]">
          <div className="rounded-[20px] bg-[#0B0E13] border border-white/10 shadow-2xl">
            <div className="p-4 pb-3 relative">
              <h3 className="text-lg font-semibold text-white pr-10">
                {status === 'success' ? 'Support Sent!' : 'Support this article'}
              </h3>
              <button
                onClick={onClose}
                disabled={status === 'processing'}
                className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}