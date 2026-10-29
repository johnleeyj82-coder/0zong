# 0zong × apochill-kit (로컬 시험판)

[apochill-kit](https://github.com/jujinghks3-svg/apochill-kit)의 옥상 3D 장면 위에 0zong 기능(게임 세이브, 지금 플레이 중
말풍선, 영화 점수, 라디오에 내 곡 추가, 주인 로그인)을 얹어서 **내 컴퓨터에서만** 돌려보는 시험판이에요.

## ⚠️ 쓰기 전에

apochill-kit에는 재사용 라이선스가 없어요("공개 열람·검토용", 재배포·재사용은 저작자에게 문의). 그래서

- 이 폴더에는 **우리가 쓴 코드만** 있어요. apochill의 코드·모델·텍스처·음악을 0zong 저장소에 복사하지 마세요.
- apochill 파일은 고치지 않아요. 말풍선 연결 한 줄은 개발 서버가 메모리에서만 끼워 넣어요.
- **공개 사이트로 배포하지 마세요.** 배포하려면 먼저 저작자에게 허락을 받아야 해요.

## 실행

```bash
# 1) apochill-kit을 0zong 옆 폴더에 받기 (한 번만)
cd ~ && git clone https://github.com/jujinghks3-svg/apochill-kit.git
cd apochill-kit && npm ci            # Node.js 24 이상 권장

# 2) 터미널 1: 0zong 서버
cd ~/0zong && npm run dev            # http://127.0.0.1:3000

# 3) 터미널 2: apochill + 0zong 기록함
cd ~/0zong && npm run apochill       # http://127.0.0.1:5174
```

apochill-kit을 다른 곳에 받았다면 `APOCHILL_DIR=그경로 npm run apochill`, 0zong 주소가 다르면 `ZONG_URL=...`.

## 무엇을 하나요

| 경로 | 동작 |
|---|---|
| `/zong/*` | 0zong 서버(3000)로 중계. 데이터와 주인 로그인은 0zong이 그대로 맡아요 |
| `/audio/bgm/playlist.json` | apochill 원래 곡 + 0zong에 올린 곡을 합친 목록. 라디오가 그대로 읽어요 |
| `/audio/bgm/zong/<id>.<ext>` | 0zong 곡 파일 중계(구간 요청 지원) |
| 캠프 설정 독의 **0ZONG 기록함** | 게임 / 영화 / 음악(내 곡 추가) / 주인 탭 |
| 캐릭터 말풍선 | 0zong에서 '지금 하는 게임 공개'를 켜면 60초마다 "지금 ○○ 하는 중" |

주인 로그인은 기록함의 **주인** 탭에서 해요(주소가 127.0.0.1:5174라서 3000에서 한 로그인과 따로예요).
곡을 올린 뒤 **라디오에 반영(새로고침)**을 누르면 라디오 목록 끝에 들어가요.

## 파일

- `run.mjs`: apochill 폴더의 Vite로 개발 서버를 띄우고 아래 플러그인과 중계 설정을 더해요.
- `plugin.mjs`: 오버레이 스크립트 삽입, 재생 목록 합치기, 말풍선 연결.
- `overlay/`: 0ZONG 기록함 화면(apochill 도트 UI 변수 사용).
