# Tokamak Network Biweekly Report (2026-02-01 ~ 02-15)

## Highlight

Tokamak Network pushed major momentum across privacy, staking & governance, and our rollup hub stack—shipping ZK circuit upgrades for private voting, expanding TON staking with faster-withdrawal integration and a new web-based devnet monitoring UI, and accelerating developer tooling and AI-assisted infrastructure. This means users get smoother private UX (with stronger nullifier verification and multi-wallet support), token holders benefit from more robust staking operations and clearer governance flows, and builders can iterate faster with improved docs, deployment readiness, and end-to-end automation. Development activity totaled **2161** commits, **12** merged PRs across **67** repositories.

## Statistics

| Metric | Value |
|--------|-------|
| Total Commits | 2,161 |
| Total PRs | 12 |
| Active Repos | 67 |
| Contributors | 16 |
| Lines Added | +3,939,114 |
| Lines Deleted | -959,544 |
| Net Change | +2,979,570 |
| Total Changes | 4,898,658 |

## SentinAI

SentinAI is an AI-powered security sentinel that helps projects catch smart contract vulnerabilities and produce verification reports faster, improving safety and trust for users and ecosystems building on Tokamak Network.

* **Published the first system architecture draft**: Made the product direction clearer for partners and contributors, accelerating integration and reducing ambiguity about how audits and reports are produced.
* **Implemented a hybrid AI strategy with module-specific providers**: Improved detection quality and consistency by using the best-fit AI model per task, helping teams find more real issues with fewer false alarms.
* **Delivered end-to-end verification automation with Playwright test infrastructure**: Increased confidence that reports and verification flows work as intended, reducing the risk of “it passed locally” failures for teams relying on SentinAI outputs.
* **Upgraded the dashboard to show L2 nodes’ L1 RPC status**: Gave operators more actionable, real-time visibility into network dependencies, helping them diagnose issues faster and keep audit pipelines running smoothly.
* **Introduced an LLM stress-test framework plus stronger test coverage for scaling**: Improved reliability under high load so users experience fewer slowdowns or timeouts when running larger or concurrent audits.


## ton-staking-v2

ton-staking-v2 powers TON token staking so holders can earn rewards with confidence while helping secure the network through a reliable, user-friendly staking experience.

* **Integrated V3 Staking Improvements into the Fast-Withdrawal Track**: Combined the latest staking mechanics with fast-unstaking work so users ultimately get quicker exits without sacrificing safety.
* **Launched a Web-Based Devnet Monitoring Dashboard**: Added a browser UI that makes it easier to spot issues early, improving stability and reducing the chance users encounter disrupted staking experiences.
* **Enhanced Front-End Demo and Test Coverage**: Updated demos and front-end tests to make the staking flow clearer and reduce user-facing bugs during staking and withdrawal.
* **Strengthened Real-World Integration Testing for Challenge/Monitoring Flows**: Expanded end-to-end testing to catch edge cases before release, increasing reliability and lowering the risk of failed or stuck user transactions.
* **Modernized Documentation and Verification Checklists**: Replaced outdated fast-withdrawal guidance with clear design docs and review checklists, speeding up audits and helping deliver safer, easier-to-use features faster.


## zk-dex-d1-private-voting

zk-dex-d1-private-voting brings zero-knowledge private voting on-chain so communities can govern transparently while keeping individual votes confidential and tamper-proof.

* **Delivered a Working D1 Private Voting Flow**: Enabled end-to-end commit–reveal governance so users can vote privately while everyone can still verify results on-chain.  
* **Implemented D2 Quadratic Voting**: Added more fair voting power distribution so communities can better reflect intensity of preference without whales dominating outcomes.  
* **Strengthened Anti-Fraud Nullifier Checks and Multi-Wallet Support**: Reduced double-voting risk while letting users participate from different wallets more safely and conveniently.  
* **Integrated ZK Proof Generation and Deployment Tooling**: Made it easier to run and deploy the system, accelerating testnet readiness and shortening the path to real governance pilots.  
* **Enhanced Voting UX and Navigation**: Improved clarity and feedback (progress tracking, blocked UI after voting, better translations, proposal carousel) so users make fewer mistakes and feel confident their vote was submitted.


## dust-protocol

Dust Protocol enables confidential token transfers with fast, user-friendly onboarding so people can move assets privately without sacrificing everyday wallet convenience.

- **Expanded Confidential ERC‑20 Transfers and Cross‑Chain Naming**: Enabled private transfers for standard tokens and clearer cross-chain identity mapping so users can send assets discreetly while keeping their wallet experience understandable.
- **Integrated Railgun Privacy Pool Withdrawals**: Improved withdrawal “unlinkability,” making it significantly harder for observers to connect deposits to withdrawals and strengthening user privacy guarantees.
- **Enabled One‑Click Social Login Onboarding**: Added Privy-powered sign-in options (Google, Apple, Discord, email, and Twitter) so new users can start using privacy features without managing complex wallet setup upfront.
- **Delivered a Unified Multi‑Address Dashboard and Private Wallet UI**: Added balance aggregation and a streamlined private wallet interface so users can manage multiple private addresses and funds in one place with less confusion.
- **Strengthened Transaction and App Reliability**: Introduced Gelato relayed transactions and resolved onboarding, registration, theme, and deployment issues—backed by a comprehensive test suite—so users see fewer failures and a smoother end-to-end experience.


## auto-research-press

Autonomous Research Press automatically aggregates, reviews, and publishes blockchain ecosystem research so users can access consistent, up-to-date insights without manual reporting overhead.

* **Launched v1.1.0 with improved categorization**: Users can discover reports more easily through secondary categories and a smoother, clearer browsing experience.
* **Delivered deploy-ready seed data for production environments**: New deployments start with real, usable project and results data so readers see meaningful content immediately instead of an empty site.
* **Strengthened publishing reliability by separating generated reports from source control**: Each server maintains its own published outputs, reducing deployment errors and keeping the platform stable for end users.
* **Enhanced the research queue with time tracking and clearer rejection handling**: Users get more predictable publishing timelines and fewer confusing “stuck” or low-quality report states.
* **Implemented a collaborative, multi-cycle research workflow with visual analytics**: Reviewers and contributors can iterate faster with better context and transparency, resulting in higher-quality reports for readers.


## Tokamak-zk-EVM

Tokamak-zk-EVM is the core zero-knowledge EVM engine that enables private, verifiable smart contract execution on Ethereum—so users can transact with confidentiality without sacrificing on-chain trust.

* **Optimized Proof Generation Performance**: Reduced proving overhead in the backend so private transactions can be confirmed faster and with lower compute cost for users and operators.  
* **Strengthened Commitment Handling Across the Pipeline**: Reworked how public commitments are managed from setup through verification, improving consistency so users see fewer edge-case failures when verifying private executions.  
* **Improved ERC-20 Example and Multi-State Support**: Updated configuration and simulation flows to better handle multi-tree state, making it easier for developers to ship token apps that behave predictably for end users.  
* **Delivered Automated Synthesizer Testing in CI**: Added reliable, automated test coverage for circuit synthesis so users benefit from fewer regressions and more stable releases.  
* **Enhanced Performance Visibility and Debuggability**: Expanded timing instrumentation and tooling (including visualizer updates) so bottlenecks are found earlier, translating into steadier performance and faster iteration on user-facing privacy features.


## tokamon

Tokamon is building a streamlined mobile-first experience on Tokamak Network that lets users securely connect, verify, and interact with the ecosystem—making onboarding and everyday use faster and more reliable.

* **Delivered a New React Native + Expo Mobile App**: Replaced the legacy Flutter setup so users get a more stable, modern app foundation with smoother updates and broader device compatibility.  
* **Implemented Role-Based Navigation and App Flows**: Tailored screens and permissions by user type so people see only what they need, reducing confusion and speeding up key actions.  
* **Integrated WalletConnect for Simple Wallet Linking**: Enabled secure wallet connection through WalletConnect so users can sign in and interact without manual configuration or risky copy‑pasting.  
* **Enabled Push-Based Device Claim Without a Wallet**: Added FCM-based device claiming so new users can start using the app and receive notifications immediately, even before setting up a crypto wallet.  
* **Strengthened Smart Contract Upgradability and Reliability**: Introduced an upgradeable proxy pattern, contract optimizations, and a full automated test suite so users benefit from safer releases, fewer failures, and easier future improvements without service disruption.


## all-thing-eye

all-thing-eye is Tokamak Network’s internal ecosystem-operations platform that automates support and reporting workflows, helping teams respond faster and make better decisions with reliable data.

* **Launched a ticket-based Support Bot**: Automated routine support tasks so users get quicker, more consistent responses without waiting on manual triage.  
* **Implemented secure authentication with OAuth**: Made sign-in simpler and safer, reducing access friction while protecting operational data.  
* **Strengthened Slack integration and token separation**: Improved reliability and security of Slack-driven workflows so automations run smoothly without misrouted permissions.  
* **Delivered a weekly output bot with a tools management UI**: Gave stakeholders clearer, automated weekly updates and an easier way to manage operational tools without engineering help.  
* **Enhanced member activity tracking with Code Stats and GitHub auto-migration**: Kept contributor data accurate even when IDs change, enabling more trustworthy visibility into team output and engagement.


## tokamak-dao-v2

tokamak-dao-v2 is a decentralized governance platform where TON holders can propose and vote on protocol upgrades, making decision-making more transparent, safer, and community-led.

* **Enhanced Wallet and Delegation Flow**: Automatically switches users to the right network, improves delegation interactions, and prevents “stuck loading” states so voting and delegating feel smoother and more reliable.
* **Implemented DAO-Adjustable Governance Parameters**: Lets the community update key governance settings through approved decisions, reducing reliance on manual interventions and improving long-term flexibility.
* **Integrated a Proposal Action Builder**: Makes it easier to assemble correct proposal actions, reducing errors and helping proposals execute as intended when voters approve them.
* **Delivered a vTON Issuance Simulator and Updated Specs**: Helps users and delegates preview how issuance outcomes may change under different conditions, enabling more informed debate before voting.
* **Shipped a More Stable Demo and Sandbox Environment**: Adds a deployable demo backend and UI, improves sandbox API routes, standardizes RPC access, and refreshes Sepolia contract deployments so contributors can test and iterate faster with fewer connectivity issues.


## Tokamak-AI-Layer

Tokamak-AI-Layer is building the smart contracts and user tools needed to run AI-powered yield and trading agents on Tokamak, making it easier and safer for users to access automated strategies without managing complex infrastructure themselves.

* **Launched Core Smart-Contract Infrastructure**: Established the on-chain foundation needed to securely register, run, and track AI agent activity so users can rely on consistent, auditable execution.
* **Implemented Staking & Operator Workflows**: Improved how operators are configured and managed, reducing setup errors and helping users experience more reliable staking outcomes.
* **Delivered End-to-End Validation Workflow**: Added clearer validation steps and fixes so users can verify strategy/agent behavior with fewer surprises and greater confidence.
* **Shipped Updated Front End, SDK, and New UI**: Made the product easier to use and integrate, letting users and partners interact with agents through simpler screens and developer-friendly tooling.
* **Enhanced Yield and Trading Agents (Leverage/Short Support)**: Expanded strategy capabilities so users can access more advanced automated trading options while benefiting from improved agent stability and fixes.


## Other repos

* Other Active Developments: Managed consistent updates across 57 other repositories, focusing on continuous maintenance, documentation, and automated testing to ensure a robust ecosystem.


