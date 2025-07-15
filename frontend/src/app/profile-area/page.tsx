"use client";
import React from "react";
import { useAuth } from "../auth/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";

export default function ProfilePage() {
  const { principal, status, logout, isLoading } = useAuth();

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Standard":
        return "text-green-400";
      case "Pro":
        return "text-yellow-400";
      case "Premium":
        return "text-pink-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
      <Navbar />

      <main className="flex flex-col flex-grow items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-4xl font-bold mb-2">User Area</h1>
              <p className="text-white/70 text-lg">
                View your personal information and manage your account.
              </p>
            </div>
            <button
              onClick={logout}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {isLoading ? "Logging out..." : "Log Out"}
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-8 space-y-6">
            <div>
              <p className="text-sm text-white/70 mb-1">Principal ID:</p>
              <p className="text-sm font-mono text-white break-all">
                {principal ? principal.toText() : "Loading..."}
              </p>
            </div>

            {status && (
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-white/70">Current plan:</span>
                  <span
                    className={`font-semibold ${
                      getPlanColor(Object.keys(status.plan)[0] || "")
                    }`}
                  >
                    {Object.keys(status.plan)[0]}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-white/70">Remaining requests:</span>
                  <span className="text-white font-semibold">
                    {status.requestsLeft.toString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <a
              href="/round"
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all duration-300 p-6 rounded-xl border border-white/10 shadow-lg"
            >
              <div>
                <h3 className="text-xl font-semibold mb-1">📰 Verified News</h3>
                <p className="text-white/70 text-sm">
                  Access curated news and expert-reviewed content.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </a>

            <a
              href="/chat"
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all duration-300 p-6 rounded-xl border border-white/10 shadow-lg"
            >
              <div>
                <h3 className="text-xl font-semibold mb-1">🛡️ Fact Checking</h3>
                <p className="text-white/70 text-sm">
                  Submit questions and get a truthfulness rating.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
    