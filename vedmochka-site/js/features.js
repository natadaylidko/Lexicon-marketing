/* ===== Сонник ===== */
function usedDream(){ try{ return localStorage.getItem("vm_dream")===today(); }catch(e){ return false; } }
function markDream(){ try{ localStorage.setItem("vm_dream",today()); }catch(e){} }
function esc(s){ return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
async function startDream(){
  const m=await herSays(`<p class="cardname">Сонник 💭</p><p>Расскажи свой сон своими словами: что происходило, кто был рядом, что ты чувствовала. Чем больше деталей, тем точнее толкование.</p>
    <div class="dates"><label>Твой сон<textarea data-dream rows="4" maxlength="1500" placeholder="Мне снилось, что…"></textarea></label></div>
    <div class="btn-row"><button class="btn solid" type="button" data-dbtn>Растолковать сон</button></div>
    <small class="note">Сон толкует ИИ от Google. Мы текст не храним, но сервис может использовать его для улучшения своих моделей. Не указывай имена и личные данные.</small>`,600,"wide");
  const btn=m.querySelector("[data-dbtn]"), ta=m.querySelector("[data-dream]");
  btn.addEventListener("click",async()=>{
    const dream=ta.value.trim();
    if(dream.length<10){ toast("Расскажи сон чуть подробнее"); return; }
    if(usedDream()){
      track("limit_hit",{section:"dream"});
      const d=await herSays(`<p class="cardname">Сегодня я уже толковала твой сон</p><p>Одно толкование в день: сны любят тишину 😉 Возвращайся завтра. А в канале каждое утро карта дня.</p>
        <div class="btn-row"><a class="btn full" href="${CONFIG.telegram}" target="_blank" rel="noopener" data-tgx>Подписаться в Telegram</a></div>`,700,"wide door");
      d.querySelector("[data-tgx]").addEventListener("click",()=>track("telegram_clicked",{from:"dream_limit"}));
      return;
    }
    btn.disabled=true; ta.disabled=true;
    track("dream_started",{length:dream.length});
    const wait=document.createElement("div"); wait.className="msg her typing"; wait.innerHTML="<i></i><i></i><i></i>"; chat.appendChild(wait); wait.scrollIntoView({behavior:"smooth",block:"end"});
    document.getElementById("status").textContent="толкует сон…";
    let text=null, code="сеть";
    try{
      const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),28000);
      const r=await fetch("/api/dream",{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({dream})}); clearTimeout(tm);
      code=r.status;
      const j=await r.json().catch(()=>({}));
      if(r.ok) text=j.text; else { code=[r.status,j.error,j.code].filter(Boolean).join(" · "); if(j.msg) code+=" · "+j.msg; }
    }catch(e){}
    wait.remove(); document.getElementById("status").textContent="в сети · отвечает мгновенно";
    let html, tag;
    if(!text && !DREAM_DICT.some(([re])=>re.test(dream))){
      bubble("her wide",`<p>Шар сегодня затуманен 🔮 Попробуй через пару минут — бесплатная попытка не сгорит.</p>`+(/v=test/.test(location.search)?`<small class="note">ИИ не ответил, код: ${esc(String(code))}</small>`:""));
      btn.disabled=false; ta.disabled=false; track("dream_fog",{detail_code:String(code).slice(0,110)}); return;
    }
    if(!text){
      track("dream_fallback",{detail_code:String(code).slice(0,110)});
      tag="📖 по соннику Ведьмочки · без ИИ";
      html=offlineDream(dream)+(/v=test/.test(location.search)?`<small class="note">ИИ не ответил, код: ${esc(String(code))}</small>`:"");
    } else {
      track("dream_shown");
      tag="✨ толкование от ИИ-Ведьмочки";
      html=esc(text).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").split(/\n+/).filter(Boolean).map(p=>`<p>${p}</p>`).join("");
    }
    markDream();
    bubble("her wide",`<span class="tag">${tag}</span>${html}`);
    const d=await herSays(`<p>Хочешь, чтобы карты подсказали ещё больше? Загляни в «Расклад на вопрос» 🃏 А карта дня каждое утро в канале.</p>
      <div class="btn-row"><a class="btn full" href="${CONFIG.telegram}" target="_blank" rel="noopener" data-tgx>Подписаться в Telegram</a></div>`,900,"wide door");
    d.querySelector("[data-tgx]").addEventListener("click",()=>track("telegram_clicked",{from:"dream"}));
  });
}

/* ===== Матрица судьбы ===== */
const ARC=[null,
 {n:"Маг",core:"Ты создатель. Твоя энергия в инициативе и умении превращать идеи в реальность.",persona:"Тебя видят уверенной и находчивой, человеком, который знает, с чего начать.",talent:"Убеждать, начинать новое и находить ресурсы там, где другие их не видят.",lesson:"Научиться доводить начатое до конца и не распыляться."},
 {n:"Верховная Жрица",core:"Твоя сила в интуиции и глубине. Ты чувствуешь людей и ситуации без слов.",persona:"Тебя видят загадочной и спокойной, с тобой хочется делиться секретами.",talent:"Слушать, понимать скрытое и давать мудрые советы.",lesson:"Доверять своему внутреннему голосу и не прятаться от мира."},
 {n:"Императрица",core:"Ты энергия изобилия, красоты и заботы. Рядом с тобой всё расцветает.",persona:"Тебя видят тёплой, женственной, со вкусом к жизни.",talent:"Создавать уют и красоту, окружать заботой.",lesson:"Заботиться о себе так же щедро, как о других."},
 {n:"Император",core:"Твоя энергия — опора и структура. Ты умеешь брать ответственность и строить.",persona:"Тебя видят надёжной и сильной, человеком слова.",talent:"Организовывать, руководить и доводить планы до результата.",lesson:"Не превращать контроль в жёсткость и доверять другим."},
 {n:"Иерофант",core:"Ты наставник. Твоя сила в знаниях, ценностях и умении вести за собой.",persona:"Тебя видят мудрой, к тебе приходят за советом.",talent:"Учить, объяснять и передавать опыт.",lesson:"Найти свои убеждения, а не жить по чужим правилам."},
 {n:"Влюблённые",core:"Твоя энергия — любовь, выбор и отношения. Через близость ты раскрываешься.",persona:"Тебя видят обаятельной и открытой, к тебе тянутся люди.",talent:"Строить отношения, объединять людей и чувствовать красоту.",lesson:"Делать выбор сердцем и брать за него ответственность."},
 {n:"Колесница",core:"Ты движение и победа. Твоя энергия в целеустремлённости.",persona:"Тебя видят активной и энергичной, всегда в пути.",talent:"Достигать целей, путешествовать и вести за собой.",lesson:"Не гнать вперёд любой ценой и замечать тех, кто рядом."},
 {n:"Справедливость",core:"Твоя сила в честности, порядке и умении видеть суть.",persona:"Тебя видят справедливой и рассудительной.",talent:"Анализировать, взвешивать и принимать честные решения.",lesson:"Быть мягче к себе и другим: не всё измеряется правилами."},
 {n:"Отшельник",core:"Ты мудрость и глубина. Твоя энергия раскрывается в тишине и познании.",persona:"Тебя видят спокойной, немного закрытой, но очень умной.",talent:"Исследовать, учиться и находить ответы внутри себя.",lesson:"Не закрываться от людей и делиться своими знаниями."},
 {n:"Колесо Фортуны",core:"Твоя энергия — удача и перемены. Жизнь постоянно куда-то тебя ведёт.",persona:"Тебя видят лёгкой на подъём и везучей.",talent:"Ловить шансы и легко подстраиваться под перемены.",lesson:"Не плыть по течению, а самой поворачивать колесо."},
 {n:"Сила",core:"Ты внутренняя сила и страсть к жизни. Ты способна выдержать многое.",persona:"Тебя видят сильной и энергичной, с характером.",talent:"Вдохновлять, справляться с трудностями и укрощать хаос мягкостью.",lesson:"Направлять силу не на борьбу, а на созидание."},
 {n:"Повешенный",core:"Твоя энергия — особый взгляд на мир. Ты видишь то, чего не замечают другие.",persona:"Тебя видят необычной и творческой, немного не от мира сего.",talent:"Смотреть иначе, творить и помогать людям.",lesson:"Перестать жертвовать собой и ждать, а начать жить для себя."},
 {n:"Смерть",core:"Ты энергия трансформации. Ты умеешь начинать заново и меняться.",persona:"Тебя видят сильной и бесстрашной, тебя сложно сломать.",talent:"Обновлять, отпускать старое и помогать другим пройти перемены.",lesson:"Не бояться перемен и не держаться за прошлое."},
 {n:"Умеренность",core:"Твоя сила в гармонии и балансе. Рядом с тобой людям спокойно.",persona:"Тебя видят мягкой и уравновешенной, умеющей сгладить углы.",talent:"Примирять, исцелять словом и находить золотую середину.",lesson:"Не растворяться в других и слышать свои желания."},
 {n:"Дьявол",core:"Ты энергия притяжения, страсти и денег. У тебя сильная харизма.",persona:"Тебя видят магнетичной и уверенной, тебя сложно не заметить.",talent:"Влиять, продавать, зарабатывать и вызывать сильные эмоции.",lesson:"Не попадать в зависимости и использовать свою силу во благо."},
 {n:"Башня",core:"Твоя энергия — смелость рушить старое и строить новое.",persona:"Тебя видят решительной, порой резкой, но честной.",talent:"Создавать с нуля и не бояться кризисов.",lesson:"Строить на прочном фундаменте и не разрушать то, что дорого."},
 {n:"Звезда",core:"Ты вдохновение и надежда. Твоя энергия светит другим.",persona:"Тебя видят яркой и творческой, немного звездой.",talent:"Вдохновлять, создавать красоту и быть на виду.",lesson:"Верить в себя и не ждать признания, чтобы сиять."},
 {n:"Луна",core:"Твоя сила в воображении и чувствительности. Ты тонко чувствуешь мир.",persona:"Тебя видят мечтательной и загадочной.",talent:"Творчество, интуиция и понимание чувств других.",lesson:"Отличать страхи от реальности и не накручивать себя."},
 {n:"Солнце",core:"Ты радость и свет. Твоя энергия согревает всех вокруг.",persona:"Тебя видят открытой, тёплой и успешной.",talent:"Дарить радость, быть лидером и добиваться успеха.",lesson:"Не выгорать, стараясь понравиться всем."},
 {n:"Суд",core:"Твоя энергия — пробуждение и связь поколений. Ты умеешь начинать новую жизнь.",persona:"Тебя видят мудрой не по годам, человеком семьи.",talent:"Объединять родных, давать второй шанс и вдохновлять на перемены.",lesson:"Простить прошлое и не жить по чужим сценариям."},
 {n:"Мир",core:"Ты целостность и широта. Тебе подвластно многое, мир для тебя открыт.",persona:"Тебя видят разносторонней и свободной.",talent:"Путешествия, языки и умение объединять разных людей.",lesson:"Не бояться масштаба и выходить за привычные рамки."},
 {n:"Шут",core:"Твоя энергия — свобода, лёгкость и детская непосредственность.",persona:"Тебя видят весёлой, спонтанной и немного безбашенной.",talent:"Радоваться жизни, рисковать и находить нестандартные решения.",lesson:"Сохранить лёгкость, но научиться брать ответственность."}
];
const red=n=>{ while(n>22) n=String(n).split("").reduce((s,d)=>s+ +d,0); return n||22; };
function matrixOf(dateStr){
  const [y,m,d]=dateStr.split("-").map(Number);
  const A=red(d), B=red(m), C=red(String(y).split("").reduce((s,x)=>s+ +x,0));
  const D=red(A+B+C), E=red(A+B+C+D);
  return {A,B,C,D,E};
}
function matrixSVG(mx){
  const node=(x,y,v,lab,big)=>`<g><circle cx="${x}" cy="${y}" r="${big?24:19}" fill="${big?"url(#mg)":"#221a3b"}" stroke="#ff7fb8" stroke-width="1.5"/><text x="${x}" y="${y+6}" text-anchor="middle" font-family="Unbounded,Arial Black,sans-serif" font-weight="700" font-size="${big?18:15}" fill="#fff">${v}</text><text x="${x}" y="${y+(big?42:36)}" text-anchor="middle" font-family="Manrope,sans-serif" font-size="10" fill="#a59cc0">${lab}</text></g>`;
  return `<svg viewBox="-20 0 300 250" class="mxsvg" role="img" aria-label="Схема матрицы судьбы"><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6c3cf0"/><stop offset="1" stop-color="#ff6fae"/></linearGradient></defs>
  <path d="M130 30 L230 125 L130 210 L30 125 Z" fill="none" stroke="#352a55" stroke-width="1.5"/><path d="M130 30 V210 M30 125 H230" stroke="#352a55" stroke-width="1"/>
  ${node(130,30,mx.B,"таланты")}${node(30,120,mx.A,"личность")}${node(230,120,mx.C,"деньги и дела")}${node(130,200,mx.D,"задача")}${node(130,118,mx.E,"суть",true)}</svg>`;
}
async function startMatrix(){
  const m=await herSays(`<p class="cardname">Матрица судьбы 🔢</p><p>Введи дату рождения, и я разложу её на энергии арканов: твою суть, личность, таланты и главную задачу. Считаю прямо в телефоне, никуда ничего не отправляю.</p>
    <div class="dates"><label>Дата рождения<input type="date" data-md max="2015-12-31" min="1930-01-01" value="1995-06-15"></label></div>
    <div class="btn-row"><button class="btn solid" type="button" data-mbtn>Рассчитать матрицу</button></div>`,600,"wide");
  m.querySelector("[data-mbtn]").addEventListener("click",async()=>{
    const v=m.querySelector("[data-md]").value; if(!v){ toast("Выбери дату"); return; }
    const mx=matrixOf(v); track("matrix_shown",{E:mx.E});
    await herSays(`<span class="tag">матрица судьбы</span>${matrixSVG(mx)}
      <div class="pos"><b>Твоя суть · ${mx.E} ${ARC[mx.E].n}</b>${ARC[mx.E].core}</div>
      <div class="pos"><b>Личность · ${mx.A} ${ARC[mx.A].n}</b>${ARC[mx.A].persona}</div>
      <div class="pos"><b>Таланты · ${mx.B} ${ARC[mx.B].n}</b>${ARC[mx.B].talent}</div>
      <div class="pos"><b>Деньги и дела · ${mx.C} ${ARC[mx.C].n}</b>Деньги приходят через энергию «${ARC[mx.C].n}»: ${ARC[mx.C].talent.charAt(0).toLowerCase()+ARC[mx.C].talent.slice(1)}</div>
      <p class="advice"><b>Главная задача · ${mx.D} ${ARC[mx.D].n}:</b> ${ARC[mx.D].lesson}</p>`,1000,"wide");
    const d=await herSays(`<p>Хочешь узнать, где стояли планеты в день твоего рождения? Загляни в «Натальную карту» 🪐 А карта дня каждое утро в канале.</p>
      <div class="btn-row"><a class="btn full" href="${CONFIG.telegram}" target="_blank" rel="noopener" data-tgx>Подписаться в Telegram</a></div>`,900,"wide door");
    d.querySelector("[data-tgx]").addEventListener("click",()=>track("telegram_clicked",{from:"matrix"}));
  });
}

/* ===== Натальная карта ===== */
const NATAL={
  sun:["Ты прирождённый лидер: смелая, прямая, всегда готова начать первой.","Ты основательная и чувственная, ценишь стабильность, красоту и комфорт.","Ты любопытная и общительная, легко схватываешь новое и не любишь скучать.","Ты заботливая и чуткая, семья и близкие люди для тебя главное.","Ты яркая и щедрая, создана, чтобы творить и вдохновлять.","Ты внимательная к деталям и практичная, умеешь навести порядок в любом хаосе.","Ты обаятельная и дипломатичная, тонко чувствуешь красоту и гармонию.","Ты глубокая и страстная, видишь людей насквозь и не боишься правды.","Ты свободолюбивая оптимистка, тебя манят путешествия и новые смыслы.","Ты целеустремлённая и надёжная, умеешь ставить цели и достигать их.","Ты оригинальная и независимая, мыслишь на шаг впереди.","Ты мечтательная и чувствительная, с богатой фантазией и большим сердцем."],
  moon:["движение, новые вызовы и свобода действовать по-своему.","уют, вкусная еда, стабильность и ощущение безопасности.","общение, новости и разнообразие, без них ты быстро грустишь.","дом, тёплые объятия и люди, с которыми можно быть собой.","внимание, признание и возможность проявить себя.","порядок, понятный план и ощущение, что ты полезна.","гармония, красота вокруг и отношения без конфликтов.","глубокая близость, честность и доверие.","свобода, приключения и чувство, что жизнь движется.","цель, результат и уверенность в завтрашнем дне.","свобода быть собой и друзья-единомышленники.","тишина, творчество и время помечтать."],
  venus:["Ты любишь страстно и решительно, тебе нравится азарт завоевания.","Ты любишь верно и чувственно, проявляешь чувства через заботу и прикосновения.","Тебе важно, чтобы с партнёром было интересно говорить и смеяться.","Ты любишь нежно и заботливо, ищешь эмоциональную близость.","Ты любишь щедро и ярко и хочешь, чтобы тобой восхищались.","Ты показываешь любовь делами и вниманием к мелочам.","Ты ищешь партнёрство на равных, красоту и романтику.","Ты любишь глубоко и всерьёз: всё или ничего.","Тебе нужен партнёр-приключение и много свободы.","Ты любишь надёжно и серьёзно, ценишь верность и поступки.","Сначала дружба, потом любовь: тебе важны свобода и единомыслие.","Ты любишь романтично и самоотверженно, веришь в сказку."],
  mars:["Ты действуешь быстро и напористо, препятствия тебя только заводят.","Ты действуешь медленно, но упорно, и редко сдаёшься.","Ты действуешь словом и идеями, легко переключаешься между задачами.","Ты действуешь ради близких, а силу проявляешь, когда их защищаешь.","Ты действуешь ярко и с размахом, любишь быть в центре событий.","Ты действуешь методично и точно, по плану.","Ты действуешь дипломатично и предпочитаешь договариваться, а не воевать.","Ты действуешь стратегически и не отступаешь, пока не добьёшься своего.","Ты действуешь с энтузиазмом, когда видишь большую цель.","Ты действуешь как стратег: шаг за шагом к вершине.","Ты действуешь нестандартно и не терпишь давления.","Ты действуешь интуитивно, и лучше всего, когда вдохновлена."]
};
// Расчёт положений планет (метод П. Шлайтера, точность ~1–2′)
const Astro=(()=>{
  const R=Math.PI/180, rev=x=>((x%360)+360)%360;
  const kep=(M,e)=>{ let E=M+e/R*Math.sin(M*R)*(1+e*Math.cos(M*R)); for(let i=0;i<8;i++) E=E-(E-e/R*Math.sin(E*R)-M)/(1-e*Math.cos(E*R)); return E; };
  function helio(N,i,w,a,e,M){ const E=kep(M,e), xv=a*(Math.cos(E*R)-e), yv=a*Math.sqrt(1-e*e)*Math.sin(E*R), v=Math.atan2(yv,xv)/R, r=Math.hypot(xv,yv);
    return [r*(Math.cos(N*R)*Math.cos((v+w)*R)-Math.sin(N*R)*Math.sin((v+w)*R)*Math.cos(i*R)), r*(Math.sin(N*R)*Math.cos((v+w)*R)+Math.cos(N*R)*Math.sin((v+w)*R)*Math.cos(i*R))]; }
  function dayNum(y,m,D,ut){ return 367*y-Math.floor(7*(y+Math.floor((m+9)/12))/4)+Math.floor(275*m/9)+D-730530+ut/24; }
  function lons(y,m,D,ut){
    const d=dayNum(y,m,D,ut);
    const ws=282.9404+4.70935e-5*d, es=0.016709-1.151e-9*d, Ms=rev(356.0470+0.9856002585*d);
    const Es=kep(Ms,es), xv=Math.cos(Es*R)-es, yv=Math.sqrt(1-es*es)*Math.sin(Es*R), rs=Math.hypot(xv,yv);
    const sun=rev(Math.atan2(yv,xv)/R+ws), xs=rs*Math.cos(sun*R), ys=rs*Math.sin(sun*R);
    const Nm=rev(125.1228-0.0529538083*d), wm=rev(318.0634+0.1643573223*d), Mm=rev(115.3654+13.0649929509*d);
    const [xm,ym]=helio(Nm,5.1454,wm,60.2666,0.0549,Mm); let moon=Math.atan2(ym,xm)/R;
    const Ls=rev(Ms+ws), Lm=rev(Mm+wm+Nm), Dd=rev(Lm-Ls), F=rev(Lm-Nm), s=x=>Math.sin(x*R);
    moon+=-1.274*s(Mm-2*Dd)+0.658*s(2*Dd)-0.186*s(Ms)-0.059*s(2*Mm-2*Dd)-0.057*s(Mm-2*Dd+Ms)+0.053*s(Mm+2*Dd)+0.046*s(2*Dd-Ms)+0.041*s(Mm-Ms)-0.035*s(Dd)-0.031*s(Mm+Ms)-0.015*s(2*F-2*Dd)+0.011*s(Mm-4*Dd);
    const pl=(N,i,w,a,e,M)=>{ const [x,y]=helio(rev(N),i,rev(w),a,e,rev(M)); return rev(Math.atan2(y+ys,x+xs)/R); };
    const venus=pl(76.6799+2.4659e-5*d,3.3946+2.75e-8*d,54.8910+1.38374e-5*d,0.723330,0.006773-1.302e-9*d,48.0052+1.6021302244*d);
    const mars=pl(49.5574+2.11081e-5*d,1.8497-1.78e-8*d,286.5016+2.92961e-5*d,1.523688,0.093405+2.516e-9*d,18.6021+0.5240207766*d);
    return {sun,moon:rev(moon),venus,mars};
  }
  return {lons};
})();
const sgn=l=>Math.floor(l/30)%12;
async function startNatal(){
  const m=await herSays(`<p class="cardname">Натальная карта 🪐</p><p>Введи дату рождения, и я посчитаю, где стояли Солнце, Луна, Венера и Марс в этот день. Расчёт идёт прямо в телефоне, никуда ничего не отправляю.</p>
    <div class="dates"><label>Дата рождения<input type="date" data-nd max="2015-12-31" min="1930-01-01" value="1995-06-15"></label></div>
    <div class="btn-row"><button class="btn solid" type="button" data-nbtn>Построить карту</button></div>`,600,"wide");
  m.querySelector("[data-nbtn]").addEventListener("click",async()=>{
    const v=m.querySelector("[data-nd]").value; if(!v){ toast("Выбери дату"); return; }
    const [y,mo,d]=v.split("-").map(Number);
    const mid=Astro.lons(y,mo,d,9), a=Astro.lons(y,mo,d,-3), b=Astro.lons(y,mo,d,20.98);
    const S=k=>SIGNS[sgn(mid[k])], moonA=SIGNS[sgn(a.moon)], moonB=SIGNS[sgn(b.moon)];
    const moonLine= moonA.n===moonB.n ? `${moonA.g} ${moonA.n}` : `${moonA.g} ${moonA.n} или ${moonB.g} ${moonB.n}`;
    const moonNote= moonA.n===moonB.n ? "" : `<br><span class="note">В этот день Луна переходила из знака в знак, точнее скажет время рождения. Ниже описание для ${S("moon").n}.</span>`;
    track("natal_shown",{sun:S("sun").n});
    await herSays(`<span class="tag">натальная карта</span>
      <p class="cardname">${S("sun").g} ${S("sun").n} · Луна ${moonLine}</p>
      <div class="pos"><b>☀️ Солнце в знаке ${S("sun").n} · кто ты</b>${NATAL.sun[sgn(mid.sun)]}</div>
      <div class="pos"><b>🌙 Луна в знаке ${S("moon").n} · что нужно для счастья</b>Для счастья тебе нужны ${NATAL.moon[sgn(mid.moon)]}${moonNote}</div>
      <div class="pos"><b>💗 Венера в знаке ${S("venus").n} · как ты любишь</b>${NATAL.venus[sgn(mid.venus)]}</div>
      <div class="pos"><b>🔥 Марс в знаке ${S("mars").n} · как ты действуешь</b>${NATAL.mars[sgn(mid.mars)]}</div>
      <p class="advice"><b>Скоро:</b> асцендент и дома гороскопа по времени и месту рождения.</p>`,1000,"wide");
    const dd=await herSays(`<p>А какие энергии зашиты в твоей дате рождения, покажет «Матрица судьбы» 🔢 Карта дня каждое утро в канале.</p>
      <div class="btn-row"><a class="btn full" href="${CONFIG.telegram}" target="_blank" rel="noopener" data-tgx>Подписаться в Telegram</a></div>`,900,"wide door");
    dd.querySelector("[data-tgx]").addEventListener("click",()=>track("telegram_clicked",{from:"natal"}));
  });
}

let asked=false;
async function ask(){
  const text=q.value.trim(); if(!text||asked) return; asked=true;
  bubble("me",`<p></p>`).querySelector("p").textContent=text;
  q.value=""; q.disabled=true; q.placeholder="Ведьмочка колдует…"; updateSend(); q.style.height="48px";
  const c=chat.querySelector(".chips"); if(c) c.remove();
  if(usedToday() && !/v=test/.test(location.search)){
    track("limit_hit");
    await herSays(`<p class="cardname">Сегодня карты уже сказали своё</p>
      <p>Один бесплатный расклад в день, иначе магия выдыхается 😉 Возвращайся завтра. А в канале Ведьмочки каждое утро карта дня.</p>
      <div class="btn-row"><a class="btn full" id="tg" href="${CONFIG.telegram}" target="_blank" rel="noopener">Подписаться в Telegram</a></div>`,800,"wide door");
    chat.querySelector("#tg").addEventListener("click",()=>track("telegram_clicked",{from:"limit"}));
    q.placeholder="Новый расклад завтра 🌙";
    asked=false; return;
  }
  const topic=topicOf(text);
  track("question_cta",{length:text.length,topic});
  const draw=[...CARDS].sort(()=>Math.random()-.5).slice(0,3);
  const [a,b,d]=draw.map(x=>READING[x.n]?x:CARDS[0]);
  const wait=document.createElement("div"); wait.className="msg her typing"; wait.innerHTML="<i></i><i></i><i></i>"; chat.appendChild(wait); wait.scrollIntoView({behavior:"smooth",block:"end"});
  document.getElementById("status").textContent="раскладывает карты…";
  let ai=null, code="сеть";
  try{
    const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),28000);
    const r=await fetch("/api/ask",{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({question:text,cards:[a.n,b.n,d.n]})}); clearTimeout(tm);
    const j=await r.json().catch(()=>({}));
    if(r.ok && j.now) ai=j; else { code=[r.status,j.error,j.code].filter(Boolean).join(" · "); if(j.msg) code+=" · "+j.msg; }
  }catch(e){}
  wait.remove(); document.getElementById("status").textContent="в сети · отвечает мгновенно";
  const P=s=>esc(String(s||"")).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
  let tag, body;
  if(ai){
    tag="✨ расклад от ИИ-Ведьмочки";
    body=`<div class="pos"><b>Что сейчас · ${a.n}</b>${P(ai.now)}</div>`+
      (ai.block?`<div class="pos"><b>Что мешает · ${b.n}</b>${P(ai.block)}</div>`:"")+
      (ai.lead?`<div class="pos"><b>К чему ведёт · ${d.n}</b>${P(ai.lead)}</div>`:"")+
      (ai.advice?`<p class="advice"><b>Совет Ведьмочки:</b> ${P(ai.advice)}</p>`:"");
  } else {
    tag="📖 расклад по колоде Ведьмочки · без ИИ";
    const intro=topic==="self"?"🔮 Карты легли. Посмотрим, что они хотят тебе сказать…":TOPICS[topic].intro;
    body=`<p>${intro}</p>
    <div class="pos"><b>Что сейчас · ${a.n}</b>${READING[a.n].now}</div>
    <div class="pos"><b>Что мешает · ${b.n}</b>${READING[b.n].block}</div>
    <div class="pos"><b>К чему ведёт · ${d.n}</b>${READING[d.n].lead}</div>
    <p class="advice"><b>Совет Ведьмочки:</b> ${READING[d.n].advice}</p>`+(/v=test/.test(location.search)?`<small class="note">ИИ не ответил, код: ${esc(String(code))}</small>`:"");
  }
  const m=bubble("her wide",`<span class="tag">${tag}</span>
    <div class="spread">${frontSVG(a)}${frontSVG(b)}${frontSVG(d)}</div>${body}`);
  markUsed();
  track("reading_shown",{topic,source:ai?"ai":"deck",cards:[a.n,b.n,d.n].join("|")});
  if(!ai) track("ask_fallback",{detail_code:String(code).slice(0,100)});
  const door=await herSays(`<p>Понравилось? В канале Ведьмочки каждое утро карта дня 🌙</p>
    <div class="btn-row"><a class="btn full" id="tg" href="${CONFIG.telegram}" target="_blank" rel="noopener">Подписаться в Telegram</a></div>`,1000,"wide door");
  door.querySelector("#tg").addEventListener("click",()=>track("telegram_clicked",{from:"reading"}));
  const l=document.createElement("p"); l.className="legal"; l.textContent="18+. Ведьмочка гадает для развлечения и самоанализа. Не заменяет советы врача, юриста или финансиста.";
  chat.appendChild(l);
  q.placeholder="Новый расклад завтра 🌙";
  asked=false;
}


function updateSend(){ send.disabled = q.disabled || !q.value.trim(); }
q.addEventListener("input",()=>{ updateSend(); q.style.height="48px"; q.style.height=Math.min(q.scrollHeight,120)+"px"; });
q.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); if(!send.disabled) ask(); }});
send.addEventListener("click",ask);

function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400); }
async function share(){
  const url=location.origin+location.pathname;
  const text=`Ведьмочка вытянула мне карту «${chosen.n}» 😳 Вытяни свою: ${url}`;
  track("share_clicked",{card:chosen.n});
  try{ await navigator.clipboard.writeText(text); toast("Скопировала! Отправь подруге"); }catch(e){ toast(text); }
}

let refHost = ""; try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch(e) {}
track("landing", { vis: document.visibilityState, ref: refHost });
/* Пробыл на сайте 10 и 30 секунд с открытой вкладкой — отличает живых людей от случайных тапов и предзагрузки */
(function(){
  let shown = 0, last = document.visibilityState === "visible" ? Date.now() : 0, sent10 = false, sent30 = false;
  function tick(){
    const now = Date.now();
    if (last) { shown += now - last; last = now; }
    if (!sent10 && shown >= 10000) { sent10 = true; track("stay_10s"); }
    if (!sent30 && shown >= 30000) { sent30 = true; track("stay_30s"); clearInterval(timer); }
  }
  const timer = setInterval(tick, 2000);
  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState === "visible") { last = Date.now(); if (!sent10 && !shown) track("became_visible"); }
    else { tick(); last = 0; }
  });
})();

/* ===== Шабаш: «Ведьмин суд» ===== */
const SUD=[
  ["Кто из нас первой выйдет замуж?","Платье уже шьётся где-то во Вселенной. Подружки, готовьте тосты заранее 💍"],
  ["Кто ответит бывшему в два часа ночи?","Ведьмочка изымает твой телефон после полуночи. Ради твоего же блага 🔒"],
  ["Кто однажды бросит всё и уедет жить на Бали?","Чемодан уже чувствует твой взгляд. Не забудь позвать нас в гости 🌴"],
  ["Кто опаздывает даже на свой день рождения?","Приговор: прийти на следующую встречу первой. Ведьмочка проверит 😏"],
  ["Кто тайно смотрит гороскоп каждое утро?","Звёзды знают, что ты знаешь, что они знают ✨"],
  ["Кто расплачется на любой свадьбе, даже на чужой?","Тебе выдаётся пожизненный запас бумажных платочков 🤍"],
  ["Кто станет самой богатой из нас?","Карты видят деньги. Много денег. Не забудь про подруг 💸"],
  ["Кто может уговорить кого угодно на что угодно?","Приговор: уговорить всех за этим столом на следующую встречу 🕯"],
  ["Кто скорее всего заведёт пятерых котов?","Пятеро — это только начало. Котики уже выбирают тебя 🐈‍⬛"],
  ["Кто лучше всех хранит секреты?","Ты наш сейф. Но сегодня можно рассказать один. Маленький 🤫"],
  ["Кто первой уснёт на этой вечеринке?","Приговор: продержаться до полуночи. Ведьмочка верит в тебя 🌙"],
  ["Кто влюбляется с первого взгляда?","Сердце у тебя быстрее, чем мозг. И это прекрасно 💘"],
  ["Кто заведёт свой бизнес?","Название уже придумано, осталось его вспомнить. Мы первые клиентки 📈"],
  ["Кто потратит последние деньги на красивую сумочку?","Сумочка того стоила. Ведьмочка не осуждает, Ведьмочка понимает 👜"],
  ["Кто однажды станет звездой соцсетей?","Миллион подписчиков ждёт. Начни с фото этого вечера 📸"],
  ["Кто идеально выбирает подарки?","Приговор: в следующий раз выбираешь подарок для всех нас 🎁"],
  ["Кто громче всех поёт в караоке?","Соседи уже знают твой репертуар. Ведьмочка требует песню прямо сейчас 🎤"],
  ["Кто пишет «буду через 5 минут», выходя из душа?","Время для тебя — понятие гибкое. Почти магическое ⏳"],
  ["Кто лучше всех готовит?","Следующий шабаш — у тебя на кухне. Решение окончательное 🍲"],
  ["Кто первой побежит на помощь в три часа ночи?","Твоя корона подруги сияет ярче всех. Ведьмочка кланяется 👑"],
  ["Кто читает чужие сообщения через плечо?","Любопытство — главный ведьминский талант. Но сегодня держи себя в руках 👀"],
  ["Кто больше всех похож на настоящую ведьму?","Ты принята в ковен. Метла выдаётся на выходе 🧹"],
  ["Кто может дать совет на все случаи жизни?","Ты наш личный оракул. Приговор: дать совет каждой за этим столом 🔮"],
  ["Кто покупает вещи, которые потом никогда не носит?","Шкаф уже просит пощады. Но одну обновку Ведьмочка разрешает 👗"],
  ["Кто тайно мечтает о собственном доме у моря?","Море уже шумит в твою сторону. Карты говорят: это ближе, чем кажется 🌊"],
  ["Кто будет самой классной бабушкой?","Внуки будут обожать тебя, а пироги станут легендой 🧁"],
  ["Кто влюбится в иностранца?","Учи языки. Судьба говорит с акцентом 🌍"],
  ["Кто чаще всех говорит «последний раз» и делает это снова?","Ведьмочка вела подсчёт и сбилась на третьей сотне 😅"],
  ["Кто лучше всех танцует?","Приговор: исполнить танец победы прямо сейчас. Хотя бы плечами 💃"],
  ["Кто сменит профессию после сорока?","Лучшие перемены приходят вовремя. Твоё время идёт 🚀"],
  ["Кто первой разберётся в любой новой технике?","Ты наша главная техническая ведьма. Почини Wi-Fi, пожалуйста 💻"],
  ["Кто плачет над фильмами про собак?","Сердце у тебя размером с дом. В нём и собаке место есть 🐶"],
  ["Кто сегодня выглядит лучше всех?","Это не вопрос, это констатация факта. Все согласны? ✨"],
  ["Кто чаще всех говорит «я на диете» с пирожным в руке?","Пирожное не считается, если его ешь на шабаше. Это закон 🍰"],
  ["Кто тайно мечтает о сцене?","Свет софитов уже ищет тебя. Начни с тоста за этим столом 🎭"],
  ["Кто напишет книгу о своей жизни?","Глава про этот вечер будет самой смешной. Не забудь нас упомянуть 📖"],
  ["Кто первой заметит, что кто-то из нас влюбился?","Твоя интуиция — настоящий радар. Ведьмочка снимает шляпу 🎩"],
  ["Кто никогда не сдаётся в настольных играх?","Ведьмочка рекомендует: в следующий раз играть с тобой в одной команде 🎲"],
  ["Кто проснётся завтра раньше всех?","Утро у тебя начинается с кофе и плана на день. Остальные завидуют ☕"],
  ["Кто будет дружить с нами до старости?","Каждая из вас. Но эта — точно. Обнимите её прямо сейчас 💜"]
];
const SUD_ROUNDS=10;
async function startShabash(){
  const m=await herSays(`<p class="cardname">Шабаш: Ведьмин суд ⚖️</p>
    <p>Собери подруг вокруг телефона. Я тяну карту с вопросом и считаю до трёх. На «три» все одновременно показывают пальцем на ту, про кого это. Кого выбрали больше всех, та получает мой приговор.</p>
    <p>${SUD_ROUNDS} раундов, имена вводить не нужно.</p>
    <div class="btn-row"><button class="btn solid full" type="button" data-sud-go>Начать суд</button></div>`,500,"wide");
  m.querySelector("[data-sud-go]").addEventListener("click",e=>{
    e.currentTarget.disabled=true;
    track("shabash_started");
    const deck=[...SUD].sort(()=>Math.random()-.5).slice(0,SUD_ROUNDS);
    sudRound(deck,0);
  });
}
async function sudRound(deck,i){
  const [q,verdict]=deck[i];
  const m=await herSays(`<span class="tag">раунд ${i+1} из ${deck.length}</span>
    <p class="cardname">${q}</p>
    <div class="btn-row"><button class="btn solid full" type="button" data-sud-count>Считаю до трёх 👉</button></div>`,700,"wide");
  const btn=m.querySelector("[data-sud-count]");
  btn.addEventListener("click",async()=>{
    btn.disabled=true;
    for(const t of ["Раз…","Два…","ТРИ! 👉"]){ btn.textContent=t; await new Promise(r=>setTimeout(r,700)); }
    const v=await herSays(`<span class="tag">приговор Ведьмочки</span>
      <p>Та, на кого показали больше всех:</p>
      <p class="advice">${verdict}</p>
      <div class="btn-row"><button class="btn solid full" type="button" data-sud-next>${i+1<deck.length?"Следующий вопрос":"Итоги суда"}</button></div>`,500,"wide");
    v.querySelector("[data-sud-next]").addEventListener("click",e=>{
      e.currentTarget.disabled=true;
      if(i+1<deck.length) sudRound(deck,i+1); else sudFinish();
    });
  });
}
async function sudFinish(){
  track("shabash_finished");
  const m=await herSays(`<p class="cardname">Суд окончен! ⚖️</p>
    <p>Все приговоры окончательные и обжалованию не подлежат. Та, кого выбирали чаще всех за вечер, сегодня объявляется Верховной ведьмой ковена 👑</p>
    <div class="btn-row"><button class="btn full" type="button" data-sud-again>Сыграть ещё раз</button></div>`,700,"wide");
  m.querySelector("[data-sud-again]").addEventListener("click",e=>{ e.currentTarget.disabled=true; track("shabash_again"); startShabash(); });
  const d=await herSays(`<p>Понравилось? Новые игры для шабаша и карта дня каждое утро ждут в канале Ведьмочки 🌙</p>
    <div class="btn-row"><a class="btn full" href="${CONFIG.telegram}" target="_blank" rel="noopener" data-tgx>Подписаться в Telegram</a></div>`,900,"wide door");
  d.querySelector("[data-tgx]").addEventListener("click",()=>track("telegram_clicked",{from:"shabash"}));
}
