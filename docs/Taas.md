# TaaS — Truth-as-a-Service

**TaaS** is a decentralized protocol that provides fast, auditable fact verification on-chain. It accepts user claims, sources information from the web, processes reasoning through LLMs, aggregates community input, and stores tamper-proof verdicts.


[Group things // linkedins // summary]

### 🧱 Architecture Overview

Each logical unit of the system is implemented as a separate canister, making the architecture modular, scalable, and composable.

#### Canisters

* **1. bot-plan**
  Manages user subscription plans, payments, and daily usage quotas.

* **2. search-news**
  Aggregates relevant search results and source data from the open web.

* **3. round-table**
  Handles community-driven input and voting for identifying trustworthy sources.

* **4. verdict**
  Performs claim hashing, timestamping, and stores the final signed verdicts permanently on-chain.

* **5. llm**
  Processes the data and synthesizes conclusions using a local or remote language model (LLM).

### 🔁 Processing Pipeline

```text
User Input
   ↓
[2] Web Search (search-news)
   ↓
[5] LLM Reasoning (llm)
   ↓
[3] Community Trust Scoring (round-table)
   ↓
[4] Verdict Storage (verdict)
```


### 📦 Project Structure

```
backend/
├── bot-plan/        # Subscriptions and billing
├── search-news/     # Query and collect open web sources
├── round-table/     # Voting and trust delegation
├── verdict/         # Hash and store final output
├── llm/             # Synthesize reasoning from data
```

---

### 🧪 Local Use

```bash
dfx start --clean --background
dfx canister create --all
dfx build
dfx generate
dfx deploy
```
