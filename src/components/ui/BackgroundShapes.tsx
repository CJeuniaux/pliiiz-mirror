import React from 'react';
import './bg-shapes.css';

type Props = {
  density?: 'low' | 'mid' | 'high';
  animated?: boolean;
  palette?: { a: string; b: string; c: string };
};

export default function BackgroundShapes({
  density = 'mid',
  animated = true,
  palette = { a: '#ff9c6b', b: '#b05cff', c: '#ff7cab' },
}: Props) {
  const blobs = {
    low: [
      { cx: '18%', cy: '16%', r: 140, fill: palette.a },
      { cx: '82%', cy: '24%', r: 120, fill: palette.b },
      { cx: '42%', cy: '78%', r: 180, fill: palette.c },
    ],
    mid: [
      { cx: '14%', cy: '12%', r: 160, fill: palette.a },
      { cx: '78%', cy: '20%', r: 130, fill: palette.b },
      { cx: '36%', cy: '70%', r: 190, fill: palette.c },
      { cx: '90%', cy: '70%', r: 110, fill: palette.a },
    ],
    high: [
      { cx: '12%', cy: '10%', r: 170, fill: palette.a },
      { cx: '78%', cy: '18%', r: 140, fill: palette.b },
      { cx: '36%', cy: '70%', r: 210, fill: palette.c },
      { cx: '92%', cy: '66%', r: 120, fill: palette.a },
      { cx: '24%', cy: '90%', r: 130, fill: palette.b },
    ],
  }[density];

  return (
    <div className={`plz-shapes ${animated ? 'plz-shapes--anim' : ''}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="plz-blur"><feGaussianBlur stdDeviation="30" /></filter>
        </defs>
        <g filter="url(#plz-blur)" opacity="0.30" className="plz-shapes__group">
          {blobs.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r/10} fill={b.fill} className={`plz-blob plz-blob--${i}`} />
          ))}
        </g>
      </svg>
    </div>
  );
}
