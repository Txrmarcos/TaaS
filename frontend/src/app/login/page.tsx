// src/app/login/page.tsx
"use client";
import React from "react";

import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
      <div className="max-w-md w-full bg-white/10 p-8 rounded-xl shadow-xl text-center backdrop-blur-md border border-white/20">
        <h1 className="text-3xl text-white font-bold mb-4">🚀 Login</h1>
        <p className="text-white/70 mb-6">
          Conecte-se usando seu Internet Identity
        </p>
        <button
          onClick={login}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] hover:opacity-90 text-white rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <span className="mr-2">🔐</span>
          )}
          {isLoading ? "Conectando..." : "Entrar com Internet Identity"}
        </button>
        <p className="text-xs text-white/50 mt-4">
          Sua identidade é protegida pela blockchain da Internet Computer
        </p>
      </div>
    </div>
  );
}
