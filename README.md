# Learner's Lexicon

영어 학습자를 위한 영영사전 앱입니다. 간단한 레벨 테스트로 사용자의 CEFR 레벨(A1~C2)을 판정하고, 이후 모든 단어를 그 레벨에서 이해할 수 있는 어휘만 사용해 **영어로만** 설명합니다.

- **Collins COBUILD 스타일 정의** — 단어가 실제로 쓰이는 모습을 보여주는 풀센텐스 설명. 예: "If something is *ephemeral*, it lasts for only a very short time."
- **Longman Activator 스타일 동의어** — 동의어마다 자체 CEFR 레벨과 표제어와의 뉘앙스 차이(격식, 강도, 쓰이는 맥락)를 한 줄로 정리. 동의어를 클릭하면 바로 그 단어를 검색합니다.
- **단어마다 일러스트 생성** — OpenAI 이미지 API(gpt-image-2)가 단어의 대표 의미를 색연필풍 그림으로 그려줍니다.
- **한글 번역 토글** — 정의·예문·콜로케이션마다 자연스러운 한글 번역이 함께 생성되며, 헤더의 한국어 스위치로 켜고 끌 수 있습니다.
- **발음 듣기(TTS)** — 표제어·예문·동의어 옆 스피커 버튼으로 원어민 발음을 들을 수 있습니다 (OpenAI TTS).
- **작문 연습 코치** — 검색한 단어로 직접 문장을 써보면 AI가 레벨에 맞는 영어로 첨삭해줍니다.

> 화면별 사용 방법은 [사용설명서(USER_GUIDE.md)](USER_GUIDE.md)를 참고하세요.

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 레벨 테스트 | 8문항 객관식(A1→C2 난이도순). 점수로 레벨을 판정해 localStorage에 저장. 이미 레벨을 알면 건너뛰고 직접 선택 가능 |
| 레벨 변경 | 헤더의 LEVEL 셀렉트로 즉시 변경, RETAKE TEST로 재응시 |
| 단어 검색 | 레벨에 맞춘 정의·예문·동의어를 구조화된 JSON(strict schema)으로 생성 |
| 오타 교정 | 사전에 없는 입력이면 "Did you mean …?" 제안 |
| 최근 검색 | 최근 8개 단어를 localStorage에 저장, 첫 화면에서 바로 재검색 |
| 일러스트 | 정의가 먼저 표시되고 그림은 비동기로 로드 (실패해도 사전 기능은 정상 동작) |
| 한글 번역 | 정의·예문·콜로케이션의 한글 번역. 헤더 토글로 ON/OFF (설정은 localStorage에 저장) |
| 발음 듣기 | 스피커 버튼 클릭 시 OpenAI TTS로 합성한 음성 재생. 같은 문장은 세션 내 캐시 |
| 콜로케이션 | 단어가 자주 쓰이는 덩어리 표현(COMMON PHRASES) 3~5개를 예문과 함께 제공 |
| 작문 연습 | 단어로 문장을 써서 제출하면 AI 코치가 판정(great/minor/needs work)·피드백·교정문 제공 |

## 설치 및 실행

```bash
cp .env.local.example .env.local   # OPENAI_API_KEY 입력 (.env 파일도 동일하게 동작)
npm install
npm run dev
```

http://localhost:3000 접속. (3000번 포트가 사용 중이면 Next.js가 자동으로 3001 등 다른 포트를 사용합니다 — 터미널 출력 확인)

## 환경 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | 필수. OpenAI API 키 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 사전 엔트리(정의·동의어) 생성 모델 |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` | 일러스트 생성 모델. 사용 불가 시 `gpt-image-1-mini`로 자동 폴백 |
| `OPENAI_TTS_MODEL` | `gpt-4o-mini-tts` | 발음 합성 모델. 사용 불가 시 `tts-1`로 자동 폴백 |
| `OPENAI_TTS_VOICE` | `alloy` | TTS 목소리 (alloy, echo, nova 등) |

> 비용 참고: 이미지 1장당 약 $0.006(gpt-image-2, low 품질, 1024×1024). 정의·작문 피드백은 gpt-4o-mini 기준 회당 $0.001 미만, TTS는 문장당 $0.001 수준.

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 진입점 — 레벨 유무에 따라 테스트/사전 분기
│   ├── layout.tsx                # 폰트(Newsreader, IBM Plex) 및 메타데이터
│   ├── globals.css               # 디자인 토큰 (종이 사전 콘셉트)
│   └── api/
│       ├── define/route.ts       # 단어 → 구조화된 사전 엔트리 + 한글 번역 (strict JSON schema)
│       ├── illustrate/route.ts   # 이미지 프롬프트 → 색연필풍 일러스트
│       ├── speak/route.ts        # 텍스트 → 발음 음성(mp3, OpenAI TTS)
│       └── practice/route.ts     # 사용자 작문 → AI 코치 피드백
├── components/
│   ├── LevelTest.tsx             # 8문항 레벨 테스트 (인트로 → 퀴즈 → 결과)
│   ├── Dictionary.tsx            # 검색, 엔트리 레이아웃, 동의어·콜로케이션, 한국어 토글
│   ├── SpeakButton.tsx           # 발음 재생 버튼 (음성 blob 세션 캐시)
│   └── PracticeBox.tsx           # 작문 연습 입력 + 피드백 표시
└── lib/
    ├── types.ts                  # CEFR 레벨, 엔트리 타입 정의
    ├── level-test.ts             # 테스트 문항, 채점 기준, 레벨별 추천 단어
    └── use-local-storage.ts      # SSR 안전 localStorage 훅 (useSyncExternalStore)
```

## 동작 흐름

1. 첫 방문 시 레벨 테스트 → 판정된 레벨이 `localStorage`에 저장됩니다.
2. 단어 검색 시 `/api/define`이 사용자 레벨을 프롬프트에 포함해 OpenAI를 호출합니다. 정의·예문·동의어 전부 해당 레벨 이하 어휘로 작성되며, 더 어려운 단어가 불가피하면 괄호로 쉬운 설명을 덧붙입니다. 한국어는 사용하지 않습니다.
3. 정의 응답에 포함된 `imagePrompt`로 `/api/illustrate`가 일러스트를 생성합니다.

## 기술 스택

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4
- OpenAI API (`openai` SDK) — chat completions(structured outputs) + images
