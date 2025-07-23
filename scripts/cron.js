import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as roundtableIDL } from "../dfx/local/canisters/RoundtableCanister";

const canisterId = "54eer-fqaaa-aaaaf-qbiiq-cai";
const host = "https://ic0.app";


async function main() {
  const agent = new HttpAgent({
    host,
  });

  const roundtable = Actor.createActor(roundtableIDL, {
    agent,
    canisterId,
  });

  try {
    console.log(`🚀 Conectando à mainnet: ${host}`);
    console.log(`📋 Canister ID: ${canisterId}`);
    
    const result = await roundtable.atualizarPropostas();
    console.log("✅ Resultado da atualização na mainnet:");
    console.log(result);
  } catch (e) {
    console.error("❌ Erro ao executar atualizarPropostas na mainnet:", e);
    
    // Log mais detalhado para debug
    if (e.message) {
      console.error("Mensagem do erro:", e.message);
    }
    if (e.stack) {
      console.error("Stack trace:", e.stack);
    }
  }
}

main().catch(console.error);