import { startTransition, useState } from 'react'
import './App.css'
import BattleScreen from './components/BattleScreen'
import ResultScreen from './components/ResultScreen'
import RewardScreen from './components/RewardScreen'
import StartScreen from './components/StartScreen'
import {
  createWelcomeState,
  endTurn as finishTurn,
  selectRewardCard,
  startGame,
  useCard as playCard,
} from './game/engine'

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

  const handleEndTurn = () => {
    startTransition(() => {
      setState((current) => finishTurn(current))
    })
  }

  const handleSelectReward = (cardId: string | null) => {
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
            <p className="header-label">던전 탐험</p>
            <strong>미니 던전 카드</strong>
          </div>
          <div className="header-meta">
            <span>{state.stage} / {state.totalStages} 스테이지</span>
            <span>덱 {state.deck.length}장</span>
            {state.screen === 'battle' && <span>에너지 {state.energy} / {state.maxEnergy}</span>}
          </div>
        </header>

        {state.screen === 'start' && <StartScreen onStart={handleStart} />}
        {state.screen === 'battle' && (
          <BattleScreen state={state} onUseCard={handleUseCard} onEndTurn={handleEndTurn} />
        )}
        {state.screen === 'reward' && <RewardScreen state={state} onSelectCard={handleSelectReward} />}
        {state.screen === 'result' && <ResultScreen state={state} onRestart={handleStart} />}
      </main>
    </div>
  )
}

export default App
