/* ===== Настройки теста ===== */
const CONFIG = {
  telegram: "https://t.me/vedmochka_na_svyazi",   // ← ссылка на канал
  brand: "Ведьмочка на связи"
};

/* Отслеживание: Vercel Web Analytics (va) и Google Analytics (gtag), если подключены */
const params = new URLSearchParams(location.search);
/* Метка рекламы и номер визита закрепляются на весь визит (sessionStorage), без персональных данных */
function ssGet(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function ssSet(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
const urlVariant = params.get("v") || params.get("utm_content") || location.hash.slice(1) || "";
const variant = urlVariant || ssGet("vm_variant") || "direct";
ssSet("vm_variant", variant);
const sessionId = ssGet("vm_sid") || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
ssSet("vm_sid", sessionId);
const EV={url:"https://dzjiwutoeukmutcandni.supabase.co/rest/v1/vedmochka_events",key:"sb_publishable_aLZ2EKN_N1k3GSwgpNKjrg_FlwJrIu_"};
function track(name, data = {}){
  const payload = { variant, ...data };
  try{ window.va && window.va("event", { name, data: payload }); }catch(e){}
  try{ window.gtag && window.gtag("event", name, payload); }catch(e){}
  // анонимная статистика: только событие, раздел и метка рекламы
  try{
    if(!/^https?:/.test(location.protocol)) return;
    const {variant:v, section, from, topic, ...rest} = payload;
    const row={ name:String(name).slice(0,40), section:String(section||from||topic||"").slice(0,40)||null,
      detail:Object.keys(rest).length?JSON.stringify(rest).slice(0,120):null, variant:String(v||"").slice(0,40)||null,
      session_id:String(sessionId).slice(0,40) };
    fetch(EV.url,{method:"POST",keepalive:true,headers:{"apikey":EV.key,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(row)}).catch(()=>{});
  }catch(e){}
}

const CARDS = [
  {n:"Солнце", k:"ясность · радость", s:"sun", t:"Ну всё, сегодня тебе везёт, и не спорь. Всё складывается проще, чем кажется, если не усложнять.", a:"Скажи «да» тому, что давно откладываешь из-за сомнений."},
  {n:"Луна", k:"интуиция · туман", s:"moon", t:"Сегодня не всё видно сразу, и это нормально. Твоя чуйка сейчас умнее любой логики.", a:"Важные решения отложи до вечера. Сначала прислушайся к себе."},
  {n:"Звезда", k:"надежда · восстановление", s:"star", t:"После тяжёлого периода приходит лёгкость. Ты ближе к своей мечте, чем думаешь.", a:"Запиши одно желание и сделай сегодня крошечный шаг к нему."},
  {n:"Колесо Фортуны", k:"перемены · шанс", s:"wheel", t:"Колесо крутанулось! То, что застряло, наконец сдвигается с места.", a:"Будь готова к неожиданному сообщению. Да-да, и от него тоже."},
  {n:"Влюблённые", k:"выбор · притяжение", s:"hearts", t:"Ох, тут про чувства. Кто-то думает о тебе чаще, чем показывает.", a:"Выбирай то, что ощущается честным, а не удобным."},
  {n:"Императрица", k:"забота · изобилие", s:"crown", t:"Ты слишком много заботишься о других. Сегодня очередь за тобой.", a:"Подари себе час, который принадлежит только тебе."},
  {n:"Сила", k:"мягкая уверенность", s:"infinity", t:"Твоя сила сегодня в спокойствии. Не надо ничего доказывать, ты и так молодец.", a:"На провокацию ответь паузой, а не эмоцией."},
  {n:"Маг", k:"действие · ресурс", s:"spark", t:"Всё нужное у тебя уже есть. Не хватает только решения начать.", a:"Сделай первый шаг сегодня, даже если план не идеален."},
  {n:"Отшельник", k:"пауза · ответы внутри", s:"lamp", t:"Карты намекают: выключи шум. Ответ уже внутри, просто его не слышно за чатами.", a:"Прогулка без телефона даст больше, чем десять советов подруг."},
  {n:"Колесница", k:"движение · победа", s:"arrow", t:"Ты разгоняешься, и это видно. Главное сейчас — не распыляться.", a:"Выбери одну главную задачу дня и доведи её до конца."},
  {n:"Умеренность", k:"баланс · терпение", s:"cups", t:"Всё придёт вовремя. Сегодня работает золотая середина, а не крайности.", a:"Не торопи события, дай ситуации созреть."},
  {n:"Мир", k:"завершение · гармония", s:"ring", t:"Одна глава закрывается, и закрывается красиво. Впереди новая.", a:"Скажи себе спасибо за пройденный путь. Серьёзно, скажи."},
  {n:"Шут", k:"новое начало · лёгкость", s:"fool", t:"Карта смелых и немного безрассудных. Сегодня можно попробовать то, на что раньше не решалась.", a:"Сделай одну спонтанную вещь. Мир не рухнет, обещаю."},
  {n:"Верховная Жрица", k:"тайна · внутренний голос", s:"pillars", t:"Ты знаешь больше, чем говоришь. И, кажется, больше, чем признаёшься себе.", a:"Не рассказывай всем о своих планах. Пусть пока поживут в тишине."},
  {n:"Император", k:"порядок · опора", s:"throne", t:"День для структуры и решительности. Ты умеешь держать всё под контролем, когда захочешь.", a:"Поставь одну границу, которую давно откладываешь."},
  {n:"Иерофант", k:"мудрость · наставник", s:"key", t:"Ответ может прийти от человека постарше или поопытнее. Не стесняйся спросить совета.", a:"Напиши тому, чьё мнение для тебя важно."},
  {n:"Справедливость", k:"честность · баланс", s:"scales", t:"Всё возвращается, и сегодня это работает в твою пользу. Честность окупится.", a:"Взвесь все «за» и «против», прежде чем отвечать «да»."},
  {n:"Повешенный", k:"пауза · новый взгляд", s:"hanged", t:"Если всё застряло, попробуй посмотреть с другой стороны. Иногда пауза полезнее рывка.", a:"Не дави на ситуацию сегодня. Дай ей повисеть."},
  {n:"Смерть", k:"трансформация · обновление", s:"sunrise", t:"Не пугайся, это не про плохое. Это карта больших перемен: старое уходит, чтобы освободить место новому.", a:"Отпусти то, что давно отжило. Хотя бы одну мелочь."},
  {n:"Дьявол", k:"соблазн · привязанности", s:"horns", t:"Кое-что держит тебя сильнее, чем стоило бы. Привычка, человек или «ещё одна серия».", a:"Заметь, что сегодня забирает твою энергию, и чуть ослабь хватку."},
  {n:"Башня", k:"встряска · освобождение", s:"tower", t:"Возможен неожиданный поворот. Встряска неприятна, но после неё становится легче дышать.", a:"Если что-то пойдёт не по плану, не паникуй. Возможно, так и надо."},
  {n:"Суд", k:"пробуждение · второй шанс", s:"trumpet", t:"Время для второго шанса, себе или кому-то ещё. Ты уже не та, что раньше.", a:"Вернись к одной идее, которую когда-то бросила."}
];

const QUESTIONS = [
  "Писать ли ему первой?","Думает ли он обо мне?","Что он ко мне чувствует?","Стоит ли давать второй шанс?","Будут ли у нас отношения?",
  "Менять ли работу?","Получится ли мой проект?","Стоит ли просить повышение?","Будут ли деньги в этом месяце?","Куда вложить силы сейчас?",
  "Что ждёт меня в ближайший месяц?","Чего мне сейчас не хватает?","Как помириться с подругой?","Стоит ли переезжать?","Что мне мешает двигаться дальше?"
];
function symbol(s){
  const g='stroke="#2b1a5c" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const m={
    sun:`<circle cx="50" cy="70" r="15" ${g}/>`+Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="${50+21*Math.cos(a)}" y1="${70+21*Math.sin(a)}" x2="${50+29*Math.cos(a)}" y2="${70+29*Math.sin(a)}" ${g}/>`}).join(""),
    moon:`<path d="M58 44a26 26 0 1 0 0 52a34 34 0 0 1 0-52z" ${g}/>`,
    star:`<path d="M50 40l7 20h21l-17 12 6 20-17-12-17 12 6-20-17-12h21z" ${g}/>`,
    wheel:`<circle cx="50" cy="70" r="26" ${g}/><circle cx="50" cy="70" r="6" ${g}/>`+[0,45,90,135].map(d=>{const a=d*Math.PI/180;return `<line x1="${50-26*Math.cos(a)}" y1="${70-26*Math.sin(a)}" x2="${50+26*Math.cos(a)}" y2="${70+26*Math.sin(a)}" ${g}/>`}).join(""),
    hearts:`<path d="M38 88c-14-10-18-18-14-25s14-6 14 2c0-8 10-9 14-2s0 15-14 25z" ${g}/><path d="M62 78c-14-10-18-18-14-25s14-6 14 2c0-8 10-9 14-2s0 15-14 25z" ${g}/>`,
    crown:`<path d="M26 88h48l4-34-14 14-14-22-14 22-14-14z" ${g}/>`,
    infinity:`<path d="M30 70c0-10 14-10 20 0s20 10 20 0-14-10-20 0-20 10-20 0z" ${g}/>`,
    spark:`<path d="M50 38v64M18 70h64M28 48l44 44M72 48L28 92" ${g}/><circle cx="50" cy="70" r="8" ${g}/>`,
    lamp:`<path d="M42 50h16l4 24H38z" ${g}/><path d="M50 40v10M44 74l-4 22h20l-4-22" ${g}/>`,
    arrow:`<path d="M24 92L76 40M52 40h24v24M24 70l22 22" ${g}/>`,
    cups:`<path d="M24 52h20l-3 18h-14zM56 72h20l-3 18H59z" ${g}/><path d="M40 66c10 0 14 4 18 10" ${g}/>`,
    ring:`<ellipse cx="50" cy="70" rx="22" ry="30" ${g}/><circle cx="50" cy="70" r="4" ${g}/>`,
    fool:`<circle cx="50" cy="52" r="10" ${g}/><path d="M30 100c6-22 14-30 20-30s14 8 20 30M50 62v8" ${g}/><path d="M64 44l10-8" ${g}/>`,
    pillars:`<path d="M30 42v58M70 42v58M26 42h8M66 42h8M26 100h8M66 100h8" ${g}/><path d="M56 60a10 10 0 1 0 0 20a8 8 0 1 1 0-20z" ${g}/>`,
    throne:`<path d="M32 98V50h36v48M32 74h36M28 50l22-12 22 12" ${g}/>`,
    key:`<circle cx="50" cy="52" r="10" ${g}/><path d="M50 62v38M50 84h10M50 94h8" ${g}/>`,
    scales:`<path d="M50 40v58M30 52h40M36 98h28" ${g}/><path d="M22 76l8-24 8 24zM62 76l8-24 8 24" ${g}/>`,
    hanged:`<path d="M30 40h40M50 40v14" ${g}/><circle cx="50" cy="90" r="8" ${g}/><path d="M50 54v28M50 64l-12 10M50 64l12 10" ${g}/>`,
    sunrise:`<path d="M24 86h52M30 86a20 20 0 0 1 40 0" ${g}/><path d="M50 52v-10M34 60l-7-7M66 60l7-7" ${g}/>`,
    horns:`<circle cx="50" cy="76" r="18" ${g}/><path d="M36 64c-8-8-8-18-4-24 2 8 8 14 14 18M64 64c8-8 8-18 4-24-2 8-8 14-14 18" ${g}/>`,
    tower:`<path d="M38 100V54h24v46M34 54h32M42 54v-8h16v8M46 72h8" ${g}/><path d="M76 36l-10 14h8l-10 14" ${g}/>`,
    trumpet:`<path d="M26 82l34-24v32z M60 58l14-8v48l-14-8" ${g}/><path d="M80 66h6M80 76h8M80 86h6" ${g}/>`
  };
  return m[s]||"";
}
let uid=0;
function frontSVG(c){
  const id="f"+(uid++);
  return `<svg viewBox="0 0 100 165" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.n}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf3"/><stop offset="1" stop-color="#ffe3f0"/></linearGradient></defs>
    <rect width="100" height="165" rx="12" fill="url(#${id})"/>
    <rect x="6" y="6" width="88" height="153" rx="8" fill="none" stroke="#6c3cf0" stroke-width=".8" stroke-dasharray="2 3"/>
    ${symbol(c.s)}
    <text x="50" y="138" text-anchor="middle" font-family="Unbounded,Arial Black,sans-serif" font-weight="700" font-size="8.5" fill="#2b1a5c">${c.n}</text>
  </svg>`;
}
function backSVG(){
  const id="b"+(uid++);
  return `<svg viewBox="0 0 100 165" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1a5c"/><stop offset=".6" stop-color="#6c3cf0"/><stop offset="1" stop-color="#ff6fae"/></linearGradient></defs>
    <rect width="100" height="165" rx="12" fill="url(#${id})"/>
    <rect x="6" y="6" width="88" height="153" rx="8" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>
    <path d="M60 58a22 22 0 1 0 0 44a30 30 0 0 1 0-44z" fill="#fff"/>
    <path d="M30 34l2 6 6 2-6 2-2 6-2-6-6-2 6-2z M72 118l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#c8f169"/>
  </svg>`;
}

/* ===== Ведьминский дым и искры ===== */
const Smoke=(()=>{
  const cv=document.getElementById("smoke"); if(!cv||!cv.getContext) return {puff(){}};
  const ctx=cv.getContext("2d"); let W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2);
  const still=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dark=()=>true;
  const P=[],S=[];
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function wisp(x,y,burst){return{x:x??Math.random()*W,y:y??H+80+Math.random()*120,r:burst?20+Math.random()*30:60+Math.random()*90,
    vx:(Math.random()-.5)*(burst?1.6:.25),vy:-(burst?.4+Math.random()*1.2:.15+Math.random()*.35),
    g:burst?.9:.25,a:0,max:burst?.5:.16+Math.random()*.12,life:0,ttl:burst?140+Math.random()*80:900+Math.random()*700,
    hue:Math.random()<.6?0:1,ph:Math.random()*6.28,burst}}
  function star(){return{x:Math.random()*W,y:Math.random()*H,r:.6+Math.random()*1.6,ph:Math.random()*6.28,sp:.01+Math.random()*.03}}
  size();addEventListener("resize",size);
  for(let i=0;i<16;i++){const w=wisp();w.y=Math.random()*H;w.life=Math.random()*w.ttl*.6;P.push(w)}
  for(let i=0;i<38;i++)S.push(star());
  function frame(){
    ctx.clearRect(0,0,W,H);
    const dk=dark(), c=[dk?"150,110,255":"140,95,240", dk?"255,120,185":"255,130,190"];
    ctx.globalCompositeOperation=dk?"lighter":"source-over";
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.life++;p.ph+=.01;
      p.x+=p.vx+Math.sin(p.ph)*.35;p.y+=p.vy;p.r+=p.g*.12;
      const t=p.life/p.ttl;p.a=p.max*(t<.2?t/.2:t>.7?(1-t)/.3:1);
      if(t>=1||p.y<-p.r*2){P.splice(i,1);if(!p.burst)P.push(wisp());continue}
      const gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      gr.addColorStop(0,`rgba(${c[p.hue]},${p.a})`);gr.addColorStop(1,`rgba(${c[p.hue]},0)`);
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill()}
    ctx.globalCompositeOperation="source-over";
    for(const s of S){s.ph+=s.sp;const a=.15+.55*Math.max(0,Math.sin(s.ph));
      ctx.fillStyle=dk?`rgba(220,245,160,${a})`:`rgba(108,60,240,${a*.7})`;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}
    if(!still)requestAnimationFrame(frame)}
  frame();
  return{puff(el){if(still||!el)return;const b=el.getBoundingClientRect();
    for(let i=0;i<26;i++)P.push(wisp(b.left+b.width*(.15+Math.random()*.7),b.top+b.height*(.3+Math.random()*.6),true))}};
})();

const chat=document.getElementById("chat");
const q=document.getElementById("q"), send=document.getElementById("send");
const now=()=>new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});
document.querySelectorAll("[data-now]").forEach(e=>e.textContent=now());

function bubble(cls,html){
  const d=document.createElement("div"); d.className="msg "+cls; d.innerHTML=html+`<span class="time">${now()}</span>`;
  chat.appendChild(d); d.scrollIntoView({behavior:"smooth",block:"end"}); return d;
}
function herSays(html,delay=900,extra=""){
  return new Promise(res=>{
    const t=document.createElement("div"); t.className="msg her typing"; t.innerHTML="<i></i><i></i><i></i>";
    chat.appendChild(t); t.scrollIntoView({behavior:"smooth",block:"end"});
    document.getElementById("status").textContent="печатает…";
    setTimeout(()=>{ t.remove(); document.getElementById("status").textContent="в сети · отвечает мгновенно"; res(bubble("her "+extra,html)); },delay);
  });
}

/* ===== Разделы ===== */
const IC={
  day:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  ask:'<rect x="3" y="6" width="9" height="14" rx="2" transform="rotate(-8 7 13)"/><rect x="11" y="4" width="9" height="14" rx="2" transform="rotate(8 15 11)"/><path d="M15.5 9.5a1.6 1.6 0 1 1 1.4 2.4v1"/>',
  him:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 8v5"/>',
  matrix:'<rect x="5" y="5" width="14" height="14" rx="1"/><rect x="5" y="5" width="14" height="14" rx="1" transform="rotate(45 12 12)"/><circle cx="12" cy="12" r="2"/>',
  compat:'<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
  natal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21"/><circle cx="17" cy="7" r="1.2"/>',
  dream:'<path d="M14 4a7 7 0 1 0 6 10.5A6 6 0 0 1 14 4z"/><path d="M17 3h3l-3 3h3"/>',
  palm:'<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v7M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13M17 12a1.5 1.5 0 0 1 3 0v2.5A6.5 6.5 0 0 1 13.5 21h-1a6 6 0 0 1-5-2.8L5 14a1.5 1.5 0 0 1 2.5-1.6L8 13"/>',
  lila:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/>',
  shabash:'<path d="M4 11h16"/><path d="M5 11c0 5 3 8.5 7 8.5s7-3.5 7-8.5"/><path d="M8 19.5l-1 1.5M16 19.5l1 1.5"/><circle cx="10" cy="6.5" r="1.4"/><circle cx="14.5" cy="4.5" r="1"/><circle cx="14" cy="8" r=".8"/>'
};
const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const GO=`<svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>`;
const SECTIONS=[
  {id:"day",sub:"Одна карта и совет на сегодня",n:"Карта дня",live:true,d:"Одна карта и совет на сегодня."},
  {id:"ask",sub:"3 карты на твой вопрос",n:"Расклад на вопрос",live:true,d:"Задаёшь любой вопрос, я раскладываю 3 карты: что сейчас, что мешает и к чему всё ведёт. И даю совет, что делать."},
  {id:"him",sub:"Что он чувствует",n:"Гадание на него",live:true,d:"Что он чувствует, думает ли о тебе и стоит ли писать первой. Честный расклад на ваши отношения."},
  {id:"matrix",sub:"Суть и таланты по дате",n:"Матрица судьбы",live:true,d:"По дате рождения: твоё предназначение, денежный канал, задачи в любви и сильные стороны."},
  {id:"compat",sub:"Ваша пара по звёздам",n:"Совместимость",live:true,d:"Вводишь две даты рождения и получаешь процент совместимости и разбор вашей пары: где вы совпадаете, а где искрит."},
  {id:"natal",sub:"Твои планеты",n:"Натальная карта",live:true,d:"Где стояли планеты в момент твоего рождения: Солнце, Луна, Венера, Марс. Кто ты, что тебе нужно для счастья и как ты любишь."},
  {id:"dream",sub:"Расскажи сон, растолкую",n:"Сонник",live:true,d:"Расскажи свой сон, и я растолкую, что он значит именно для тебя, а не по старой книжке."},
  {id:"shabash",sub:"3 игры для девичника",n:"Шабаш",live:true,d:"Ведьминские игры для девичника и посиделок с подругами: предсказание каждой по очереди, «кто из нас…» на картах, совместимость вашей компании и фанты-предсказания.<br><br>Один телефон на всех, а смех гарантирован."},
  {id:"palm",sub:"Линии судьбы по фото ладони",n:"Чтение по руке",d:"Сфотографируй ладонь, и я прочитаю твои линии: жизни, сердца, ума и судьбы."}
];
const menu=document.getElementById("menu");
SECTIONS.forEach(x=>{
  const b=document.createElement("button"); b.type="button"; b.className="tile"+(x.id==="day"?" feat":"")+(x.live?"":" soon");
  b.innerHTML=`<span class="ic">${icon(x.id)}</span><span class="tt"><b>${x.n}</b><small>${x.sub}</small></span>${x.live?GO:'<span class="soonpill">скоро</span>'}`;
  b.addEventListener("click",()=>{
    track("section_clicked",{section:x.id});
    if(x.id==="ask"){ enableAsk(); return; }
    if(x.id==="him"){ startHim(); return; }
    if(x.id==="compat"){ startCompat(); return; }
    if(x.id==="dream"){ startDream(); return; }
    if(x.id==="matrix"){ startMatrix(); return; }
    if(x.id==="natal"){ startNatal(); return; }
    if(x.id==="shabash"){ startShabash(); return; }
    if(x.live){ document.getElementById("deck").scrollIntoView({behavior:"smooth",block:"center"}); return; }
    openSheet(x);
  });
  menu.appendChild(b);
});
const sheet=document.getElementById("sheet");
let sheetSec=null;
function openSheet(x){
  sheetSec=x;
  document.getElementById("sh-ic").innerHTML=icon(x.id);
  document.getElementById("sh-t").textContent=x.n;
  document.getElementById("sh-d").innerHTML=x.d;
  document.getElementById("sh-tg").href=CONFIG.telegram;
  sheet.hidden=false; document.getElementById("sh-tg").focus();
}
function closeSheet(){ sheet.hidden=true; }
document.getElementById("sh-x").addEventListener("click",closeSheet);
sheet.addEventListener("click",e=>{ if(e.target===sheet) closeSheet(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!sheet.hidden) closeSheet(); });
document.getElementById("sh-tg").addEventListener("click",()=>track("telegram_clicked",{from:sheetSec&&sheetSec.id}));

const deck=document.getElementById("deck");
const picks=[...CARDS].sort(()=>Math.random()-.5).slice(0,3);
let chosen=null;
picks.forEach((c,i)=>{
  const b=document.createElement("button");
  b.className="card"; b.type="button"; b.id="card"+i; b.setAttribute("aria-label","Карта "+(i+1));
  b.innerHTML=`<span class="face back">${backSVG()}</span><span class="face front">${frontSVG(c)}</span>`;
  b.addEventListener("click",()=>flip(b,c,i));
  deck.appendChild(b);
});

async function flip(btn,c,i){
  if(chosen) return; chosen=c;
  btn.classList.add("flipped"); deck.classList.add("done"); Smoke.puff(btn);
  deck.querySelectorAll(".card").forEach(x=>{ if(x!==btn) x.disabled=true; });
  track("card_flipped",{card:c.n,position:i+1});
  await new Promise(r=>setTimeout(r,400));
  await herSays(`<span class="tag">${c.k}</span><p class="cardname">Твоя карта: ${c.n}</p><p>${c.t}</p><p class="advice"><b>Совет:</b> ${c.a}</p>
    <div class="btn-row"><button class="btn" type="button" data-share>Отправить подруге</button><a class="btn solid" href="${CONFIG.telegram}" target="_blank" rel="noopener" data-tgcard>🌙 Карта каждое утро в Telegram</a></div>`,700,"wide");
  chat.querySelector("[data-share]").addEventListener("click",share);
  chat.querySelector("[data-tgcard]").addEventListener("click",()=>track("telegram_clicked",{from:"card"}));
}

