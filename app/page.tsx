'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { Activity, Anchor, ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, BadgeCheck, Building2, Check, ChevronRight, ClipboardPaste, Clock3, Compass, Copy, Cpu, Crown, Download, Flag, GraduationCap, Handshake, HelpCircle, Landmark, LayoutGrid, Library, Lightbulb, LockKeyhole, Medal, Mic, MicOff, Minus, Moon, Play, RefreshCw, RotateCcw, Scale, Send, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Sprout, Star, Sun, Target, Timer, Trash2, TrendingUp, Trophy, UserRound, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { Turn } from '@/lib/engine';
import { arrangeChoices, choices, Choice, Config, defaults, discoveredInterests, Domain, evaluateText, finale, interestsFor, openingLine, scenarioFor, usesStory, outcome, PRESSURE_TIMER_TENSION, pressureTimeLimit, scenarios, silenceChoice, withInterests, SESSION_STAGE_COUNT, stages, tension, tensionState, threshold } from '@/lib/engine';
import { Session, sessionStageCount, useArena } from '@/lib/store';
import { generateOpponentReplyWebLLM, initLocalAi, interruptLocalGeneration, loadLocalModel, LOCAL_MODEL_OPTIONS, localAiReady, LocalModelTier, removeLocalModel, setLocalAiEnabled, setLocalModelTier, useLocalAi } from '@/lib/web-llm';
import { createRussianRecognition, playArenaSound, speakOpponent, speechRecognitionAvailable, SpeechRecognitionLike, startTensionClock, stopOpponentVoice, stopTensionClock } from '@/lib/media';
import { Arrival, Atmosphere, Modal, TensionMeter, transition, Welcome } from '@/components/experience';
import { mapLevels, RankIcon as RankIconName, rankForXp, rankIndexForXp, rankProgress, ranks } from '@/lib/progression';
import { createTeacherAccount, decodeReport, encodeReport, groupAnalytics, groupCsv, hasTeacherAccount, importReport, LearnerProfile, loadLearner, loadReports, loginTeacher, logoutTeacher, reportFromHistory, saveLearner, StudentReport, teacherSession } from '@/lib/teacher';
import { CustomSelect } from '@/components/custom-select';
import { COACH_HINTS, Competency, competencyProfile, harvardAssessment, sessionMemo, techniqueFor } from '@/lib/methods';
import { AchievementId, ACHIEVEMENTS } from '@/lib/achievements';
import { parseScenario, sameScenario, SCENARIO_PRESETS, ScenarioPreset, serializeScenario } from '@/lib/scenario-library';

type View='practice'|'progress'|'admin'|'settings'|'teacher';
const navigation=[{id:'practice',icon:LayoutGrid,name:'Арена',short:'Арена'},{id:'progress',icon:TrendingUp,name:'Прогресс',short:'Прогресс'},{id:'admin',icon:SlidersHorizontal,name:'Администратор / Конструктор',short:'Админ'},{id:'settings',icon:Settings2,name:'Настройки',short:'Настройки'}] as const;

export default function Home(){
 const {config,session,history,setConfig,start,clearSession,achievements,recentAchievements,dismissAchievements}=useArena();
 const [briefPrevious,setBriefPrevious]=useState<string|undefined>();
 const [view,setView]=useState<View>('practice');
 const [ready,setReady]=useState(false);
 const [welcome,setWelcome]=useState(true);
 const [quiet,setQuiet]=useState(false);
 const [dark,setDark]=useState(true);
 const [sounds,setSounds]=useState(true);
 const [voice,setVoice]=useState(false);
 const [timer,setTimer]=useState(true);
 const [brief,setBrief]=useState<Config|null>(null);
 const [review,setReview]=useState<Session|null>(null);
 const [learner,setLearner]=useState<LearnerProfile>({name:'Ученик',classCode:'ARENA-01'});
 const [teacherName,setTeacherName]=useState('');
 useEffect(()=>{try{setWelcome(localStorage.getItem('arena-intro-v2')!=='done');setQuiet(localStorage.getItem('arena-quiet')==='true');setDark(localStorage.getItem('arena-theme')!=='light');setSounds(localStorage.getItem('arena-sounds')!=='false');setVoice(localStorage.getItem('arena-voice')==='true');setTimer(localStorage.getItem('arena-timer')!=='false');setLearner(loadLearner());setTeacherName(teacherSession())}catch{}setReady(true)},[]);
 useEffect(()=>{void initLocalAi()},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark]);
 const completeWelcome=()=>{try{localStorage.setItem('arena-intro-v2','done')}catch{}setWelcome(false)};
 const toggleQuiet=()=>{setQuiet(value=>{try{localStorage.setItem('arena-quiet',String(!value))}catch{}return !value})};
 const toggleDark=()=>{setDark(value=>{try{localStorage.setItem('arena-theme',value?'light':'dark')}catch{}return !value})};
 const toggleSounds=()=>{setSounds(value=>{try{localStorage.setItem('arena-sounds',String(!value))}catch{}if(!value)playArenaSound('navigate',true);return !value})};
 const toggleTimer=()=>{setTimer(value=>{try{localStorage.setItem('arena-timer',String(!value))}catch{}return !value})};
 const toggleVoice=()=>{setVoice(value=>{try{localStorage.setItem('arena-voice',String(!value))}catch{}if(value)stopOpponentVoice();return !value})};
 const active=ready?session:null;
 const past=ready?history:[];
 const pressure=active&&!active.ended&&view==='practice'?tension(active.config,active.turns):20;
 const total=past.reduce((sum,s)=>sum+outcome(s.config,s.turns,sessionStageCount(s)).score,0);
 function preview(value:Domain|Config){playArenaSound('navigate',sounds);setBriefPrevious(undefined);setBrief(typeof value==='string'?(config.domain===value?config:defaults[value]):value)}
 const visibleNavigation=teacherName?[...navigation,{id:'teacher' as const,icon:GraduationCap,name:'Кабинет',short:'Кабинет'}]:navigation;
 const rankState=rankProgress(total);
 const screen=view==='practice'?(active?(active.ended?'result':'session'):'home'):view;
 return <MotionConfig transition={transition} reducedMotion={quiet?'always':'user'}><div className={`app-root ${quiet?'quiet':''} ${dark?'theme-dark':''}`}>
 <AnimatePresence mode="wait">
 {!ready?<motion.div className="loading" key="loading" exit={{opacity:0}}><AudioLines size={35}/></motion.div>:welcome?<Arrival key="welcome"><Welcome onComplete={completeWelcome}/></Arrival>:<Arrival key="application" className="app-frame">
 <Atmosphere value={pressure} quiet={quiet}/>
 <aside className="sidebar"><button className="brand" aria-label="Главное меню" onClick={()=>{playArenaSound('navigate',sounds);setView('practice')}}><span className="brand-mark"><AudioLines size={22}/></span><span>арена<span className="brand-dot">.</span></span></button><span className="sidebar-caption">ПРАКТИКА ДИАЛОГА</span><nav aria-label="Основная навигация">{visibleNavigation.map(item=><button key={item.id} data-nav={item.id} aria-current={view===item.id?'page':undefined} onClick={()=>{playArenaSound('navigate',sounds);setView(item.id);setReview(null)}} className={`nav-item ${view===item.id?'selected':''}`}>{view===item.id&&<motion.span className="nav-highlight" layoutId="navigation" transition={{type:'spring',stiffness:320,damping:36}}/>}<item.icon size={20}/><span className="short-label" data-short={item.short!==item.name?item.short:undefined}>{item.name}</span>{item.id==='practice'&&active&&!active.ended&&<i className="live-dot"/>}</button>)}</nav><div className="sidebar-bottom"><button className="legend-link" onClick={()=>setWelcome(true)}><HelpCircle size={19}/><span>Как устроена арена</span></button><div className="profile"><div className="avatar"><RankIcon name={rankState.current.icon} size={18}/></div><div><strong>{rankState.current.title}</strong><small>{rankState.next?`${rankState.earned} / ${rankState.needed} XP`:`${total} XP · высшее звание`}</small><div className="mini-track"><i style={{width:`${rankState.percent}%`}}/></div></div></div></div></aside>
 <main className="main"><header className="topbar"><div className="breadcrumb">Пространство практики <ChevronRight size={14}/><span>{visibleNavigation.find(n=>n.id===view)?.name}</span></div><div className="topbar-status"><LocalAiStatusLabel/><button className="icon-button" aria-label={dark?'Включить светлую тему':'Включить тёмную тему'} onClick={toggleDark}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button" aria-label="Повторить знакомство" onClick={()=>setWelcome(true)}><HelpCircle size={18}/></button></div></header>
 <div className="screen-host"><AnimatePresence mode="wait"><Arrival key={screen+(review?.id||'')} className={`screen screen-${screen}`}>
 {view==='practice'&&!active&&<Dashboard history={past} total={total} onPreview={preview} onConfigure={()=>setView('admin')}/>}
 {view==='practice'&&active&&!active.ended&&<Negotiation key={active.id} session={active} quiet={quiet} sounds={sounds} voice={voice} pressureTimer={timer}/>}
 {view==='practice'&&active?.ended&&<Results session={active} history={past} sounds={sounds} totalXp={total} onRetry={()=>start(active.config,learner,active.id)} onClose={clearSession}/>}
 {view==='progress'&&(review?<Results session={review} history={past} sounds={sounds} totalXp={total} onRetry={()=>{setBriefPrevious(review.id);setBrief(review.config)}} onClose={()=>setReview(null)}/>:<Progress history={past} achievements={achievements} total={total} onSelect={setReview} onPractice={()=>setView('practice')}/>)}
 {view==='admin'&&<Constructor config={config} onSave={setConfig} onPreview={c=>{setConfig(c);setBrief(c)}}/>}
 {view==='settings'&&<Settings quiet={quiet} dark={dark} sounds={sounds} voice={voice} timer={timer} onTimer={toggleTimer} history={past} learner={learner} teacherName={teacherName} onLearner={setLearner} onTeacher={setTeacherName} onOpenTeacher={()=>setView('teacher')} onQuiet={toggleQuiet} onDark={toggleDark} onSounds={toggleSounds} onVoice={toggleVoice} onWelcome={()=>setWelcome(true)}/>}
 {view==='teacher'&&teacherName&&<TeacherDashboard teacherName={teacherName} learner={learner} history={past}/>}
 </Arrival></AnimatePresence></div>
 </main>
 </Arrival>}
 </AnimatePresence>
 <AnimatePresence>{brief&&!welcome&&<Modal title="Брифинг перед переговорами" onClose={()=>{setBrief(null);setBriefPrevious(undefined)}}><div className="eyebrow">ПЕРЕД НАЧАЛОМ / БРИФИНГ</div><h2>{brief.topic}</h2><p className="brief-text">{scenarioFor(brief).brief}</p><NegotiationFrame config={brief}/><div className="brief-person"><div className="avatar">{scenarioFor(brief).initials}</div><div><strong>{scenarioFor(brief).person}</strong><small>{brief.role} · {brief.tone} тон</small></div></div><label>Сложность<CustomSelect ariaLabel="Сложность переговоров" value={brief.difficulty} onChange={difficulty=>setBrief({...brief,difficulty})} options={difficultyOptions}/></label><p className="note">Цель собеседника: {brief.goal}. Для успеха — {threshold(brief)} баллов, доверие от 40%, напряжённость ниже 100% и все {SESSION_STAGE_COUNT} этапов.</p>{active&&!active.ended&&<p className="notice">Новая практика заменит текущую незавершённую сессию.</p>}<button className="button primary full" onClick={()=>{playArenaSound('navigate',sounds);start(brief,learner,briefPrevious);setBrief(null);setBriefPrevious(undefined);setView('practice');setReview(null)}}>Начать переговоры <ArrowRight size={17}/></button></Modal>}</AnimatePresence>
 <AchievementToast ids={recentAchievements} onClose={dismissAchievements}/>
 </div></MotionConfig>;
}

const difficultyOptions=[
 {value:'Базовый',label:'Базовый',description:'мягче реакции и ниже стартовое напряжение'},
 {value:'Продвинутый',label:'Продвинутый',description:'больше сопротивления и требований'},
 {value:'Эксперт',label:'Эксперт',description:'высокая цена каждого неудачного хода'},
] as const;
const domainOptions=[
 {value:'supplier',label:'Закупки и продажи',description:'цена, объём и условия контракта'},
 {value:'career',label:'Карьера и развитие',description:'роль, результаты и вознаграждение'},
 {value:'team',label:'Команда и управление',description:'сроки, нагрузка и выгорание команды'},
] as const;
const toneOptions=[
 {value:'Дружелюбный',label:'Дружелюбный',description:'открыт к совместному поиску'},
 {value:'Сдержанный',label:'Сдержанный',description:'деловой и осторожный'},
 {value:'Жёсткий',label:'Жёсткий',description:'быстро усиливает давление'},
] as const;

function Dashboard({history,total,onPreview,onConfigure}:{history:Session[];total:number;onPreview:(config:Config)=>void;onConfigure:()=>void}){
 const rankIndex=rankIndexForXp(total);const currentRank=rankForXp(total);
 return <div className="dashboard map-dashboard"><div className="heading"><div><span className="eyebrow">МАРШРУТ ПЕРЕГОВОРЩИКА</span><h1>Растите от встречи<br/>к большой сделке<span>.</span></h1><p>Каждое звание открывает переговоры нового масштаба.</p></div><div className="dashboard-seal rank-seal" style={{'--rank-tone':currentRank.tone} as React.CSSProperties}><RankIcon name={currentRank.icon} size={38}/><span>{currentRank.title}</span></div></div>
 <div className="dashboard-stats"><span><Flag size={16}/><strong>{history.length}</strong> сессий</span><span><Zap size={16}/><strong>{total}</strong> XP</span><span><Trophy size={16}/>{currentRank.title}</span></div>
 <div className="section-label"><h2>Карта переговоров</h2><span>{mapLevels.filter(level=>rankIndex>=level.requiredRank).length} из {mapLevels.length} переговоров открыто</span></div>
 <div className="negotiation-map scroll-region">{mapLevels.map((level,index)=>{const unlocked=rankIndex>=level.requiredRank;const rank=ranks[level.requiredRank];return <motion.button key={level.id} data-level={level.id} data-domain={level.config.domain} whileHover={unlocked?{y:-3,scale:1.01}:{}} whileTap={unlocked?{scale:.98}:{}} disabled={!unlocked} onClick={()=>unlocked&&onPreview(level.config)} className={`map-level ${unlocked?'unlocked':'locked'} ${level.id.startsWith('alabuga')?'scope-partner':`scope-${level.scope.toLowerCase()}`}`} style={{'--level-tone':rank.tone} as React.CSSProperties}><span className="map-path-index">{String(index+1).padStart(2,'0')}</span><span className="map-node-icon">{unlocked?<RankIcon name={rank.icon} size={22}/>:<LockKeyhole size={20}/>}</span><span className="map-copy"><small>{level.scope} · {level.config.difficulty}</small><strong>{level.title}</strong><span>{unlocked?level.subtitle:`Откроется со званием «${rank.title}»`}</span></span><span className="map-action">{unlocked?<Play size={16}/>:<LockKeyhole size={14}/>}</span></motion.button>})}</div>
 <button className="custom-banner" onClick={onConfigure}><span><SlidersHorizontal size={20}/><strong>Ваш контекст. Ваши условия.</strong><small>Настройте собеседника и сложность.</small></span><ArrowRight size={19}/></button>
 <div className="dashboard-footer"><ShieldCheck size={13}/><span>Здесь можно ошибаться. Для этого мы и тренируемся.</span><Link href="/presentation">О проекте <ArrowUpRight size={13}/></Link></div>
 </div>;
}

function Negotiation({session:s,quiet,sounds,voice,pressureTimer}:{session:Session;quiet:boolean;sounds:boolean;voice:boolean;pressureTimer:boolean}){
 const {beginAnswer,resolveAnswer,finish,setReplyDraft}=useArena();
 const text=s.draft||'';const setText=setReplyDraft;
 const inheritedPending=useRef(Boolean(s.pending));
 const [busy,setBusy]=useState(Boolean(s.pending));const busyRef=useRef(Boolean(s.pending));
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const voiceDraft=useRef(false);
 const recognition=useRef<SpeechRecognitionLike|null>(null);const draftBeforeVoice=useRef('');
 const [now,setNow]=useState(Date.now());const [showMission,setShowMission]=useState(false);
 const localAi=useLocalAi();const aiReady=localAi.enabled&&localAi.status==='ready';const [aiNotice,setAiNotice]=useState('');
 const [listening,setListening]=useState(false);const [voiceNotice,setVoiceNotice]=useState('');
 const [micReady,setMicReady]=useState(false);const [coachOpen,setCoachOpen]=useState(false);const [micHint,setMicHint]=useState(false);const [timerNotice,setTimerNotice]=useState('');const [left,setLeft]=useState<number|null>(null);const log=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();
 const stageTotal=sessionStageCount(s);const stage=s.turns.length;
 const liveTurns=s.pending?[...s.turns,{...s.pending.choice,reply:''}]:s.turns;
 const pressure=tension(s.config,liveTurns);const previous=s.pending?tension(s.config,s.turns):stage?tension(s.config,s.turns.slice(0,-1)):undefined;
 const mood=tensionState(pressure);const result=outcome(s.config,s.turns,stageTotal);const liveResult=outcome(s.config,liveTurns,stageTotal);const observedTurns=useRef(stage);

 useEffect(()=>{
  setMicReady(speechRecognitionAvailable());try{setMicHint(localStorage.getItem('arena-mic-hint')!=='seen')}catch{}
  const interval=setInterval(()=>setNow(Date.now()),1000);
  const openingTimer=voice?setTimeout(()=>speakOpponent(openingLine(s.config)),260):null;
  return()=>{clearInterval(interval);if(timer.current)clearTimeout(timer.current);if(openingTimer)clearTimeout(openingTimer);interruptLocalGeneration();recognition.current?.abort();stopOpponentVoice()};
 },[]);
 useEffect(()=>{if(!inheritedPending.current||!s.pending)return;timer.current=setTimeout(()=>{resolveAnswer();busyRef.current=false;setBusy(false);inheritedPending.current=false},quiet||reduced?220:720);return()=>{if(timer.current)clearTimeout(timer.current)}},[]);
 useEffect(()=>{if(!voice)stopOpponentVoice()},[voice]);
 useEffect(()=>setCoachOpen(false),[stage]);
 useEffect(()=>startTensionClock(pressure,sounds),[pressure,sounds]);
 useEffect(()=>{const el=log.current;if(el)el.scrollTo({top:el.scrollHeight,behavior:reduced||quiet?'instant':'smooth'})},[stage,Boolean(s.pending),reduced,quiet]);
 useEffect(()=>{
  if(stage<=observedTurns.current)return;
  const reply=s.turns[stage-1]?.reply;const rose=previous!==undefined&&pressure>previous;
  playArenaSound(rose&&pressure>=70?'warning':'response',sounds);
  if(voice&&reply)speakOpponent(reply);
  observedTurns.current=stage;
 },[stage,pressure,previous,s.turns,sounds,voice]);
 useEffect(()=>{
  if(!result.collapsed)return;
  recognition.current?.abort();stopOpponentVoice();stopTensionClock();busyRef.current=false;setBusy(false);playArenaSound('warning',sounds);
  const collapseTimer=setTimeout(finish,quiet||reduced?450:1800);return()=>clearTimeout(collapseTimer);
 },[result.collapsed,finish,quiet,reduced,sounds]);

 const baseTension=tension(s.config,s.turns);
 // Shuffled per session and stage: the strongest move is not always the first one.
 const options=arrangeChoices(choices(s.config,stage,baseTension),`${s.id}:${stage}`);
 const known=discoveredInterests(liveTurns);const interestList=interestsFor(s.config);const scenario=scenarioFor(s.config);
 const limit=pressureTimeLimit(s.config);
 const timed=pressureTimer&&baseTension>=PRESSURE_TIMER_TENSION&&!busy&&!s.pending&&!result.collapsed&&stage<stageTotal;
 useEffect(()=>{setLeft(timed?limit:null)},[timed,stage,limit]);
 useEffect(()=>{
  if(left===null||!timed||showMission)return;
  if(left<=0){
   // Time is up: a meaningful draft is sent as is, otherwise the silence itself becomes the move.
   const draft=text.trim();setLeft(null);
   void choose(draft.length>=15?evaluateText(draft,s.config.domain,stage,s.turns[stage-1]):silenceChoice());
   setTimerNotice(draft.length>=15?'Время вышло — отправлен ваш черновик.':'Время вышло — собеседник воспринял паузу как отсутствие позиции.');
   return;
  }
  const tick=setTimeout(()=>setLeft(value=>value===null?null:value-1),1000);return()=>clearTimeout(tick);
 },[left,timed,showMission]);
 useEffect(()=>{
  // Keys 1–3 pick an answer when the player is not typing.
  const onKey=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null;
   if(target&&(target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable))return;
   if(event.metaKey||event.ctrlKey||event.altKey||showMission||busy||stage>=stageTotal||result.collapsed)return;
   const index=Number(event.key)-1;
   if(Number.isInteger(index)&&index>=0&&index<options.length){event.preventDefault();void choose(options[index])}
  };
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 });
 function hideMicHint(){setMicHint(false);try{localStorage.setItem('arena-mic-hint','seen')}catch{}}
 async function choose(c:Choice){
  if(busyRef.current||stage>=stageTotal||result.collapsed)return;
  recognition.current?.abort();setListening(false);playArenaSound('send',sounds);
  busyRef.current=true;setBusy(true);setAiNotice('');setVoiceNotice('');setTimerNotice('');setText('');
  // Remember how the move was made: time left under pressure and voice input feed the achievements.
  const move:Choice={...withInterests(s.config,stage,c,s.turns),...(left!==null?{timerLeft:left}:{}),...(c.freeText&&voiceDraft.current?{voice:true}:{})};
  voiceDraft.current=false;
  beginAnswer(move);
  if(!localAiReady()){timer.current=setTimeout(()=>{resolveAnswer();busyRef.current=false;setBusy(false)},quiet||reduced?220:720);return}
  try{const result=await generateOpponentReplyWebLLM(s.config,s.turns,move,stage);resolveAnswer(result.text);if(result.fallback)setAiNotice('Локальная модель ответила неуверенно — показана реплика сценария.')}
  finally{busyRef.current=false;setBusy(false)}
 }
 function send(){if(text.trim().length>=5)void choose(evaluateText(text.trim(),s.config.domain,stage,s.turns[stage-1]))}
 function toggleListening(){
  hideMicHint();
  if(listening){recognition.current?.stop();return}
  draftBeforeVoice.current=text.trim();setVoiceNotice('');
  const instance=createRussianRecognition({
   onStart:()=>{setListening(true);playArenaSound('navigate',sounds)},
   onResult:transcript=>{voiceDraft.current=true;setText([draftBeforeVoice.current,transcript].filter(Boolean).join(' ').slice(0,800))},
   onError:message=>setVoiceNotice(message),
   onEnd:()=>{setListening(false);recognition.current=null},
  });
  if(!instance){setVoiceNotice('Голосовой ввод недоступен в этом браузере. Используйте актуальный Chrome или Edge.');return}
  recognition.current=instance;
  try{instance.start()}catch{setVoiceNotice('Микрофон уже используется. Попробуйте ещё раз.');setListening(false)}
 }
 const opponentName=scenario.person.split(' ')[0];
 // Training wheels: on the basic level the method behind each option is visible before the choice.
 const methodHints=s.config.difficulty==='Базовый';
 // The coach explains the method of the stage without giving away an answer; experts play without it.
 const coachAllowed=s.config.difficulty!=='Эксперт';const coach=COACH_HINTS[Math.min(stage,COACH_HINTS.length-1)];
 return <div className={`negotiation tension-${mood.level}`} data-tension={pressure}>
  <div className="session-heading"><div><span className="eyebrow">ВСТРЕЧА В АРЕНЕ · {stage}/{stageTotal} ЭТАПОВ</span><h1>{s.config.topic}</h1></div><div className="session-controls"><span className="timer"><Clock3 size={15}/>{formatTime(now-s.started)}</span><button className="icon-button" aria-label="Показать задачу" onClick={()=>setShowMission(true)}><Target size={19}/></button></div></div>
  <div className="session-layout"><section className="conversation"><div className="opponent"><div className={`avatar mood-avatar ${mood.level}`}>{scenario.initials}<span/></div><div><strong>{scenario.person}</strong><small>{s.config.role} · {aiReady?'локальный AI':'сценарный режим'} · интересы {known.size}/{interestList.length}</small></div><span className={`mood-chip ${mood.level}`}>{mood.label}</span></div><div className="mobile-tension"><TensionMeter value={pressure} previous={previous} compact/></div>
   <div className="messages" ref={log} role="log" aria-label="История переговоров" aria-live="polite"><div className="dialog-intro"><span>Переговоры начались</span></div><div className="message theirs"><button className="speak-reply" aria-label="Озвучить первую реплику" onClick={()=>speakOpponent(openingLine(s.config))}><Volume2 size={15}/></button><small>{opponentName}</small><span>{openingLine(s.config)}</span></div>{s.turns.map((turn,i)=><div key={i} className="exchange"><div className="stage-divider">{stages[i]}</div><motion.div className="message yours" initial={{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}} transition={transition}>{turn.text}</motion.div><motion.div className="message theirs" initial={{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}} transition={{...transition,delay:quiet||reduced?0:.16}}><button className="speak-reply" aria-label={`Озвучить ответ ${i+1}`} onClick={()=>speakOpponent(turn.reply)}><Volume2 size={15}/></button><small>{opponentName}</small><span>{turn.reply}</span></motion.div><div className="turn-feedback"><Sparkles size={13}/><TechniqueBadge choice={turn}/>{turn.skill} · +{turn.points} XP{turn.interests?.length?' · раскрыт интерес':''}</div></div>)}{s.pending&&<div className="exchange pending-exchange"><div className="stage-divider">{stages[stage]}</div><motion.div className="message yours" initial={{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}}>{s.pending.choice.text}</motion.div><motion.div className="message theirs thinking-message" initial={{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}} role="status"><small>{opponentName}</small><span className="thinking-label">{aiReady?'Локальная модель формулирует ответ':'Обдумывает ответ'}</span><span className="thinking-dots" aria-hidden="true"><i/><i/><i/></span></motion.div><div className="turn-feedback pending-feedback"><Activity size={13}/><TechniqueBadge choice={s.pending.choice}/>{s.pending.choice.skill} · напряжённость пересчитана</div></div>}</div>
   <AnimatePresence>{micHint&&stage<stageTotal&&!result.collapsed&&<motion.div key="mic-hint" className="mic-hint" role="note" initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Mic size={18}/><span><strong>{micReady?'Можно отвечать голосом':'Голосовой ввод'}</strong>{micReady?'Нажмите на микрофон и говорите по-русски — текст появится в поле, его можно поправить и отправить.':'В этом браузере микрофон недоступен: он работает в Chrome и Edge. Здесь отвечайте текстом или выбирайте вариант.'}</span><button type="button" onClick={hideMicHint}>Понятно</button></motion.div>}</AnimatePresence><div className="composer"><AnimatePresence mode="wait">{result.collapsed?<Arrival key="collapse" className="finish-prompt collapse-prompt"><div><VolumeX size={19}/><span><strong>Сделка сорвалась.</strong> Напряжённость достигла 100%. Переходим к разбору…</span></div></Arrival>:stage<stageTotal?<Arrival key={stage} className="response-block"><div className="composer-heading"><span>ВАШ ХОД</span><strong>{stages[stage]}</strong>{coachAllowed&&<button type="button" className={`coach-button ${coachOpen?'active':''}`} aria-expanded={coachOpen} onClick={()=>setCoachOpen(value=>!value)}><Lightbulb size={14}/><span className="short-label" data-short="Коуч">Подсказка коуча</span></button>}{left!==null?<span className={`answer-timer ${left<=10?'urgent':''}`} role="timer" aria-label={`На ответ осталось ${left} секунд`}><Clock3 size={13}/>{left} с</span>:<span>{stage+1}/{stageTotal}</span>}</div>{left!==null&&<div className="answer-timer-track" aria-hidden="true"><i style={{width:`${Math.max(0,left/limit*100)}%`}}/></div>}{coachOpen&&coachAllowed&&<div className="coach-hint" role="note"><Lightbulb size={16}/><span><strong>{coach.method}</strong>{coach.text}</span></div>}<div className="options">{options.map((c,i)=><button disabled={busy} key={c.text} onClick={()=>void choose(c)}><span className="option-number">{i+1}</span><span>{c.text}{methodHints&&<TechniqueBadge choice={c}/>}</span><ArrowUpRight size={16}/></button>)}</div><form className="input-row" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="Ваша реплика" placeholder={listening?'Говорите — я записываю…':'Ответьте своими словами или голосом…'} value={text} maxLength={800} disabled={busy} onChange={e=>setText(e.target.value)}/><button type="button" className={`voice-button ${listening?'listening':''} ${micHint&&micReady?'hinted':''}`} aria-label={listening?'Остановить голосовой ввод':'Начать голосовой ввод'} aria-pressed={listening} disabled={busy||!micReady} title={micReady?'Голосовой ввод':'Доступно в Chrome и Edge'} onClick={toggleListening}>{listening?<MicOff size={18}/>:<Mic size={18}/>}<span className="voice-pulse"/></button><button className="send-button" aria-label="Отправить реплику" disabled={busy||text.trim().length<5}><Send size={18}/></button></form><div className={`input-note ${aiNotice||voiceNotice||timerNotice?'ai-fallback-notice':''}`}>{busy?(aiReady?'Локальная нейросеть формирует ответ на вашем устройстве…':'Собеседник обдумывает ваш ответ…'):(voiceNotice||aiNotice||timerNotice||(left!==null?`Напряжение на пределе: на ответ ${limit} секунд. Черновик от 15 символов отправится сам.`:listening?'Слушаю… Нажмите микрофон ещё раз, чтобы остановить.':<><span className="hint-desktop">Введите от 5 символов или нажмите микрофон · Enter — отправить · 1–3 — выбрать вариант</span><span className="hint-touch">Выберите вариант или нажмите микрофон</span></>))}</div></Arrival>:<Arrival key="finish" className="finish-prompt"><div><Check size={19}/><span>Все {stageTotal} этапов пройдены. Посмотрим, что получилось?</span></div><button disabled={busy} className="button primary" onClick={finish}>Посмотреть разбор <ArrowRight size={17}/></button></Arrival>}</AnimatePresence></div>
  </section><aside className="session-sidebar"><TensionMeter value={pressure} previous={previous}/><div className="session-mission"><span className="eyebrow"><Target size={14}/> ВАША ЗАДАЧА</span><p>{scenario.brief}</p></div><div className="session-stage-list">{stages.slice(0,stageTotal).map((label,i)=><div key={label} className={i<=stage?'reached':''}><span>{stage>i?<Check size={13}/>:i+1}</span>{label}</div>)}</div><div className="trust-panel"><div><span>Доверие</span><strong>{liveResult.trust}%</strong></div><div className="mini-track"><motion.i animate={{width:liveResult.trust+'%'}} transition={{duration:.8}}/></div><small>Цель: {threshold(s.config)} баллов и доверие от 40%</small></div><div className="interest-panel"><div><span>Интересы собеседника</span><strong>{known.size}/{interestList.length}</strong></div><ul>{interestList.map(item=><li key={item.id} className={known.has(item.id)?'found':''}>{known.has(item.id)?<Check size={13}/>:<HelpCircle size={13}/>}<span>{known.has(item.id)?item.label:'Скрытый интерес — спросите, что стоит за позицией'}</span></li>)}</ul></div><button className="text-button leave-button" onClick={()=>{stopOpponentVoice();finish()}}>Завершить досрочно <ArrowUpRight size={15}/></button></aside></div>
  <button className="mobile-leave" onClick={()=>{stopOpponentVoice();finish()}}>Завершить и разобрать <ArrowUpRight size={13}/></button>
  <AnimatePresence>{showMission&&<Modal title="Ваша задача" onClose={()=>setShowMission(false)}><span className="eyebrow">ВАША ЗАДАЧА</span><h2>{s.config.topic}</h2><p className="brief-text">{scenario.brief}</p><NegotiationFrame config={s.config}/><TensionMeter value={pressure}/><p className="note">Для успеха: {threshold(s.config)} баллов, доверие не ниже 40% и все {stageTotal} этапов.</p><button className="button primary full" onClick={()=>setShowMission(false)}>Вернуться к разговору <ArrowRight size={17}/></button></Modal>}</AnimatePresence>
 </div>;
}

function Results({session:s,history,sounds,totalXp,onRetry,onClose}:{session:Session;history:Session[];sounds:boolean;totalXp:number;onRetry:()=>void;onClose:()=>void}){
 const [step,setStep]=useState(0);const stageTotal=sessionStageCount(s);const result=outcome(s.config,s.turns,stageTotal);const turn=s.turns[step];const known=discoveredInterests(s.turns);const interestList=interestsFor(s.config);const harvard=harvardAssessment(s.config,s.turns);
 // «Было ➔ Стало»: compared with the attempt this retry started from.
 const previous=s.previousId?history.find(item=>item.id===s.previousId&&item.ended):undefined;const before=previous?outcome(previous.config,previous.turns,sessionStageCount(previous)):null;
 const nowTension=tension(s.config,s.turns);const beforeTension=previous?tension(previous.config,previous.turns):0;const mistakes=(turns:Turn[])=>turns.filter(turn=>turn.trust<0||turn.points<10).length;const [memoMessage,setMemoMessage]=useState('');
 async function copyMemo(){const memo=sessionMemo(s);try{await navigator.clipboard.writeText(memo);setMemoMessage('Памятка скопирована в буфер обмена.')}catch{downloadFile(`arena-memo-${new Date(s.ended??s.started).toISOString().slice(0,10)}.txt`,memo,'text/plain;charset=utf-8');setMemoMessage('Буфер обмена недоступен — памятка скачана файлом.')}}
 useEffect(()=>{playArenaSound(result.won?'success':'navigate',sounds)},[]);
 return <div className="results"><div className="heading compact-heading"><div><span className="eyebrow">РАЗБОР ПЕРЕГОВОРОВ</span><h1>{result.collapsed?'Переговоры сорваны.':result.won?'Общий язык найден.':s.turns.length<stageTotal?'Практика остановлена.':'Каждая попытка делает вас сильнее.'}</h1><p>{result.collapsed?'Напряжённость дошла до предела. Найдём ход, который вернёт стороны к диалогу.':result.won?'Вы приблизили обе стороны к общей цели.':'Разберём решения и найдём более сильный следующий ход.'}</p></div><XpBurst gained={result.score} total={totalXp}/></div><p className="finale-line"><Flag size={14}/><span>{finale(s.config,result,s.turns.length>=stageTotal)}</span></p>{before&&<p className="compare-line"><TrendingUp size={14}/><span><strong>Было ➔ Стало:</strong> {before.score} ➔ {result.score} баллов · доверие {before.trust}% ➔ {result.trust}% · напряжённость {beforeTension}% ➔ {nowTension}% · ошибок {mistakes(previous!.turns)} ➔ {mistakes(s.turns)}</span></p>}<div className="result-metrics"><Metric value={`${result.score}/100`} label="Результат" delta={before?result.score-before.score:undefined}/><Metric value={`${result.trust}%`} label="Доверие" delta={before?result.trust-before.trust:undefined}/><Metric value={`${nowTension}%`} label="Напряжённость" delta={before?nowTension-beforeTension:undefined} lowerIsBetter/><Metric value={formatTime((s.ended||Date.now())-s.started)} label="Время"/></div>
 <section className="review-panel"><div className="review-tabs" aria-label="Этапы разбора">{s.turns.map((_,i)=><button key={i} title={stages[i]} aria-pressed={step===i} className={step===i?'active':''} onClick={()=>setStep(i)}><span>{i+1}</span><span>{stages[i]}</span></button>)}<button aria-pressed={step===-1} aria-label="Оценка по Гарвардскому методу" className={`harvard-tab ${step===-1?'active':''}`} onClick={()=>setStep(-1)}><span><Scale size={11}/></span><span>Гарвард</span></button></div><div className="review-content scroll-region"><AnimatePresence mode="wait"><Arrival key={step}>{step===-1?<div className="interest-review"><div className="review-label"><span>ОЦЕНКА ПО ГАРВАРДСКОМУ МЕТОДУ</span><strong>{harvard.filter(item=>item.status==='yes').length}/{harvard.length}</strong></div><ul className="harvard-list">{harvard.map(item=><li key={item.id} className={`status-${item.status}`}>{item.status==='yes'?<Check size={16}/>:item.status==='partial'?<Minus size={16}/>:<X size={16}/>}<span><strong>{item.label} — {item.status==='yes'?'да':item.status==='partial'?'частично':'нет'}</strong><small>{item.detail}</small></span></li>)}</ul><div className="review-label interests-label"><span>СКРЫТЫЕ ИНТЕРЕСЫ СОБЕСЕДНИКА</span><strong>{known.size}/{interestList.length}</strong></div><p>Интерес — то, что стоит за позицией собеседника. Его раскрывают вопросы и предложения, которые его затрагивают: чем больше интересов раскрыто, тем выше доверие и тем проще найти обмен.</p><ul>{interestList.map(item=><li key={item.id} className={known.has(item.id)?'found':''}>{known.has(item.id)?<Check size={16}/>:<HelpCircle size={16}/>}<span><strong>{item.label}</strong><small>{known.has(item.id)?'Раскрыт в разговоре.':`Не раскрыт. ${item.hint}`}</small></span></li>)}</ul></div>:turn?<><div className="review-label"><span>ВАША РЕПЛИКА <TechniqueBadge choice={turn}/></span><strong>+{turn.points} XP</strong></div><blockquote>«{turn.text}»</blockquote><div className="feedback-box"><Sparkles size={19}/><p>{turn.feedback}</p></div>{turn.points<17?<div className="better"><span>ПОПРОБУЙТЕ ТАК</span><p>{choices(s.config,step)[0].text}</p></div>:<div className="better"><span>СОХРАНИТЕ ЭТОТ ПРИЁМ</span><p>{turn.skill}: попробуйте применить его в другом сценарии или сформулировать своими словами.</p></div>}</>:<div className="empty-state"><Compass size={32}/><h2>Разговор ещё не начался</h2><p>Сделайте первый ход, чтобы получить обратную связь.</p></div>}</Arrival></AnimatePresence></div></section><div className="result-footer"><button className="button secondary" onClick={onClose}><ArrowLeft size={17}/> <span className="short-label" data-short="Назад">К списку</span></button><span role="status" className={memoMessage?'memo-status':''}>{memoMessage||`${s.config.difficulty} · ${s.turns.length}/${stageTotal} этапов`}</span><button className="button secondary memo-button" onClick={()=>void copyMemo()}><Copy size={17}/><span className="short-label" data-short="Памятка">Скопировать памятку по сессии</span></button><button className="button primary" onClick={onRetry}><RotateCcw size={17}/> <span className="short-label" data-short="Ещё раз">Попробовать иначе</span></button></div></div>;
}
function Metric({value,label,delta,lowerIsBetter=false}:{value:string;label:string;delta?:number;lowerIsBetter?:boolean}){const better=delta!==undefined&&(lowerIsBetter?delta<0:delta>0);return <div className="metric"><strong>{value}</strong><span>{label}</span>{delta!==undefined&&delta!==0&&<em className={`metric-delta ${better?'up':'down'}`}>{delta>0?'+':''}{delta} к прошлой попытке</em>}</div>}
function XpBurst({gained,total}:{gained:number;total:number}){
 const [shown,setShown]=useState(0);const rank=rankForXp(total);const progress=rankProgress(total);
 useEffect(()=>{let frame=0;const started=performance.now();const animate=(now:number)=>{const value=Math.min(gained,Math.round(gained*Math.min(1,(now-started)/950)));setShown(value);if(value<gained)frame=requestAnimationFrame(animate)};frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame)},[gained]);
 return <div className="xp-burst" style={{'--rank-tone':rank.tone} as React.CSSProperties}><span className="xp-stars" aria-hidden="true"><Sparkles/><Star/><Sparkles/></span><span className="xp-rank-icon"><RankIcon name={rank.icon} size={24}/></span><span><small>ОПЫТ ЗА ПЕРЕГОВОРЫ</small><strong>+{shown} XP</strong><em>{rank.title}</em></span><div className="xp-track"><i style={{width:`${progress.percent}%`}}/></div></div>;
}
function Progress({history,achievements,total,onSelect,onPractice}:{history:Session[];achievements:Partial<Record<AchievementId,number>>;total:number;onSelect:(s:Session)=>void;onPractice:()=>void}){
 const current=rankIndexForXp(total);
 return <div className="progress-screen"><div className="heading compact-heading"><div><span className="eyebrow">КАЖДАЯ ПОПЫТКА ИМЕЕТ ЗНАЧЕНИЕ</span><h1>Ваш путь переговорщика<span>.</span></h1><p>Вернитесь к разговору или посмотрите, какое звание будет следующим.</p></div></div><div className="result-metrics"><Metric value={String(history.length)} label="Сессий"/><Metric value={String(history.filter(s=>outcome(s.config,s.turns,sessionStageCount(s)).won).length)} label="Договорённостей"/><Metric value={String(total)} label="Очков опыта"/></div><div className="rank-road" aria-label="Звания переговорщика">{ranks.map((rank,index)=><div key={rank.title} className={`rank-card ${index===current?'current':''} ${index<=current?'earned':'locked'}`} style={{'--rank-tone':rank.tone} as React.CSSProperties}><span><RankIcon name={rank.icon} size={20}/></span><div><strong>{rank.title}</strong><small>{rank.minXp} XP</small></div></div>)}</div><div className="history-list scroll-region"><CompetencyMatrix history={history}/><AchievementShowcase unlocked={achievements}/>{history.length?history.map(s=><button className="history-item" key={s.id} onClick={()=>onSelect(s)}><div className="history-icon">{outcome(s.config,s.turns,sessionStageCount(s)).won?<Check size={20}/>:outcome(s.config,s.turns,sessionStageCount(s)).collapsed?<VolumeX size={20}/>:<Flag size={20}/>}</div><div><strong>{s.config.topic}</strong><small>{new Date(s.started).toLocaleDateString('ru-RU')} · {s.config.difficulty} · {s.turns.length}/{sessionStageCount(s)} этапов{s.learner?` · ${s.learner}`:''}</small></div><span>{outcome(s.config,s.turns,sessionStageCount(s)).score}<small>/100</small></span><ArrowUpRight size={19}/></button>):<div className="empty-state"><Compass size={40}/><h2>Первый разговор — начало пути</h2><p>Пройдите сценарий. Здесь появятся результаты и разбор.</p><button className="button primary" onClick={onPractice}>Выбрать разговор <ArrowRight size={17}/></button></div>}</div><p className="storage-note"><ShieldCheck size={14}/> Последние 50 сессий сохраняются в этом браузере.</p></div>;
}

function Constructor({config,onSave,onPreview}:{config:Config;onSave:(c:Config)=>void;onPreview:(c:Config)=>void}){
 const [draft,setDraft]=useState(config);const [saved,setSaved]=useState(false);
 const [toolMessage,setToolMessage]=useState('');const [importOpen,setImportOpen]=useState(false);const [importText,setImportText]=useState('');const [exported,setExported]=useState('');
 function update<K extends keyof Config>(key:K,value:Config[K]){setDraft({...draft,[key]:value});setSaved(false)}
 const valid=draft.topic.trim()&&draft.role.trim()&&draft.goal.trim();
 function applyPreset(preset:ScenarioPreset){setDraft({...preset.config});setSaved(false);setImportOpen(false);setExported('');setToolMessage(`Кейс «${preset.title}» загружен в форму. Сохраните его или сразу протестируйте.`)}
 async function exportScenario(){const json=serializeScenario(draft);setImportOpen(false);try{await navigator.clipboard.writeText(json);setExported('');setToolMessage('JSON сценария скопирован. Коллега вставит его через «Импорт сценария».')}catch{setExported(json);setToolMessage('Браузер не дал доступ к буферу обмена — скопируйте JSON из поля ниже.')}}
 function importScenario(){try{const next=parseScenario(importText);setDraft(next);setSaved(false);setImportOpen(false);setImportText('');setToolMessage(`Сценарий «${next.topic}» импортирован. Проверьте поля и сохраните.`)}catch(error){setToolMessage(error instanceof Error?error.message:'Не удалось импортировать сценарий.')}}
 return <div className="constructor"><div className="heading compact-heading"><div><span className="eyebrow">КОНТУР АДМИНИСТРАТОРА · КОНСТРУКТОР КОНТЕКСТА</span><h1>Администратор / Конструктор<span>.</span></h1><p>Задайте условия разговора или возьмите готовый кейс — каждая настройка меняет сценарий.</p></div></div><form className="constructor-form" onSubmit={e=>{e.preventDefault();if(valid){onSave(draft);setSaved(true)}}}><div className="form-body scroll-region">
 <section className="case-library" aria-label="Библиотека готовых кейсов"><div className="case-library-head"><h2><Library size={17}/> Библиотека готовых кейсов</h2><span>Один клик заполняет тему, роль, цель, сложность и тон</span></div><div className="case-grid">{SCENARIO_PRESETS.map(preset=>{const active=sameScenario(draft,preset.config);return <button type="button" key={preset.id} aria-pressed={active} className={`case-card ${active?'active':''}`} onClick={()=>applyPreset(preset)}><strong>{preset.title}</strong><small>{preset.description}</small><span>{preset.config.tone} тон · {preset.config.difficulty}</span></button>})}</div></section>
 <div className="form-grid"><label>Сфера<CustomSelect ariaLabel="Сфера переговоров" value={draft.domain} options={domainOptions} onChange={domain=>{setDraft({...defaults[domain],difficulty:draft.difficulty,tone:draft.tone});setSaved(false)}}/></label><label>Тема переговоров<input required maxLength={100} value={draft.topic} onChange={e=>update('topic',e.target.value)}/></label><label>Сложность<CustomSelect ariaLabel="Сложность" value={draft.difficulty} options={difficultyOptions} onChange={value=>update('difficulty',value)}/></label><label>Тон собеседника<CustomSelect ariaLabel="Тон собеседника" value={draft.tone} options={toneOptions} onChange={value=>update('tone',value)}/></label><label>Роль собеседника<input required maxLength={80} value={draft.role} onChange={e=>update('role',e.target.value)}/></label><label>Его цель<input required maxLength={180} value={draft.goal} onChange={e=>update('goal',e.target.value)}/></label></div><div className="context-preview"><div><span className="eyebrow">АТМОСФЕРА НА СТАРТЕ</span><TensionMeter value={tension(draft,[])} compact/></div><p>Тон и сложность задают начальное напряжение. Сфера выбирает сюжет, цель и тон меняют ответы. Тема и роль уточняют контекст.</p></div>
 <section className="scenario-tools" aria-label="Обмен сценариями"><div><h2>Обмен сценариями</h2><p>Методист экспортирует настроенный кейс в JSON и делится им, коллега импортирует его в один шаг.</p></div><div className="scenario-actions"><button type="button" className="button secondary" disabled={!valid} onClick={()=>void exportScenario()}><Copy size={16}/> Экспорт сценария</button><button type="button" className="button secondary" aria-expanded={importOpen} onClick={()=>{setImportOpen(!importOpen);setExported('')}}><ClipboardPaste size={16}/> Импорт сценария</button></div>
 {importOpen&&<div className="scenario-import"><textarea aria-label="JSON сценария для импорта" value={importText} onChange={e=>setImportText(e.target.value)} placeholder='{"format": "arena-scenario", "version": 1, "config": {…}}' rows={5} spellCheck={false}/><div className="scenario-actions"><button type="button" className="button primary" disabled={!importText.trim()} onClick={importScenario}>Применить</button><button type="button" className="text-button" onClick={()=>{setImportOpen(false);setImportText('')}}>Отмена</button></div></div>}
 {exported&&<textarea className="scenario-export" aria-label="JSON сценария для копирования" readOnly value={exported} rows={6} onFocus={e=>e.currentTarget.select()}/>}
 {toolMessage&&<p className="inline-message" role="status">{toolMessage}</p>}</section>
 <p className="note">{usesStory(draft)?`Тема совпадает с сюжетом «${scenarioFor(draft).label}»: используются авторские реплики с ветвлением.`:'Своя тема: брифинг, первая реплика, варианты и ответы собеседника строятся из шаблонов с вашей темой, ролью и целью.'} Тон меняет первую фразу и манеру ответов, сложность — порог успеха и цену ошибок. Тема, роль и цель передаются и локальной нейросети.</p></div><div className="form-footer"><button className="button secondary" disabled={!valid} type="submit"><Check size={16}/>{saved?'Сохранено':'Сохранить'}</button><span role="status">{saved?'Контекст готов к практике':''}</span><button className="button primary" disabled={!valid} type="button" onClick={()=>onPreview(draft)}>Протестировать <Play size={15}/></button></div></form></div>;
}

function Settings({quiet,dark,sounds,voice,timer,onTimer,history,learner,teacherName,onLearner,onTeacher,onOpenTeacher,onQuiet,onDark,onSounds,onVoice,onWelcome}:{quiet:boolean;dark:boolean;sounds:boolean;voice:boolean;timer:boolean;onTimer:()=>void;history:Session[];learner:LearnerProfile;teacherName:string;onLearner:(profile:LearnerProfile)=>void;onTeacher:(name:string)=>void;onOpenTeacher:()=>void;onQuiet:()=>void;onDark:()=>void;onSounds:()=>void;onVoice:()=>void;onWelcome:()=>void}){
 const [learnerDraft,setLearnerDraft]=useState(learner);const [profileMessage,setProfileMessage]=useState('');
 const [accountExists,setAccountExists]=useState(()=>hasTeacherAccount());const [teacherForm,setTeacherForm]=useState({name:'',pin:''});const [teacherMessage,setTeacherMessage]=useState('');
 function storeLearner(){const profile=saveLearner(learnerDraft);onLearner(profile);setLearnerDraft(profile);setProfileMessage('Профиль сохранён. Новые сессии будут подписаны этим именем.')}
 async function copyStudentReport(){const report=reportFromHistory(learner,history);const code=encodeReport(report);try{await navigator.clipboard.writeText(code);setProfileMessage(`Код отчёта скопирован: ${report.sessions.length} сессий.`)}catch{setProfileMessage(`Код отчёта: ${code}`)}}
 async function submitTeacher(){setTeacherMessage('');try{const name=accountExists?await loginTeacher(teacherForm.pin):await createTeacherAccount(teacherForm.name,teacherForm.pin);setAccountExists(true);onTeacher(name);setTeacherForm(value=>({...value,pin:''}));setTeacherMessage(`Выполнен вход: ${name}.`)}catch(error){setTeacherMessage(error instanceof Error?error.message:'Не удалось войти.')}}
 function exitTeacher(){logoutTeacher();onTeacher('');setTeacherMessage('Вы вышли из кабинета преподавателя.')}
 return <div className="settings-screen"><div className="heading compact-heading"><div><span className="eyebrow">ВАШ КОМФОРТ — ВАШИ ПРАВИЛА</span><h1>Настройки арены<span>.</span></h1><p>Настройте внешний вид, движение и голос под свой ритм практики.</p></div></div><div className="settings-body scroll-region">
  <LocalAiCard/>
  <div className="settings-grid">
   <section className="setting-card"><span className="setting-icon">{dark?<Moon size={23}/>:<Sun size={23}/>}</span><div><h2>Тёмная тема</h2><p>Снижает яркость интерфейса и сохраняет контраст показателей.</p></div><button role="switch" aria-label="Тёмная тема" aria-checked={dark} onClick={onDark} className={`toggle ${dark?'on':''}`}><span/></button></section>
   <section className="setting-card"><span className="setting-icon"><Activity size={23}/></span><div><h2>Спокойный режим</h2><p>Убирает движение фона и пульсацию. Показатели остаются видимыми.</p></div><button role="switch" aria-label="Спокойный режим" aria-checked={quiet} onClick={onQuiet} className={`toggle ${quiet?'on':''}`}><span/></button></section>
   <section className="setting-card"><span className="setting-icon"><Clock3 size={23}/></span><div><h2>Таймер под давлением</h2><p>Когда напряжённость достигает 70%, собеседник ждёт ответ ограниченное время: 45, 35 или 25 секунд в зависимости от сложности.</p></div><button role="switch" aria-label="Таймер под давлением" aria-checked={timer} onClick={onTimer} className={`toggle ${timer?'on':''}`}><span/></button></section>
   <section className="setting-card media-card"><span className="setting-icon">{sounds||voice?<Volume2 size={23}/>:<VolumeX size={23}/>}</span><div><h2>Озвучка</h2><p>Отдельно включайте звуковые эффекты и автоматическое чтение реплик соперника. Автоозвучка по умолчанию выключена.</p><div className="media-switches"><button role="switch" aria-label="Звуковые эффекты" aria-checked={sounds} onClick={onSounds} className={sounds?'active':''}>{sounds?<Volume2 size={16}/>:<VolumeX size={16}/>} Эффекты и тиканье <span>{sounds?'вкл.':'выкл.'}</span></button><button role="switch" aria-label="Озвучка" aria-checked={voice} onClick={onVoice} className={voice?'active':''}>{voice?<AudioLines size={16}/>:<VolumeX size={16}/>} Озвучка <span>{voice?'вкл.':'выкл.'}</span></button></div></div></section>
   <section className="setting-card"><span className="setting-icon"><Compass size={23}/></span><div><h2>Легенда и знакомство</h2><p>История арены и короткая экскурсия по навигации, репликам и показателям.</p></div><button className="button secondary" onClick={onWelcome}>Посмотреть <ArrowUpRight size={17}/></button></section>
   <section className="setting-card learner-card"><span className="setting-icon"><UserRound size={23}/></span><div><h2>Профиль ученика</h2><p>Имя подписывает новые результаты. Код класса помогает преподавателю объединять отчёты.</p><ProfileRadar history={history}/><div className="inline-fields"><label>Имя<input value={learnerDraft.name} maxLength={60} onChange={event=>setLearnerDraft({...learnerDraft,name:event.target.value})}/></label><label>Код класса<input value={learnerDraft.classCode} maxLength={24} onChange={event=>setLearnerDraft({...learnerDraft,classCode:event.target.value})}/></label></div><div className="profile-actions"><button className="button secondary" onClick={storeLearner}>Сохранить</button><button className="button secondary" disabled={!history.length} onClick={()=>void copyStudentReport()}><Copy size={16}/> Код отчёта</button></div>{profileMessage&&<p className="inline-message" role="status">{profileMessage}</p>}</div></section>
   <section className="setting-card teacher-login-card"><span className="setting-icon"><GraduationCap size={23}/></span><div><div className="api-title"><h2>Аккаунт преподавателя</h2><span className={`status-tag ${teacherName?'connected':''}`}>{teacherName?'Выполнен вход':accountExists?'Есть на устройстве':'Не создан'}</span></div><p>Преподаватель импортирует коды учеников и видит сводку результатов. PIN и отчёты хранятся только на этом устройстве.</p>{teacherName?<div className="profile-actions"><button className="button primary" onClick={onOpenTeacher}>Открыть кабинет <ArrowRight size={16}/></button><button className="text-button" onClick={exitTeacher}>Выйти</button></div>:<div className="teacher-login-form">{!accountExists&&<label>Имя преподавателя<input value={teacherForm.name} maxLength={60} onChange={event=>setTeacherForm({...teacherForm,name:event.target.value})} placeholder="Анна Сергеевна"/></label>}<label>PIN<input type="password" inputMode="numeric" value={teacherForm.pin} maxLength={24} onChange={event=>setTeacherForm({...teacherForm,pin:event.target.value})} placeholder="Минимум 4 символа"/></label><button className="button primary" disabled={teacherForm.pin.length<4||(!accountExists&&teacherForm.name.trim().length<2)} onClick={()=>void submitTeacher()}>{accountExists?'Войти':'Создать аккаунт'} <ArrowRight size={16}/></button></div>}{teacherMessage&&<p className="inline-message" role="status">{teacherMessage}</p>}</div></section>
  </div>
  <div className="settings-footnote"><ShieldCheck size={16}/><p>Прогресс и настройки хранятся в этом браузере. Микрофон включается только после нажатия; Chrome может отправлять аудио своему онлайн-сервису распознавания. Локальная нейросеть работает на вашем устройстве: реплики никуда не отправляются, ключи не нужны.</p></div>
 </div></div>;
}

function TeacherDashboard({teacherName,learner,history}:{teacherName:string;learner:LearnerProfile;history:Session[]}){
 const [reports,setReports]=useState<StudentReport[]>(()=>loadReports());const [code,setCode]=useState('');const [message,setMessage]=useState('');
 const local:StudentReport={...reportFromHistory(learner,history),id:'local'};
 const students=[local,...reports.filter(report=>report.learner!==local.learner||report.classCode!==local.classCode)];
 const sessions=students.flatMap(report=>report.sessions);const analytics=groupAnalytics(students);const average=sessions.length?Math.round(sessions.reduce((sum,item)=>sum+item.score,0)/sessions.length):0;
 const [csvMessage,setCsvMessage]=useState('');
 function exportCsv(){downloadFile(`arena-group-${new Date().toISOString().slice(0,10)}.csv`,groupCsv(students),'text/csv;charset=utf-8');setCsvMessage(`Выгружено учеников: ${students.length}.`)}
 function addReport(){try{const report=decodeReport(code);setReports(importReport(report));setCode('');setMessage(`Импортирован отчёт: ${report.learner}, ${report.sessions.length} сессий.`)}catch(error){setMessage(error instanceof Error?error.message:'Не удалось импортировать отчёт.')}}
 return <div className="teacher-dashboard"><div className="heading compact-heading"><div><span className="eyebrow">КАБИНЕТ ПРЕПОДАВАТЕЛЯ</span><h1>Результаты группы<span>.</span></h1><p>{teacherName}, здесь собраны локальные и импортированные отчёты учеников.</p></div><div className="teacher-heading-actions"><button className="button secondary" onClick={exportCsv}><Download size={16}/><span className="short-label" data-short="CSV">Экспорт группы в CSV</span></button>{csvMessage&&<small role="status">{csvMessage}</small>}</div></div><div className="result-metrics"><Metric value={String(students.length)} label="Учеников"/><Metric value={String(sessions.length)} label="Сессий"/><Metric value={`${average}/100`} label="Средний результат"/><Metric value={String(sessions.filter(item=>item.won).length)} label="Договорённостей"/></div><section className="group-analytics" aria-label="Аналитика группы для HR"><div className="analytics-tile"><small>Самый проблемный этап</small><strong>{analytics.weakestStage?analytics.weakestStage.label:'нет данных'}</strong><span>{analytics.weakestStage?`в среднем ${analytics.weakestStage.percent}% от максимума баллов`:'появится после новых отчётов'}</span></div><div className="analytics-tile"><small>Срывы под давлением</small><strong>{analytics.collapseRate===null?'—':`${analytics.collapseRate}%`}</strong><span>сессий закончились при 100% напряжённости</span></div><div className="analytics-tile"><small>Западающая компетенция</small><strong>{analytics.weakestCompetency?.label??'нет данных'}</strong><span>{analytics.weakestCompetency?`в среднем ${analytics.weakestCompetency.value}% по группе`:'появится после новых отчётов'}</span></div></section><section className="teacher-import"><div><h2>Добавить отчёт ученика</h2><p>Попросите ученика скопировать код в разделе «Профиль ученика».</p></div><div className="teacher-import-row"><input aria-label="Код отчёта ученика" value={code} onChange={event=>setCode(event.target.value)} placeholder="Вставьте код отчёта…"/><button className="button primary" disabled={code.trim().length<20} onClick={addReport}>Импортировать</button></div>{message&&<p role="status">{message}</p>}</section><div className="student-roster scroll-region">{students.map(report=>{const xp=report.sessions.reduce((sum,item)=>sum+item.score,0);const rank=rankForXp(xp);const avg=report.sessions.length?Math.round(xp/report.sessions.length):0;return <article className="student-card" key={`${report.learner}-${report.classCode}`}><div className="student-summary"><span className="student-rank" style={{'--rank-tone':rank.tone} as React.CSSProperties}><RankIcon name={rank.icon} size={22}/></span><div><small>{report.classCode}</small><h2>{report.learner}</h2><p>{rank.title} · {xp} XP</p></div><div className="student-numbers"><strong>{avg}</strong><small>средний балл</small></div></div><div className="student-sessions">{report.sessions.length?report.sessions.slice(0,4).map(item=><div key={item.id}><span className={item.won?'won':item.tension>=100?'collapsed':''}>{item.won?<Check size={14}/>:item.tension>=100?<VolumeX size={14}/>:<Flag size={14}/>}</span><strong>{item.topic}</strong><small>{item.score}/100 · напряжённость {item.tension}% · {new Date(item.ended).toLocaleDateString('ru-RU')}</small></div>):<p>У ученика пока нет завершённых сессий.</p>}</div></article>})}</div><p className="storage-note"><ShieldCheck size={14}/> Демонстрационный кабинет работает локально. Для автоматической синхронизации между устройствами потребуется серверная база данных.</p></div>;
}

function NegotiationFrame({config}:{config:Config}){
 const frame=scenarioFor(config).frame;
 return <section className="negotiation-frame" aria-label="Переговорная рамка"><span className="eyebrow">ПЕРЕГОВОРНАЯ РАМКА</span><dl><div><dt><Target size={14}/> Ваша цель</dt><dd>{frame.goal}</dd></div><div><dt><Compass size={14}/> Ваша BATNA</dt><dd>{frame.batna}<small>Наилучшая альтернатива соглашению: если предложение хуже неё, лучше не соглашаться.</small></dd></div><div><dt><Scale size={14}/> Зона возможных договорённостей (ZOPA)</dt><dd>{frame.zopa}</dd></div></dl></section>;
}
function LocalAiStatusLabel(){
 const {status,enabled,progress}=useLocalAi();
 const active=enabled&&status==='ready';const loading=enabled&&status==='loading';
 return <span className={`ai-status ${active?'on':loading?'loading':'off'}`} title={active?'Реплики собеседника формирует нейросеть на вашем устройстве':'Реплики собеседника берутся из сценарного движка'}><span className="ai-status-dot"/>{active?'Локальный AI (WebGPU) активен':loading?`Локальный AI: загрузка ${progress}%`:`Сценарный режим (${status==='unsupported'?'WebGPU недоступен':'нейросеть выключена'})`}</span>;
}
function LocalAiCard(){
 const {status,enabled,cached,progress,stage,gpu,error,model,tier}=useLocalAi();const option=LOCAL_MODEL_OPTIONS[tier];
 const unsupported=status==='unsupported';const loadingModel=status==='loading';
 const tag=unsupported?'WebGPU недоступен':status==='ready'?(enabled?'Активна':'Загружена, выключена'):loadingModel?`Загрузка ${progress}%`:status==='error'?'Ошибка':status==='checking'?'Проверка…':cached?'В кэше браузера':'Не загружена';
 return <section className="setting-card local-ai-card"><span className="setting-icon"><Cpu size={23}/></span><div><div className="api-title"><h2>On-Device нейросеть · WebLLM</h2><span className={`status-tag ${status==='ready'&&enabled?'connected':status==='error'?'error':''}`}>{tag}</span></div>
  <p>Собеседник отвечает с помощью языковой модели Qwen2.5-Instruct, которая работает прямо в браузере через WebGPU: без серверов, API-ключей и оплаты. Веса скачиваются один раз и хранятся в кэше браузера, дальше модель запускается без сети. Очки, доверие и напряжённость по-прежнему считает прозрачный сценарный движок.</p>
  <div className="local-ai-facts"><span className={unsupported?'bad':'good'}>{unsupported?<X size={14}/>:<Check size={14}/>} WebGPU: {unsupported?'не поддерживается этим браузером — работает сценарный режим':status==='checking'?'проверка…':`поддерживается${gpu?` · ${gpu}`:''}`}</span><span><Cpu size={14}/> Модель: {model}</span></div>
  {!unsupported&&<><div className="model-tiers" role="radiogroup" aria-label="Модель">{(Object.keys(LOCAL_MODEL_OPTIONS) as LocalModelTier[]).map(key=><button key={key} type="button" role="radio" aria-checked={tier===key} disabled={loadingModel} className={tier===key?'active':''} onClick={()=>void setLocalModelTier(key)}><strong>{LOCAL_MODEL_OPTIONS[key].label}</strong><small>{LOCAL_MODEL_OPTIONS[key].size}{key==='quality'?' · грамотнее по-русски':' · для слабых устройств'}</small></button>)}</div><div className="local-ai-controls"><button role="switch" aria-label="Использовать локальную нейросеть" aria-checked={enabled} onClick={()=>setLocalAiEnabled(!enabled)} className={`toggle ${enabled?'on':''}`}><span/></button><span>Использовать локальную нейросеть в переговорах</span></div>
  {loadingModel&&<div className="local-ai-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div><i style={{width:`${progress}%`}}/></div><small>{stage||'Инициализация…'}</small></div>}
  <div className="api-actions"><button type="button" className="button primary" disabled={loadingModel||status==='ready'||status==='checking'} onClick={()=>void loadLocalModel()}><Download size={16}/> {status==='ready'?'Модель загружена':cached?'Запустить модель из кэша':`Загрузить модель (${option.size})`}</button>{(cached||status==='ready')&&<button type="button" className="text-button" disabled={loadingModel} onClick={()=>void removeLocalModel()}><Trash2 size={15}/> Удалить из кэша</button>}</div>
  {status==='error'&&<p className="api-message error" role="status">Модель не запустилась: {error}. Арена продолжает работать в сценарном режиме.</p>}</>}
  <p className="api-warning"><ShieldCheck size={15}/> Первая загрузка требует интернета (веса с Hugging Face) и 1–2 ГБ видеопамяти. Если WebGPU недоступен или модель ответила бессвязно, арена мгновенно подставляет сценарную реплику.</p></div></section>;
}
function TechniqueBadge({choice}:{choice:Pick<Choice,'skill'|'intent'|'technique'>}){
 const technique=techniqueFor(choice);if(!technique)return null;
 return <span className={`technique-badge ${technique.kind}`}>{technique.label}</span>;
}
const RADAR_SHORT:Record<string,string>={empathy:'Эмпатия',spin:'SPIN',package:'Пакет',stress:'Стресс',closing:'Фиксация'};
/** Pure SVG radar chart of the five competencies (0–100%). */
function RadarChart({items,size=220,compact=false}:{items:Competency[];size?:number;compact?:boolean}){
 const center=size/2;const radius=size/2-(compact?8:40);const count=items.length;
 const point=(index:number,r:number)=>{const angle=-Math.PI/2+index*2*Math.PI/count;return [center+Math.cos(angle)*r,center+Math.sin(angle)*r] as const};
 const polygon=(scale:(index:number)=>number)=>items.map((_,index)=>point(index,radius*scale(index)).map(value=>value.toFixed(1)).join(',')).join(' ');
 return <svg className={`radar-chart ${compact?'compact':''}`} viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`Профиль компетенций: ${items.map(item=>`${item.label} — ${item.value===null?'нет данных':`${item.value}%`}`).join('; ')}`}>
  {[.25,.5,.75,1].map(level=><polygon key={level} className="radar-ring" points={polygon(()=>level)}/>)}
  {items.map((_,index)=>{const [x,y]=point(index,radius);return <line key={index} className="radar-axis" x1={center} y1={center} x2={x} y2={y}/>})}
  <polygon className="radar-shape" points={polygon(index=>(items[index].value??0)/100)}/>
  {items.map((item,index)=>{const [x,y]=point(index,radius*((item.value??0)/100));return <circle key={item.id} className="radar-dot" cx={x} cy={y} r={compact?2:3}/>})}
  {!compact&&items.map((item,index)=>{const [x,y]=point(index,radius+16);return <text key={item.id} className="radar-label" x={x} y={y} textAnchor={Math.abs(x-center)<4?'middle':x>center?'start':'end'} dominantBaseline="middle">{RADAR_SHORT[item.id]??item.label}</text>})}
 </svg>;
}
function ProfileRadar({history}:{history:Session[]}){
 const profile=competencyProfile(history);if(!profile.sessions)return null;
 const known=profile.items.filter(item=>item.value!==null).sort((a,b)=>(b.value??0)-(a.value??0));
 return <div className="profile-radar"><RadarChart items={profile.items} size={96} compact/><p><strong>Сильная сторона:</strong> {known[0]?.label}<br/><strong>Зона роста:</strong> {known[known.length-1]?.label}</p></div>;
}
const ACHIEVEMENT_ICONS:Record<AchievementId,typeof Trophy>={'harvard-diplomat':Trophy,'steel-nerves':Anchor,'pressure-decision':Timer,'win-win':Handshake,'live-voice':Mic,'de-escalation':RefreshCw};
function AchievementShowcase({unlocked}:{unlocked:Partial<Record<AchievementId,number>>}){
 const count=ACHIEVEMENTS.filter(item=>unlocked[item.id]).length;
 return <section className="achievement-card" aria-label="Витрина наград"><div className="competency-head"><h2>Витрина наград</h2><span>{count} из {ACHIEVEMENTS.length}</span></div><div className="achievement-grid">{ACHIEVEMENTS.map(item=>{const Icon=ACHIEVEMENT_ICONS[item.id];const at=unlocked[item.id];return <div key={item.id} className={`achievement ${at?'earned':'locked'}`}><span><Icon size={18}/></span><div><strong>{item.title}</strong><small>{at?`Получено ${new Date(at).toLocaleDateString('ru-RU')}`:item.description}</small></div></div>})}</div></section>;
}
function AchievementToast({ids,onClose}:{ids:AchievementId[];onClose:()=>void}){
 useEffect(()=>{if(!ids.length)return;const hide=setTimeout(onClose,7000);return()=>clearTimeout(hide)},[ids,onClose]);
 const list=ACHIEVEMENTS.filter(item=>ids.includes(item.id));
 return <AnimatePresence>{list.length>0&&<motion.div key="achievement-toast" className="achievement-toast" role="status" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}><span className="achievement-toast-icon"><Trophy size={20}/></span><div><small>{list.length>1?'Новые достижения':'Новое достижение'}</small>{list.map(item=><strong key={item.id}>{item.title}</strong>)}</div><button className="icon-button" aria-label="Закрыть уведомление" onClick={onClose}><X size={16}/></button></motion.div>}</AnimatePresence>;
}
function CompetencyMatrix({history}:{history:Session[]}){
 const profile=competencyProfile(history);const n=profile.sessions;
 return <section className="competency-card" aria-label="Матрица компетенций переговорщика"><div className="competency-head"><h2>Матрица компетенций</h2><span>{n?`по ${n} ${n%10===1&&n%100!==11?'сессии':'сессиям'}`:'стартовые ориентиры'}</span></div>{!n&&<p className="competency-empty">Пройдите 1–2 переговоров для расчёта вашего профиля. Отметка на шкале — ориентир уверенного уровня (80%).</p>}<div className="competency-body"><RadarChart items={profile.items}/><div className="competency-list">{profile.items.map(item=><div key={item.id} className={`competency ${item.value===null?'empty':''}`}><div className="competency-title"><strong>{item.label}</strong><span>{item.value===null?'ориентир 80%':`${item.value}% · ${item.level}`}</span></div><div className="competency-track" role="meter" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.value??0}><i style={{width:`${item.value??0}%`}}/><b aria-hidden="true"/></div><small>{item.hint}</small></div>)}</div></div></section>;
}
function downloadFile(name:string,content:string,type:string){
 const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function RankIcon({name,size=20}:{name:RankIconName;size?:number}){
 const icons={sprout:Sprout,user:UserRound,badge:BadgeCheck,medal:Medal,star:Star,crown:Crown,landmark:Landmark,building:Building2};const Icon=icons[name];return <Icon size={size}/>;
}
function formatTime(ms:number){const seconds=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
