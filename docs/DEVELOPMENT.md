# 개발 안내

## 구조

- `src/App.tsx`: 문항 탐색, 검색, 저장, 공유와 공식 자료 연결
- `src/components/ProofPlayer.tsx`: 풀이 단계와 재생·전환 조작
- `src/components/MathScene.tsx`: Three.js 렌더링과 카메라 조작
- `src/visuals/question-scenes.ts`: 문항 데이터 지연 로딩과 단계 보간
- `scripts/content/`: 문항별 풀이·도형 생성 코드와 수치 검산
- `src/data/question-visuals/`: 과목별 생성 결과
- `public/data/visuals/`: 선택 시 불러오는 문항별 배포 데이터
- `public/portfolio/`: 기존 포트폴리오의 CSS 및 테마

## 문항 수정 후 재생성

```sh
node scripts/content/calculus-early.mjs
node scripts/content/calculus-recent.mjs
node scripts/content/geometry.mjs
node scripts/content/probability.mjs
npm run check:visuals
npm run collect:visuals
npm test
npm run build
```

일반 빌드는 저장소 안의 생성된 데이터만 사용합니다. 최초 자료 수집용 `scripts/prepare-data.mjs`는 별도로 보관한 상위 `data/research/` 자료가 있어야 실행할 수 있습니다. 원문 PDF·해설 이미지가 있는 연구 캐시는 저장소나 공개 빌드에 넣지 않습니다.

## 공개 페이지

학습 페이지는 포트폴리오의 [수능 수학 시각화](https://jblee.app/notes/math/)에서 운영합니다. 이 저장소는 해당 자료의 소스를 공유합니다. `base: './'`와 해시 링크를 사용하므로 빌드 결과를 하위 경로에도 배치할 수 있습니다.

`portfolio-card.html`은 포트폴리오에 이 자료의 링크를 추가할 때 사용할 수 있는 카드 조각입니다.

## 제한된 실행 환경

하위 프로세스를 실행할 수 없는 환경을 위해 빌드는 TypeScript의 프로세스 내부 변환을 사용합니다.

```sh
node node_modules/typescript/bin/tsc --noEmit
node scripts/build.mjs
node scripts/serve.mjs
```

곡선은 수치 샘플링으로, 단계 사이의 전환은 보간으로 표현합니다. 중간 프레임 자체는 별도의 수학적 명제가 아닙니다. 검증 결과와 확인하지 못한 항목은 [검증 기록](../VERIFICATION.md)에 정리했습니다.
