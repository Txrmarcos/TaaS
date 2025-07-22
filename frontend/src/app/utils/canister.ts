import ids from "../../../../.dfx/local/canister_ids.json";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as round_idl } from "../../../../src/declarations/round-table/round-table.did.js";
import { idlFactory as searchNewsId } from "../../../../src/declarations/search-news/search-news.did.js";
import { idlFactory as bot_idl } from "../../../../src/declarations/bot-plan/bot-plan.did.js";

// Interface para o contexto de loading (será injetado via callback)
interface LoadingContextCallbacks {
  startLoading: (id: string) => void;
  stopLoading: (id: string) => void;
}

// Variável global para callbacks do loading context
let loadingCallbacks: LoadingContextCallbacks | null = null;

// Função para definir os callbacks do loading context
export function setLoadingCallbacks(callbacks: LoadingContextCallbacks) {
  loadingCallbacks = callbacks;
}

// Função para criar proxy que monitora requisições e integra com loading
function createActorProxy(actor: any, actorName: string) {
  return new Proxy(actor, {
    get(target, prop, receiver) {
      const originalMethod = target[prop];
      
      // Se for uma função do ator, intercepta a chamada
      if (typeof originalMethod === 'function') {
        return function(this: any, ...args: any[]) {
          const requestId = `${actorName}_${String(prop)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const startTime = performance.now();
          
          // Inicia o loading se o contexto estiver disponível
          if (loadingCallbacks) {
            loadingCallbacks.startLoading(requestId);
          }
          
          console.log(`🚀 [${actorName}] Iniciando requisição: ${String(prop)}`, {
            requestId,
            timestamp: new Date().toISOString(),
            method: String(prop),
            args: args.length > 0 ? args : undefined
          });

          // Chama o método original
          const result = originalMethod.apply(this, args);
          
          // Se for uma Promise, monitora a conclusão
          if (result && typeof result.then === 'function') {
            return result
              .then((data: any) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Para o loading
                if (loadingCallbacks) {
                  loadingCallbacks.stopLoading(requestId);
                }
                
                console.log(`✅ [${actorName}] Requisição concluída: ${String(prop)}`, {
                  requestId,
                  duration: `${duration.toFixed(2)}ms`,
                  timestamp: new Date().toISOString(),
                  success: true,
                  dataSize: JSON.stringify(data).length
                });
                
                return data;
              })
              .catch((error: any) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Para o loading mesmo em caso de erro
                if (loadingCallbacks) {
                  loadingCallbacks.stopLoading(requestId);
                }
                
                console.error(`❌ [${actorName}] Requisição falhou: ${String(prop)}`, {
                  requestId,
                  duration: `${duration.toFixed(2)}ms`,
                  timestamp: new Date().toISOString(),
                  error: error.message || error,
                  success: false
                });
                
                throw error;
              });
          }
          
          // Para métodos síncronos, para o loading imediatamente
          if (loadingCallbacks) {
            loadingCallbacks.stopLoading(requestId);
          }
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log(`✅ [${actorName}] Método síncrono executado: ${String(prop)}`, {
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

const agent = new HttpAgent({
  host: "http://127.0.0.1:4943",
});

agent.fetchRootKey();

if (process.env.NODE_ENV !== "production") {
  agent.fetchRootKey();
}

const round = ids["round-table"]?.local;
const plan = ids["bot-plan"]?.local;
const news = ids["search-news"]?.local;

// Criando os atores originais
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

// Exportando os atores com proxy para monitoramento
export const roundtableActor = createActorProxy(originalRoundtableActor, "RoundTable");
export const botActor = createActorProxy(originalBotActor, "BotPlan");
export const searchNewsActor = createActorProxy(originalSearchNewsActor, "SearchNews");

// Versão alternativa: Sistema de métricas mais avançado
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
      
      // Log detalhado
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

// Hook para usar métricas no React (opcional)
export function useRequestMetrics() {
  return {
    getMetrics: () => requestTracker.getMetrics(),
    clearMetrics: () => requestTracker.clearMetrics()
  };
}

