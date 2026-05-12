export type TripCategory =
  | "food"
  | "coffee"
  | "beer"
  | "whisky"
  | "sight"
  | "shopping"
  | "transit"
  | "hotel";

export type TripPriority = "must" | "optional" | "backup";

export type TripStop = {
  id: string;
  day: number;
  date: string;
  time: string;
  title: string;
  subtitle: string;
  nameZh: string;
  mrt: string;
  phrase: string;
  /** Pinyin (with tone marks) for `phrase` — so you can actually say it. */
  phrasePron?: string;
  /** Korean meaning of `phrase` — what you're actually saying. */
  phraseHint?: string;
  category: TripCategory;
  lat: number;
  lng: number;
  highlights: string[];
  prompt: string;
  mapsQuery: string;
};

export type StopPlanMeta = {
  priority: TripPriority;
  durationMinutes: number;
  alternatives: string[];
  flexTip: string;
  openingHours?: string;
  bookingStatus?: string;
  riskLevel?: "low" | "medium" | "high";
  riskNote?: string;
};

export type TripDay = {
  day: number;
  date: string;
  title: string;
  mood: string;
  summary: string;
};

export const tripDays: TripDay[] = [
  {
    day: 1,
    date: "5/15 금",
    title: "시먼딩 길거리 음식 & 크래프트 맥주",
    mood: "도착하자마자 먹고 걷는 첫날",
    summary: "시먼딩을 베이스로 지파이, 곱창국수, 용산사 야경, 맥주와 바까지 가볍게 이어지는 코스."
  },
  {
    day: 2,
    date: "5/16 토",
    title: "이란 카발란 + 쑤아오 냉천",
    mood: "느긋한 조식 → 기차로 이란 데이트립",
    summary: "호텔 조식 → 타이베이역에서 기차로 이란 → 로컬 점심 → 카발란 양조장 → 쑤아오 냉천 → 닝샤 야시장 → 호텔 복귀."
  },
  {
    day: 3,
    date: "5/17 일",
    title: "융캉제 + 마라 훠궈 + 바 호핑",
    mood: "커피, 딤섬, 낮맥, 마라 훠궈, 위스키",
    summary: "중정기념당 → 융캉제 딘타이펑·커피·낮맥 → 鼎王 마라 훠궈 저녁 → Bar Mood → Fake Sober로 마무리."
  },
  {
    day: 4,
    date: "5/18 월",
    title: "마지막 해장 및 출국",
    mood: "우육면과 쇼핑으로 마무리",
    summary: "니우뎬 우육면, 카르푸 쇼핑, 공항철도 이동과 면세점 카발란 체크."
  }
];

export const categoryLabels: Record<TripCategory, string> = {
  food: "미식",
  coffee: "커피",
  beer: "맥주",
  whisky: "위스키",
  sight: "관광",
  shopping: "쇼핑",
  transit: "이동",
  hotel: "체크인"
};

export const categoryColors: Record<TripCategory, string> = {
  food: "#e4572e",
  coffee: "#7a4d2b",
  beer: "#d8a31a",
  whisky: "#8b3a3a",
  sight: "#2364aa",
  shopping: "#6f5bd3",
  transit: "#2f4858",
  hotel: "#3a7d44"
};

export const tripStops: TripStop[] = [
  {
    id: "tsa-arrival",
    day: 1,
    date: "5/15 금",
    time: "13:00",
    title: "송산공항 도착 — 입국 & 이동",
    subtitle: "TW667 · 김포(GMP) → 타이베이 송산(TSA)",
    nameZh: "台北松山機場 (TSA)",
    mrt: "송산공항역(松山機場站) · 文湖線 BR12",
    phrase: "我要買一張悠遊卡，謝謝。",
    phrasePron: "wǒ yào mǎi yī zhāng yōuyóukǎ, xièxie",
    phraseHint: "이지카드(悠遊卡) 한 장 주세요",
    category: "transit",
    lat: 25.0633,
    lng: 121.552,
    highlights: ["입국심사 · 짐 찾기", "悠遊卡(EasyCard) 구매·충전 (NT$100)", "文湖線 → 忠孝復興 환승 → 板南線(BL) 西門站 (~25분)"],
    prompt: "대만 도착! 짐 찾고 이지카드 사서 문후선 타고 시먼딩으로. 도착 첫 사진 한 장.",
    mapsQuery: "Taipei Songshan Airport"
  },
  {
    id: "ximending-checkin",
    day: 1,
    date: "5/15 금",
    time: "14:30",
    title: "미드타운 리처드슨 호텔 체크인",
    subtitle: "여행 베이스캠프 · 西門町",
    nameZh: "Midtown Richardson 西門館",
    mrt: "시먼역(西門站) 1번 출구 도보 3분 · BL11",
    phrase: "你好，我有訂房，請辦理入住。",
    phrasePron: "nǐ hǎo, wǒ yǒu dìngfáng, qǐng bànlǐ rùzhù",
    phraseHint: "안녕하세요, 예약했어요 — 체크인 부탁드려요",
    category: "hotel",
    lat: 25.0427142,
    lng: 121.5094583,
    highlights: ["짐 풀기 (체크인 보통 15:00 — 일찍 도착하면 짐만 맡기기)", "근처 동선 — 시먼딩 전부 도보권", "첫 사진 남기기"],
    prompt: "도착해서 제일 먼저 찍은 사진이나 서로의 첫 인상을 적어두기.",
    mapsQuery: "Midtown Richardson Hotel Ximen Taipei"
  },
  {
    id: "hot-star",
    day: 1,
    date: "5/15 금",
    time: "16:30",
    title: "핫스타 지파이",
    subtitle: "얼굴만한 지파이 나눠 먹기",
    nameZh: "豪大大雞排",
    mrt: "시먼역(西門站) 6번 출구",
    phrase: "一份雞排，不要辣，謝謝。",
    phrasePron: "yī fèn jīpái, búyào là, xièxie",
    phraseHint: "지파이 하나, 안 맵게 해주세요",
    category: "food",
    lat: 25.0439,
    lng: 121.5089,
    highlights: ["지파이", "파우더 맛 비교", "첫 길거리 음식"],
    prompt: "지파이 크기 인증샷과 오늘의 파우더 취향 기록.",
    mapsQuery: "Hot-Star Large Fried Chicken Ximending"
  },
  {
    id: "ay-chung",
    day: 1,
    date: "5/15 금",
    time: "17:00",
    title: "아종면선 곱창국수",
    subtitle: "서서 먹는 시먼딩 필수 코스",
    nameZh: "阿宗麵線",
    mrt: "시먼역(西門站) 6번 출구",
    phrase: "一碗大碗，加香菜。",
    phrasePron: "yī wǎn dà wǎn, jiā xiāngcài",
    phraseHint: "큰 그릇 하나, 고수 넣어주세요",
    category: "food",
    lat: 25.0431,
    lng: 121.5078,
    highlights: ["곱창국수", "고수 옵션", "길거리 분위기"],
    prompt: "국물 맛을 한 단어로 남기고, 고수 찬반도 기록.",
    mapsQuery: "Ay-Chung Flour-Rice Noodle Ximending"
  },
  {
    id: "longshan-temple",
    day: 1,
    date: "5/15 금",
    time: "18:30",
    title: "용산사",
    subtitle: "야경 보며 소원 빌기",
    nameZh: "龍山寺",
    mrt: "룽산스역(龍山寺站) BL10",
    phrase: "請問怎麼參拜？",
    phrasePron: "qǐngwèn zěnme cānbài?",
    phraseHint: "참배는 어떻게 하나요?",
    category: "sight",
    lat: 25.0372,
    lng: 121.4999,
    highlights: ["야경", "소원", "도보 15분 코스"],
    prompt: "서로에게 말하지 않은 소원을 하나씩 비밀 기록으로 남기기.",
    mapsQuery: "Longshan Temple Taipei"
  },
  {
    id: "taihu-driftwood",
    day: 1,
    date: "5/15 금",
    time: "20:00",
    title: "Taihu Driftwood",
    subtitle: "유목 인테리어의 탭 맥주",
    nameZh: "臺虎 Driftwood",
    mrt: "시먼역(西門站) 1번 출구",
    phrase: "推薦一款今天的限定啤酒。",
    phrasePron: "tuījiàn yī kuǎn jīntiān de xiàndìng píjiǔ",
    phraseHint: "오늘의 한정 맥주 하나 추천해 주세요",
    category: "beer",
    lat: 25.0438,
    lng: 121.5079,
    highlights: ["탭 맥주", "수제맥주", "첫날 건배"],
    prompt: "각자 고른 맥주와 한줄 평점 남기기.",
    mapsQuery: "Taihu Driftwood Ximending"
  },
  {
    id: "foot-spa-101",
    day: 1,
    date: "5/15 금",
    time: "20:50",
    title: "발마사지 — 足spa101",
    subtitle: "탭 맥주 후 발 풀고 바 가기",
    nameZh: "足spa101 西門町按摩",
    mrt: "시먼역(西門站) 6번 출구",
    phrase: "兩位，腳底按摩，謝謝。",
    phrasePron: "liǎng wèi, jiǎodǐ ànmó, xièxie",
    phraseHint: "두 명, 발마사지요",
    category: "sight",
    lat: 25.0423512,
    lng: 121.5048014,
    highlights: ["발마사지 40분 / 60분", "탭 맥주 → 발 풀고 → 바", "팁 부담 없음 (대만)"],
    prompt: "발마사지 만족도랑 끝나고 발이 얼마나 가벼워졌는지 한 줄.",
    mapsQuery: "足spa101 西門町 Taipei foot massage"
  },
  {
    id: "hanko-60",
    day: 1,
    date: "5/15 금",
    time: "22:00",
    title: "Hanko 60",
    subtitle: "영화관 컨셉 스피크이지 바",
    nameZh: "Hanko 60",
    mrt: "시먼역(西門站) 6번 출구",
    phrase: "我有預約，兩位。",
    phrasePron: "wǒ yǒu yùyuē, liǎng wèi",
    phraseHint: "예약했어요, 두 명이요",
    category: "whisky",
    lat: 25.0436,
    lng: 121.5062,
    highlights: ["스피크이지", "위스키 칵테일", "첫날 마무리"],
    prompt: "입구 찾기 난이도와 베스트 칵테일 이름 저장.",
    mapsQuery: "Hanko 60 Taipei"
  },
  {
    id: "hotel-breakfast",
    day: 2,
    date: "5/16 토",
    time: "08:30",
    title: "호텔 조식",
    subtitle: "느긋하게 출발 (08:30~09:30)",
    nameZh: "Midtown Richardson 西門館",
    mrt: "호텔 내",
    phrase: "早餐供應到幾點？",
    phrasePron: "zǎocān gōngyìng dào jǐ diǎn?",
    phraseHint: "조식 몇 시까지예요?",
    category: "hotel",
    lat: 25.0427142,
    lng: 121.5094583,
    highlights: ["조식 시간 확인 (보통 ~10:00)", "체크아웃 아님 — 짐 두고 출발", "오늘 일정 가볍게"],
    prompt: "조식 메뉴 중 마음에 든 것, 오늘 컨디션 한 줄.",
    mapsQuery: "Midtown Richardson Hotel Ximen Taipei"
  },
  {
    id: "yilan-transfer",
    day: 2,
    date: "5/16 토",
    time: "10:00",
    title: "타이베이역 → 이란 (기차)",
    subtitle: "10:00 타이베이역 → 11시 전후 탑승 → 12:00 이란 도착",
    nameZh: "台北車站 → 宜蘭 (台鐵)",
    mrt: "타이베이역(台北車站) M8 / R10 / BL12",
    phrase: "兩張到宜蘭的火車票，謝謝。",
    phrasePron: "liǎng zhāng dào Yílán de huǒchēpiào, xièxie",
    phraseHint: "이란행 기차표 두 장이요",
    category: "transit",
    lat: 25.0478,
    lng: 121.517,
    highlights: ["台鐵 자강/거광호 ~1시간 10분", "주말 매진 — 예매 권장", "12:00 이란역 도착"],
    prompt: "차창 풍경이나 이동 중 들은 노래 한 줄.",
    mapsQuery: "Taipei Main Station"
  },
  {
    id: "yilan-brunch",
    day: 2,
    date: "5/16 토",
    time: "12:30",
    title: "이란 로컬 점심",
    subtitle: "우셔빙·육갱 등 이란 명물",
    nameZh: "宜蘭在地午餐",
    mrt: "이란역(宜蘭車站)에서 도보",
    phrase: "牛舌餅一份，一碗肉羹。",
    phrasePron: "niúshébǐng yī fèn, yī wǎn ròugēng",
    phraseHint: "니우셔빙 하나, 육갱 한 그릇이요",
    category: "food",
    lat: 24.758,
    lng: 121.753,
    highlights: ["소혀 모양 과자(우셔빙)", "마늘 고기 국수(육갱)", "카발란 가기 전 든든히"],
    prompt: "처음 먹어본 이란 음식 중 다시 먹고 싶은 메뉴 선택.",
    mapsQuery: "Yilan niu she bing rou geng"
  },
  {
    id: "kavalan",
    day: 2,
    date: "5/16 토",
    time: "14:00",
    title: "카발란 양조장 투어",
    subtitle: "예약 완료, 솔리스트 집중 공략",
    nameZh: "噶瑪蘭威士忌酒廠",
    mrt: "이란(宜蘭)에서 택시 ~25분",
    phrase: "我們有預約導覽，這是訂單號碼。",
    phrasePron: "wǒmen yǒu yùyuē dǎolǎn, zhè shì dìngdān hàomǎ",
    phraseHint: "투어 예약했어요 — 이게 예약번호예요",
    category: "whisky",
    lat: 24.7131,
    lng: 121.6904,
    highlights: ["양조장 투어", "시음", "솔리스트 라인업"],
    prompt: "오늘의 원픽 위스키, 향, 구매 후보를 남기기.",
    mapsQuery: "Kavalan Distillery Yilan"
  },
  {
    id: "suao-cold-spring",
    day: 2,
    date: "5/16 토",
    time: "16:30",
    title: "쑤아오 냉천",
    subtitle: "탄산 기포로 피로 풀기",
    nameZh: "蘇澳冷泉",
    mrt: "쑤아오신역(蘇澳新站)에서 도보",
    phrase: "兩張冷泉門票，謝謝。",
    phrasePron: "liǎng zhāng lěngquán ménpiào, xièxie",
    phraseHint: "냉천 입장권 두 장이요",
    category: "sight",
    lat: 24.5967,
    lng: 121.8512,
    highlights: ["냉천", "탄산 기포", "양조장 후 휴식"],
    prompt: "물에 들어간 첫 10초의 표정을 사진으로 남기기.",
    mapsQuery: "Suao Cold Spring"
  },
  {
    id: "ningxia",
    day: 2,
    date: "5/16 토",
    time: "19:30",
    title: "닝샤 야시장",
    subtitle: "굴전, 토란 튀김, 지파이 투어",
    nameZh: "寧夏夜市",
    mrt: "솽롄역(雙連站) G14",
    phrase: "一份蚵仔煎，一份芋頭餅。",
    phrasePron: "yī fèn ézǎijiān, yī fèn yùtóubǐng",
    phraseHint: "굴전 하나, 토란전 하나요",
    category: "food",
    lat: 25.0567,
    lng: 121.515,
    highlights: ["굴전", "토란 튀김", "야시장 먹방"],
    prompt: "둘이 고른 야시장 베스트 3 메뉴 기록.",
    mapsQuery: "Ningxia Night Market Taipei"
  },
  {
    id: "day2-wrap",
    day: 2,
    date: "5/16 토",
    time: "21:30",
    title: "마무리 — 숙소 복귀",
    subtitle: "야시장 후 호텔로 (피곤하면 바로, 여유 있으면 한잔)",
    nameZh: "西門町 (호텔 부근)",
    mrt: "시먼역(西門站) 일대",
    phrase: "一瓶台灣啤酒，謝謝。",
    phrasePron: "yī píng Táiwān píjiǔ, xièxie",
    phraseHint: "타이완 맥주 한 병 주세요",
    category: "hotel",
    lat: 25.0427142,
    lng: 121.5094583,
    highlights: ["피곤하면 바로 호텔", "여유 있으면 호텔 근처 바/편의점 맥주", "이튿날 무리 안 함"],
    prompt: "Day 2 한 줄 정리 — 카발란·냉천·야시장 중 베스트.",
    mapsQuery: "Ximending Taipei"
  },
  {
    id: "cks",
    day: 3,
    date: "5/17 일",
    time: "10:30",
    title: "중정기념당",
    subtitle: "융캉제 전 웅장한 산책",
    nameZh: "中正紀念堂",
    mrt: "중정기념당역(中正紀念堂站) R8·G10",
    phrase: "衛兵交接幾點？",
    phrasePron: "wèibīng jiāojiē jǐ diǎn?",
    phraseHint: "근위병 교대식 몇 시예요?",
    category: "sight",
    lat: 25.0346,
    lng: 121.5218,
    highlights: ["광장", "근위병 교대식", "사진 스팟"],
    prompt: "광장에서 제일 잘 나온 사진 한 장 고르기.",
    mapsQuery: "Chiang Kai-shek Memorial Hall"
  },
  {
    id: "dintaifung",
    day: 3,
    date: "5/17 일",
    time: "12:00",
    title: "딘타이펑 본점 지역",
    subtitle: "미리 산 티켓으로 점심",
    nameZh: "鼎泰豐 信義店",
    mrt: "둥먼역(東門站) R7",
    phrase: "我們有訂位，兩位。",
    phrasePron: "wǒmen yǒu dìngwèi, liǎng wèi",
    phraseHint: "예약했어요, 두 명이요",
    category: "food",
    lat: 25.0337,
    lng: 121.5302,
    highlights: ["샤오롱바오", "본점", "점심"],
    prompt: "한 입 먹고 서로의 표정 점수 매기기.",
    mapsQuery: "Din Tai Fung Xinyi Road Taipei"
  },
  {
    id: "simple-kaffa",
    day: 3,
    date: "5/17 일",
    time: "14:00",
    title: "Simple Kaffa",
    subtitle: "융캉제 근처 챔피언 커피",
    nameZh: "Simple Kaffa 興波咖啡",
    mrt: "중샤오푸싱역(忠孝復興站) BR10",
    phrase: "一杯今日特調，謝謝。",
    phrasePron: "yī bēi jīnrì tèdiào, xièxie",
    phraseHint: "오늘의 시그니처 한 잔이요",
    category: "coffee",
    lat: 25.0341,
    lng: 121.5294,
    highlights: ["스페셜티 커피", "카페 거리", "디저트"],
    prompt: "커피 산미, 향, 분위기를 각각 5점으로 기록.",
    mapsQuery: "Simple Kaffa Taipei Yongkang"
  },
  {
    id: "slow-spa-massage",
    day: 3,
    date: "5/17 일",
    time: "15:00",
    title: "전신 마사지 — 慢SPA",
    subtitle: "오전 산책 후 휴식 (전신/등/머리)",
    nameZh: "慢SPA 全身按摩",
    mrt: "둥먼역(東門站) 일대",
    phrase: "兩位，全身按摩六十分鐘，謝謝。",
    phrasePron: "liǎng wèi, quánshēn ànmó liùshí fēnzhōng, xièxie",
    phraseHint: "두 명, 전신 마사지 60분이요",
    category: "sight",
    lat: 25.0361651,
    lng: 121.5275284,
    highlights: ["전신/등/머리 마사지 (1인 1실)", "예약 권장", "융캉제·東門 도보권"],
    prompt: "마사지 전후 컨디션 차이, 또 오고 싶은지 한 줄.",
    mapsQuery: "慢SPA 全身按摩 台北 東門"
  },
  {
    id: "zhang-men",
    day: 3,
    date: "5/17 일",
    time: "16:30",
    title: "Zhang Men Brewing",
    subtitle: "융캉제 본점 낮맥 샘플러",
    nameZh: "掌門精釀啤酒 永康店",
    mrt: "둥먼역(東門站) R7",
    phrase: "一份品飲組合，謝謝。",
    phrasePron: "yī fèn pǐnyǐn zǔhé, xièxie",
    phraseHint: "테이스팅 세트 하나요",
    category: "beer",
    lat: 25.0338,
    lng: 121.5309,
    highlights: ["샘플러", "수제맥주", "낮맥"],
    prompt: "샘플러 중 1등과 꼴등을 솔직하게 적기.",
    mapsQuery: "Zhang Men Brewing Yongkang Taipei"
  },
  {
    id: "dingwang-hotpot",
    day: 3,
    date: "5/17 일",
    time: "18:00",
    title: "鼎王 마라훠궈 (저녁)",
    subtitle: "대만 대표 마라 훠궈 — 鴛鴦鍋(반반)으로 · 台北忠孝店",
    nameZh: "鼎王麻辣鍋 (台北忠孝店)",
    mrt: "충샤오둔화역(忠孝敦化站) BL16 일대",
    phrase: "兩位，鴛鴦鍋（微辣），謝謝。",
    phrasePron: "liǎng wèi, yuānyāng guō (wēi là), xièxie",
    phraseHint: "두 명, 원앙(반반)탕 — 약간만 맵게요",
    category: "food",
    lat: 25.0417614,
    lng: 121.5506429,
    highlights: ["鴛鴦鍋 — 마라/백탕 반반", "예약 권장 (성수기 웨이팅)", "탕바·반찬 무료 리필"],
    prompt: "마라 강도, 제일 맛있던 재료, 다음에 또 시킬 것 한 줄.",
    mapsQuery: "鼎王麻辣鍋 台北忠孝店"
  },
  {
    id: "bar-mood",
    day: 3,
    date: "5/17 일",
    time: "20:00",
    title: "Bar Mood Taipei",
    subtitle: "위스키 칵테일과 싱글몰트",
    nameZh: "Bar Mood Taipei",
    mrt: "중샤오푸싱역(忠孝復興站) BR10",
    phrase: "我們有預約，請推薦招牌。",
    phrasePron: "wǒmen yǒu yùyuē, qǐng tuījiàn zhāopái",
    phraseHint: "예약했어요 — 시그니처 추천해 주세요",
    category: "whisky",
    lat: 25.0332,
    lng: 121.5435,
    highlights: ["위스키", "차와 커피를 접목한 칵테일", "프리미엄 바"],
    prompt: "가장 대만답다고 느낀 향이나 재료를 남기기.",
    mapsQuery: "Bar Mood Taipei"
  },
  {
    id: "fake-sober",
    day: 3,
    date: "5/17 일",
    time: "22:30",
    title: "Fake Sober (마지막 밤 바)",
    subtitle: "타이베이 스피크이지 칵테일 바",
    nameZh: "Fake Sober Taipei",
    mrt: "信義安和(R05) / 通化夜市 일대",
    phrase: "兩位，請推薦招牌調酒。",
    phrasePron: "liǎng wèi, qǐng tuījiàn zhāopái tiáojiǔ",
    phraseHint: "두 명, 시그니처 칵테일 추천해 주세요",
    category: "whisky",
    lat: 25.0352052,
    lng: 121.5674503,
    highlights: ["시그니처 칵테일", "마지막 밤 마무리", "예약/웨이팅 확인"],
    prompt: "여행 마지막 밤의 한 문장 일기 쓰기.",
    mapsQuery: "Fake Sober Taipei bar"
  },
  {
    id: "niudian",
    day: 4,
    date: "5/18 월",
    time: "09:30",
    title: "니우뎬 우육면",
    subtitle: "진한 국물로 마지막 해장",
    nameZh: "牛店 精燉牛肉麵",
    mrt: "시먼역(西門站) 1번 출구",
    phrase: "一碗清燉牛肉麵，半筋半肉。",
    phrasePron: "yī wǎn qīngdùn niúròumiàn, bàn jīn bàn ròu",
    phraseHint: "맑은 우육면 한 그릇, 힘줄·고기 반반이요",
    category: "food",
    lat: 25.0437,
    lng: 121.507,
    highlights: ["우육면", "해장", "마지막 만찬"],
    prompt: "국물, 면, 고기 중 최고였던 요소 하나 고르기.",
    mapsQuery: "Niu Dian Beef Noodles Ximending"
  },
  {
    id: "carrefour",
    day: 4,
    date: "5/18 월",
    time: "10:30",
    title: "카르푸 쇼핑",
    subtitle: "맥주, 위스키 안주, 기념품",
    nameZh: "家樂福 桂林店",
    mrt: "룽산스역(龍山寺站)에서 도보",
    phrase: "請問金門高粱在哪裡？",
    phrasePron: "qǐngwèn Jīnmén gāoliáng zài nǎlǐ?",
    phraseHint: "금문고량주(金門高粱) 어디 있어요?",
    category: "shopping",
    lat: 25.0462,
    lng: 121.5067,
    highlights: ["금문고량주", "망고젤리", "안주 쇼핑"],
    prompt: "한국 가서 제일 먼저 열어볼 기념품 체크.",
    mapsQuery: "Carrefour Guilin Store Taipei"
  },
  {
    id: "airport",
    day: 4,
    date: "5/18 월",
    time: "12:00",
    title: "송산공항 도착 — 귀국 수속",
    subtitle: "TW668 · 타이베이 송산(TSA) → 김포(GMP) · 14:00 출국",
    nameZh: "台北松山機場 (TSA)",
    mrt: "송산공항역(松山機場站) · 文湖線 BR12",
    phrase: "我要去國際線出境，謝謝。",
    phrasePron: "wǒ yào qù guójìxiàn chūjìng, xièxie",
    phraseHint: "국제선 출국하려고요",
    category: "transit",
    lat: 25.0633,
    lng: 121.552,
    highlights: ["12:00까지 송산공항 도착 (출발 2시간 전)", "면세점 — 카발란 위스키 라인업", "TW668 14:00 출국"],
    prompt: "마지막으로 사고 싶은 카발란과 여행 총평 남기기.",
    mapsQuery: "Taipei Songshan Airport"
  }
];

export const essentials = [
  "5/18 월 11:00에는 무조건 시먼딩에서 공항철도 방향으로 이동",
  "카발란 솔리스트는 양조장과 면세점 가격을 비교",
  "지파이는 보이면 바로 하나씩 비교",
  "누가 크래커, 펑리수, 망고젤리는 선물/안주 후보"
];

export const priorityLabels: Record<TripPriority, string> = {
  must: "필수",
  optional: "선택",
  backup: "후보"
};

export const stopPlanMeta: Record<string, StopPlanMeta> = {
  "ximending-checkin": {
    priority: "must",
    durationMinutes: 45,
    alternatives: ["짐만 맡기고 바로 시먼딩 산책", "호텔 체크인이 늦으면 근처 카페 대기"],
    flexTip: "첫날 컨디션을 보고 바 일정을 줄일지 결정하는 기준점."
  },
  "hot-star": {
    priority: "optional",
    durationMinutes: 25,
    alternatives: ["시먼딩 다른 지파이 노점", "왕자치즈감자"],
    flexTip: "줄이 길면 사진만 남기고 다른 길거리 간식으로 대체."
  },
  "ay-chung": {
    priority: "must",
    durationMinutes: 30,
    alternatives: ["시먼딩 우육면", "근처 편의점 간식으로 가볍게"],
    flexTip: "고수 취향이 갈리면 한 그릇만 나눠 먹고 다음 코스로 이동."
  },
  "longshan-temple": {
    priority: "must",
    durationMinutes: 50,
    alternatives: ["시먼딩 야경 산책", "홍러우 주변 산책"],
    flexTip: "비가 오면 택시 이동, 피곤하면 20분 야경만 보고 복귀."
  },
  "taihu-driftwood": {
    priority: "optional",
    durationMinutes: 70,
    alternatives: ["Ximen Beer Bar", "편의점 맥주로 호텔 휴식"],
    flexTip: "첫날 체력이 떨어지면 Hanko 60과 둘 중 하나만 선택."
  },
  "foot-spa-101": {
    priority: "optional",
    durationMinutes: 50,
    alternatives: ["다른 西門町 발마사지샵", "호텔에서 휴식"],
    flexTip: "줄이 길면 바(Hanko 60) 먼저 가고 마사지는 다음 날 오후로."
  },
  "hanko-60": {
    priority: "optional",
    durationMinutes: 90,
    alternatives: ["Bar Mood를 3일차에 집중", "호텔 근처 조용한 바"],
    flexTip: "첫날 늦은 시간이라 컨디션이 안 좋으면 과감히 스킵."
  },
  "yilan-transfer": {
    priority: "must",
    durationMinutes: 120,
    alternatives: ["기차", "버스", "택시/투어 차량"],
    flexTip: "카발란 예약 시간 기준으로 역산해서 아침 일정을 줄이기."
  },
  "yilan-brunch": {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["카발란 근처 식사", "편의점 간단식"],
    flexTip: "이동 지연 시 브런치는 줄이고 양조장 도착을 우선."
  },
  kavalan: {
    priority: "must",
    durationMinutes: 150,
    alternatives: ["면세점 카발란 샵", "카발란 바 시음만 집중"],
    flexTip: "이번 여행의 핵심 일정. 다른 일정은 카발란 시간에 맞춰 조정."
  },
  "suao-cold-spring": {
    priority: "optional",
    durationMinutes: 90,
    alternatives: ["이란 시내 카페 휴식", "타이베이 조기 복귀"],
    flexTip: "비/피로/교통 지연이 있으면 가장 먼저 줄일 수 있는 일정."
  },
  ningxia: {
    priority: "must",
    durationMinutes: 90,
    alternatives: ["시먼딩 야식", "라오허제 야시장"],
    flexTip: "귀환 시간이 늦어지면 먹고 싶은 메뉴 2개만 고르고 짧게."
  },
  "hotel-breakfast": {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["호텔 근처 카페·아침", "출발 전 편의점 간단식"],
    flexTip: "기차 시간만 맞추면 됨 — 늦잠 자도 OK."
  },
  "day2-wrap": {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["바로 호텔 복귀", "호텔 근처 바 한 잔", "편의점 맥주"],
    flexTip: "이란 당일치기 후라 피곤하면 그냥 호텔로."
  },
  cks: {
    priority: "must",
    durationMinutes: 60,
    alternatives: ["융캉제 바로 이동", "비 오는 경우 실내 카페 먼저"],
    flexTip: "날씨가 좋으면 사진 시간을 늘리고, 덥거나 비오면 짧게."
  },
  dintaifung: {
    priority: "must",
    durationMinutes: 90,
    alternatives: ["융캉제 로컬 딤섬", "대기 긴 경우 테이크아웃 간식"],
    flexTip: "대기가 길면 티켓 순서를 확인하고 주변 카페와 순서 교체."
  },
  "simple-kaffa": {
    priority: "optional",
    durationMinutes: 70,
    alternatives: ["융캉제 골목 카페", "다른 스페셜티 카페"],
    flexTip: "카페는 분위기 좋은 곳 발견 시 현장에서 바로 교체 가능."
  },
  "slow-spa-massage": {
    priority: "optional",
    durationMinutes: 75,
    alternatives: ["다른 東門 마사지샵", "호텔에서 낮잠"],
    flexTip: "예약 권장. 시간 빠듯하면 60분으로, 더 피곤하면 90분으로."
  },
  "zhang-men": {
    priority: "optional",
    durationMinutes: 70,
    alternatives: ["Taihu 맥주 추가", "카페 휴식 연장"],
    flexTip: "저녁 바를 강하게 갈 예정이면 샘플러만 짧게."
  },
  "dingwang-hotpot": {
    priority: "must",
    durationMinutes: 120,
    alternatives: ["다른 마라 훠궈 (馬辣/詹記)", "융캉제 총좌빙·간단식"],
    flexTip: "성수기엔 미리 예약. 웨이팅 길면 한 명 줄 서고 한 명은 근처 산책."
  },
  "bar-mood": {
    priority: "must",
    durationMinutes: 100,
    alternatives: ["Fake Sober", "Ounce Taipei"],
    flexTip: "마지막 밤 핵심 바. 예약/대기 상황에 따라 Fake Sober와 순서 교체."
  },
  "fake-sober": {
    priority: "optional",
    durationMinutes: 80,
    alternatives: ["Bar Mood에서 오래 머물기", "호텔 복귀"],
    flexTip: "Bar Mood 만족도가 높으면 무리해서 이동하지 않아도 됨. 예약/웨이팅 확인."
  },
  niudian: {
    priority: "must",
    durationMinutes: 55,
    alternatives: ["호텔 근처 우육면", "공항 식사"],
    flexTip: "출국일이라 웨이팅이 길면 즉시 대체."
  },
  carrefour: {
    priority: "must",
    durationMinutes: 45,
    alternatives: ["공항 면세점", "시먼딩 편의점"],
    flexTip: "11시 공항 이동 기준으로 쇼핑 시간을 강하게 제한."
  },
  airport: {
    priority: "must",
    durationMinutes: 120,
    alternatives: ["택시 이동", "공항철도 급행"],
    flexTip: "절대 스킵 불가. 다른 모든 마지막 일정은 공항 도착 기준으로 판단."
  }
};

export function getStopPlan(stopId: string): StopPlanMeta {
  return (
    stopPlanMeta[stopId] ?? {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["근처 카페 휴식", "다음 일정으로 바로 이동"],
      flexTip: "현장 컨디션에 따라 체류 시간을 조정.",
      openingHours: "",
      bookingStatus: "",
      riskLevel: "low",
      riskNote: ""
    }
  );
}

export const flexModes = [
  {
    id: "rain",
    title: "비 오는 날",
    description: "야외 산책은 줄이고 카페, 쇼핑, 바처럼 실내 체류가 가능한 코스를 우선."
  },
  {
    id: "tired",
    title: "피곤한 날",
    description: "선택/후보 일정을 숨기고 필수 일정 사이에 휴식 시간을 확보."
  },
  {
    id: "hungry",
    title: "배고픈 날",
    description: "관광보다 미식 장소를 먼저 보고, 대기 긴 곳은 대체 메뉴로 전환."
  }
];
