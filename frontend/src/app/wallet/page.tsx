"use client";
import React, { useState } from "react";
import {
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    MessageSquare,
    Briefcase,
    PlusCircle,
    ShoppingCart,
} from "lucide-react";

// Dados de exemplo para as transações (expandidos para demonstrar a rolagem)
const mockTransactions = [
    {
        id: 1,
        type: "request",
        description: 'Verdict: "Inflation in Brazil > 3% in Jun/2025"',
        amount: -0.05,
        date: "2025-07-12",
        status: "Completed",
    },
    {
        id: 2,
        type: "deposit",
        description: "Deposit using PIX",
        amount: 50.0,
        date: "2025-07-11",
        status: "Completed",
    },
    {
        id: 3,
        type: "subscription",
        description: "Pro Plan Subscription",
        amount: -19.9,
        date: "2025-07-01",
        status: "Completed",
    },
    {
        id: 4,
        type: "request",
        description: 'Parsing: "Unemployment fell in May 2024"',
        amount: -0.01,
        date: "2025-06-28",
        status: "Completed",
    },
    {
        id: 5,
        type: "request",
        description: 'Verdict: "ACME stocks rose 5%?"',
        amount: -0.05,
        date: "2025-06-25",
        status: "Completed",
    },
    {
        id: 6,
        type: "deposit",
        description: "Deposit using Credit Card",
        amount: 100.0,
        date: "2025-06-20",
        status: "Completed",
    },
    {
        id: 7,
        type: "request",
        description: 'Verdict: "US GDP grew in Q2 2025?"',
        amount: -0.05,
        date: "2025-06-18",
        status: "Completed",
    },
    {
        id: 8,
        type: "request",
        description: 'Parsing: "ECB interest rate"',
        amount: -0.01,
        date: "2025-06-15",
        status: "Completed",
    },
    {
        id: 9,
        type: "request",
        description: 'Verdict: "Did it rain in São Paulo on 10/06/2025?"',
        amount: -0.05,
        date: "2025-06-10",
        status: "Completed",
    },
    {
        id: 10,
        type: "subscription",
        description: "Purchase of 1000 credits",
        amount: -9.9,
        date: "2025-06-05",
        status: "Completed",
    },
    {
        id: 11,
        type: "request",
        description: 'Verdict: "Candidate X won the debate?"',
        amount: -0.05,
        date: "2025-06-02",
        status: "Completed",
    },
    {
        id: 12,
        type: "deposit",
        description: "Deposit using PIX",
        amount: 25.0,
        date: "2025-06-01",
        status: "Completed",
    },
];

// Componente para renderizar o ícone de cada tipo de transação
const TransactionIcon = ({ type }: any) => {
    switch (type) {
        case "deposit":
            return <ArrowDownCircle className="w-6 h-6 text-green-400" />;
        case "request":
            return <MessageSquare className="w-6 h-6 text-purple-400" />;
        case "subscription":
            return <Briefcase className="w-6 h-6 text-yellow-400" />;
        default:
            return <ArrowUpCircle className="w-6 h-6 text-red-400" />;
    }
};

export default function WalletPage() {
    const [filter, setFilter] = useState("all");

    const filteredTransactions = mockTransactions
        .filter((tx) => {
            if (filter === "all") return true;
            if (filter === "deposits")
                return tx.type === "deposit" || tx.type === "subscription";
            if (filter === "usage") return tx.type === "request";
            return false;
        })
        .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

    const currentBalance = mockTransactions.reduce(
        (acc, tx) => acc + tx.amount,
        0
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold mb-4">My Wallet</h1>
                <p className="text-lg text-gray-300 mb-10">
                    Manage your balance, credits, and view your usage history.
                </p>

                {/* Card de Saldo Principal */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Wallet className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">
                                    Current Balance
                                </p>
                                <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                                    R${" "}
                                    {currentBalance
                                        .toFixed(2)
                                        .replace(".", ",")}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-2 px-5 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 font-semibold">
                                <PlusCircle className="w-5 h-5" />
                                <span>Deposit</span>
                            </button>
                            <button className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg font-semibold">
                                <ShoppingCart className="w-5 h-5" />
                                <span>Buy Credits</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Seção de Histórico de Transações */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-white">
                            Transaction History
                        </h2>

                        {/* Filtros */}
                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                    filter === "all"
                                        ? "bg-white/20 text-white"
                                        : "bg-transparent text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                Everyone
                            </button>
                            <button
                                onClick={() => setFilter("deposits")}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                    filter === "deposits"
                                        ? "bg-white/20 text-white"
                                        : "bg-transparent text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                Deposits and Purchases
                            </button>
                            <button
                                onClick={() => setFilter("usage")}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                    filter === "usage"
                                        ? "bg-white/20 text-white"
                                        : "bg-transparent text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                Usage of Chatbot
                            </button>
                        </div>
                    </div>

                    {/* Lista de Transações com Rolagem */}
                    <div className="max-h-[500px] overflow-y-auto">
                        <div className="divide-y divide-white/10">
                            {filteredTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-white/5 p-3 rounded-full">
                                            <TransactionIcon type={tx.type} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">
                                                {tx.description}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(
                                                    tx.date
                                                ).toLocaleDateString("pt-BR", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`font-bold text-lg ${
                                                tx.amount > 0
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {tx.amount > 0
                                                ? `+R$ ${tx.amount
                                                      .toFixed(2)
                                                      .replace(".", ",")}`
                                                : `-R$ ${Math.abs(tx.amount)
                                                      .toFixed(2)
                                                      .replace(".", ",")}`}
                                        </p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="p-10 text-center text-gray-400">
                                    <p>
                                        No transactions found for this filter.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
