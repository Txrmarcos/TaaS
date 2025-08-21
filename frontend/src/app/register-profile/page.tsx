"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Fixed import path
import { Copy, Check, Loader2, User, FileText, ShieldCheck, ArrowRight } from "lucide-react";
import { createSearchNewsActor } from "../utils/canister";

export default function RegisterProfilePage() {
    const router = useRouter();
    const { principal, authClient, isAuthenticated, isLoading } = useAuth();
    
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [profileImgUrl, setProfileImgUrl] = useState("");
    const [isJournalist, setIsJournalist] = useState(false);
    const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [actors, setActors] = useState<{usersActor: any} | null>(null);

    // Initialize actors when authClient is available
    useEffect(() => {
        if (authClient) {
            try {
                const { usersActor }:any = createSearchNewsActor(authClient);
                setActors({ usersActor });
                console.log("Actors created successfully");
            } catch (error) {
                console.error("Error creating actors:", error);
            }
        }
    }, [authClient]);

    useEffect(() => {
        const checkFirstLogin = async () => {
            // Wait for authentication to complete
            if (isLoading) {
                console.log("Authentication still loading...");
                return;
            }

            // if (!isAuthenticated || !principal || !authClient || !actors?.usersActor) {
            //     console.log("Missing requirements:", { 
            //         isAuthenticated, 
            //         principal: !!principal, 
            //         authClient: !!authClient,
            //         usersActor: !!actors?.usersActor
            //     });
                
            //     // If not authenticated, redirect to login
            //     if (!isAuthenticated && !isLoading) {
            //         router.push("/");
            //         return;
            //     }
            //     return;
            // }

            try {
                console.log("Checking existing profile...");
                
                // Try to get existing profile first
                try {
                    const profile = await actors!!.usersActor.getProfile(principal);
                    console.log("Existing profile found:", profile);
                    
                    // If profile exists and firstLogin is false, redirect to news feed
                    if (profile && !profile.firstLogin) {
                        console.log("User has already completed registration, redirecting...");
                        router.push("/news-feed");
                        return;
                    }
                    
                    console.log("User has profile but hasn't completed first login setup");
                } catch (profileError) {
                    console.log("No existing profile found - this is expected for new users:", profileError);
                }
                
                // Set component as ready
                setIsReady(true);

            } catch (err) {
                console.error("Error during initialization:", err);
                setError("Failed to initialize. Please try refreshing the page.");
                setIsReady(true); // Show the form anyway
            }
        };

        checkFirstLogin();
    }, [principal, authClient, actors, isAuthenticated, isLoading, router]);

    const principalText = principal ? principal.toText() : "Loading identity...";

    const copyPrincipal = () => {
        if (!principal) return;
        navigator.clipboard.writeText(principalText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validações
        if (username.trim().length < 3) {
            setError("Username must be at least 3 characters long.");
            setFormState('error');
            return;
        }
        
        if (bio.trim().length < 10) {
            setError("Your bio must be at least 10 characters long.");
            setFormState('error');
            return;
        }

        if (!actors?.usersActor) {
            setError("System not ready. Please wait a moment and try again.");
            setFormState('error');
            return;
        }
        
        setFormState('loading');
        setError(null);

        try {
            if (!authClient || !isAuthenticated) {
                throw new Error("Authentication client not available. Please login first.");
            }

            console.log("Auth status:", {
                principal: principal?.toText(),
                isAuthenticated,
                identity: authClient.getIdentity().getPrincipal().toText()
            });

            // Small delay to ensure auth stability
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log("Calling createUser with:", {
                username: username.trim(),
                bio: bio.trim(),
                profileImgUrl: profileImgUrl.trim() || ""
            });
            
            // Create user profile
            const userProfile = await actors.usersActor.createUser(
                username.trim(),
                bio.trim(),
                profileImgUrl.trim() || ""
            );
            
            console.log("User profile created successfully:", userProfile);
            
            // Register as journalist if requested
            if (isJournalist) {
                console.log("Registering user as journalist...");
                try {
                    await actors.usersActor.registerAsJournalist();
                    console.log("User registered as journalist successfully");
                } catch (journalistError) {
                    console.warn("Could not register as journalist:", journalistError);
                    // Don't fail the whole registration for this
                }
            }
            
            // Mark first login as completed (optional, since the Motoko code handles this automatically)
            try {
                await actors.usersActor.markFirstLoginDone();
                console.log("First login marked as completed");
            } catch (markError) {
                console.warn("Could not mark first login as done (this might be okay):", markError);
            }
            
            setFormState('success');
            setTimeout(() => {
                router.push("/news-feed");
            }, 1500);

        } catch (err: any) {
            console.error("Detailed error:", {
                message: err.message,
                stack: err.stack,
                name: err.name,
                cause: err.cause
            });
            
            // More user-friendly error messages
            let errorMessage = "An unexpected error occurred. Please try again.";
            if (err.message?.includes("already exists") || err.message?.includes("já possui")) {
                errorMessage = "A profile already exists for this account. Please refresh the page.";
            } else if (err.message?.includes("not authenticated") || err.message?.includes("not available")) {
                errorMessage = "Authentication issue. Please try logging out and logging back in.";
            } else if (err.message?.includes("username") || err.message?.includes("nome")) {
                errorMessage = "Username is already taken. Please choose a different one.";
            }
            
            setError(errorMessage);
            setFormState('error');
        }
    };

    // Show loading state while authentication is initializing
    if (isLoading) {
        return (
            <>
                <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
                    <div 
                        className="absolute w-full h-full top-0 left-0 bg-transparent"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                            backgroundSize: '2rem 2rem',
                            animation: 'grid-pan 60s linear infinite',
                        }}
                    ></div>
                </div>
                <main className="min-h-screen flex items-center justify-center p-4 font-sans">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FF4D00]" />
                        <p className="text-white/60">Initializing...</p>
                    </div>
                </main>
            </>
        );
    }

    // Show error if not authenticated
    if (!isAuthenticated) {
        return (
            <>
                <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
                    <div 
                        className="absolute w-full h-full top-0 left-0 bg-transparent"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                            backgroundSize: '2rem 2rem',
                            animation: 'grid-pan 60s linear infinite',
                        }}
                    ></div>
                </div>
                <main className="min-h-screen flex items-center justify-center p-4 font-sans">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
                        <p className="text-white/60">Please log in to create your profile.</p>
                        <button 
                            onClick={() => router.push("/")}
                            className="bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Go to Login
                        </button>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
                <div 
                    className="absolute w-full h-full top-0 left-0 bg-transparent"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '2rem 2rem',
                        animation: 'grid-pan 60s linear infinite',
                    }}
                ></div>
            </div>

            <main className="min-h-screen flex items-center justify-center p-4 font-sans">
                <div 
                    className={`w-full max-w-lg mx-auto bg-[#101419]/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20 transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="p-8 border-b border-white/10">
                        <p className="text-sm font-semibold text-[#FF4D00]">STEP 1 / 1</p>
                        <h1 className="text-3xl font-bold text-white tracking-tight mt-1">Create your Digital Identity</h1>
                        <p className="text-white/60 mt-2">Your profile is anonymous and linked to your identity on the network.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-[#FF4D00]" />
                                <label className="block text-sm font-medium text-white/80">
                                    Your Anonymous Identity
                                </label>
                            </div>
                            <div className="flex items-center gap-2 bg-[#0B0E13] border border-white/10 rounded-lg px-3 py-2.5">
                                <p className="flex-1 text-sm font-mono text-white/70 truncate">{principalText}</p>
                                <button type="button" onClick={copyPrincipal} className="p-1 text-white/60 hover:text-white transition-colors" title="Copy ID">
                                    {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Campo Username */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-[#FF4D00]" />
                                <label htmlFor="username" className="block text-sm font-medium text-white/80">
                                    Username
                                </label>
                            </div>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#0B0E13] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/40 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-colors"
                                placeholder="Choose your username..."
                                required
                                minLength={3}
                            />
                        </div>

                        {/* Campo Bio */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-[#FF4D00]" />
                                <label htmlFor="bio" className="block text-sm font-medium text-white/80">
                                    Biography
                                </label>
                            </div>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="w-full bg-[#0B0E13] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/40 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-colors"
                                placeholder="Describe yourself in a few words..."
                                required
                                minLength={10}
                            />
                            <p className="text-xs text-white/50">This will be displayed publicly on your profile.</p>
                        </div>

                        {/* Campo Profile Image URL (Opcional) */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-[#FF4D00]" />
                                <label htmlFor="profileImg" className="block text-sm font-medium text-white/80">
                                    Profile Image URL (Optional)
                                </label>
                            </div>
                            <input
                                id="profileImg"
                                type="url"
                                value={profileImgUrl}
                                onChange={(e) => setProfileImgUrl(e.target.value)}
                                className="w-full bg-[#0B0E13] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/40 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-colors"
                                placeholder="https://example.com/your-image.jpg"
                            />
                        </div>

                        {/* Campo Jornalista */}
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#FF4D00]" />
                                <label className="block text-sm font-medium text-white/80">
                                    Verification
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsJournalist(!isJournalist)}
                                className={`w-full flex items-center justify-between text-left p-4 rounded-lg border transition-all duration-300 ${isJournalist ? 'bg-[#FF4D00]/10 border-[#FF4D00]/50' : 'bg-[#0B0E13] border-white/10 hover:border-white/20'}`}
                            >
                                <div>
                                    <p className="font-semibold text-white">I'm a Journalist</p>
                                    <p className="text-xs text-white/60 mt-1">Activate if you work professionally in the area.</p>
                                </div>
                                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${isJournalist ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF007A]' : 'bg-white/10'}`}>
                                    <div className={`bg-white h-4 w-4 rounded-full shadow-md transform transition-transform ${isJournalist ? 'translate-x-5' : ''}`}></div>
                                </div>
                            </button>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 text-center animate-shake">{error}</p>
                        )}

                        <div>
                             <button
                                type="submit"
                                disabled={formState === 'loading' || formState === 'success' || !actors?.usersActor}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {formState === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
                                {formState === 'success' && <Check className="h-5 w-5" />}
                                <span>
                                    {formState === 'idle' && 'Complete Registration'}
                                    {formState === 'loading' && 'Creating Profile...'}
                                    {formState === 'success' && 'Profile created!'}
                                    {formState === 'error' && 'Try again'}
                                </span>
                                {formState === 'idle' && <ArrowRight className="h-5 w-5" />}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            
            <style jsx global>{`
                @keyframes grid-pan {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </>
    );
}