export type ArenaSound = 'navigate' | 'send' | 'response' | 'warning' | 'success';

let audioContext: AudioContext | null = null;
let tensionClock: ReturnType<typeof setInterval> | null = null;
let voiceRequest = 0;

function context() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

export function playArenaSound(kind: ArenaSound, enabled = true) {
  if (!enabled) return;
  const audio = context();
  if (!audio) return;
  const presets: Record<ArenaSound, Array<[number, number, number]>> = {
    navigate: [[420, 0, .035]],
    send: [[330, 0, .045], [480, .045, .055]],
    response: [[520, 0, .045], [650, .055, .07]],
    warning: [[210, 0, .085], [170, .095, .11]],
    success: [[440, 0, .07], [554, .08, .07], [659, .16, .12]],
  };
  const start = audio.currentTime;
  for (const [frequency, delay, duration] of presets[kind]) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind === 'warning' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, start + delay);
    gain.gain.setValueAtTime(.0001, start + delay);
    gain.gain.exponentialRampToValueAtTime(kind === 'warning' ? .055 : .035, start + delay + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, start + delay + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start + delay);
    oscillator.stop(start + delay + duration + .02);
  }
}

export function speakOpponent(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth=window.speechSynthesis;const request=++voiceRequest;synth.cancel();
  const play=()=>{
    if(request!==voiceRequest)return;
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang='ru-RU';utterance.rate=.96;utterance.pitch=1.04;
    const russian=synth.getVoices().filter(item=>item.lang.toLowerCase().startsWith('ru'));
    const voice=russian.find(item=>/алиса|alisa|alice|ал[её]на|alena|yandex/i.test(item.name))
      ?? russian.find(item=>/milena|ирина|irina|female|жен/i.test(item.name))
      ?? russian[0];
    if(voice)utterance.voice=voice;synth.speak(utterance);
  };
  if(synth.getVoices().length)play();else{let played=false;const ready=()=>{if(played)return;played=true;synth.removeEventListener('voiceschanged',ready);play()};synth.addEventListener('voiceschanged',ready);setTimeout(ready,350)}
  return true;
}

function tick(volume=.025) {
  const audio=context();if(!audio)return;
  const start=audio.currentTime;const oscillator=audio.createOscillator();const gain=audio.createGain();
  oscillator.type='square';oscillator.frequency.setValueAtTime(1040,start);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.004);gain.gain.exponentialRampToValueAtTime(.0001,start+.035);
  oscillator.connect(gain).connect(audio.destination);oscillator.start(start);oscillator.stop(start+.045);
}

export function startTensionClock(value:number,enabled=true) {
  stopTensionClock();if(!enabled||value<55)return()=>{};
  const delay=value>=85?430:value>=70?650:900;tick(value>=85?.035:.022);tensionClock=setInterval(()=>tick(value>=85?.035:.022),delay);
  return stopTensionClock;
}
export function stopTensionClock(){if(tensionClock){clearInterval(tensionClock);tensionClock=null;}}

export function stopOpponentVoice() {
  voiceRequest++;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

type RecognitionResultEvent = Event & {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type RecognitionErrorEvent = Event & { error?: string };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor() {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function speechRecognitionAvailable() {
  return Boolean(recognitionConstructor());
}

export function createRussianRecognition(callbacks: {
  onStart: () => void;
  onResult: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}) {
  const Recognition = recognitionConstructor();
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = 'ru-RU';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart = callbacks.onStart;
  recognition.onresult = event => {
    const transcript = Array.from(event.results).map(result => result[0]?.transcript ?? '').join(' ').trim();
    if (transcript) callbacks.onResult(transcript);
  };
  recognition.onerror = event => {
    const messages: Record<string,string> = {
      'not-allowed': 'Разрешите доступ к микрофону в настройках браузера.',
      'no-speech': 'Речь не распознана. Попробуйте ещё раз чуть ближе к микрофону.',
      network: 'Сервис распознавания недоступен. Проверьте подключение к интернету.',
    };
    callbacks.onError(messages[event.error ?? ''] ?? 'Не удалось распознать речь. Попробуйте ещё раз.');
  };
  recognition.onend = callbacks.onEnd;
  return recognition;
}
