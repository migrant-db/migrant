# Migrant

Migrant is an AI-powered engineering intelligence CLI designed to help you understand, optimize, and interrogate your PostgreSQL databases.

---

## Installation

**Install via NPM/bun:**
```bash
npm install -g migrant-cli
```

```bash
bun add -g migrant-cli
```

**Install via curl:**
```bash
curl -fsSL https://raw.githubusercontent.com/migrant-db/migrant/main/install.sh | bash
```

**Install via brew:**
```bash
brew install migrant-db/tap/migrant
```

---

## 100% Local & Secure

Your database credentials and schema data never leave your machine. Migrant connects directly from your local terminal and stores all context locally. No cloud sync, no middleman servers.

---

## The Problem

As data infrastructure grows, developers end up managing multiple databases (production, staging, analytics) with increasingly complex schemas.

Understanding and optimizing these systems is painful and manual:
* **What tables, columns, and relationships exist** across different databases?
* **What happens if a column or constraint is changed or removed?**
* **Are production, staging, and dev schemas actually consistent?**
* **How do access controls and RLS policies** protect data across tables?

Existing database tools only allow you to write static queries. They don't provide an intelligent, context-aware layer that actually understands your schema relationships and helps you optimize them.

---

## What's Built

Migrant focuses on deep database introspection and natural language retrieval directly in your terminal:

* **100% Local Architecture:** Your data never touches a cloud server. Database connections happen securely from your own machine, and all vector embeddings are stored entirely locally.
* **Interactive Terminal Interface:** Built with Bun + OpenTUI for a blazingly fast, responsive CLI experience.
* **Authentication & Keyring Integration:** Secure web login flow via Supabase, with sessions stored locally in SQLite and database credentials saved directly in OS credential keychains.
* **PostgreSQL Schema Scanner:** Deep extraction of database schemas, tables, columns, data types, primary keys, foreign key relationships, and constraints.
* **Knowledge Indexing & RAG:** Structuring schema data into searchable knowledge representations and vector embeddings.
* **Natural Language Query Engine:** Ask natural language questions in the CLI about connected database structures and relationships, powered by multi-provider LLM integrations (OpenAI, Anthropic, DeepSeek, Groq, OpenRouter).
* **Multi-Database Workspaces:** Support for connecting, persisting, and switching between multiple databases (e.g., `production`, `staging`) inside a single local workspace.

---

## Roadmap & Next Steps

Migrant is evolving to become a complete AI DBA in your terminal:

* **Query Routing & Optimization:** Smart classification of user queries to route between direct schema lookups, live database queries, and AI-driven analysis of slow queries.
* **Schema Freshness & Drift Detection:** Automatically detecting schema changes in connected databases and re-indexing knowledge without requiring manual rescans.
* **Multi-Database Intelligence:** Answering comparative queries across environments (e.g., *"Compare the users table schema between production and staging"*).
* **Impact Analysis:** Pre-evaluating schema migrations to show exactly what relationships break before applying a change.
* **Security & Policy Audit:** Introspecting PostgreSQL Row Level Security (RLS) policies and permissions to explain who can access what data.

---

## The Goal

The goal for Migrant is to serve as the ultimate, intelligent companion for your databases.

Instead of manually digging through ERDs, writing complex join queries to understand relationships, or guessing why a query is slow, Migrant provides a living, intelligent map of your database architecture—keeping your data systems understood, optimized, and instantly queryable in plain English.

---

## Contributing

We welcome contributions! Whether you're fixing bugs, adding new LLM providers, or improving schema parsing, your help is appreciated.

1. Fork the repository
2. Clone your fork locally: `git clone https://github.com/migrant-db/migrant.git`
3. Install dependencies: `bun install`
4. Run locally: `bun dev`
5. Create a new branch, make your changes, and submit a Pull Request!

For major feature additions, please open an issue first to discuss the implementation.
