import React from 'react';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function ExternalLink({ href, children, className, ...rest }: Props) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // évite que la carte parent capte le clic
      onClick={(e) => { e.stopPropagation(); }}
      {...rest}
    >
      {children}
    </a>
  );
}