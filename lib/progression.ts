import { Config, defaults } from './engine';

export type RankIcon = 'sprout' | 'user' | 'badge' | 'medal' | 'star' | 'crown' | 'landmark' | 'building';

export const ranks = [
  {title:'Стажёр переговорщик',minXp:0,icon:'sprout' as RankIcon,tone:'#77a66e'},
  {title:'Младший переговорщик',minXp:100,icon:'user' as RankIcon,tone:'#6fa7a0'},
  {title:'Специалист по переговорам',minXp:250,icon:'badge' as RankIcon,tone:'#668fc0'},
  {title:'Ведущий переговорщик',minXp:450,icon:'medal' as RankIcon,tone:'#8a79c4'},
  {title:'Старший переговорщик',minXp:700,icon:'star' as RankIcon,tone:'#c28b55'},
  {title:'Директор по переговорам',minXp:1000,icon:'crown' as RankIcon,tone:'#d0a94f'},
  {title:'Вице‑президент по партнёрствам',minXp:1400,icon:'landmark' as RankIcon,tone:'#cb6f62'},
  {title:'Президент корпорации',minXp:1900,icon:'building' as RankIcon,tone:'#dbbd70'},
] as const;

export function rankIndexForXp(xp:number) {
  for (let index=ranks.length-1;index>=0;index--) if (xp>=ranks[index].minXp) return index;
  return 0;
}

export function rankForXp(xp:number) { return ranks[rankIndexForXp(xp)]; }

export function rankProgress(xp:number) {
  const index=rankIndexForXp(xp);const current=ranks[index];const next=ranks[index+1];
  if (!next) return {current,next:null,earned:xp-current.minXp,needed:0,percent:100};
  const earned=Math.max(0,xp-current.minXp);const needed=next.minXp-current.minXp;
  return {current,next,earned,needed,percent:Math.min(100,Math.round(earned/needed*100))};
}

export type MapLevel = {
  id:string;scope:'Городские'|'Региональные'|'Федеральные'|'Международные';title:string;subtitle:string;
  requiredRank:number;config:Config;
};

export const mapLevels: MapLevel[] = [
  {id:'city-career',scope:'Городские',title:'Новая роль',subtitle:'Разговор с руководителем',requiredRank:0,config:{...defaults.career,difficulty:'Базовый',tone:'Дружелюбный',topic:'Повышение до ведущего специалиста'}},
  {id:'city-supply',scope:'Городские',title:'Локальный поставщик',subtitle:'Первый коммерческий контракт',requiredRank:1,config:{...defaults.supplier,difficulty:'Базовый',tone:'Сдержанный',topic:'Контракт с локальным поставщиком'}},
  {id:'region-network',scope:'Региональные',title:'Региональная сеть',subtitle:'Объём, цена и сроки',requiredRank:2,config:{...defaults.supplier,difficulty:'Продвинутый',tone:'Сдержанный',topic:'Поставки для региональной сети'}},
  {id:'region-team',scope:'Региональные',title:'Ключевой специалист',subtitle:'Удержание и новая ответственность',requiredRank:3,config:{...defaults.career,difficulty:'Продвинутый',tone:'Жёсткий',topic:'Удержание ключевого специалиста'}},
  {id:'federal-tender',scope:'Федеральные',title:'Федеральный тендер',subtitle:'Риски крупного контракта',requiredRank:4,config:{...defaults.supplier,difficulty:'Эксперт',tone:'Жёсткий',topic:'Условия федерального тендера'}},
  {id:'federal-change',scope:'Федеральные',title:'Реорганизация',subtitle:'Роль в новой структуре',requiredRank:5,config:{...defaults.career,difficulty:'Эксперт',tone:'Сдержанный',topic:'Роль в федеральной реорганизации'}},
  {id:'global-contract',scope:'Международные',title:'Международный контракт',subtitle:'Стандарты и гарантии',requiredRank:6,config:{...defaults.supplier,difficulty:'Эксперт',tone:'Жёсткий',topic:'Международный контракт поставки'}},
  {id:'global-board',scope:'Международные',title:'Совет директоров',subtitle:'Стратегическая роль',requiredRank:7,config:{...defaults.career,difficulty:'Эксперт',tone:'Жёсткий',topic:'Переговоры с советом директоров'}},
];
