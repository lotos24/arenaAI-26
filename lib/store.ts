'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Config, defaults, Turn, Choice, respond, outcome, SESSION_STAGE_COUNT, sessionStageCount } from './engine';
import { AchievementId, newAchievements } from './achievements';
export { sessionStageCount };
export type PendingTurn = {choice:Choice;started:number};
export type Session = {id:string; config:Config; turns:Turn[]; started:number; ended?:number; draft?:string; pending?:PendingTurn; stageCount?:number;learner?:string;classCode?:string;previousId?:string};
type Store = {config:Config; session:Session|null; history:Session[]; setConfig:(c:Config)=>void; setReplyDraft:(text:string)=>void; start:(c:Config,learner?:{name:string;classCode:string},previousId?:string)=>void; beginAnswer:(c:Choice)=>void; resolveAnswer:(reply?:string)=>void; answer:(c:Choice,reply?:string)=>void; finish:()=>void; clearSession:()=>void; achievements:Partial<Record<AchievementId,number>>; recentAchievements:AchievementId[]; dismissAchievements:()=>void};
export const useArena = create<Store>()(persist((set,get)=>({
 config:defaults.supplier,session:null,history:[],achievements:{},recentAchievements:[],setConfig:config=>set({config}),
 dismissAchievements:()=>set({recentAchievements:[]}),
 setReplyDraft:text=>{const s=get().session;if(s&&!s.ended)set({session:{...s,draft:text.slice(0,800)}});},
 start:(config,learner,previousId)=>set({session:{id:crypto.randomUUID(),config:{...config},turns:[],started:Date.now(),stageCount:SESSION_STAGE_COUNT,learner:learner?.name,classCode:learner?.classCode,previousId}}),
 beginAnswer:c=>{const s=get().session;if(!s||s.ended||s.pending||s.turns.length>=sessionStageCount(s))return;// The move remembers when it was made, so the review can quote it as «02:17 — …».
 set({session:{...s,draft:'',pending:{choice:{...c,at:c.at??Math.max(0,Date.now()-s.started)},started:Date.now()}}});},
 resolveAnswer:reply=>{const s=get().session;if(!s||s.ended||!s.pending)return;const c=s.pending.choice;const stageCount=sessionStageCount(s);const trust=outcome(s.config,[...s.turns,{...c,reply:''}],stageCount).trust;const finalReply=reply?.trim().slice(0,1000)||respond(s.config,s.turns.length,c,trust);const {pending:_,...rest}=s;set({session:{...rest,draft:'',stageCount,turns:[...s.turns,{...c,reply:finalReply}]}});},
 answer:(c,reply)=>{get().beginAnswer(c);get().resolveAnswer(reply);},
 finish:()=>{let s=get().session;if(!s||s.ended)return;if(s.pending){const c=s.pending.choice;const trust=outcome(s.config,[...s.turns,{...c,reply:''}],sessionStageCount(s)).trust;const {pending:_,...rest}=s;s={...rest,turns:[...s.turns,{...c,reply:respond(s.config,s.turns.length,c,trust)}]};}const completed={...s,stageCount:sessionStageCount(s),ended:Date.now()};
 // Achievements are checked once, when the session ends; new ones feed the toast.
 const earned=newAchievements(completed,get().achievements);const now=Date.now();
 set({session:completed,history:[completed,...get().history].slice(0,50),...(earned.length?{achievements:{...get().achievements,...Object.fromEntries(earned.map(id=>[id,now]))},recentAchievements:earned}:{})});},clearSession:()=>set({session:null})
}),{name:'arena-v1',version:1}));
