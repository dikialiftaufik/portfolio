import { useEffect, useState } from 'react';

/** Cycles through `words`, typing and deleting. `words` must be a stable reference. */
export function useTypewriter(words: readonly string[], disabled: boolean): string {
  const [text, setText] = useState('');

  useEffect(() => {
    if (disabled || words.length === 0) return;
    let wordIndex = 0;
    let length = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = words[wordIndex % words.length] ?? '';
      length += deleting ? -1 : 1;
      setText(word.slice(0, length));

      let delay = deleting ? 50 : 150;
      if (!deleting && length === word.length) {
        deleting = true;
        delay = 2000;
      } else if (deleting && length === 0) {
        deleting = false;
        wordIndex += 1;
        delay = 150;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 150);
    return () => clearTimeout(timer);
  }, [words, disabled]);

  // Reduced motion: show the first role, static.
  return disabled ? (words[0] ?? '') : text;
}
