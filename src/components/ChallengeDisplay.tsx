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

      {/* Grid match methods */}
      {['emoji_match', 'word_match', 'icon_match', 'flag_match', 'shape_match', 'number_sequence'].includes(method) && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {{
              emoji_match: 'Find these emojis in the app',
              word_match: 'Find these words in the app',
              icon_match: 'Find these icons in the app',
              flag_match: 'Find these flags in the app',
              shape_match: 'Find these shapes in the app',
              number_sequence: 'Tap these numbers in order in the app',
            }[method]}
          </p>
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
            {cd.grid?.map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-center min-h-[44px]"
              >
                <span className={method === 'word_match' ? 'text-xs text-white' : 'text-2xl'}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Color match */}
      {method === 'color_match' && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Find these colors in the app
          </p>
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
            {cd.grid?.map((color, i) => (
              <div
                key={i}
                className="rounded-lg min-h-[44px] border-2 border-white/15"
                style={{ background: COLOR_MAP[color] || '#94A3B8' }}
              />
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

      {/* Animal sound */}
      {method === 'animal_sound' && (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Listen in the app, then tap the matching animal
          </p>
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
            {cd.grid?.map((emoji, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-center min-h-[44px] text-2xl"
              >
                {emoji}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
