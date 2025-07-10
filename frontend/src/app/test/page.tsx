"use client";
import React, { useEffect, useState } from "react";
import { roundtableActor } from "../utils/canister";

type Proposal = {
  id: number;
  name: string;
  url: string;
  description: string;
  proposer: string;
  created_at: bigint;
  votes_for: number;
  votes_against: number;
  status: { Pending?: null; Approved?: null; Rejected?: null };
  voters: string[];
};

export default function RoundtablePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState("");

  const fetchProposals = async () => {
    try {
      const list = await roundtableActor.list_proposals();
      setProposals(list as Proposal[]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const submitProposal = async () => {
    try {
      const id = await roundtableActor.propose_source(name, url, desc);
      setMessage(`✅ Proposta enviada! ID: ${id}`);
      setName("");
      setUrl("");
      setDesc("");
      fetchProposals();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erro ao enviar proposta.");
    }
  };

  const vote = async (id: number, isFor: boolean) => {
    try {
      const res = await roundtableActor.vote_source(id, isFor);
      setMessage(res as string);
      fetchProposals();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erro ao votar.");
    }
  };

  const formatStatus = (status: Proposal["status"]) => {
    if (status.Approved !== undefined) return "Aprovada ✅";
    if (status.Rejected !== undefined) return "Rejeitada ❌";
    return "Pendente ⏳";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#6e00ff] to-[#c300ff] p-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-bold text-lg">🛡️ TaaS</span>
          <span className="text-green-400 text-xs bg-green-900 bg-opacity-20 rounded px-2 py-0.5">
            ● On-Chain
          </span>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded hover:opacity-90 transition shadow-md border border-cyan-300">
            🔎 Verificar
          </button>
          <button className="px-4 py-1 bg-white bg-opacity-10 text-white font-semibold rounded hover:bg-opacity-20 transition border border-white border-opacity-30">
            👥 Mesa Redonda
          </button>
        </div>
      </header>

      <div className="p-6">
        <h1 className="text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
          🌐 Mesa Redonda — Propostas de Fontes
        </h1>

        <div className="max-w-2xl mx-auto bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white border-opacity-30">
          <h2 className="text-2xl font-semibold mb-4 text-center text-white">Nova Proposta</h2>
          <input
            className="w-full mb-3 p-3 rounded-lg bg-white bg-opacity-30 placeholder-white text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Nome da fonte"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="text-black w-full mb-3 p-3 rounded-lg bg-white bg-opacity-30 placeholder-white text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="URL oficial"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <textarea
            className="text-black w-full mb-3 p-3 rounded-lg bg-white bg-opacity-30 placeholder-white text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Descrição"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button
            className="w-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-bold py-3 rounded-lg hover:opacity-90 transition shadow-md"
            onClick={submitProposal}
          >
            🚀 Enviar Proposta
          </button>
          <p className="mt-2 text-green-300 text-sm text-center">{message}</p>
        </div>

        <h2 className="text-3xl font-semibold my-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
          📄 Propostas Existentes
        </h2>

        {proposals.length === 0 ? (
          <p className="text-center text-gray-200">Nenhuma proposta ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white border-opacity-30 text-black"
              >
                <h3 className="text-xl font-bold mb-2">{p.name} — <span className="italic">{formatStatus(p.status)}</span></h3>
                <p className="mb-2">
                  <strong>URL:</strong>{" "}
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-cyan-500 underline">
                    {p.url}
                  </a>
                </p>
                <p className="mb-2">{p.description}</p>
                <p className="mb-4 text-black">
                  ✅ <strong>{p.votes_for}</strong> | ❌ <strong>{p.votes_against}</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-green-400 text-black font-bold py-2 rounded-lg hover:bg-green-300 transition shadow-sm"
                    onClick={() => vote(p.id, true)}
                  >
                    Votar a favor
                  </button>
                  <button
                    className="flex-1 bg-red-400 text-black font-bold py-2 rounded-lg hover:bg-red-300 transition shadow-sm"
                    onClick={() => vote(p.id, false)}
                  >
                    Votar contra
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
