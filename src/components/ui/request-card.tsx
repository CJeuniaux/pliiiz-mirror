import React from 'react';

interface RequestCardProps {
  avatarUrl?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  rightSlot?: React.ReactNode;
}

export function RequestCard({ 
  avatarUrl, 
  title, 
  subtitle, 
  ctaLabel, 
  onCta, 
  rightSlot 
}: RequestCardProps) {
  return (
    <div className="pliiz-card plz-card-row">
      <div className="plz-card-left">
        <div className="plz-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <div className="plz-avatar-ph" aria-hidden />
          )}
        </div>
        <div className="plz-card-text">
          <div className="plz-card-title">{title}</div>
          {subtitle && <div className="plz-card-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="plz-card-right">
        {rightSlot ? rightSlot : (
          ctaLabel && (
            <button className="plz-btn" onClick={onCta}>
              {ctaLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
