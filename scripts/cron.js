import { HttpAgent, Actor } from "@dfinity/agent";
import fetch from "node-fetch";
import { idlFactory as roundtableIDL } from "../.dfx/local/canisters/RoundtableCanister"; // ou caminho real

const canisterId = "l62sy-yx777-77777-aaabq-cai"; // Altere para o seu
const host = "http://127.0.0.1:4943"; // Ou https://ic0.app se for mainnet

global.fetch = fetch;

async function main() {
  const agent = new HttpAgent({ host });

  if (host.includes("127.0.0.1")) {
    await agent.fetchRootKey();
  }

  const roundtable = Actor.createActor(roundtableIDL, {
    agent,
    canisterId,
  });

  try {
    const result = await roundtable.atualizarPropostas();
    console.log("✅ Resultado da atualização:");
    console.log(result);
  } catch (e) {
    console.error("❌ Erro ao executar atualizarPropostas:", e);
  }
}

main();
