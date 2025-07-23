import ids from "../../../../canister_ids.json";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as round_idl } from "../../../../src/declarations/round-table/round-table.did.js";
import { idlFactory as searchNewsId } from "../../../../src/declarations/search-news/search-news.did.js";
import { idlFactory as bot_idl } from "../../../../src/declarations/bot-plan/bot-plan.did.js";
import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";

interface LoadingContextCallbacks {
  startLoading: (id: string) => void;
  stopLoading: (id: string) => void;
}

function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}


let loadingCallbacks: LoadingContextCallbacks | null = null;

export function setLoadingCallbacks(callbacks: LoadingContextCallbacks) {
  loadingCallbacks = callbacks;
}

function createActorProxy(actor: any, actorName: string) {
  return new Proxy(actor, {
    get(target, prop, receiver) {
      const originalMethod = target[prop];
      
      if (typeof originalMethod === 'function') {
        return function(this: any, ...args: any[]) {
          const requestId = `${actorName}_${String(prop)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const startTime = performance.now();
          
          if (loadingCallbacks) {
            loadingCallbacks.startLoading(requestId);
          }
          
          console.log(`🚀 [${actorName}] Starting request: ${String(prop)}`, {
            requestId,
            timestamp: new Date().toISOString(),
            method: String(prop),
            args: args.length > 0 ? args : undefined
          });

          const result = originalMethod.apply(this, args);
          
          if (result && typeof result.then === 'function') {
            return result
              .then((data: any) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (loadingCallbacks) {
                  loadingCallbacks.stopLoading(requestId);
                }

                console.log(`✅ [${actorName}] Request completed: ${String(prop)}`, {
                  requestId,
                  duration: `${duration.toFixed(2)}ms`,
                  timestamp: new Date().toISOString(),
                  success: true,
                  dataSize: safeStringify(data).length
                });
                
                return data;
              })
              .catch((error: any) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (loadingCallbacks) {
                  loadingCallbacks.stopLoading(requestId);
                }

                console.error(`❌ [${actorName}] Request failed: ${String(prop)}`, {
                  requestId,
                  duration: `${duration.toFixed(2)}ms`,
                  timestamp: new Date().toISOString(),
                  error: error.message || error,
                  success: false
                });
                
                throw error;
              });
          }
          
          if (loadingCallbacks) {
            loadingCallbacks.stopLoading(requestId);
          }
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log(`✅ [${actorName}] Synchronous method executed: ${String(prop)}`, {
            requestId,
            duration: `${duration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
          
          return result;
        };
      }
      
      return Reflect.get(target, prop, receiver);
    }
  });
}

export function createSearchNewsActor(authClient: AuthClient | null) {
 const identity = authClient?.getIdentity(); 
  const agent = new HttpAgent({
    identity,
    host: "https://ic0.app",
  });

  if (process.env.DFX_NETWORK === "local") {
    agent.fetchRootKey();
  }

  const round = ids["round-table"]?.ic;
  const plan = ids["bot-plan"]?.ic;
  const news = ids["search-news"]?.ic;

  const originalRoundtableActor = Actor.createActor(round_idl, {
    agent,
    canisterId: round,
  });

  const originalBotActor = Actor.createActor(bot_idl, {
    agent,
    canisterId: plan,
  });

  const originalSearchNewsActor = Actor.createActor(searchNewsId, {
    agent,
    canisterId: news,
  });

  return {
    roundtableActor: createActorProxy(originalRoundtableActor, "RoundTable"),
    botActor: createActorProxy(originalBotActor, "BotPlan"),
    searchNewsActor: createActorProxy(originalSearchNewsActor, "SearchNews"),
  };
}



interface RequestMetrics {
  id: string;
  actor: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
  dataSize?: number;
}

class RequestTracker {
  private requests: Map<string, RequestMetrics> = new Map();
  
  startRequest(actor: string, method: string): string {
    const id = `${actor}_${method}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.requests.set(id, {
      id,
      actor,
      method,
      startTime: performance.now()
    });
    return id;
  }
  
  endRequest(id: string, success: boolean, data?: any, error?: any) {
    const request = this.requests.get(id);
    if (request) {
      request.endTime = performance.now();
      request.duration = request.endTime - request.startTime;
      request.success = success;
      if (data) {
        request.dataSize = JSON.stringify(data).length;
      }
      if (error) {
        request.error = error.message || error;
      }
      
      const emoji = success ? '✅' : '❌';
      console.log(`${emoji} [${request.actor}] ${request.method}`, {
        duration: `${request.duration?.toFixed(2)}ms`,
        success,
        ...(request.dataSize && { dataSize: `${request.dataSize} chars` }),
        ...(request.error && { error: request.error })
      });
    }
  }
  
  getMetrics() {
    return Array.from(this.requests.values());
  }
  
  clearMetrics() {
    this.requests.clear();
  }
}

export const requestTracker = new RequestTracker();

export function useRequestMetrics() {
  return {
    getMetrics: () => requestTracker.getMetrics(),
    clearMetrics: () => requestTracker.clearMetrics()
  };
}

