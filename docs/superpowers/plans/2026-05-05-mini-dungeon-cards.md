# Mini Dungeon Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable five-stage card battle game from the provided plan with reward selection, result states, and a polished responsive UI.

**Architecture:** Keep the combat engine in pure TypeScript modules so battle rules can be tested without React. Use a small set of React screen and panel components that render the current game state and dispatch user actions through the engine. Add a legacy production build target so the shipped bundle remains safer on older browsers.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Vitest, CSS

---

### Task 1: Project Structure And Tooling

**Files:**
- Create: `src/game/cards.ts`
- Create: `src/game/enemies.ts`
- Create: `src/game/types.ts`
- Create: `src/game/engine.ts`
- Create: `src/game/engine.test.ts`
- Create: `src/components/*.tsx`
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] Remove scaffold demo files and replace them with game-specific modules.
- [ ] Add test scripts and browser-compatibility build support.
- [ ] Keep the UI split by responsibility: start, battle, reward, result, shared panels.

### Task 2: Test-First Combat Engine

**Files:**
- Test: `src/game/engine.test.ts`
- Modify: `src/game/engine.ts`

- [ ] Write failing tests for card draw count, damage and block resolution, poison decay, reward selection, stage progression, defeat, and clear state.
- [ ] Run the test command and confirm the failures are caused by missing logic.
- [ ] Implement the smallest pure functions needed to pass those tests.
- [ ] Re-run the targeted test command until it is green.

### Task 3: React Screens And Interaction Flow

**Files:**
- Create: `src/components/StartScreen.tsx`
- Create: `src/components/BattleScreen.tsx`
- Create: `src/components/RewardScreen.tsx`
- Create: `src/components/ResultScreen.tsx`
- Create: `src/components/StatusPanel.tsx`
- Create: `src/components/EnemyPanel.tsx`
- Create: `src/components/CardList.tsx`
- Create: `src/components/CardItem.tsx`
- Create: `src/components/BattleLog.tsx`
- Modify: `src/App.tsx`

- [ ] Render the current screen from game state only.
- [ ] Wire start, card use, reward selection, and restart actions to engine functions.
- [ ] Show stage progress, deck size, hand size, HP, block, poison, and battle logs.

### Task 4: Styling, Runtime Check, And Final Verification

**Files:**
- Modify: `src/App.css`
- Modify: `src/index.css`
- Modify: `README.md`

- [ ] Replace default Vite styling with a full-screen card-battle presentation that works on desktop and mobile.
- [ ] Run `npm.cmd run test -- --run`, `npm.cmd run build`, and `npm.cmd run lint`.
- [ ] Start a local server and confirm the built app responds over HTTP.
- [ ] Review bundle output and keep the implementation lean enough for a small game.
