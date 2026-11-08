# 점자메뉴판 보유 매장 찾기 — 전체 소스 내보내기

## 내보내기 기준

- 내보낸 날짜: 2026-11-08 (한국 시간)
- 배포 사이트: https://sonkkeut-menu-guide.brainydrake131.chatgpt.site/
- Sites 버전: 24
- 원본 커밋: a3eeac0f22e32a0cf1577ee0e5838247d98f463f
- 프로젝트 ID: appgprj_6add7fb4c664819194de32cd9fea0994

원본 저장소에 추적된 모든 파일을 해당 커밋에서 내보냈습니다. 원본 파일의 내용은 변경하지 않았습니다. 이 안내서, package.json, scripts/serve.mjs, start-windows.cmd, EXPORT_MANIFEST.json은 로컬 실행과 검증을 위해 내보내기 사본에만 추가했습니다. 기존 사이트에 대한 수정이나 재배포는 수행하지 않았습니다.

## 1. Windows에서 실행

1. ZIP 파일을 내려받아 압축을 풉니다. ZIP 안에서 직접 실행하지 마세요.
2. Node.js 22 이상을 설치합니다. Node.js는 https://nodejs.org/ 에서 받을 수 있습니다. 이미 설치되어 있다면 터미널에서 `node --version`으로 확인합니다.
3. 프로젝트 폴더 안의 `start-windows.cmd`를 더블클릭합니다.
4. 실행 창을 열어둔 상태로 Chrome 또는 Edge에서 **http://localhost:5173** 에 접속합니다.
5. 종료할 때 실행 창에서 Ctrl+C를 누릅니다.

PowerShell이나 VS Code 터미널로 실행하려면 프로젝트 폴더에서 다음 명령을 실행해도 됩니다.

```powershell
npm start
```

별도 npm 패키지가 없으므로 `npm install`은 필요하지 않습니다. PowerShell에서 npm.ps1 실행 정책 오류가 나오면 정책을 변경하는 대신 다음 명령을 사용하세요.

```powershell
node scripts/serve.mjs
```

macOS와 Linux에서도 Node.js 22 이상을 설치한 뒤 같은 `npm start` 명령으로 실행할 수 있습니다.

5173 포트를 다른 프로그램이 쓰고 있으면 Windows PowerShell에서 다음처럼 실행합니다.

```powershell
$env:PORT = '5174'
node scripts/serve.mjs
```

이 경우 접속 주소는 http://localhost:5174 입니다. 서버는 내 컴퓨터에서만 접속할 수 있도록 127.0.0.1에 연결됩니다.

## 2. 프로젝트 구조와 역할

```text
sonkkeut-menu-source-v24/
  .openai/
    hosting.json            기존 Sites 프로젝트·정적 배포 폴더 설정
  dist/
    index.html              문서 기본 구조, 사이트 헤더와 화면 설정
    style.css               전체 레이아웃·색상·반응형·고대비·상단 돌아가기 스타일
    app.js                  목록·검색·지역 선택·상세·안내·제보 화면 및 화면 이동
    sheet-feed.js           공개 CSV 요청·파싱·검증·매장 데이터 변환
    report-mail.js          오류 제보 본문 및 mailto 주소 생성
    public-feed.json        기존 공개용 구글 시트 CSV 주소
  tests/
    report-mail.test.mjs     오류 제보 검증 테스트
    sheet-feed.test.mjs      시트 데이터 파싱·검증 테스트
  scripts/
    serve.mjs               내보내기 사본의 로컬 실행용 정적 서버
  README.md                 원본 데이터 운영·기능 설명
  EXPORT_README.md          이 실행·구조 안내서
  EXPORT_MANIFEST.json      원본 커밋과 파일별 SHA-256 검증 정보
  package.json              내보내기 사본의 실행·테스트 명령
  start-windows.cmd         Windows 더블클릭 실행 도구
```

이 프로젝트는 React/Next.js나 TypeScript를 사용하지 않는 HTML·CSS·JavaScript 정적 웹입니다. 별도의 TS/TSX 파일, React 컴포넌트 폴더, 빌드 과정은 존재하지 않습니다. 카드와 각 화면을 구성하는 함수는 `dist/app.js`에, 장식용 SVG 아이콘도 같은 파일에 포함되어 있습니다. `dist`라는 이름을 쓰지만 여기의 파일들이 사람이 수정하는 실제 원본 소스이며 압축·번들된 결과물만 제공하는 것이 아닙니다.

ES 모듈과 데이터 요청을 사용하므로 `dist/index.html`을 더블클릭해 file:// 주소로 여는 대신 로컬 서버를 실행하세요.

## 3. 기존 기능과 외부 연결

- 매장 검색, 지역 선택, 매장 상세, 메뉴판 이용 방법, 접근 정보, 매장 특징을 기존 코드 그대로 제공합니다.
- 글자 크기·고대비 설정은 브라우저 localStorage에 저장합니다. 기존 사이트와 localhost는 주소가 다르므로 화면 설정은 각각 저장됩니다.
- 매장 데이터는 `dist/public-feed.json`의 기존 **사이트 공개용 탭 CSV**에서 불러옵니다. 인터넷 연결과 해당 탭의 웹 게시 유지가 필요합니다. 이 ZIP은 구글 시트 파일이나 Apps Script의 내보내기가 아니며 매장 데이터의 고정 스냅샷도 포함하지 않습니다.
- 시트 설정과 헤더 규칙, 공개/비치 조건은 원본 `README.md`와 `dist/sheet-feed.js`에 설명되어 있습니다. 구글 게시 캐시 때문에 수정 반영에는 지연이 있을 수 있습니다.
- 카카오맵·네이버지도 길찾기는 외부 서비스로 연결합니다. 전화하기는 기기의 전화 앱 지원이 필요합니다.
- 오류 제보는 sonkkeutgp@gmail.com을 받는 사람으로 채운 메일 앱을 엽니다. 실제 발송은 사용자가 메일 앱에서 전송해야 합니다. 자동 접수 서버나 발송 확인 기능은 없습니다.
- 주소·제보 내용 복사는 브라우저 권한과 환경에 따라 작동합니다. 데스크톱의 메일·전화 연결 여부도 설치된 앱과 운영체제 설정에 따라 달라집니다.
- 사이트 코드 자체는 ChatGPT 로그인이나 OpenAI API 키를 사용하지 않습니다. 기존 Sites 주소의 공유·로그인 설정은 호스팅 서비스 설정으로, 소스 코드에 포함되는 로그인 구현이 아닙니다.

## 4. 코드 검토 및 수정

VS Code의 폴더 열기로 압축을 푼 프로젝트 폴더 전체를 열면 됩니다. 화면 동작은 app.js, 디자인은 style.css, 데이터 변환은 sheet-feed.js, 제보 메일은 report-mail.js에서 확인할 수 있습니다. 수정한 파일을 저장하고 브라우저를 새로고침하면 로컬 화면에 반영됩니다.

기존 테스트 6개 실행:

```powershell
npm test
```

이 테스트는 데이터 파싱·검증과 메일 본문·주소 생성을 확인합니다. 실제 모바일 화면낭독기나 외부 지도·메일 앱의 동작을 대신 검증하지는 않습니다.

## 5. 다른 호스팅으로 옮기기

일반 정적 웹 호스팅에서는 **dist 폴더의 내용 전체**를 사이트 루트로 배포하면 됩니다. 별도 서버 API, 데이터베이스, 빌드 명령이나 비밀 환경변수는 필요하지 않습니다. 해시 경로(#store/..., #report/..., #guide)를 사용하므로 일반 페이지 경로를 위한 SPA 재작성 설정도 필요하지 않습니다.

`.openai/hosting.json`은 기존 Sites 연결 정보를 보존한 파일이며 다른 호스팅에서는 필요하지 않을 수 있습니다. 이 ZIP에는 저장소 인증 토큰이나 Git 내부 정보(.git)는 포함하지 않았습니다. Sites 플랫폼 자체의 소스·인증 시스템·호스팅 인프라는 사용자 프로젝트의 소스 범위에 포함되지 않습니다.
