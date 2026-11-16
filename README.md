# College Scholastic Ability Test

AI를 활용해 수능 수학 수록 대상 **전체 329문항의 풀이와 시각화 자료**를 구성하고 공유하는 프로젝트입니다. 문제와 풀이의 전체 구조를 먼저 살펴본 뒤, 필요한 개념과 세부 계산을 따라 내려가는 **TOP-DOWN 방식의 공부에 도움이 될 수 있도록 배포합니다.**

수식의 변형에 따라 교점과 기준이 어떻게 바뀌는지, 조건의 경계에서 그래프가 어떻게 달라지는지, 공간에서 도형과 정사영이 어떤 관계를 갖는지를 직접 움직이며 살펴볼 수 있습니다.

## 만든 이유

과거 수학을 공부할 때, 미적분에서는 그래프의 개형이 한눈에 들어오지 않았고 기하와 벡터에서는 3차원 공간을 머릿속으로 상상하기가 어려웠습니다. 확률과 통계도 시각화하면 기하학적인 무늬와 패턴으로 이해할 수 있을 것 같았지만, 종이 위의 수식과 풀이만으로는 그 모습이 잘 보이지 않았습니다.

이런 경험을 바탕으로, 당시 머릿속으로만 그려야 했던 모습을 직접 보고 움직이며 이해할 수 있는 자료를 만들고자 했습니다. 전체 풀이의 흐름을 먼저 관찰하고 필요한 개념으로 내려가는 TOP-DOWN 학습에 이 자료가 도움이 되었으면 합니다.

## 웹에서 보기

별도 설치 없이 **[jblee.app](https://jblee.app)**에서 바로 볼 수 있도록 공개합니다.

시각화 주소: **[수능 수학 시각화](https://jblee.app/College-Scholastic-Ability-Test/)**.

## 수록 내용

2017학년도부터 2026학년도까지의 본수능에서 미적분 144문항, 기하·벡터 76문항, 확률과 통계 109문항을 제공합니다. 2022학년도 이후의 공통 문항(1번부터 22번까지)은 제외하고, 이전 시험은 과목 기준으로 선별했습니다. 가·나형 중복 문항은 하나로 연결했습니다.

- 전체 문항의 풀이 단계, Three.js 시각화, 단계 재생과 전환 슬라이더
- 2차원 그래프 이동·확대, 3차원 도형 회전·확대
- 과목·학년도·문항 검색, 저장 및 공유 링크
- 평가원 문제 원문과 EBSi 공식 풀이 자료실 연결

원문·해설 PDF는 재배포하지 않으며, 자료실 링크로 제공합니다. React, TypeScript, shadcn/ui, Three.js, KaTeX로 만들었습니다.

## 로컬 실행

Node.js 24 이상에서 저장소를 내려받은 뒤 실행합니다.

```sh
npm ci
npm run build
npm run preview
```

[http://localhost:4173](http://localhost:4173)에서 열 수 있습니다. Windows PowerShell에서 실행 정책 오류가 나면 `npm` 대신 `npm.cmd`를 사용하세요.

## 배포 및 검증

`main`에 올린 변경은 GitHub Actions에서 데이터 검사, 테스트, 빌드를 거쳐 GitHub Pages에 배포됩니다. 최초 한 번 저장소의 **Settings → Pages → Source**를 **GitHub Actions**로 설정해야 합니다. [GitHub의 배포 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

```sh
npm run check:data
npm run check:visuals
npm test
```

데이터 검산과 테스트를 수행했지만, AI를 활용해 작성한 학습 보조 자료이므로 학습 중에는 공식 문제·풀이도 함께 확인할 수 있도록 연결했습니다. 실제 브라우저 화면 검수는 아직 완료하지 못했습니다. 자세한 검증 범위는 [VERIFICATION.md](VERIFICATION.md), 데이터 수정 방법은 [개발 안내](docs/DEVELOPMENT.md)에 있습니다.
