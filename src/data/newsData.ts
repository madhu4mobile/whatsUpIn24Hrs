export interface NewsStory {
  id: number;
  headline: string;
  summary: string;
  region: string;
  regionFlag: string;
  category: string;
  categoryColor: string;
  keyFact: string;
  narration: string;
  timestamp: string;
  visualDescription: string;
  musicMood: string;
  sources: string[];
}

export interface ScheduleInfo {
  timezone: string;
  updateTime: string;
  nextUpdate: string;
  lastUpdate: string;
  status: "live" | "scheduled" | "processing";
}

export const scheduleInfo: ScheduleInfo = {
  timezone: "EST (UTC-5)",
  updateTime: "5:00 AM",
  nextUpdate: "July 18, 2025 at 5:00 AM EST",
  lastUpdate: "July 17, 2025 at 5:00 AM EST",
  status: "live",
};

export interface PublishingChannel {
  id: string;
  name: string;
  icon: string;
  status: "published" | "scheduled" | "pending" | "failed";
  publishedAt?: string;
  scheduledFor?: string;
  url?: string;
  specs: string;
  color: string;
}

export const publishingChannels: PublishingChannel[] = [
  {
    id: "youtube",
    name: "YouTube Shorts",
    icon: "▶️",
    status: "published",
    publishedAt: "5:02 AM EST",
    url: "https://youtube.com/shorts/",
    specs: "9:16 • 5:47 duration",
    color: "from-red-600 to-red-500",
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    icon: "📸",
    status: "published",
    publishedAt: "5:05 AM EST",
    url: "https://instagram.com/reel/",
    specs: "9:16 • 5:47 duration",
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    icon: "👤",
    status: "published",
    publishedAt: "5:08 AM EST",
    url: "https://facebook.com/reel/",
    specs: "9:16 • 5:47 duration",
    color: "from-blue-600 to-blue-500",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "𝕏",
    status: "published",
    publishedAt: "5:10 AM EST",
    url: "https://x.com/",
    specs: "9:16 • 2:20 (Part 1/3)",
    color: "from-gray-700 to-gray-600",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    status: "published",
    publishedAt: "5:12 AM EST",
    url: "https://tiktok.com/",
    specs: "9:16 • 5:47 duration",
    color: "from-gray-900 to-gray-800",
  },
];

export const todayDate = "July 17, 2025";
export const videoTitle = "Fire, Fractures & a Fed Showdown";
export const videoSubtitle = "Your Daily Global Pulse in 5 Minutes";

export const stories: NewsStory[] = [
  {
    id: 1,
    headline: "Deadly Shopping Mall Fire Kills 69+ in Iraq",
    summary:
      "A devastating fire tore through the newly opened Corniche Hypermarket Mall in the city of Kut, eastern Iraq, killing at least 69 people and injuring over 200. The five-story mall had opened just five days earlier. Officials say most victims suffocated in bathrooms and stairwells. Residents allege the building lacked fire exits, extinguishers, and alarms. Legal proceedings have been launched against the building's owners.",
    region: "Middle East",
    regionFlag: "🇮🇶",
    category: "DISASTER",
    categoryColor: "#ef4444",
    keyFact: "69+ dead, 200+ injured — mall opened just 5 days ago",
    narration:
      "We begin tonight with tragedy in Iraq. A massive fire engulfed a brand-new shopping mall in the city of Kut, killing at least sixty-nine people and injuring more than two hundred. The Corniche Hypermarket had been open for just five days. Most victims suffocated, trapped in bathrooms and stairwells — because the building reportedly had no fire exits, no extinguishers, and no alarms. Iraqi authorities have filed charges against the mall's owners. The governor of Kut has declared three days of mourning.",
    timestamp: "0:08 – 0:50",
    visualDescription:
      "Map of Iraq zooming into Kut. Stock footage of firefighters battling blaze. Text overlay: '69+ Dead in Mall Fire — Kut, Iraq'. Transition to mourners at funeral in Najaf.",
    musicMood: "Somber, restrained orchestral underscore",
    sources: [
      "Associated Press",
      "Al-Monitor",
      "Al Arabiya",
      "Vatican News",
      "Iraq Interior Ministry Statement",
    ],
  },
  {
    id: 2,
    headline: "Ukraine Appoints First Wartime PM in Major Reshuffle",
    summary:
      "Ukraine's parliament confirmed Yulia Svyrydenko as the country's new prime minister — the first change in leadership since Russia's full-scale invasion began in 2022. The 39-year-old former economy minister replaces Denys Shmyhal, who now takes over as defense minister. President Zelenskyy's reshuffle aims to boost domestic weapons production to meet 50% of battlefield needs within six months.",
    region: "Europe",
    regionFlag: "🇺🇦",
    category: "POLITICS",
    categoryColor: "#3b82f6",
    keyFact:
      "First PM change since 2022 invasion — goal: 50% domestic weapons production",
    narration:
      "To Eastern Europe. Ukraine's parliament has confirmed Yulia Svyrydenko as the country's new prime minister — the first change at the top of government since Russia's full-scale invasion began more than three years ago. At thirty-nine, Svyrydenko takes over from Denys Shmyhal, who now becomes defense minister. President Zelenskyy says the reshuffle is designed to energize the war effort and ramp up domestic weapons production to fifty percent of the army's needs within six months. It's a bold move at a critical moment.",
    timestamp: "0:50 – 1:30",
    visualDescription:
      "Photo of Svyrydenko at parliament podium. Ukrainian flag animation. Map showing Ukraine with frontline overlay. Text: 'Ukraine's First Wartime PM Change'. Brief Zelenskyy clip or photo.",
    musicMood: "Determined, mid-tempo cinematic pulse",
    sources: [
      "Reuters",
      "UPI",
      "Le Monde",
      "Livemint",
      "Ukrainian Government Press Release",
    ],
  },
  {
    id: 3,
    headline: "Trump Reveals Draft Letter to Fire Fed Chair Powell",
    summary:
      "The New York Times reports President Trump showed a draft letter firing Federal Reserve Chair Jerome Powell to House Republicans during an Oval Office meeting, polling them on whether he should send it. While Trump later told reporters firing Powell was 'highly unlikely,' the revelation rattled Wall Street and reignited concerns about central bank independence. Powell's term as chair ends in May 2026.",
    region: "North America",
    regionFlag: "🇺🇸",
    category: "ECONOMY",
    categoryColor: "#f59e0b",
    keyFact: "Markets rattled as Trump polls GOP on firing Fed chair",
    narration:
      "Now to Washington, where a stunning report has shaken financial markets. The New York Times reports that President Trump showed a draft letter firing Federal Reserve Chair Jerome Powell to House Republicans — then polled the room on whether he should actually send it. Trump has since said firing Powell is 'highly unlikely' — but the very existence of that letter has rattled Wall Street and raised fresh questions about central bank independence. Powell's term as chair ends in May twenty-twenty-six. The president has called him a 'major loser' and a 'stubborn mule' for refusing to cut interest rates.",
    timestamp: "1:30 – 2:15",
    visualDescription:
      "Split screen: Trump at podium / Powell at Fed press conference. Stock ticker animation showing market reaction. Federal Reserve building exterior. Text overlay: 'Trump Drafts Letter to Fire Fed Chair'.",
    musicMood: "Tense, suspenseful electronic underscore",
    sources: [
      "The New York Times",
      "The Guardian",
      "The Spokesman-Review",
      "CBS News",
    ],
  },
  {
    id: 4,
    headline: "21 Killed in Gaza Aid Site Stampede",
    summary:
      "At least 21 Palestinians were killed in a crowd crush at a U.S.- and Israeli-backed Gaza Humanitarian Foundation distribution site in Khan Younis. Witnesses say GHF guards fired tear gas into dense crowds trapped between fences, causing mass suffocation. The GHF blames Hamas agitators; Hamas calls the allegations 'false and misleading.' The UN has previously called the GHF model 'unsafe.'",
    region: "Middle East",
    regionFlag: "🇵🇸",
    category: "CONFLICT",
    categoryColor: "#dc2626",
    keyFact: "21 dead at aid site — GHF and Hamas trade blame",
    narration:
      "Turning to Gaza. At least twenty-one Palestinians were killed in a horrific crowd crush at a food distribution site run by the U.S.- and Israeli-backed Gaza Humanitarian Foundation in Khan Younis. Eyewitnesses say GHF guards fired tear gas into crowds trapped between barbed wire fences, causing mass suffocation. The GHF blames what it calls Hamas agitators — Hamas calls the allegation false. The United Nations has repeatedly called the GHF's aid model unsafe. These are the first recorded deaths from suffocation at these sites since the foundation began operating seven weeks ago.",
    timestamp: "2:15 – 3:00",
    visualDescription:
      "Map of Gaza Strip focusing on Khan Younis. Somber stock imagery of aid distribution. Text overlay: '21 Killed in Aid Site Stampede'. Hospital scene description.",
    musicMood: "Somber, mournful strings — minimal percussion",
    sources: [
      "Reuters",
      "The Washington Post",
      "Bloomberg",
      "The Spokesman-Review",
      "Gaza Health Ministry",
    ],
  },
  {
    id: 5,
    headline: "Syria-Israel Ceasefire Amid Sweida Crisis",
    summary:
      "A renewed ceasefire was announced between Syrian government forces and Druze armed groups in the southern city of Sweida, after Israel launched airstrikes on Damascus — including near the Syrian defense ministry — in support of the Druze minority. Government forces began withdrawing from Sweida under the deal, brokered with U.S., Turkish, and regional mediation. The U.S. envoy announced a separate Syria-Israel ceasefire.",
    region: "Middle East",
    regionFlag: "🇸🇾",
    category: "CONFLICT",
    categoryColor: "#dc2626",
    keyFact: "Israel struck Damascus; US-brokered ceasefire announced",
    narration:
      "Staying in the region. A fragile ceasefire has taken hold in southern Syria after days of intense fighting between government forces and Druze armed groups in the city of Sweida — complicated by Israeli airstrikes on Damascus, including near the Syrian defense ministry. Israel says it acted to protect the Druze minority. A U.S.-brokered ceasefire between Syria and Israel was also announced. But tens of thousands have already been displaced, and it's far from clear whether this calm will hold.",
    timestamp: "3:00 – 3:40",
    visualDescription:
      "Map showing Syria with Sweida and Damascus highlighted. Damaged Syrian defense ministry building. Israeli jets graphic. Text: 'Syria-Israel Ceasefire Brokered by US'. Refugee footage.",
    musicMood: "Urgent but controlled orchestral underscore",
    sources: [
      "Associated Press",
      "NPR",
      "The Guardian",
      "Times of Israel",
      "Syrian State Media",
    ],
  },
  {
    id: 6,
    headline: "30-Nation Hague Group Summit Targets Israel's 'Era of Impunity'",
    summary:
      "A coalition of 30 countries wrapped up a landmark two-day summit in Bogotá, Colombia, announcing six coordinated measures to hold Israel accountable — including banning arms sales, blocking weapons-carrying ships, and enforcing universal jurisdiction. Twelve nations formally adopted the measures so far. Brazil also announced it will join South Africa's genocide case against Israel at the ICJ.",
    region: "Global",
    regionFlag: "🌍",
    category: "DIPLOMACY",
    categoryColor: "#8b5cf6",
    keyFact: "12 nations commit to arms embargo on Israel; Brazil joins ICJ case",
    narration:
      "To global diplomacy. A coalition of thirty nations has wrapped up a landmark summit in Bogotá, Colombia — announcing six coordinated measures aimed at ending what they call Israel's era of impunity. The steps include banning arms sales to Israel, blocking weapons-carrying ships, and enforcing universal jurisdiction. Twelve countries have formally committed so far. And in a significant move, Brazil has confirmed it will join South Africa's genocide case against Israel at the International Court of Justice. Colombia's President Petro called it a turning point.",
    timestamp: "3:40 – 4:20",
    visualDescription:
      "Bogotá summit hall with flags. Map showing participating nations highlighted. Photos of Colombian President Petro and South African delegation. Text: '30 Nations Target Israel at Bogotá Summit'. ICJ building in The Hague.",
    musicMood: "Diplomatic, neutral gravitas — piano and strings",
    sources: [
      "Al Jazeera",
      "Middle East Eye",
      "El País",
      "The Hague Group Official Statement",
      "Democracy Now",
    ],
  },
  {
    id: 7,
    headline: "Netanyahu's Coalition Rattled as Ultra-Orthodox Party Exits",
    summary:
      "United Torah Judaism, a key ultra-Orthodox coalition partner, announced it would leave Netanyahu's government over a military draft exemption bill — leaving the prime minister with just 61 of 120 Knesset seats. If the larger ultra-Orthodox party Shas follows suit, Netanyahu would lose his majority entirely. The political upheaval comes amid ongoing Gaza ceasefire negotiations and growing domestic protest.",
    region: "Middle East",
    regionFlag: "🇮🇱",
    category: "POLITICS",
    categoryColor: "#3b82f6",
    keyFact: "Netanyahu down to 61/120 seats — coalition on a knife edge",
    narration:
      "In Israel, Prime Minister Netanyahu's governing coalition has been shaken. The ultra-Orthodox party United Torah Judaism announced it's leaving the government over a dispute about military draft exemptions — dropping Netanyahu to just sixty-one seats in the one-hundred-and-twenty seat Knesset. That's a razor-thin majority. And if the larger ultra-Orthodox party Shas follows — as Israeli media suggests it may — Netanyahu could lose his majority entirely. This is happening right as ceasefire talks with Hamas continue under intense pressure.",
    timestamp: "4:20 – 4:55",
    visualDescription:
      "Knesset building exterior. Photo of Netanyahu surrounded by ministers. Graphic showing coalition seat breakdown: 61 vs 59. Text: 'Netanyahu's Coalition Fractures'. Ultra-Orthodox community footage.",
    musicMood: "Measured political tension — low strings and subtle percussion",
    sources: [
      "Euronews",
      "Bloomberg",
      "The National",
      "The Hindu",
      "Washington Times",
    ],
  },
  {
    id: 8,
    headline: "U.S. and Indonesia Seal 19% Tariff Trade Deal",
    summary:
      "The U.S. and Indonesia announced a new trade agreement reducing the threatened tariff on Indonesian goods from 32% to 19%. In return, Indonesia agreed to zero tariffs on U.S. exports, plus purchases of 50 Boeing jets, $15 billion in U.S. energy, and $4.5 billion in American agricultural products. Trump hinted similar deals with other nations and a blanket tariff of '10 or 15%' on 150 countries are coming.",
    region: "Asia-Pacific",
    regionFlag: "🇮🇩",
    category: "TRADE",
    categoryColor: "#10b981",
    keyFact: "Tariff cut from 32% to 19% — Indonesia to buy 50 Boeing jets",
    narration:
      "On the trade front. The U.S. and Indonesia have struck a deal — reducing the threatened tariff on Indonesian goods from thirty-two percent down to nineteen percent. In exchange, Indonesia will pay zero tariffs on American exports and has agreed to buy fifty Boeing jets, fifteen billion dollars in U.S. energy, and four-point-five billion in American agricultural products. President Prabowo called Trump a 'tough negotiator.' And Trump says more deals are coming — hinting at a blanket tariff of ten to fifteen percent for a hundred and fifty countries.",
    timestamp: "4:55 – 5:30",
    visualDescription:
      "Split screen: Trump and Indonesian President Prabowo. Boeing 737 MAX fleet. Trade chart graphic showing tariff reduction. Map highlighting Indonesia. Text: 'US-Indonesia Trade Deal — 19% Tariff'.",
    musicMood: "Business-forward, lightly optimistic electronic underscore",
    sources: [
      "The New York Times",
      "Reuters",
      "BBC News",
      "The Guardian",
      "Indonesian Government Statement",
    ],
  },
  {
    id: 9,
    headline: "Senate Approves $9 Billion Clawback in Foreign Aid Cuts",
    summary:
      "The Republican-led U.S. Senate voted to claw back $9 billion in already-approved funding for foreign aid and public media — including programs addressing global health, food assistance, peacekeeping, and public broadcasting. Critics say the cuts could be a death knell for vital humanitarian programs, while the White House frames them as part of government efficiency measures.",
    region: "North America",
    regionFlag: "🇺🇸",
    category: "POLICY",
    categoryColor: "#6366f1",
    keyFact: "$9 billion cut from foreign aid & public media",
    narration:
      "And back in Washington. The Republican-led Senate has voted to claw back nine billion dollars in already-approved funding for foreign aid and public broadcasting. The cuts target programs addressing global health, emergency food assistance, peacekeeping, and public media. Critics warn the cuts could devastate vital humanitarian programs worldwide. The White House says it's part of broader efficiency efforts. This comes as international development assistance from the U.S. has been declining sharply since the beginning of the year.",
    timestamp: "5:30 – 6:00",
    visualDescription:
      "U.S. Capitol building. Senate chamber voting scene. Infographic showing $9B breakdown. USAID logo. Text: 'Senate Claws Back $9B in Foreign Aid'. Global aid distribution map.",
    musicMood: "Neutral, informative — clean electronic tone",
    sources: [
      "Democracy Now",
      "Al Jazeera",
      "U.S. Senate Record",
      "NPR",
    ],
  },
];

export const hookNarration =
  "A deadly mall fire in Iraq. Ukraine gets a new prime minister for the first time since the invasion. And did the President of the United States just draft a letter to fire the head of the Federal Reserve? This is your Daily Global Pulse.";

export const closerNarration =
  "That's your world in five minutes. From a grieving city in Iraq to coalition fractures in Jerusalem, from a war-weary Ukraine reshuffling its leadership to seismic shifts in global trade — the thread connecting today's stories is clear: the systems we build only work when accountability follows. Stay informed. Stay curious. And we'll see you right here, same time tomorrow. I'm your Daily Global Pulse.";

export const voiceDirection =
  "Calm and authoritative with a measured, warm pace. American accent — think BBC World meets modern podcast. Natural pauses for emphasis between stories. Slightly more somber tone for stories 1 and 4. Energized but neutral for trade and politics segments.";

export const suggestedMusic =
  "Primary: Cinematic news underscore — clean, modern, minimal. Shifts to somber strings for disaster/conflict stories, light electronic pulse for trade/politics. No lyrics. Subtle tempo build from hook to closer.";

export const hashtags = [
  "#DailyGlobalPulse",
  "#WorldNews",
  "#BreakingNews",
  "#IraqFire",
  "#Ukraine",
  "#FederalReserve",
  "#Gaza",
  "#Syria",
  "#HagueGroup",
  "#Netanyahu",
  "#TradeDeal",
  "#Indonesia",
  "#ForeignAid",
  "#NewsToday",
  "#GlobalPulse",
];

export const socialDescription =
  "🌍 July 17, 2025 — Today's top global stories in 5 minutes: Deadly mall fire in Iraq kills 69+. Ukraine appoints first wartime PM. Trump reveals draft letter to fire Fed Chair Powell. Gaza aid site stampede kills 21. Syria-Israel ceasefire. Hague Group targets Israel. Netanyahu's coalition fractures. US-Indonesia trade deal. Senate cuts $9B in foreign aid. Stay informed. Stay ahead.";

export const originalityStatement = `
All content in this Daily Global Pulse edition is 100% original.

• Narration scripts are written by AI from scratch based on verified facts
• No text is copied from source articles — all information is synthesized and rewritten
• Headlines are original creations summarizing the news
• Visual and music direction are original creative suggestions
• Sources are cited for fact verification, not content reproduction

This briefing aggregates publicly reported facts from multiple international news sources,
synthesizes them into original narration, and attributes all factual claims to their sources.
No copyrighted content is reproduced.
`;

export const automationWorkflow = [
  {
    step: 1,
    time: "4:00 AM EST",
    action: "News Gathering",
    description: "AI crawls Reuters, AP, BBC, Al Jazeera, NYT, and 15+ verified sources for last 24h headlines",
  },
  {
    step: 2,
    time: "4:15 AM EST",
    action: "Story Selection",
    description: "AI selects 7-10 highest-impact global stories based on significance, reach, and diversity",
  },
  {
    step: 3,
    time: "4:25 AM EST",
    action: "Script Generation",
    description: "Original narration scripts written from scratch — no plagiarism, all facts verified",
  },
  {
    step: 4,
    time: "4:40 AM EST",
    action: "Visual Direction",
    description: "Scene-by-scene visual instructions and music cues generated for video production",
  },
  {
    step: 5,
    time: "4:50 AM EST",
    action: "Video Rendering",
    description: "5-7 minute vertical video rendered with AI voiceover, graphics, and transitions",
  },
  {
    step: 6,
    time: "5:00 AM EST",
    action: "Multi-Platform Publish",
    description: "Auto-publish to YouTube Shorts, Instagram Reels, Facebook Reels, X, and TikTok",
  },
];
