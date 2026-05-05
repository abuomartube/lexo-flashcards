export interface ThemeColor {
  gradient: string;
  glow: string;
  text: string;
}

export interface Theme {
  id: string;
  label: string;
  emoji: string;
  color: ThemeColor;
  words: string[];
}

const PALETTE: ThemeColor[] = [
  { gradient: "bg-gradient-to-r from-pink-500 to-rose-500", glow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]", text: "text-pink-300" },
  { gradient: "bg-gradient-to-r from-orange-500 to-red-500", glow: "shadow-[0_0_20px_rgba(249,115,22,0.35)]", text: "text-orange-300" },
  { gradient: "bg-gradient-to-r from-rose-500 to-pink-500", glow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]", text: "text-rose-300" },
  { gradient: "bg-gradient-to-r from-fuchsia-500 to-purple-500", glow: "shadow-[0_0_20px_rgba(217,70,239,0.35)]", text: "text-fuchsia-300" },
  { gradient: "bg-gradient-to-r from-amber-500 to-yellow-500", glow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]", text: "text-amber-300" },
  { gradient: "bg-gradient-to-r from-blue-500 to-indigo-500", glow: "shadow-[0_0_20px_rgba(59,130,246,0.35)]", text: "text-blue-300" },
  { gradient: "bg-gradient-to-r from-emerald-500 to-green-500", glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]", text: "text-emerald-300" },
  { gradient: "bg-gradient-to-r from-teal-500 to-emerald-500", glow: "shadow-[0_0_20px_rgba(20,184,166,0.35)]", text: "text-teal-300" },
  { gradient: "bg-gradient-to-r from-violet-500 to-purple-500", glow: "shadow-[0_0_20px_rgba(139,92,246,0.35)]", text: "text-violet-300" },
  { gradient: "bg-gradient-to-r from-cyan-500 to-sky-500", glow: "shadow-[0_0_20px_rgba(6,182,212,0.35)]", text: "text-cyan-300" },
  { gradient: "bg-gradient-to-r from-sky-500 to-blue-500", glow: "shadow-[0_0_20px_rgba(14,165,233,0.35)]", text: "text-sky-300" },
  { gradient: "bg-gradient-to-r from-lime-500 to-green-500", glow: "shadow-[0_0_20px_rgba(132,204,22,0.35)]", text: "text-lime-300" },
  { gradient: "bg-gradient-to-r from-yellow-500 to-amber-500", glow: "shadow-[0_0_20px_rgba(234,179,8,0.35)]", text: "text-yellow-300" },
  { gradient: "bg-gradient-to-r from-red-500 to-rose-500", glow: "shadow-[0_0_20px_rgba(239,68,68,0.35)]", text: "text-red-300" },
  { gradient: "bg-gradient-to-r from-indigo-500 to-violet-500", glow: "shadow-[0_0_20px_rgba(99,102,241,0.35)]", text: "text-indigo-300" },
];

type RawTheme = { id: string; label: string; emoji: string; words: string[] };

const RAW: RawTheme[] = [
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", words: ["mother","father","brother","sister","son","daughter","parent","child","baby","family","husband","wife","uncle","aunt","cousin","grandfather","grandmother","marry","married","couple"] },
  { id: "food", label: "Food & Drink", emoji: "🍎", words: ["bread","milk","cheese","butter","egg","meat","fish","rice","fruit","vegetable","apple","sugar","salt","coffee","tea","water","juice","chicken","soup","cake"] },
  { id: "body", label: "Body", emoji: "🧍", words: ["head","hair","eye","ear","nose","mouth","tooth","neck","shoulder","arm","hand","finger","leg","foot","knee","back","heart","skin","face","body"] },
  { id: "clothes", label: "Clothes", emoji: "👕", words: ["shirt","dress","hat","coat","shoe","sock","jacket","jeans","skirt","suit","tie","boot","pocket","belt","uniform","cotton","wool","wear","clothes","scarf"] },
  { id: "home", label: "Home", emoji: "🏠", words: ["house","home","room","kitchen","bathroom","bedroom","door","window","wall","floor","roof","garden","table","chair","bed","lamp","mirror","key","stairs","yard"] },
  { id: "school", label: "School", emoji: "🎓", words: ["school","teacher","student","class","lesson","book","pen","pencil","paper","desk","exam","test","study","learn","read","write","university","college","library","homework"] },
  { id: "animals", label: "Animals", emoji: "🐾", words: ["dog","cat","bird","fish","horse","cow","pig","sheep","mouse","rabbit","lion","tiger","bear","elephant","monkey","snake","duck","wolf","animal","insect"] },
  { id: "nature", label: "Nature", emoji: "🌳", words: ["tree","flower","grass","river","lake","sea","mountain","hill","forest","sky","sun","moon","star","cloud","rain","snow","wind","fire","earth","ice"] },
  { id: "colors", label: "Colors", emoji: "🎨", words: ["red","blue","green","yellow","black","white","brown","pink","orange","purple","gray","color","dark","light","bright","pale","silver","gold","shade","rainbow"] },
  { id: "time", label: "Time", emoji: "⏰", words: ["hour","minute","second","day","week","month","year","morning","afternoon","evening","night","today","tomorrow","yesterday","time","date","weekend","season","summer","winter"] },
  { id: "numbers", label: "Numbers", emoji: "🔢", words: ["one","two","three","four","five","six","seven","eight","nine","ten","hundred","thousand","million","first","second","half","quarter","double","single","number"] },
  { id: "weather", label: "Weather", emoji: "⛅", words: ["rain","snow","wind","sun","cloud","storm","hot","cold","warm","cool","ice","fog","weather","sunny","rainy","windy","dry","wet","temperature","lightning"] },
  { id: "transport", label: "Transport", emoji: "🚗", words: ["car","bus","train","plane","bike","boat","ship","taxi","truck","road","ticket","station","airport","drive","ride","fly","travel","journey","trip","traffic"] },
  { id: "city", label: "City & Places", emoji: "🏙️", words: ["city","town","village","street","road","building","park","bridge","station","hospital","hotel","restaurant","shop","market","museum","church","library","square","neighborhood","capital"] },
  { id: "sports", label: "Sports", emoji: "⚽", words: ["ball","game","team","player","win","lose","score","goal","match","sport","football","race","run","jump","swim","ride","exercise","fit","gym","coach"] },
  { id: "music", label: "Music", emoji: "🎵", words: ["music","song","sing","dance","play","band","guitar","piano","drum","sound","voice","note","concert","album","rhythm","beat","loud","quiet","listen","instrument"] },
  { id: "jobs", label: "Jobs", emoji: "💼", words: ["doctor","teacher","nurse","lawyer","engineer","farmer","artist","writer","driver","cook","waiter","manager","worker","soldier","police","scientist","actor","singer","pilot","job"] },
  { id: "money", label: "Money & Shopping", emoji: "💰", words: ["money","dollar","price","buy","sell","pay","cost","cheap","expensive","free","bill","coin","bank","save","spend","rich","poor","sale","account","shop"] },
  { id: "health", label: "Health", emoji: "🩺", words: ["doctor","nurse","hospital","medicine","pain","sick","ill","healthy","fever","cough","cold","blood","heart","hurt","well","cure","patient","treatment","disease","accident"] },
  { id: "emotions", label: "Emotions", emoji: "😊", words: ["happy","sad","angry","afraid","love","hate","fear","joy","hope","surprise","calm","worried","proud","shy","nervous","glad","lonely","excited","jealous","feeling"] },
  { id: "movement", label: "Movement", emoji: "🏃", words: ["walk","run","jump","climb","swim","fly","ride","drive","dance","move","fall","rise","push","pull","lift","throw","catch","kick","sit","stand"] },
  { id: "speaking", label: "Speaking", emoji: "💬", words: ["say","tell","ask","answer","talk","speak","shout","whisper","call","listen","speech","voice","language","word","story","conversation","message","news","question","reply"] },
  { id: "cooking", label: "Cooking", emoji: "🍳", words: ["cook","bake","fry","boil","mix","cut","slice","peel","chop","recipe","kitchen","oven","pan","pot","knife","plate","bowl","spoon","fork","cup"] },
  { id: "tools", label: "Tools", emoji: "🔧", words: ["knife","hammer","saw","nail","screw","rope","key","lock","brush","scissors","needle","machine","tool","wheel","engine","pipe","wire","chain","bell","glass"] },
  { id: "tech", label: "Technology", emoji: "💻", words: ["computer","phone","screen","internet","email","website","software","app","file","button","password","online","click","video","camera","message","network","device","system","data"] },
  { id: "furniture", label: "Furniture", emoji: "🛋️", words: ["chair","table","bed","sofa","desk","shelf","cabinet","drawer","lamp","mirror","clock","picture","carpet","curtain","pillow","blanket","cupboard","bench","stool","wardrobe"] },
  { id: "office", label: "Office", emoji: "🗂️", words: ["office","desk","computer","paper","pen","file","meeting","boss","employee","work","report","email","phone","project","deadline","task","document","contract","schedule","business"] },
  { id: "hobbies", label: "Hobbies", emoji: "🎯", words: ["read","draw","paint","write","sing","dance","play","cook","run","swim","hike","fish","garden","travel","photograph","collect","build","watch","listen","game"] },
  { id: "art", label: "Art", emoji: "🖼️", words: ["art","paint","draw","picture","color","paper","brush","pencil","design","photograph","image","statue","gallery","museum","artist","exhibition","frame","sketch","sculpture","beauty"] },
  { id: "reading", label: "Reading & Writing", emoji: "📚", words: ["book","page","word","letter","story","novel","poem","chapter","library","read","write","author","title","magazine","newspaper","dictionary","paper","print","text","language"] },
  { id: "months", label: "Months", emoji: "🗓️", words: ["january","february","march","april","may","june","july","august","september","october","november","december","month","year","calendar","season","week","day","today","date"] },
  { id: "directions", label: "Directions", emoji: "🧭", words: ["north","south","east","west","left","right","up","down","here","there","near","far","front","back","above","below","between","behind","inside","outside"] },
  { id: "shapes", label: "Shapes & Sizes", emoji: "🔺", words: ["circle","square","triangle","line","point","round","flat","big","small","large","tall","short","long","wide","narrow","thick","thin","deep","high","low"] },
  { id: "opposites", label: "Opposites", emoji: "⚖️", words: ["hot","cold","big","small","fast","slow","old","new","young","rich","poor","easy","hard","good","bad","strong","weak","dry","wet","full"] },
  { id: "personality", label: "Personality", emoji: "🌟", words: ["kind","friendly","polite","rude","brave","shy","honest","lazy","busy","calm","funny","serious","clever","wise","smart","silly","gentle","strict","generous","fair"] },
  { id: "appearance", label: "Appearance", emoji: "💁", words: ["tall","short","fat","thin","young","old","beautiful","pretty","handsome","ugly","hair","eye","face","smile","blonde","dark","light","slim","weight","height"] },
  { id: "routine", label: "Daily Routine", emoji: "🌅", words: ["wake","sleep","eat","drink","wash","dress","work","study","play","watch","read","write","cook","walk","drive","shop","clean","rest","return","leave"] },
  { id: "kitchen", label: "Kitchen", emoji: "🍽️", words: ["kitchen","oven","fridge","sink","stove","pan","pot","plate","bowl","cup","glass","knife","fork","spoon","towel","soap","food","cook","bake","wash"] },
  { id: "bathroom", label: "Bathroom", emoji: "🛁", words: ["bathroom","bath","shower","sink","toilet","mirror","towel","soap","brush","water","shampoo","comb","wash","clean","hot","cold","mat","tap","tub","tile"] },
  { id: "bedroom", label: "Bedroom", emoji: "🛏️", words: ["bed","pillow","blanket","sheet","mattress","lamp","clock","wardrobe","drawer","mirror","curtain","sleep","dream","night","rest","alarm","carpet","closet","quiet","dark"] },
  { id: "garden", label: "Garden & Plants", emoji: "🌷", words: ["garden","tree","flower","grass","leaf","plant","seed","soil","root","branch","fruit","vegetable","water","sun","grow","dig","cut","gate","fence","path"] },
  { id: "beach", label: "Sea & Beach", emoji: "🏖️", words: ["sea","beach","sand","wave","ocean","shell","fish","swim","boat","sun","hot","salt","water","coast","island","surf","deep","dive","cliff","lighthouse"] },
  { id: "sky", label: "Sky & Space", emoji: "🌌", words: ["sky","sun","moon","star","cloud","rain","snow","wind","storm","sunrise","sunset","dawn","day","night","blue","bright","dark","fly","planet","space"] },
  { id: "birds", label: "Birds", emoji: "🦅", words: ["bird","chicken","duck","goose","eagle","owl","parrot","sparrow","crow","swan","peacock","hen","wing","feather","beak","nest","egg","fly","sing","cage"] },
  { id: "sea-creatures", label: "Sea Creatures", emoji: "🐬", words: ["fish","shark","whale","dolphin","octopus","crab","lobster","squid","jellyfish","seal","turtle","eel","starfish","shrimp","salmon","tuna","ray","coral","oyster","sea"] },
  { id: "insects", label: "Insects", emoji: "🐝", words: ["bee","ant","fly","butterfly","mosquito","spider","worm","beetle","wasp","moth","ladybug","caterpillar","dragonfly","grasshopper","cricket","snail","bug","insect","sting","web"] },
  { id: "fruit", label: "Fruit", emoji: "🍓", words: ["apple","banana","orange","grape","lemon","mango","pear","peach","strawberry","watermelon","pineapple","cherry","plum","kiwi","melon","fruit","berry","lime","coconut","fig"] },
  { id: "vegetables", label: "Vegetables", emoji: "🥕", words: ["tomato","potato","onion","carrot","lettuce","cucumber","pepper","garlic","cabbage","broccoli","corn","pea","bean","mushroom","spinach","celery","eggplant","pumpkin","vegetable","salad"] },
  { id: "drinks", label: "Drinks", emoji: "🥤", words: ["water","juice","milk","coffee","tea","soda","wine","beer","cocktail","lemonade","drink","bottle","glass","cup","ice","hot","cold","sweet","sip","taste"] },
  { id: "sweets", label: "Sweets", emoji: "🍰", words: ["cake","cookie","candy","chocolate","sugar","honey","jam","pie","donut","cream","dessert","sweet","bake","frost","syrup","vanilla","caramel","treat","biscuit","ice"] },
];

export const THEMES: Theme[] = RAW.map((r, i) => ({
  ...r,
  color: PALETTE[i % PALETTE.length],
}));

export function getThemeById(id: string | null): Theme | undefined {
  if (!id) return undefined;
  return THEMES.find((t) => t.id === id);
}

export function buildThemeWordSet(theme: Theme): Set<string> {
  return new Set(theme.words.map((w) => w.toLowerCase()));
}
