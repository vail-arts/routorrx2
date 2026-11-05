'use client';

import {useEffect, useId, useRef, useState} from 'react';

export default function FilmModal({source}:{source?:string}={}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const previousOverflow = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const id = useId();

  useEffect(() => () => {
    animation.current?.cancel();
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
  }, []);

  function animatePlayer(entering: boolean, finished?: () => void) {
    const player = dialog.current!;
    // Preserve the current frame if someone closes during the entrance.
    const current = getComputedStyle(player).transform;
    animation.current?.cancel();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finished?.();
      return;
    }
    const source = trigger.current!.getBoundingClientRect();
    const target = player.getBoundingClientRect();
    const x = source.left - target.left + (source.width - target.width) / 2;
    const y = source.top - target.top + (source.height - target.height) / 2;
    const atButton = {
      transform: `translate(${x}px,${y}px) scale(${source.width / target.width},${source.height / target.height})`,
      opacity: 0.18
    };
    const frames = entering ? [atButton, {transform: 'none', opacity: 1}]
      : [{transform: current, opacity: 1}, atButton];
    const transition = player.animate(frames, {
      duration: entering ? 480 : 380,
      easing: 'cubic-bezier(.38,0,.17,1)',
      fill: 'both'
    });
    animation.current = transition;
    transition.onfinish = () => {
      finished?.();
      transition.cancel();
      animation.current = null;
    };
  }

  function open() {
    if (dialog.current!.open) return;
    setFailed(false);
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current!.showModal();
    animatePlayer(true);
    const movie = video.current!;
    movie.src = source || process.env.NEXT_PUBLIC_FILM_URL || '/media/routorrx-15s.mp4';
    void movie.play().catch(() => { /* Native controls allow manual play. */ });
  }

  function close() {
    if (!dialog.current?.open || closing.current) return;
    closing.current = true;
    dialog.current.dataset.closing = 'true';
    video.current?.pause();
    animatePlayer(false, () => {
      dialog.current!.close();
      delete dialog.current!.dataset.closing;
      video.current!.removeAttribute('src');
      video.current!.load();
      document.body.style.overflow = previousOverflow.current ?? '';
      previousOverflow.current = null;
      closing.current = false;
      trigger.current?.focus({preventScroll: true});
    });
  }

  return <>
    <button ref={trigger} className="text-button film-trigger" aria-haspopup="dialog" aria-controls={id} onClick={open}>
      <span aria-hidden="true">▷</span> Watch demo ad <small>15 SEC</small>
    </button>
    <dialog ref={dialog} id={id} aria-label="routorrX demo ad" className="film-modal"
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === dialog.current) close(); }}>
      <button className="close" onClick={close} aria-label="Close demo ad">✕</button>
      <video ref={video} aria-label="15-second routorrX demo ad" hidden={failed} controls playsInline preload="none"
        onEnded={close} onError={() => { if (dialog.current?.open && !closing.current) setFailed(true); }}/>
      {failed && <div className="film-empty" role="alert"><h2>The ad couldn’t load.</h2><p>Close the player and try again.</p></div>}
    </dialog>
  </>;
}
