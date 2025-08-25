import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, Info, X } from 'lucide-react';

// Types matching the Motoko backend
export type TaaSVerification = 'Pending' | 'True' | 'False' | 'Uncertain' | 'Error';

export interface Verdict {
  result: TaaSVerification;
  source: string;
  hash: string;
  timestamp: number;
  llm_message: string;
}

interface TaaSVerdictEmbedProps {
  verdict: Verdict | null;
  taasStatus: TaaSVerification;
  className?: string;
}

// Configuration for each verification status
const statusConfig = {
  Pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Pending Verification',
    description: 'The content is being analyzed by TaaS...'
  },
  True: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Verified Information',
    description: 'The content has been verified and found to be true'
  },
  False: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Refuted Information',
    description: 'The content has been analyzed and found to be false'
  },
  Uncertain: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Uncertain Information',
    description: 'It was not possible to fully verify the content'
  },
  Error: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Error in Verification',
    description: 'An error occurred during verification'
  }
};

export function TaaSVerdictEmbed({ verdict, taasStatus, className = '' }: TaaSVerdictEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[taasStatus];
  const IconComponent = config.icon;

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      // Convert nanoseconds to milliseconds
      const date = new Date(Math.floor(timestamp / 1000000));
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatHash = (hash: string) => {
    if (!hash || hash.length < 8) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className={`${className}`}>
      {/* Compact view - always visible */}
      <div
        onClick={handleClick}
        className={`
          cursor-pointer transition-all duration-200 hover:scale-[1.02]
          ${config.bgColor} ${config.borderColor} border rounded-lg p-3
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {verdict && (
              <span className="text-xs text-white/60">
                {formatTimestamp(verdict.timestamp)}
              </span>
            )}
            <Info className={`w-3 h-3 ${config.color}`} />
          </div>
        </div>
        
        <p className="text-xs text-white/70 mt-1">
          {config.description}
        </p>
      </div>

      {/* Expanded modal/overlay */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D23] border border-white/10 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className={`${config.bgColor} ${config.borderColor} border-b p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${config.color}`}>
                      {config.label}
                    </h3>
                    <p className="text-sm text-white/70">
                      TaaS Verification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <h4 className="text-white font-semibold mb-2">Verification Status</h4>
                <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                    <span className={`font-medium ${config.color}`}>
                      {taasStatus}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* Message from LLM */}
              {verdict?.llm_message && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Detailed Analysis</h4>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-white/90 leading-relaxed">
                      {verdict.llm_message}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {verdict && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Technical Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-white/60">Timestamp:</span>
                      <span className="text-white/90">
                        {formatTimestamp(verdict.timestamp)}
                      </span>
                    </div>
                    
                    {verdict.source && (
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-white/60">Source:</span>
                        <span className="text-white/90 max-w-[200px] truncate">
                          {verdict.source}
                        </span>
                      </div>
                    )}
                    
                    {verdict.hash && (
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-white/60">Hash:</span>
                        <span className="text-white/90 font-mono text-xs">
                          {formatHash(verdict.hash)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info about TaaS */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="text-blue-400 font-semibold mb-1">
                      About TaaS
                    </h5>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Truth as a Service is an information verification system that uses
                      artificial intelligence and trusted sources to analyze the veracity of
                      content. The results are recorded on-chain for auditing and transparency.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 bg-white/5">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full bg-gradient-to-r from-[#FF007A] to-[#FF4D00] text-white 
                         font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Updated News interface to include TaaS fields
export interface NewsWithVerdict {
  id: number;
  title: string;
  description: string;
  tag: string;
  author: string;
  likes: number;
  content?: string;
  url?: string;
  comments?: Array<{
    id: number;
    author: string;
    text: string;
    timestamp: number;
  }>;
  // TaaS fields
  taasStatus: TaaSVerification;
  verdict?: Verdict | null;
}

// Usage example component
export function TaaSVerdictExample() {
  const examples: Array<{ status: TaaSVerification; verdict: Verdict }> = [
    {
      "status": "True",
      "verdict": {
        "result": "True",
        "source": "Reuters, BBC News, G1",
        "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        "timestamp": Date.now() * 1000000,
        "llm_message": "✅ The information has been verified and confirmed by multiple reliable sources. The data presented is consistent with official reports."
      }
    },
    {
      "status": "False",
      "verdict": {
        "result": "False",
        "source": "Fact-Check Brazil, Aos Fatos",
        "hash": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4",
        "timestamp": Date.now() * 1000000,
        "llm_message": "❌ The information has been analyzed and identified as false. There is no evidence to support the claims presented."
      }
    },
    {
      "status": "Uncertain",
      "verdict": {
        "result": "Uncertain",
        "source": "Multiple sources",
        "hash": "m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0",
        "timestamp": Date.now() * 1000000,
        "llm_message": "⚠️ The available information is conflicting or insufficient for a definitive verification. Caution is advised."
      }
    },
    {
      "status": "Pending",
      "verdict": {
        "result": "Pending",
        "source": "",
        "hash": "",
        "timestamp": Date.now() * 1000000,
        "llm_message": "⏳ Verification is in progress. Please wait while we analyze the content."
      }
    },
    {
      "status": "Error",
      "verdict": {
        "result": "Error",
        "source": "",
        "hash": "",
        "timestamp": Date.now() * 1000000,
        "llm_message": "❌ You have reached the limit of your plan or do not have an active plan."
      }
    }
  ]

  return (
    <div className="min-h-screen bg-[#0B0E13] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          TaaS Verdict Embedding Examples
        </h1>
        
        <div className="grid gap-6">
          {examples.map((example, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-semibold text-white/80">
                Status: {example.status}
              </h3>
              <TaaSVerdictEmbed
                verdict={example.verdict}
                taasStatus={example.status}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}