import { startTransition, useState } from 'react'
import './App.css'
import BattleScreen from './components/BattleScreen'
import ResultScreen from './components/ResultScreen'
import RewardScreen from './components/RewardScreen'
import StartScreen from './components/StartScreen'
import { createWelcomeState, selectRewardCard, startGame, useCard as playCard } from './game/engine'

function App() {
  const [state, setState] = useState(createWelcomeState)

  const handleStart = () => {
    startTransition(() => {
      setState(startGame())
    })
  }

  const handleUseCard = (cardId: string) => {
    startTransition(() => {
      setState((current) => playCard(current, cardId))
    })
  }

  const handleSelectReward = (cardId: string) => {
    startTransition(() => {
      setState((current) => selectRewardCard(current, cardId))
    })
  }

  return (
    <div className="app-shell">
      <div className="glow glow-left" />
      <div className="glow glow-right" />
      <main className="app-frame">
        <header className="app-header">
          <div>
            <p className="header-label">Dungeon Run</p>
            <strong>Mini Dungeon Cards</strong>
          </div>
          <div className="header-meta">
            <span>Stage {state.stage} / {state.totalStages}</span>
            <span>Deck {state.deck.length}</span>
          </div>
        </header>

        {state.screen === 'start' && <StartScreen onStart={handleStart} />}
        {state.screen === 'battle' && <BattleScreen state={state} onUseCard={handleUseCard} />}
        {state.screen === 'reward' && <RewardScreen state={state} onSelectCard={handleSelectReward} />}
        {state.screen === 'result' && <ResultScreen state={state} onRestart={handleStart} />}
      </main>
    </div>
  )
}

export default App
