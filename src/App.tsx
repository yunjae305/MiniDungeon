import { startTransition, useState } from 'react'
import './App.css'
import BattleScreen from './components/BattleScreen'
import MapScreen from './components/MapScreen'
import RestScreen from './components/RestScreen'
import ResultScreen from './components/ResultScreen'
import RewardScreen from './components/RewardScreen'
import ShopScreen from './components/ShopScreen'
import StartScreen from './components/StartScreen'
import {
  buyShopCard,
  buyShopRelic,
  createWelcomeState,
  endTurn as finishTurn,
  leaveShop,
  resolveRest,
  selectMapNode,
  selectRewardCard,
  startGame,
  useCard as playCard,
} from './game/engine'

function App() {
  const [state, setState] = useState(createWelcomeState)

  const handleStart = (seed: string) => {
    startTransition(() => {
      setState(startGame(seed))
    })
  }

  const handleSelectNode = (nodeId: string) => {
    startTransition(() => {
      setState((current) => selectMapNode(current, nodeId))
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

  const handleResolveRest = () => {
    startTransition(() => {
      setState((current) => resolveRest(current))
    })
  }

  const handleBuyCard = (cardId: string) => {
    startTransition(() => {
      setState((current) => buyShopCard(current, cardId))
    })
  }

  const handleBuyRelic = (relicId: string) => {
    startTransition(() => {
      setState((current) => buyShopRelic(current, relicId))
    })
  }

  const handleLeaveShop = () => {
    startTransition(() => {
      setState((current) => leaveShop(current))
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
            <span>{state.stage} / {state.totalStages}층</span>
            <span>덱 {state.deck.length}장</span>
            <span>골드 {state.gold}</span>
            <span>유물 {state.relics.length}개</span>
            {state.screen === 'battle' && <span>에너지 {state.energy} / {state.maxEnergy}</span>}
          </div>
        </header>

        {state.screen === 'start' && <StartScreen onStart={handleStart} />}
        {state.screen === 'map' && <MapScreen state={state} onSelectNode={handleSelectNode} />}
        {state.screen === 'battle' && (
          <BattleScreen state={state} onUseCard={handleUseCard} onEndTurn={handleEndTurn} />
        )}
        {state.screen === 'reward' && <RewardScreen state={state} onSelectCard={handleSelectReward} />}
        {state.screen === 'rest' && <RestScreen state={state} onResolve={handleResolveRest} />}
        {state.screen === 'shop' && (
          <ShopScreen
            state={state}
            onBuyCard={handleBuyCard}
            onBuyRelic={handleBuyRelic}
            onLeave={handleLeaveShop}
          />
        )}
        {state.screen === 'result' && <ResultScreen state={state} onRestart={() => handleStart('20260506')} />}
      </main>
    </div>
  )
}

export default App
