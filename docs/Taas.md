# Truth-as-a-Service | TaaS

<p align="center">
  <img src="images/ic-icon.svg" alt="ICP Icon" height="48" style="vertical-align:middle; margin-right:16px;">
  <img src="images/taas-icon.png" alt="TaaS Icon" height="70" style="vertical-align:middle;">
</p>

## Project Summary

*TaaS* is a decentralized protocol built on the [Internet Computer Protocol (ICP)](https://internetcomputer.org/) that provides fast, auditable fact verification on-chain.

It accepts user claims, sources information from the web, processes reasoning through LLMs, aggregates community input, and stores tamper-proof verdicts.

It's designed to combat misinformation by creating a transparent, community-driven system for verifying claims and storing tamper-proof verdicts.

## Developers
| Name                     | Contact (LinkedIn)                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Gabriel Farias** | [linkedin.com/in/gabriel-farias-alves](https://www.linkedin.com/in/gabriel-farias-alves/)           |
| **Kaiane Cordeiro**         | [linkedin.com/in/kaiane-souza](https://www.linkedin.com/in/kaiane-souza/)                           |
| **Marco A. Rizzi**       | [linkedin.com/in/marco-a-rizzi](https://www.linkedin.com/in/marco-a-rizzi/)                         |
| **Marcos Teixeira**      | [linkedin.com/in/marcos-teixeira-37676a24a](https://www.linkedin.com/in/marcos-teixeira-37676a24a/) |


## Table of Contents

- [1. Business Vision](#1-business-vision)
  - [1.1 Leveraging TaaS in the ICP Ecosystem](#11-leveraging-taas-in-the-icp-ecosystem)
  - [1.2 Integration Simplicity](#12-integration-simplicity)
  - [1.3 Agent-to-Agent Model](#13-agent-to-agent-model)
  - [1.4 Strategic Value](#14-strategic-value)
  - [1.5 Shape future in a trustless, scalable way](#15-shape-future-in-a-trustless-scalable-way)
- [2. Architecture Overview](#2-architecture-overview)

## 1. Business Vision
Truth-as-a-Service (TaaS) acts as a decentralized, auditable fact-checking engine that removes uncertainty around data veracity. It offers near-instant verification of factual claims using only audited, trusted sources and stores its results immutably on-chain. This makes TaaS an invaluable middleware service for applications needing trustworthy, verifiable data.
#### 1.1 Leveraging TaaS in the ICP Ecosystem
>How dApps Benefit from TaaS?

Any decentralized application (dApp) operating on the Internet Computer (ICP) can seamlessly incorporate TaaS to:

1. **Validate User-Generated Claims**

   * Social platforms, content aggregators, or Q\&A forums can use TaaS to verify factual claims made by users in real-time.

2. **Power Smart Contracts with Truth Signals**

   * DeFi protocols, DAOs, and prediction markets can make automated decisions (e.g., releasing funds or executing votes) based on on-chain TaaS verdicts.

3. **Enhance Reputation Systems**

   * Platforms with rating, trust, or identity systems can integrate TaaS to ensure users aren’t rewarded for misinformation.

4. **Enable Trustable ESG or Compliance Reporting**

   * Enterprises building ESG dashboards or compliance-focused dApps can use TaaS to back reports with verified public data.

#### 1.2 Integration Simplicity
The current TaaS backend is designed for streamlined integration:

* **Single Point of Truth**: dApps query the `search-news` canister for factual verifications.
* **Optional Monetization Layer**: Integration with the `bot-plan` canister enables billing, quotas, and ckBTC-based payments.
* **Auditability by Design**: Every verdict includes hash, timestamp, and source metadata, allowing dApps to offer users proof of integrity.

#### 1.3 Agent-to-Agent Model
TaaS enables an "agent communicating with agent" paradigm, where:

* Apps don’t rely on centralized APIs
* Data authenticity is provable and independent
* Decisions across multiple dApps can coordinate based on shared, trustless facts

#### 1.4 Strategic Value
By integrating TaaS, developers reduce misinformation risks, enhance automation with verified data, and differentiate their products with built-in credibility. TaaS is positioned to become a core verification primitive within the ICP ecosystem.

#### 1.5 Shape future in a trustless, scalable way
In a decentralized world, trust must be programmable. TaaS brings a truth layer to ICP, allowing applications to build on verified, auditable information. Its modular, low-friction integration model ensures that any dApp—from finance to governance to content—can incorporate truth as a service.

## 2. Architecture Overview

Each logical unit of the system is implemented as a separate canister, making the architecture modular, scalable, and composable.

#### Canisters

* **1. bot-plan**
  Manages user subscription plans, payments (ckBTC), and daily usage quotas with automatic fee splitting.

* **2. search-news**
  Core fact-checking engine that aggregates web data, integrates with external LLM services, processes reasoning, and stores tamper-proof verdicts with hashing and timestamps.

* **3. round-table**
  Handles community-driven governance, proposal creation, voting for trusted news sources, and automatic whitelist management.

#### External Dependencies

* **llm (External)**
  Remote LLM canister service (`w36hm-eqaaa-aaaal-qr76a-cai`) for AI-powered content analysis and verdict synthesis.

### 🔁 Processing Pipeline

```text
User Input
   ↓
[1] Quota Check (bot-plan)
   ↓
[2] Web Search & Data Aggregation (search-news)
   ↓
[2] LLM Analysis via External Service (search-news → llm)
   ↓
[2] Verdict Generation & Storage (search-news)
   ↓
[3] Community Source Validation (round-table)
```


### 📦 Project Structure

```
backend/
├── bot-plan/        # Subscriptions, billing, and quota management
├── search-news/     # Fact-checking engine with web search, LLM integration, and verdict storage
├── round-table/     # Community governance and source validation
```

**External Dependencies:**
```
llm/                 # External LLM service (w36hm-eqaaa-aaaal-qr76a-cai)
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
