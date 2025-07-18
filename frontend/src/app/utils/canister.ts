import ids from "../../../../.dfx/local/canister_ids.json";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as round_idl } from "../../../../src/declarations/round-table/round-table.did.js";
import { idlFactory as searchNewsId } from "../../../../src/declarations/search-news/search-news.did.js";


import { idlFactory as bot_idl } from "../../../../src/declarations/bot-plan/bot-plan.did.js";

const agent = new HttpAgent({
  host: "http://127.0.0.1:4943",
});

if (process.env.NODE_ENV !== "production") {
  agent.fetchRootKey();
}

const round = ids["round-table"]?.local;
const plan = ids["bot-plan"]?.local;
const news = ids["search-news"]?.local;


export const roundtableActor = Actor.createActor(round_idl, {
  agent,
  canisterId:round,
});

export const botActor = Actor.createActor(bot_idl, {
  agent,
  canisterId:plan,
});

export const searchNewsActor = Actor.createActor(searchNewsId, {
  agent,
  canisterId: news,
});

