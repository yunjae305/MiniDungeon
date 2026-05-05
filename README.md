# Mini Dungeon Cards

매 턴 3장의 카드 중 1장을 골라 적과 싸우고, 승리할 때마다 보상 카드를 얻어 덱을 강화하는 미니 로그라이크 카드 배틀 게임입니다.

## 구성

- 시작 화면
- 5스테이지 전투
- 공격, 방어, 회복, 독, 버프 카드
- 적 행동 패턴 순환
- 전투 로그
- 보상 카드 선택
- 게임 클리어 / 게임 오버 결과 화면

## 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm run test -- --run
npm run build
npm run lint
```

## 기술

- React 19
- Vite 8
- TypeScript 6
- Vitest
- @vitejs/plugin-legacy

## 구현 포인트

- 카드 데이터와 적 데이터를 분리해서 확장하기 쉽게 구성했습니다.
- 전투 로직은 `src/game/engine.ts`에 모아 UI와 분리했습니다.
- 전투 규칙은 테스트로 먼저 검증하고 화면은 그 상태를 그대로 렌더링합니다.
- 레거시 번들을 같이 생성해서 구형 브라우저 대응 폭을 넓혔습니다.
