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
    title: "위스키 성지 투어 & 냉천",
    mood: "이란으로 떠나는 카발란 데이",
    summary: "아침 이동 후 카발란 양조장과 쑤아오 냉천, 저녁에는 타이베이 야시장과 맥주."
  },
  {
    day: 3,
    date: "5/17 일",
    title: "융캉제 정복",
    mood: "커피, 딤섬, 낮맥, 위스키",
    summary: "중정기념당에서 시작해 융캉제의 카페, 딘타이펑, 총좌빙, 바 문화를 촘촘히 즐기는 날."
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
    id: "ximending-checkin",
    day: 1,
    date: "5/15 금",
    time: "16:00",
    title: "시먼딩 도착 및 체크인",
    subtitle: "여행 베이스캠프",
    nameZh: "西門町・飯店 Check-in",
    mrt: "西門站 BL11 / G12",
    phrase: "你好，我有訂房，請辦理入住。",
    category: "hotel",
    lat: 25.0421,
    lng: 121.5081,
    highlights: ["짐 풀기", "근처 동선 확인", "첫 사진 남기기"],
    prompt: "도착해서 제일 먼저 찍은 사진이나 서로의 첫 인상을 적어두기.",
    mapsQuery: "Ximending Taipei"
  },
  {
    id: "hot-star",
    day: 1,
    date: "5/15 금",
    time: "17:00",
    title: "핫스타 지파이",
    subtitle: "얼굴만한 지파이 나눠 먹기",
    nameZh: "豪大大雞排",
    mrt: "西門站 6번 출구",
    phrase: "一份雞排，不要辣，謝謝。",
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
    time: "17:30",
    title: "아종면선 곱창국수",
    subtitle: "서서 먹는 시먼딩 필수 코스",
    nameZh: "阿宗麵線",
    mrt: "西門站 6번 출구",
    phrase: "一碗大碗，加香菜。",
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
    mrt: "龍山寺站 BL10",
    phrase: "請問怎麼參拜？",
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
    mrt: "西門站 1번 출구",
    phrase: "推薦一款今天的限定啤酒。",
    category: "beer",
    lat: 25.0438,
    lng: 121.5079,
    highlights: ["탭 맥주", "수제맥주", "첫날 건배"],
    prompt: "각자 고른 맥주와 한줄 평점 남기기.",
    mapsQuery: "Taihu Driftwood Ximending"
  },
  {
    id: "fong-da-coffee",
    day: 1,
    date: "5/15 금",
    time: "20:40",
    title: "Fong Da Coffee",
    subtitle: "1956년부터 운영한 노포 커피",
    nameZh: "蜂大咖啡",
    mrt: "西門站 6번 출구",
    phrase: "一杯熱拿鐵和核桃酥。",
    category: "coffee",
    lat: 25.0434,
    lng: 121.5076,
    highlights: ["대만식 드립", "호두 과자", "노포 분위기"],
    prompt: "커피 향, 디저트, 가게 분위기 중 제일 좋았던 것 체크.",
    mapsQuery: "Fong Da Coffee Taipei"
  },
  {
    id: "hanko-60",
    day: 1,
    date: "5/15 금",
    time: "22:00",
    title: "Hanko 60",
    subtitle: "영화관 컨셉 스피크이지 바",
    nameZh: "Hanko 60",
    mrt: "西門站 6번 출구",
    phrase: "我有預約，兩位。",
    category: "whisky",
    lat: 25.0436,
    lng: 121.5062,
    highlights: ["스피크이지", "위스키 칵테일", "첫날 마무리"],
    prompt: "입구 찾기 난이도와 베스트 칵테일 이름 저장.",
    mapsQuery: "Hanko 60 Taipei"
  },
  {
    id: "yilan-transfer",
    day: 2,
    date: "5/16 토",
    time: "09:30",
    title: "이란 이동",
    subtitle: "버스 또는 기차로 이동",
    nameZh: "宜蘭・轉乘",
    mrt: "台北車站 → 宜蘭",
    phrase: "一張到宜蘭的車票，謝謝。",
    category: "transit",
    lat: 24.7545,
    lng: 121.7587,
    highlights: ["아침 이동", "차창 풍경", "카발란 준비"],
    prompt: "이동 중 들은 노래나 가장 좋았던 풍경을 기록.",
    mapsQuery: "Yilan Taiwan"
  },
  {
    id: "yilan-brunch",
    day: 2,
    date: "5/16 토",
    time: "11:30",
    title: "이란 브런치",
    subtitle: "니우셔빙 & 육갱",
    nameZh: "宜蘭早午餐",
    mrt: "宜蘭車站 도보",
    phrase: "牛舌餅一份，一碗肉羹。",
    category: "food",
    lat: 24.758,
    lng: 121.753,
    highlights: ["소혀 모양 과자", "마늘 고기 국수", "지역 음식"],
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
    mrt: "宜蘭 택시 25분",
    phrase: "我們有預約導覽，這是訂單號碼。",
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
    mrt: "蘇澳新站 도보",
    phrase: "兩張冷泉門票，謝謝。",
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
    mrt: "雙連站 G14",
    phrase: "一份蚵仔煎，一份芋頭餅。",
    category: "food",
    lat: 25.0567,
    lng: 121.515,
    highlights: ["굴전", "토란 튀김", "야시장 먹방"],
    prompt: "둘이 고른 야시장 베스트 3 메뉴 기록.",
    mapsQuery: "Ningxia Night Market Taipei"
  },
  {
    id: "mikkeller",
    day: 2,
    date: "5/16 토",
    time: "22:00",
    title: "Mikkeller Taipei",
    subtitle: "다다오청 오래된 건물의 맥주",
    nameZh: "Mikkeller Taipei",
    mrt: "北門站 G13",
    phrase: "一杯 IPA，一杯 Sour。",
    category: "beer",
    lat: 25.0556,
    lng: 121.5108,
    highlights: ["미켈러", "다다오청", "2일차 건배"],
    prompt: "캔 디자인이나 탭 리스트 중 가장 마음에 든 것 저장.",
    mapsQuery: "Mikkeller Taipei"
  },
  {
    id: "cks",
    day: 3,
    date: "5/17 일",
    time: "10:30",
    title: "중정기념당",
    subtitle: "융캉제 전 웅장한 산책",
    nameZh: "中正紀念堂",
    mrt: "中正紀念堂站 R8 / G10",
    phrase: "衛兵交接幾點？",
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
    mrt: "東門站 R7",
    phrase: "我們有訂位，兩位。",
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
    mrt: "忠孝復興站 BR10",
    phrase: "一杯今日特調，謝謝。",
    category: "coffee",
    lat: 25.0341,
    lng: 121.5294,
    highlights: ["스페셜티 커피", "카페 거리", "디저트"],
    prompt: "커피 산미, 향, 분위기를 각각 5점으로 기록.",
    mapsQuery: "Simple Kaffa Taipei Yongkang"
  },
  {
    id: "zhang-men",
    day: 3,
    date: "5/17 일",
    time: "16:00",
    title: "Zhang Men Brewing",
    subtitle: "융캉제 본점 낮맥 샘플러",
    nameZh: "掌門精釀啤酒 永康店",
    mrt: "東門站 R7",
    phrase: "一份品飲組合，謝謝。",
    category: "beer",
    lat: 25.0338,
    lng: 121.5309,
    highlights: ["샘플러", "수제맥주", "낮맥"],
    prompt: "샘플러 중 1등과 꼴등을 솔직하게 적기.",
    mapsQuery: "Zhang Men Brewing Yongkang Taipei"
  },
  {
    id: "yongkang-scallion",
    day: 3,
    date: "5/17 일",
    time: "18:00",
    title: "융캉제 총좌빙",
    subtitle: "치즈와 계란 추가 추천",
    nameZh: "天津蔥抓餅",
    mrt: "東門站 R7",
    phrase: "一份蔥抓餅，加蛋加起司。",
    category: "food",
    lat: 25.0327,
    lng: 121.5299,
    highlights: ["총좌빙", "치즈", "계란"],
    prompt: "기다린 시간과 맛의 보상 정도를 기록.",
    mapsQuery: "Yongkang Street scallion pancake"
  },
  {
    id: "bar-mood",
    day: 3,
    date: "5/17 일",
    time: "20:00",
    title: "Bar Mood Taipei",
    subtitle: "위스키 칵테일과 싱글몰트",
    nameZh: "Bar Mood Taipei",
    mrt: "忠孝復興站 BR10",
    phrase: "我們有預約，請推薦招牌。",
    category: "whisky",
    lat: 25.0332,
    lng: 121.5435,
    highlights: ["위스키", "차와 커피를 접목한 칵테일", "프리미엄 바"],
    prompt: "가장 대만답다고 느낀 향이나 재료를 남기기.",
    mapsQuery: "Bar Mood Taipei"
  },
  {
    id: "public-house",
    day: 3,
    date: "5/17 일",
    time: "22:30",
    title: "The Public House",
    subtitle: "마지막 밤의 바 문화",
    nameZh: "The Public House",
    mrt: "忠孝復興站 BR10",
    phrase: "兩杯威士忌，加冰塊。",
    category: "whisky",
    lat: 25.0419,
    lng: 121.5487,
    highlights: ["마지막 밤", "바 호핑", "위스키"],
    prompt: "여행 마지막 밤의 한 문장 일기 쓰기.",
    mapsQuery: "The Public House Taipei bar"
  },
  {
    id: "niudian",
    day: 4,
    date: "5/18 월",
    time: "09:30",
    title: "니우뎬 우육면",
    subtitle: "진한 국물로 마지막 해장",
    nameZh: "牛店 精燉牛肉麵",
    mrt: "西門站 1번 출구",
    phrase: "一碗清燉牛肉麵，半筋半肉。",
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
    mrt: "龍山寺站 도보",
    phrase: "請問金門高粱在哪裡？",
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
    title: "공항 도착",
    subtitle: "수속 및 면세점 카발란 샵",
    nameZh: "桃園國際機場",
    mrt: "機場捷運 A12 / A13",
    phrase: "我要到第二航廈。",
    category: "transit",
    lat: 25.0797,
    lng: 121.2342,
    highlights: ["공항철도", "면세점", "14:00 출국"],
    prompt: "마지막으로 사고 싶은 카발란과 여행 총평 남기기.",
    mapsQuery: "Taiwan Taoyuan International Airport"
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
  "fong-da-coffee": {
    priority: "backup",
    durationMinutes: 30,
    alternatives: ["호텔 근처 카페", "다음날 아침 커피로 이동"],
    flexTip: "영업/대기 상황에 따라 짧은 디저트 코스로만 사용."
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
  mikkeller: {
    priority: "optional",
    durationMinutes: 75,
    alternatives: ["호텔 복귀", "다다오청 산책만"],
    flexTip: "이란 당일치기 후 피로도가 높으면 다음날 낮맥으로 대체."
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
    alternatives: ["융캉제 골목 카페", "Fong Da Coffee 보강"],
    flexTip: "카페는 분위기 좋은 곳 발견 시 현장에서 바로 교체 가능."
  },
  "zhang-men": {
    priority: "optional",
    durationMinutes: 70,
    alternatives: ["Taihu 맥주 추가", "카페 휴식 연장"],
    flexTip: "저녁 바를 강하게 갈 예정이면 샘플러만 짧게."
  },
  "yongkang-scallion": {
    priority: "must",
    durationMinutes: 35,
    alternatives: ["망고빙수", "융캉제 누가 크래커"],
    flexTip: "줄이 길면 한 명이 줄 서고 한 명은 쇼핑 후보 확인."
  },
  "bar-mood": {
    priority: "must",
    durationMinutes: 100,
    alternatives: ["The Public House", "Ounce Taipei"],
    flexTip: "마지막 밤 핵심 바. 예약/대기 상황에 따라 Public House와 순서 교체."
  },
  "public-house": {
    priority: "optional",
    durationMinutes: 80,
    alternatives: ["Bar Mood에서 오래 머물기", "호텔 복귀"],
    flexTip: "Bar Mood 만족도가 높으면 무리해서 이동하지 않아도 됨."
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
      flexTip: "현장 컨디션에 따라 체류 시간을 조정."
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
