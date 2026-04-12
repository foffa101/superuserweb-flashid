import type { ChallengeData } from '../lib/challenges';

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
    <div className="mt-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
      {/* OTP methods */}
      {(method === 'type_code' || method === 'select_code') && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {method === 'type_code' ? 'Enter this code in the app' : 'Select this code in the app'}
          </p>
          <p className="text-3xl font-bold text-white tracking-[8px] font-mono">
            {cd.code}
          </p>
        </>
      )}

      {/* Voice phrase */}
      {method === 'voice_phrase' && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Read this phrase aloud in the app
          </p>
          <p className="text-lg font-medium text-slate-200 italic">
            "{cd.phrase}"
          </p>
        </>
      )}

      {/* Visual match methods — show 1 target item */}
      {['emoji_match', 'word_match', 'icon_match', 'flag_match', 'shape_match'].includes(method) && cd.target && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Find this on the app
          </p>
          <div className="flex justify-center">
            <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 inline-flex items-center justify-center">
              <span className={method === 'word_match' ? 'text-lg font-semibold text-white' : 'text-5xl'}>
                {cd.target}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Color match — show 1 target color */}
      {method === 'color_match' && cd.target && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Find this color on the app
          </p>
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-xl border-2 border-white/20"
              style={{ background: COLOR_MAP[cd.target] || '#94A3B8' }}
            />
          </div>
        </>
      )}

      {/* Number sequence — keeps grid display */}
      {method === 'number_sequence' && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Tap the numbers in order on the app
          </p>
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
            {cd.grid?.map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-center min-h-[44px] text-2xl"
              >
                {item}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Draw match */}
      {method === 'draw_match' && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Draw this shape in the app
          </p>
          <p className="text-base font-semibold text-blue-400 capitalize">
            {cd.shape_template?.replace(/_/g, ' ')}
          </p>
        </>
      )}

      {/* Tap pattern */}
      {method === 'tap_pattern' && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Watch the pattern in the app and repeat it
        </p>
      )}

      {/* Shake verify */}
      {method === 'shake_verify' && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Shake your phone to verify
        </p>
      )}

      {/* Animal sound — play button on site, selection on app */}
      {method === 'animal_sound' && cd.sound_id && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Play the sound — select the animal on the app
          </p>
          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) {
                const names: Record<string, string> = {
                  dog: 'Dog', cat: 'Cat', cow: 'Cow', lion: 'Lion', bird: 'Bird',
                  frog: 'Frog', horse: 'Horse', elephant: 'Elephant', monkey: 'Monkey',
                  pig: 'Pig', duck: 'Duck', wolf: 'Wolf', rooster: 'Rooster', owl: 'Owl', bear: 'Bear',
                };
                const name = names[cd.sound_id!] || cd.sound_id;
                const utterance = new SpeechSynthesisUtterance(`The ${name} says`);
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }
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
  );
}
