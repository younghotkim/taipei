// 타이베이 여행 치트시트 — 출발 전·현지에서 빠르게 확인하는 정보 모음.

export type InfoLine = { label: string; value: string; note?: string };
export type InfoCard = { id: string; emoji: string; title: string; lines: InfoLine[] };
export type Phrase = { ko: string; zh: string; pinyin: string };

export const taipeiInfoCards: InfoCard[] = [
  {
    id: "emergency",
    emoji: "🚨",
    title: "긴급 연락처",
    lines: [
      { label: "경찰", value: "110" },
      { label: "소방·구급차", value: "119" },
      { label: "관광객 안내 핫라인", value: "0800-011-765", note: "24시간 · 영어/일본어 가능" },
      { label: "주타이베이 한국대표부", value: "+886-2-2758-8320", note: "긴급(야간) +886-912-069-484" },
      { label: "주타이베이 한국대표부 주소", value: "台北市基隆路一段333號 (国贸大楼 15층)" },
      { label: "외교부 영사콜센터(서울)", value: "+82-2-3210-0404" }
    ]
  },
  {
    id: "money",
    emoji: "💳",
    title: "돈·결제",
    lines: [
      { label: "통화", value: "신타이완달러 (NT$ / TWD)", note: "약 ₩42~45 / NT$1 (변동)" },
      { label: "현금", value: "야시장·소형 식당·전통시장은 현금 필수", note: "편의점·체인점·MRT는 카드/모바일 OK" },
      { label: "EasyCard (悠遊卡)", value: "편의점·MRT역에서 NT$100에 구매", note: "MRT·버스·편의점·일부 상점 결제. 보증금 없음" },
      { label: "EasyCard 충전", value: "편의점 카운터·MRT역 충전기 (現金/加值)" },
      { label: "ATM", value: "편의점·은행 ATM에서 해외카드 출금 가능", note: "수수료 NT$ + 카드사 수수료" },
      { label: "팁", value: "기본적으로 없음", note: "호텔·고급식당은 봉사료 10% 자동 포함되는 경우 있음" }
    ]
  },
  {
    id: "transport",
    emoji: "🚇",
    title: "교통",
    lines: [
      { label: "MRT 운행", value: "약 06:00 ~ 24:00", note: "출퇴근 시간 매우 혼잡" },
      { label: "공항↔시내", value: "공항 MRT (A1 台北車站) 약 35~50분, NT$150", note: "또는 국광 1819 버스 / 택시 NT$1,000~1,200" },
      { label: "택시", value: "기본요금 약 NT$85~", note: "Uber·Line Taxi 앱도 작동. 야간 할증 있음" },
      { label: "유바이크 (YouBike 2.0)", value: "EasyCard 등록 후 대여", note: "처음 30분 NT$10 내외" },
      { label: "버스", value: "EasyCard 태그 (탈 때/내릴 때 안내문 따라)" }
    ]
  },
  {
    id: "basics",
    emoji: "ℹ️",
    title: "기본 정보",
    lines: [
      { label: "전압", value: "110V / 60Hz, 콘센트 A·B 타입", note: "한국 220V 기기는 멀티 어댑터 필요" },
      { label: "물", value: "수돗물은 끓여 마시는 게 일반. 생수 권장", note: "편의점 생수 NT$15~25" },
      { label: "편의점", value: "7-ELEVEN·全家(FamilyMart) 곳곳, 대부분 24시간", note: "택배·복사·티켓·도시락·핫푸드까지" },
      { label: "전화 국가번호", value: "+886 (대만), +82 (한국)" },
      { label: "비자", value: "한국 여권 무비자 90일 (관광)" },
      { label: "시차", value: "한국 -1시간 (한국이 1시간 빠름)" },
      { label: "콘센트/유심", value: "공항·편의점에서 eSIM/유심 구매 가능" },
      { label: "흡연", value: "실내·버스정류장·공원 다수 금연. 위반 시 벌금" }
    ]
  }
];

export const taipeiPhrases: Phrase[] = [
  { ko: "안녕하세요", zh: "你好", pinyin: "Nǐ hǎo" },
  { ko: "감사합니다", zh: "謝謝", pinyin: "Xièxie" },
  { ko: "죄송합니다 / 실례합니다", zh: "不好意思", pinyin: "Bù hǎoyìsi" },
  { ko: "이거 주세요", zh: "我要這個", pinyin: "Wǒ yào zhège" },
  { ko: "얼마예요?", zh: "多少錢?", pinyin: "Duōshǎo qián?" },
  { ko: "계산해 주세요", zh: "買單 / 結帳", pinyin: "Mǎidān / Jiézhàng" },
  { ko: "화장실 어디예요?", zh: "廁所在哪裡?", pinyin: "Cèsuǒ zài nǎlǐ?" },
  { ko: "안 맵게 해주세요", zh: "不要辣", pinyin: "Búyào là" },
  { ko: "조금만 / 작은 거로", zh: "小份的", pinyin: "Xiǎo fèn de" },
  { ko: "포장해 주세요", zh: "外帶", pinyin: "Wàidài" },
  { ko: "카드 되나요?", zh: "可以刷卡嗎?", pinyin: "Kěyǐ shuākǎ ma?" },
  { ko: "도와주세요!", zh: "請幫我!", pinyin: "Qǐng bāng wǒ!" },
  { ko: "한국 사람이에요", zh: "我是韓國人", pinyin: "Wǒ shì Hánguó rén" },
  { ko: "영어 되나요?", zh: "你會說英文嗎?", pinyin: "Nǐ huì shuō Yīngwén ma?" }
];
