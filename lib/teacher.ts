import type { Session } from './store';
import { outcome, sessionStageCount, tension } from './engine';
import { rankForXp } from './progression';

const LEARNER_KEY='arena-learner-v1';
const ACCOUNT_KEY='arena-teacher-account-v1';
const SESSION_KEY='arena-teacher-session-v1';
const REPORTS_KEY='arena-teacher-reports-v1';

export type LearnerProfile={name:string;classCode:string};
type TeacherAccount={name:string;salt:string;hash:string};
export type StudentResult={id:string;topic:string;difficulty:string;score:number;trust:number;tension:number;won:boolean;ended:number};
export type StudentReport={version:1;id:string;learner:string;classCode:string;generatedAt:number;sessions:StudentResult[]};

const fallbackLearner: LearnerProfile={name:'Ученик',classCode:'ARENA-01'};

function read<T>(key:string,fallback:T):T {
  try { const value=localStorage.getItem(key);return value?JSON.parse(value) as T:fallback; } catch { return fallback; }
}
function write(key:string,value:unknown){localStorage.setItem(key,JSON.stringify(value));}

export function loadLearner(){return read<LearnerProfile>(LEARNER_KEY,fallbackLearner);}
export function saveLearner(profile:LearnerProfile){const clean={name:profile.name.trim().slice(0,60)||'Ученик',classCode:profile.classCode.trim().toUpperCase().slice(0,24)||'ARENA-01'};write(LEARNER_KEY,clean);return clean;}
export function hasTeacherAccount(){return Boolean(read<TeacherAccount|null>(ACCOUNT_KEY,null));}
export function teacherSession(){return sessionStorage.getItem(SESSION_KEY)||'';}

async function digest(value:string){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export async function createTeacherAccount(name:string,pin:string){
  const cleanName=name.trim().slice(0,60);if(cleanName.length<2||pin.length<4)throw new Error('Укажите имя и PIN не короче 4 символов.');
  const salt=crypto.randomUUID();const hash=await digest(`${salt}:${pin}`);write(ACCOUNT_KEY,{name:cleanName,salt,hash});sessionStorage.setItem(SESSION_KEY,cleanName);return cleanName;
}
export async function loginTeacher(pin:string){
  const account=read<TeacherAccount|null>(ACCOUNT_KEY,null);if(!account)return '';
  if(await digest(`${account.salt}:${pin}`)!==account.hash)throw new Error('Неверный PIN преподавателя.');
  sessionStorage.setItem(SESSION_KEY,account.name);return account.name;
}
export function logoutTeacher(){sessionStorage.removeItem(SESSION_KEY);}

export function reportFromHistory(profile:LearnerProfile,history:Session[]):StudentReport {
  return {version:1,id:crypto.randomUUID(),learner:profile.name,classCode:profile.classCode,generatedAt:Date.now(),sessions:history.filter(item=>item.ended).map(item=>{
    const result=outcome(item.config,item.turns,sessionStageCount(item));
    return {id:item.id,topic:item.config.topic,difficulty:item.config.difficulty,score:result.score,trust:result.trust,tension:tension(item.config,item.turns),won:result.won,ended:item.ended||item.started};
  })};
}
export function encodeReport(report:StudentReport){
  const bytes=new TextEncoder().encode(JSON.stringify(report));let binary='';bytes.forEach(byte=>binary+=String.fromCharCode(byte));return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
export function decodeReport(code:string):StudentReport {
  try {
    const normalized=code.trim().replaceAll('-','+').replaceAll('_','/');const binary=atob(normalized);const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));const parsed=JSON.parse(new TextDecoder().decode(bytes)) as StudentReport;
    if(parsed.version!==1||typeof parsed.learner!=='string'||typeof parsed.classCode!=='string'||!Array.isArray(parsed.sessions)||parsed.sessions.some(item=>!item||typeof item.id!=='string'||typeof item.topic!=='string'||typeof item.score!=='number'||typeof item.trust!=='number'||typeof item.tension!=='number'||typeof item.won!=='boolean'||typeof item.ended!=='number'))throw new Error();
    return {...parsed,learner:parsed.learner.slice(0,60),classCode:parsed.classCode.slice(0,24),sessions:parsed.sessions.slice(0,50)};
  } catch { throw new Error('Код отчёта не распознан. Скопируйте его у ученика целиком.'); }
}
export function loadReports(){return read<StudentReport[]>(REPORTS_KEY,[]);}
export function importReport(report:StudentReport){
  const reports=loadReports().filter(item=>!(item.learner===report.learner&&item.classCode===report.classCode));const next=[report,...reports].slice(0,100);write(REPORTS_KEY,next);return next;
}

/** Group summary for spreadsheets: «;» separator and a BOM so Excel opens Cyrillic correctly. */
export function groupCsv(reports:StudentReport[]){
  const cell=(value:string|number)=>{const text=String(value);return /[;"\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text;};
  const rows=reports.map(report=>{
    const xp=report.sessions.reduce((sum,item)=>sum+item.score,0);const count=report.sessions.length;
    const last=count?Math.max(...report.sessions.map(item=>item.ended)):0;
    return [report.learner,report.classCode,count,count?Math.round(xp/count):0,xp,rankForXp(xp).title,count?Math.round(report.sessions.filter(item=>item.won).length/count*100):0,last?new Date(last).toLocaleDateString('ru-RU'):''];
  });
  return '﻿'+[['Ученик','Класс','Сессий','Средний балл','XP','Звание','Договорённостей, %','Последняя сессия'],...rows].map(row=>row.map(cell).join(';')).join('\r\n');
}

