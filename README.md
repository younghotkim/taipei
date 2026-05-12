# Taipei Trip Diary

`trip.md` 일정을 바탕으로 만든 Next.js 여행기 사이트입니다.

## 실행

```bash
npm install --cache /tmp/npm-cache
npm run dev
```

## Google Maps 설정

1. `.env.example`을 참고해서 `.env.local`을 만듭니다.
2. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`에 Google Maps JavaScript API 키를 넣습니다.
3. 개발 서버를 다시 시작합니다.

API 키가 없어도 일정, 기록장, 내보내기/가져오기는 동작하고 지도 영역에는 안내가 표시됩니다.

## Supabase 셋업 (새 프로젝트 기준)

1. **프로젝트 생성** — https://supabase.com/dashboard/projects → `New project`
   - Region: `Northeast Asia (Seoul)` 권장
   - Database password는 별도 보관 (Bitwarden 등)

2. **키 복사** — `Settings → API`
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트에 노출 금지)

3. **스키마 실행** — `SQL Editor → New query`에 `supabase/init.sql` 전체 붙여넣고 `Run`
   - 여행 기록, 일정, 가계부, 예약/문서 보관함, 준비물 체크리스트 테이블 + `trip-photos` Storage 버킷 + Read 정책까지 idempotent 하게 생성
   - 재실행해도 안전 (모두 `if not exists` / `on conflict`)

4. **로컬 env 설정** — `.env.example`을 참고해서 `.env.local`을 만들거나 수정:
   ```bash
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   TRIP_ID=taipei-2026
   ```

5. **dev 서버 재시작** — env 변경은 hot-reload되지 않습니다.

브라우저는 `/api/memories`, `/api/upload`, `/api/directions`만 호출하고, Service Role Key는 서버에서만 사용됩니다. Supabase 미설정 시에도 메모는 localStorage에 저장되어 동작합니다 (사진 업로드와 일정 편집 영구 저장만 비활성).

## 포함된 기능

- 날짜별 여행 타임라인
- Google Maps 마커와 날짜별 동선
- 장소별 방문 체크, 별점, 메모, 사진 링크 저장
- 장소별 예정/가는 중/완료/스킵 상태 관리
- 필수/선택/후보 일정, 체류 시간, 대체 장소, 현장 조정 팁
- Y/S 개인 코멘트와 공동 메모
- 지출 금액/분류/결제자 기록 + 영하/소현 분담 정산
- 예약번호/문서 링크/파일 첨부(탑승권 PDF·바우처)/eSIM/보험/항공/숙소 보관함 + 다가오는 예약 카운트다운
- 항공편 실시간 상태 (AviationStack — 운항상태·터미널·게이트·지연·예정 vs 실제, 키 설정 시)
- 준비물 체크리스트 (타이베이 5월 기준 프리셋 + 직접 추가, 영하/소현 동기화)
- 타이베이 현지 정보 — 긴급 연락처·돈·교통·기본 정보·비상 중국어
- "오늘" 모드 근처 추천 (Places — 맛집·카페·디저트·바·마트·명소, ⭐·도보거리·영업중)
- 가계부 입력 시 TWD → KRW 실시간 환산 표시
- 영업시간, 예약 상태, 리스크 메모, 후보/필수 빠른 전환
- 브라우저 localStorage 저장
- Supabase 서버 저장, 미설정 시 localStorage fallback
- 여행 기록 JSON 내보내기/가져오기
- 여행 후 확장 가능한 기능 기획 섹션
