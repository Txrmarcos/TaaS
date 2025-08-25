"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import PostCard from "@/components/ui/PerfilPostCard";
import { Footer } from "@/components/Footer";
import { ArrowRight, RefreshCw, CheckCircle, XCircle, User } from "lucide-react";
import { HttpAgent } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { useLoading } from "@/context/LoadingContext";
import { createSearchNewsActor } from "../utils/canister";
import BigNewsCard, { BigArticle } from "@/components/ui/BigNewsCard";

// ===================== Tipos e helpers =====================
export interface UserStatus {
  plan: {
    Standard?: null;
    Pro?: null;
    Premium?: null;
  };
  resetAt: bigint;
  requestsLeft: bigint;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

type Role = "User" | "Journalist";

interface UserProfile {
  id?: string;          // vindo do canister (Principal.toText opcional)
  username?: string;
  bio?: string;
  profileImgUrl?: string;
  isJournalist?: boolean;
  role: Role;           // derivado de isJournalist
}

// Alinhado ao schema do posts.mo
interface PostItem {
  id: number;
  title: string;
  description: string;     // mini (subtitle ou content)
  content: string;         // conteúdo completo
  likesCount: number;      // length de likes
  timestamp?: number;      // nanos (Time.Time)
  imageUrl?: string;
  location?: string;
  authorId?: string;
}

const roleFromBool = (isJournalist?: boolean): Role =>
  isJournalist ? "Journalist" : "User";

const defaultUsernameFromPrincipal = (p: Principal) =>
  `user_${p.toText().slice(0, 8)}`;

const safeStringify = (obj: any) =>
  JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);

// ===================== Componente =====================
export default function ProfilePage() {
  const { authClient } = useAuth();
  const { principal, logout, isLoading } = useAuth();
  const { isLoading: isGlobalLoading } = useLoading();

  // Actors + estados já existentes
  const [actors, setActors] = useState<any>(null);
  const [icpBalance, setIcpBalance] = useState<string | null>(null);
  const [ckBalance, setCkBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  // Novos estados (perfil/jornalista)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<PostItem[]>([]);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // BigNewsCard
  const [selected, setSelected] = useState<BigArticle | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const openFromPost = (post: PostItem) => {
    const article: BigArticle = {
      id: post.id,
      title: post.title,
      description: post.description ?? "",
      content: post.content ?? "",
      tag: "Highlights",                               // ajuste se tiver
      author: profile?.username || "You",           // ou puxe do canister
      likes: post.likesCount ?? 0,
      url: post.imageUrl,                           // se BigNewsCard usa imagem
      comments: [],                                 // mapeie se tiver
      taasStatus: undefined,                        // traga se precisar
      verdict: undefined,
    };
    setSelected(article);
  };
  const closeBig = () => setSelected(null);
  const handleLike = (id: string) => {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // TODO: integrar com postsActor (toggleLike) se existir
  };
  const handleSupport = (id: string) => {
    // TODO: abrir modal de suporte/tip se existir
    console.log("support post:", id);
  };

  // ===================== Inicialização de Actors =====================
  useEffect(() => {
    const initializeActors = async () => {
      if (authClient) {
        try {
          const createdActors = await createSearchNewsActor(authClient);
          setActors(createdActors);
        } catch (error) {
          console.error("Error initializing actors:", error);
        }
      }
    };
    initializeActors();
  }, [authClient]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ===================== PERFIL / JOURNALIST =====================
  const fetchProfile = async () => {
    if (!actors?.usersActor || !principal) return;
    try {
      const res = await actors.usersActor.getProfile(principal);
      const mapped: UserProfile = {
        id: res?.id ? String(res.id) : undefined,
        username: res?.username,
        bio: res?.bio,
        profileImgUrl: res?.profileImgUrl,
        isJournalist: Boolean(res?.isJournalist),
        role: roleFromBool(res?.isJournalist),
      };
      setProfile(mapped);
    } catch (err) {
      console.warn("getProfile falhou; tentando createUser:", err);
      try {
        const created = await actors.usersActor.createUser(
          defaultUsernameFromPrincipal(principal),
          "",
          ""
        );
        const mapped: UserProfile = {
          id: created?.id ? String(created.id) : undefined,
          username: created?.username,
          bio: created?.bio,
          profileImgUrl: created?.profileImgUrl,
          isJournalist: Boolean(created?.isJournalist),
          role: roleFromBool(created?.isJournalist),
        };
        setProfile(mapped);
      } catch (e) {
        console.error("createUser error:", e);
        showToast("error", "Não foi possível carregar/criar seu perfil.");
      }
    }
  };

  const fetchMyPosts = async () => {
    if (!actors?.postsActor || !principal) return;
    setIsLoadingPosts(true);
    try {
      const list = await actors.postsActor.getPostsByAuthor(principal);

      if (Array.isArray(list) && list.length) {
        console.log("🧾 Exemplo de post (bruto):\n", safeStringify(list[0]));
      }

      const norm: PostItem[] = (list || []).map((p: any, idx: number) => ({
        id:
          (typeof p.id === "bigint" ? p.id.toString() : p.id) ??
          (typeof p.postId === "bigint" ? p.postId.toString() : p.postId) ??
          idx,
        title: String(p.title ?? ""),
        description: String(p.subtitle ?? p.content ?? ""), // mini descrição
        content: String(p.content ?? ""),                   // conteúdo completo
        likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
        timestamp: p.timestamp ? Number(p.timestamp) : undefined,
        imageUrl: p.imageUrl ? String(p.imageUrl) : undefined,
        location: p.location ? String(p.location) : undefined,
        authorId:
          (p.author && typeof p.author.toText === "function") ? p.author.toText() : undefined,
      }));

      setMyPosts(norm);
    } catch (err) {
      console.error("getPostsByAuthor error:", err);
      showToast("error", "Erro ao carregar suas notícias.");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const becomeJournalist = async () => {
    if (!actors?.usersActor) return;
    setIsUpdatingRole(true);
    try {
      const res = await actors.usersActor.registerAsJournalist();
      const mapped: UserProfile = {
        id: res?.id ? String(res.id) : undefined,
        username: res?.username,
        bio: res?.bio,
        profileImgUrl: res?.profileImgUrl,
        isJournalist: Boolean(res?.isJournalist),
        role: roleFromBool(res?.isJournalist),
      };
      setProfile(mapped);
      showToast("success", "Agora você é jornalista!");
      await fetchMyPosts();
    } catch (err) {
      console.error("registerAsJournalist error:", err);
      showToast("error", "Erro ao atualizar perfil.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // ===================== Wallet / Planos =====================
  const fetchICPBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({ host: "https://ic0.app" });
      const ledger = LedgerCanister.create({
        agent,
        canisterId: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
      });
      const accountIdentifier = AccountIdentifier.fromPrincipal({
        principal: userPrincipal,
      });
      const balance = await ledger.accountBalance({
        accountIdentifier: accountIdentifier.toHex(),
      });
      setIcpBalance((Number(balance) / 100_000_000).toFixed(8));
    } catch (error) {
      console.error("Error fetching ICP balance:", error);
      setIcpBalance("0.00000000");
    }
  };

  const fetchCkBTCBalance = async (userPrincipal: Principal) => {
    try {
      const agent = new HttpAgent({ host: "https://ic0.app" });
      const ckBTCCanister = await import("@dfinity/ledger-icrc");
      const ledger = ckBTCCanister.IcrcLedgerCanister.create({
        agent,
        canisterId: Principal.fromText("mxzaz-hqaaa-aaaar-qaada-cai"),
      });
      const balance = await ledger.balance({ owner: userPrincipal });
      setCkBalance((Number(balance) / 100_000_000).toFixed(8));
    } catch (error) {
      console.error("Error fetching ckBTC balance:", error);
      setCkBalance("0.00000000");
    }
  };

  const formatResetTime = (resetAt: bigint) => {
    const date = new Date(Number(resetAt / BigInt(1_000_000)));
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const subscribePlan = async (plan: "Standard" | "Pro" | "Premium") => {
    if (!actors?.botActor) {
      showToast("error", "Please wait for the system to load or try refreshing the page.");
      return;
    }

    setIsSubscribing(plan);

    let planObj;
    switch (plan) {
      case "Standard": planObj = { Standard: null }; break;
      case "Pro": planObj = { Pro: null }; break;
      case "Premium": planObj = { Premium: null }; break;
      default: setIsSubscribing(null); return;
    }

    try {
      const res = await actors.botActor.subscribe(planObj);

      if (res && "Ok" in res) {
        showToast("success", `${plan} plan activated successfully!`);
        await fetchStatus();
      } else if (res && "Err" in res) {
        const errType = Object.keys(res.Err)[0];
        let message = "Subscription failed. Please try again.";
        if (errType === "InsufficientFunds" || errType === "InsufficientBalance") {
          message = "Insufficient balance to upgrade.";
        } else if (errType === "TransferFailure") {
          message = "Payment transfer failed. Please check your balance and try again.";
        }
        showToast("error", message);
      } else {
        showToast("success", `${plan} plan activated successfully!`);
        await fetchStatus();
      }
    } catch (err: any) {
      console.error("Error subscribing to plan:", err);
      let message = "An error occurred while subscribing to the plan.";
      const errorMessageString = String(err).toLowerCase();
      if (errorMessageString.includes("saldo insuficiente") || errorMessageString.includes("⚠️  ")) {
        message = "Insufficient balance to upgrade the plan.";
      } else if (errorMessageString.includes("transfer failed")) {
        message = "Payment transfer failed. Please check your balance and try again.";
      }
      showToast("error", message);
    } finally {
      setIsSubscribing(null);
    }
  };

  const fetchStatus = async () => {
    if (!actors?.botActor) {
      console.warn("Bot actor not available yet");
      return;
    }
    try {
      const res = await actors.botActor.get_user_status();
      if (res && res.length > 0) setStatus(res[0] as UserStatus);
      else setStatus(null);
    } catch (err) {
      console.error("Error fetching user status:", err);
    }
  };

  // ===================== Ciclos de vida =====================
  useEffect(() => {
    if (principal && actors) {
      const fetchAllData = async () => {
        setIsLoadingBalance(true);
        await Promise.all([
          fetchICPBalance(principal),
          fetchCkBTCBalance(principal),
          fetchStatus(),
          fetchProfile(),
        ]);
        setIsLoadingBalance(false);
      };
      fetchAllData();
    }
  }, [principal, actors]);

  useEffect(() => {
    if (!profile) return;

    if (profile.role === "Journalist") {
      fetchMyPosts();
    }
  }, [profile]);

  const handleRefresh = async () => {
    if (!principal || !actors) return;
    setIsLoadingBalance(true);
    await Promise.all([
      fetchICPBalance(principal),
      fetchCkBTCBalance(principal),
      fetchStatus(),
      fetchProfile(),
    ]);
    if (profile?.role === "Journalist") {
      await fetchMyPosts();
    }
    setIsLoadingBalance(false);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Standard": return "text-green-400";
      case "Pro": return "text-yellow-400";
      case "Premium": return "text-pink-400";
      default: return "text-gray-400";
    }
  };

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case "Standard":
        return {
          requests: "5 requests/day",
          features: ["Basic fact-checking", "Access to verified news", "Email support"],
        };
      case "Pro":
        return {
          requests: "50 requests/day",
          features: ["Advanced fact-checking", "Trend analysis", "Priority support", "Detailed reports"],
        };
      case "Premium":
        return {
          requests: "500 requests/day",
          features: ["Full access", "Custom API", "24/7 support", "Custom analysis", "Premium reports"],
        };
      default:
        return { requests: "0", features: [] };
    }
  };

  const currentPlan = status ? Object.keys(status.plan)[0] : null;

  // ===================== Loading dos actors =====================
  if (!actors) {
    return (
      <div className="flex flex-col min-h-screen text-white font-sans lg:pl-72">
        <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
          <div
            className="absolute w-full h-full top-0 left-0 bg-transparent"
            style={{
              backgroundImage:
                `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: "2rem 2rem",
              animation: "grid-pan 60s linear infinite",
            }}
          ></div>
        </div>

        <Sidebar />

        <main className="flex flex-col flex-grow items-center justify-center px-4 pt-32 pb-20">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#FF4D00]" />
            <p className="text-lg">Loading system components...</p>
          </div>
        </main>

        <Footer />

        <style jsx global>{`
          @keyframes grid-pan {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ===================== UI =====================
  return (
    <div className="flex flex-col min-h-screen text-white font-sans lg:pl-72">
      {/* Fundo */}
      <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
        <div
          className="absolute w-full h-full top-0 left-0 bg-transparent"
          style={{
            backgroundImage:
              `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "2rem 2rem",
            animation: "grid-pan 60s linear infinite",
          }}
        ></div>
      </div>

      <Sidebar />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300">
          {toast.type === "success" ? (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border-green-500/30 px-4 py-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>{toast.message}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border-red-500/30 px-4 py-3 rounded-lg">
              <XCircle className="w-5 h-5" />
              <span>{toast.message}</span>
            </div>
          )}
        </div>
      )}

      <main className="flex flex-col flex-grow items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-lg flex items-center justify-center shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              User Area
            </h1>
            <p className="text-white/70 text-lg">
              View your information and manage your account.
            </p>
          </div>

          {/* Wallet */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Your Wallet</h2>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoadingBalance || isGlobalLoading}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`'w-4 h-4 ${isLoadingBalance ? "animate-spin" : ""}`} />
                {isLoadingBalance ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ICP */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-blue-400">ICP Balance</h3>
                  <p className="font-bold text-2xl text-white">{icpBalance ?? "..."}</p>
                </div>
              </div>

              {/* ckBTC */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-orange-400">ckBTC Balance</h3>
                  <p className="font-bold text-2xl text-white">{ckBalance ?? "..."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Planos */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Standard */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 flex flex-col">
                <div className="text-center flex-shrink-0">
                  <div className="w-4 h-4 bg-green-400 rounded-full mx-auto mb-2"></div>
                  <h3 className="text-xl font-semibold text-green-400 mb-2">Standard</h3>
                  <p className="text-2xl font-bold text-white mb-1">Free</p>
                  <p className="text-sm text-white/70">{getPlanFeatures("Standard").requests}</p>
                </div>

                <ul className="space-y-2 text-sm mt-4 flex-grow">
                  {getPlanFeatures("Standard").features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribePlan("Standard")}
                  disabled={isSubscribing === "Standard" || currentPlan === "Standard" || isGlobalLoading}
                  className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 mt-6"
                >
                  {isSubscribing === "Standard" ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Activating...
                    </div>
                  ) : currentPlan === "Standard" ? "Current Plan" : "Select"}
                </button>
              </div>

              {/* Pro */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-6 flex flex-col">
                <div className="text-center flex-shrink-0">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full mx-auto mb-2"></div>
                  <h3 className="text-xl font-semibold text-yellow-400 mb-2">Pro</h3>
                  <p className="text-2xl font-bold text-white mb-1">$19.99/month</p>
                  <p className="text-sm text-white/70">{getPlanFeatures("Pro").requests}</p>
                </div>

                <ul className="space-y-2 text-sm mt-4 flex-grow">
                  {getPlanFeatures("Pro").features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribePlan("Pro")}
                  disabled={isSubscribing === "Pro" || currentPlan === "Pro" || isGlobalLoading}
                  className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 mt-6"
                >
                  {isSubscribing === "Pro" ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Activating...
                    </div>
                  ) : currentPlan === "Pro" ? "Current Plan" : "Select"}
                </button>
              </div>

              {/* Premium */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-pink-500/30 p-6 flex flex-col">
                <div className="text-center flex-shrink-0">
                  <div className="w-4 h-4 bg-pink-400 rounded-full mx-auto mb-2"></div>
                  <h3 className="text-xl font-semibold text-pink-400 mb-2">Premium</h3>
                  <p className="text-2xl font-bold text-white mb-1">$99.99/month</p>
                  <p className="text-sm text-white/70">{getPlanFeatures("Premium").requests}</p>
                </div>

                <ul className="space-y-2 text-sm mt-4 flex-grow">
                  {getPlanFeatures("Premium").features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-pink-400" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribePlan("Premium")}
                  disabled={isSubscribing === "Premium" || currentPlan === "Premium" || isGlobalLoading}
                  className="w-full py-3 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 mt-6"
                >
                  {isSubscribing === "Premium" ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Activating...
                    </div>
                  ) : currentPlan === "Premium" ? "Current Plan" : "Select"}
                </button>
              </div>
            </div>
          </div>

          {/* === Jornalista: lista de notícias === */}
          {profile?.role === "Journalist" && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Your published news</h2>

              {isLoadingPosts ? (
                <div className="text-white/70">Loading your news...</div>
              ) : myPosts.length === 0 ? (
                <div className="text-white/70">You haven't published any news yet.</div>
              ) : (
                <div
                  ref={listRef}
                  className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollBehavior: "smooth" }}
                >
                  {myPosts.map((post) => (
                    <div key={post.id} className="snap-start">
                      <PostCard
                        id={post.id}
                        title={post.title}
                        description={post.description}
                        likes={post.likesCount}
                        className="w-40 h-40"
                        onEdit={() => openFromPost(post)} // abre o BigNewsCard ao clicar no lápis
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* === Não-jornalista: CTA === */}
          {profile && profile.role !== "Journalist" && (
            <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-2">Want to publish news?</h2>
              <p className="text-white/70 mb-4">
                Become a journalist to create, edit and manage your publications.
              </p>
              <button
                onClick={becomeJournalist}
                disabled={isUpdatingRole || isGlobalLoading}
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-[#FF4D00] to-[#FF007A] font-semibold disabled:opacity-60"
              >
                {isUpdatingRole ? "Updating..." : "I want to become a journalist"}
              </button>
            </div>
          )}

          {/* Atalhos principais */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <a
              href="/round"
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all duration-300 p-6 rounded-xl border border-white/10 shadow-lg"
            >
              <div>
                <h3 className="text-xl font-semibold mb-1">📰 Verified News</h3>
                <p className="text-white/70 text-sm">Access news and content reviewed by experts.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </a>

            <a
              href="/chat"
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all duration-300 p-6 rounded-xl border border-white/10 shadow-lg"
            >
              <div>
                <h3 className="text-xl font-semibold mb-1">🛡️ Fact Checking</h3>
                <p className="text-white/70 text-sm">Submit questions and receive truthfulness evaluations.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </a>
          </div>

          {/* Account Information */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-8 mt-12">
            <h2 className="text-2xl font-bold mb-6">Account Information</h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-1">Main ID:</p>
                <p className="text-sm font-mono text-white break-all">
                  {principal ? principal.toText() : "Loading..."}
                </p>
              </div>

              <button
                onClick={logout}
                disabled={isLoading}
                className="px-6 py-3 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {isLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>

          {/* Account Status */}
          {status && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-8 mt-6">
              <h2 className="text-2xl font-bold mb-6">Account Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-white/70 mb-1">Current Plan:</p>
                  <p className={`text-lg font-semibold ${getPlanColor(currentPlan || "")}`}>
                    {currentPlan || "No active plan"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/70 mb-1">Requests Available:</p>
                  <p className="text-lg font-semibold text-white">
                    {status.requestsLeft.toString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/70 mb-1">Reset In:</p>
                  <p className="text-sm text-white">{formatResetTime(status.resetAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal BigNewsCard */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl">
            <button
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
              onClick={closeBig}
            >
              Close
            </button>
            <BigNewsCard
              article={selected}
              liked={likedIds.includes(String(selected.id))}
              onLike={() => handleLike(String(selected.id))}
              onSupport={() => handleSupport(String(selected.id))}
              onClose={closeBig}
            />
          </div>
        </div>
      )}

      <Footer />

      {/* CSS global */}
      <style jsx global>{`
        @keyframes grid-pan {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
    </div>
  );
}
