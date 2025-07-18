"use client";

import { useState, useEffect, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import { HttpAgent } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";

// A importação dinâmica é usada aqui para alinhar com o código original
// Se o pacote for usado com frequência, uma importação estática no topo é mais eficiente
// import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";

const ICP_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const CK_BTC_CANISTER_ID = "mxzaz-hqaaa-aaaar-qaada-cai";
const HOST = "https://ic0.app";

// Função auxiliar para buscar saldo de ICP
const fetchICP = async (principal: Principal): Promise<string> => {
    try {
        const agent = new HttpAgent({ host: HOST });
        const ledger = LedgerCanister.create({ agent, canisterId: Principal.fromText(ICP_CANISTER_ID) });
        const accountIdentifier = AccountIdentifier.fromPrincipal({ principal });
        const balance = await ledger.accountBalance({ accountIdentifier: accountIdentifier.toHex() });
        return (Number(balance) / 1e8).toFixed(4); // Formata para 4 casas decimais
    } catch (error) {
        console.error("Error fetching ICP balance:", error);
        return "0.0000";
    }
};

// Função auxiliar para buscar saldo de ckBTC
const fetchCkBTC = async (principal: Principal): Promise<string> => {
    try {
        const agent = new HttpAgent({ host: HOST });
        // Usando importação dinâmica como no código original
        const { IcrcLedgerCanister } = await import("@dfinity/ledger-icrc");
        const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(CK_BTC_CANISTER_ID) });
        const balance = await ledger.balance({ owner: principal });
        return (Number(balance) / 1e8).toFixed(4); // Formata para 4 casas decimais
    } catch (error) {
        console.error("Error fetching ckBTC balance:", error);
        return "0.0000";
    }
};

export const useWalletBalance = (principal: Principal | null | undefined) => {
    const [icpBalance, setIcpBalance] = useState<string | null>(null);
    const [ckBalance, setCkBalance] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refreshBalances = useCallback(async () => {
        if (!principal) return;

        setIsLoading(true);
        // Busca os saldos em paralelo
        const [icp, ckb] = await Promise.all([
            fetchICP(principal),
            fetchCkBTC(principal)
        ]);
        setIcpBalance(icp);
        setCkBalance(ckb);
        setIsLoading(false);
    }, [principal]);

    useEffect(() => {
        if (principal) {
            refreshBalances();
        }
    }, [principal, refreshBalances]);

    return { icpBalance, ckBalance, isLoading, refreshBalances };
};