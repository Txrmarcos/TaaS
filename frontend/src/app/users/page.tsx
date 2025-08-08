// pages/register.tsx
"use client";
import { useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as users } from "../../../../src/declarations/users/users.did.js";
import ids from "../../../../canister_ids.json";

export default function Register() {
  const [actor, setActor] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImgUrl, setProfileImgUrl] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializeCanister = async () => {
    try {
      const agent = new HttpAgent({ host: "http://127.0.0.1:4943" });
      await agent.fetchRootKey();
      const canisterId = ids.users.ic;
      const canister = Actor.createActor(users, { agent, canisterId });
      setActor(canister);
      const principal = await agent.getPrincipal();
      setCurrentUser(principal);
    } catch (error) {
      console.error("Falha ao inicializar o canister:", error);
    }
  };

  useEffect(() => {
    initializeCanister();
  }, []);

  async function handleRegister() {
    if (!actor) return;
    try {
      setIsLoading(true);
      const newProfile = await actor.createUser(username, bio, profileImgUrl);
      setProfile(newProfile);
    } catch (err) {
      alert("Erro ao criar perfil: " + err);
    } finally {
      setIsLoading(false);
    }
  }

  async function becomeJournalist() {
    if (!actor) return;
    try {
      const updated = await actor.registerAsJournalist();
      setProfile(updated);
    } catch (err) {
      alert("Erro ao tornar-se jornalista: " + err);
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto">
      {!currentUser ? (
        <p>Carregando identidade...</p>
      ) : (
        <>
          {!profile ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full border p-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <textarea
                placeholder="Bio"
                className="w-full border p-2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
              <input
                type="text"
                placeholder="URL da imagem de perfil"
                className="w-full border p-2"
                value={profileImgUrl}
                onChange={(e) => setProfileImgUrl(e.target.value)}
              />
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrar"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Perfil criado!</h2>
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Bio:</strong> {profile.bio}</p>
              <p><strong>É jornalista:</strong> {profile.isJournalist ? "Sim" : "Não"}</p>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded"
                onClick={becomeJournalist}
                disabled={profile.isJournalist}
              >
                Tornar-se Jornalista
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
