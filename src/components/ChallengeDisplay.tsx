import { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import type { ChallengeData } from '../lib/challenges';

/**
 * Plays the onomatopoeia sound for an animal using speech synthesis.
 * Says the animal sound (woof, meow, moo) not the animal name.
 */
function playAnimalSound(soundId: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const sounds: Record<string, string> = {
    dog: 'woof woof woof',
    cat: 'meow meow',
    cow: 'moo moo',
    lion: 'roar',
    bird: 'tweet tweet tweet',
    frog: 'ribbit ribbit ribbit',
    horse: 'neigh',
    elephant: 'pawoo',
    monkey: 'ooh ooh ah ah',
    pig: 'oink oink oink',
    duck: 'quack quack quack',
    wolf: 'awoo',
    rooster: 'cock a doodle doo',
    owl: 'hoo hoo',
    bear: 'growl',
  };
  const text = sounds[soundId] || soundId;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;
  utterance.pitch = soundId === 'bird' || soundId === 'monkey' ? 1.5 :
                    soundId === 'bear' || soundId === 'lion' || soundId === 'cow' ? 0.5 :
                    soundId === 'elephant' ? 0.4 : 1.0;
  window.speechSynthesis.speak(utterance);
}

const COLOR_MAP: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#22C55E', yellow: '#EAB308',
  purple: '#A855F7', orange: '#F97316', pink: '#EC4899', cyan: '#06B6D4',
  brown: '#92400E', gray: '#6B7280', white: '#F1F5F9', black: '#1E293B',
  teal: '#14B8A6', lime: '#84CC16', indigo: '#6366F1',
};

interface ChallengeDisplayProps {
  challengeData: ChallengeData;
}

export function ChallengeDisplay({ challengeData: cd }: ChallengeDisplayProps) {
  const method = cd.method;

  if (!method) return null;

  return (
    <div className="flex justify-center">
    <div className="w-[280px] min-h-[280px] flex flex-col items-center justify-center bg-white border-2 border-slate-100 rounded-2xl shadow-lg p-6 text-center">
      {/* OTP methods */}
      {(method === 'type_code' || method === 'select_code') && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            {method === 'type_code' ? 'Enter this code in the app' : 'Select this code in the app'}
          </p>
          <p className="text-3xl font-bold text-slate-900 tracking-[8px] font-mono">
            {cd.code}
          </p>
        </>
      )}

      {/* Voice phrase */}
      {method === 'voice_phrase' && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Read this phrase aloud in the app
          </p>
          <p className="text-lg font-medium text-slate-800 italic">
            "{cd.phrase}"
          </p>
        </>
      )}

      {/* Visual match methods — show 1 target item */}
      {['emoji_match', 'word_match', 'icon_match', 'flag_match', 'shape_match'].includes(method) && cd.target && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Find this on the app
          </p>
          <div className="flex justify-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 inline-flex items-center justify-center">
              <span className={method === 'word_match' ? 'text-lg font-semibold text-slate-900' : 'text-5xl'}>
                {cd.target}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Color match — show 1 target color */}
      {method === 'color_match' && cd.target && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Find this color on the app
          </p>
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-xl border-2 border-slate-200"
              style={{ background: COLOR_MAP[cd.target] || '#94A3B8' }}
            />
          </div>
        </>
      )}

      {/* Number sequence — autoplay one digit at a time with Replay button */}
      {method === 'number_sequence' && (
        <NumberSequencePlayer sequence={cd.sequence ?? []} />
      )}

      {/* Draw match */}
      {method === 'draw_match' && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Draw this shape in the app
          </p>
          <p className="text-base font-semibold text-blue-400 capitalize">
            {cd.shape_template?.replace(/_/g, ' ')}
          </p>
        </>
      )}

      {/* Tap pattern */}
      {method === 'tap_pattern' && (
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Watch the pattern in the app and repeat it
        </p>
      )}

      {/* Shake verify */}
      {method === 'shake_verify' && (
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Shake your phone to verify
        </p>
      )}

      {/* Animal sound — play button on site, selection on app */}
      {method === 'animal_sound' && cd.sound_id && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Play the sound — select the animal on the app
          </p>
          <button
            type="button"
            onClick={() => {
              playAnimalSound(cd.sound_id!);
            }}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
          >
            <span className="text-lg">&#9654;</span>
            Play Sound
          </button>
          <p className="text-[10px] text-slate-500 mt-2">The user selects the matching animal on their phone</p>
        </>
      )}
    </div>
    </div>
  );
}

/**
 * Plays a digit sequence one at a time. Each digit shows for ~1.2s,
 * then advances. After the last digit, a "Replay" button appears so the
 * user can restart the playback if they missed one. The phone validates
 * each tap against the same sequence locally — this component is purely
 * the visual cue, not the source of truth.
 *
 * No real-time sync with the phone — the user can tap whenever as long
 * as they get the digits in the right order.
 */
function NumberSequencePlayer({ sequence }: { sequence: number[] }) {
  const total = sequence.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    if (index >= total) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [playing, index, total]);

  const replay = () => {
    setIndex(0);
    setPlaying(true);
  };

  if (total === 0) return null;
  const showing = playing && index < total;
  const currentDigit = showing ? sequence[index] : null;
  const finished = !playing && index >= total;

  return (
    <>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
        Tap each number on your phone as it appears
      </p>
      <div
        className={`w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-6xl font-bold transition-all ${
          showing
            ? 'bg-blue-50 border-2 border-blue-300 text-blue-700 scale-100'
            : 'bg-slate-50 border-2 border-slate-200 text-slate-300 scale-95'
        }`}
      >
        {currentDigit ?? '·'}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {sequence.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < index ? 'bg-blue-500' : i === index && showing ? 'bg-blue-300' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {showing ? `${index + 1} / ${total}` : finished ? `Done — ${total} digits shown` : 'Get ready...'}
      </div>
      {finished && (
        <button
          onClick={replay}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Play className="w-3 h-3" /> Replay
        </button>
      )}
      {playing && index < total && (
        <button
          onClick={() => setPlaying(false)}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Pause className="w-3 h-3" /> Pause
        </button>
      )}
    </>
  );
}
