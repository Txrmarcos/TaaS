"use client";

import React, { useEffect, useState } from "react";
import { botActor } from "../utils/canister"; // Ajuste para o seu path correto

type Plan = "Standard" | "Pro" | "Premium";

type UserStatus = {
  plan: Plan;
  requestsLeft: number;
  resetAt: bigint;
};

export default function BotPage() {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [message, setMessage] = useState("");

  const fetchStatus = async () => {
    try {
      const s = await botActor.get_user_status();
      if (s !== null) {
        setStatus(s as UserStatus);
      } else {
        setStatus(null);
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao buscar status.");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const subscribe = async (plan: Plan) => {
    try {
      const res = await botActor.subscribe({ [plan]: null });
      setMessage(res as string);
      fetchStatus();
    } catch (err) {
      console.error(err);
      setMessage("Erro ao assinar plano.");
    }
  };

  const useRequest = async () => {
    try {
      const res = await botActor.use_request();
      setMessage(res as string);
      fetchStatus();
    } catch (err) {
      console.error(err);
      setMessage("Erro ao usar request.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-violet-700 to-pink-700 p-6 text-white">
      <header className="flex items-center justify-between mb-8 border-b border-purple-500 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold">🛡️ TaaS</span>
          <span className="text-green-400 text-sm">• On-Chain</span>
        </div>
        <nav className="space-x-2">
          <button className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-4 py-1 rounded shadow hover:opacity-80 transition">🔎 Verificar</button>
          <button className="bg-white text-purple-700 px-4 py-1 rounded shadow hover:bg-purple-100 transition">🤖 Bot Plans</button>
        </nav>
      </header>

      <h1 className="text-3xl font-extrabold text-center mb-6">🤖 Gerenciamento de Plano do Bot</h1>

      <div className="max-w-md mx-auto bg-white/10 rounded-xl p-6 mb-8 shadow-xl backdrop-blur-md">
        {status ? (
          <div>
            <p className="text-lg mb-2">
              Plano atual: <span className="font-bold">{status.plan}</span>
            </p>
            <p>
              Requests restantes hoje: <span className="font-bold">{status.requestsLeft}</span>
            </p>
            {status && status.resetAt && (
              <p>
                Reset em: {
                  (new Date(Number(BigInt(status.resetAt) / BigInt(1000000)))).toLocaleString('pt-BR')
                }
              </p>
            )}
          </div>
        ) : (
          <p className="text-center mb-4">Nenhum plano ativo.</p>
        )}

        <button
          onClick={useRequest}
          className="w-full py-2 bg-green-500 text-black font-bold rounded mt-4 hover:bg-green-600 transition"
        >
          🚀 Usar Request
        </button>

        <p className="mt-2 text-sm">{message}</p>
      </div>

      <h2 className="text-2xl font-bold text-center mb-4">💎 Escolher Plano</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 p-4 rounded-xl text-center shadow-lg backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-2">Standard</h3>
          <p className="mb-4">5 requests/dia • Grátis</p>
          <button
            onClick={() => subscribe("Standard")}
            className="w-full py-2 bg-cyan-400 text-black font-bold rounded hover:bg-cyan-500 transition"
          >
            Assinar Grátis
          </button>
        </div>

        <div className="bg-white/10 p-4 rounded-xl text-center shadow-lg backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-2">Pro</h3>
          <p className="mb-4">50 requests/dia • $19,90/mês</p>
          <button
            onClick={() => subscribe("Pro")}
            className="w-full py-2 bg-purple-500 text-white font-bold rounded hover:bg-purple-600 transition"
          >
            Assinar Pro
          </button>
        </div>

        <div className="bg-white/10 p-4 rounded-xl text-center shadow-lg backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-2">Premium</h3>
          <p className="mb-4">500 requests/dia • $99,90/mês</p>
          <button
            onClick={() => subscribe("Premium")}
            className="w-full py-2 bg-pink-500 text-white font-bold rounded hover:bg-pink-600 transition"
          >
            Assinar Premium
          </button>
        </div>
      </div>
    </div>
  );
}
