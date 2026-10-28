import React from 'react';
import { Gamepad2, Zap, Trophy, ShieldCheck, Crown } from 'lucide-react';
import type { GamerStats, GamerTier } from '../types';

interface GamerBadgePillProps {
  stats?: GamerStats | null;
  size?: 'xs' | 'sm' | 'md';
  showTitle?: boolean;
}

export const getTierConfig = (tier?: GamerTier) => {
  switch (tier) {
    case 'mythic':
      return {
        label: 'Mythic',
        icon: Crown,
        badgeBg: 'bg-gradient-to-r from-purple-500/25 via-pink-500/25 to-amber-500/25 border-purple-500/50 text-purple-200 shadow-md shadow-purple-500/20',
        nameStyle: 'font-black bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(168,85,247,0.35)]',
        ringStyle: 'ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/30',
        cardBorder: 'border-purple-500/40 bg-purple-950/10',
      };
    case 'platinum':
      return {
        label: 'Platinum',
        icon: ShieldCheck,
        badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10',
        nameStyle: 'font-extrabold text-emerald-200 drop-shadow-[0_1px_6px_rgba(16,185,129,0.25)]',
        ringStyle: 'ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20',
        cardBorder: 'border-emerald-500/30 bg-emerald-950/10',
      };
    case 'gold':
      return {
        label: 'Gold',
        icon: Trophy,
        badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10',
        nameStyle: 'font-extrabold text-amber-200 drop-shadow-[0_1px_6px_rgba(245,158,11,0.25)]',
        ringStyle: 'ring-2 ring-amber-500/50 shadow-md shadow-amber-500/20',
        cardBorder: 'border-amber-500/30 bg-amber-950/10',
      };
    case 'silver':
      return {
        label: 'Silver',
        icon: Zap,
        badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-300 shadow-sm shadow-sky-500/10',
        nameStyle: 'font-bold text-sky-100',
        ringStyle: 'ring-2 ring-sky-500/40',
        cardBorder: 'border-sky-500/20',
      };
    case 'bronze':
    default:
      return {
        label: 'Bronze',
        icon: Gamepad2,
        badgeBg: 'bg-amber-900/20 border-amber-800/30 text-amber-300/90',
        nameStyle: 'font-bold text-slate-100',
        ringStyle: 'ring-1 ring-slate-700',
        cardBorder: 'border-slate-800',
      };
  }
};

export const GamerBadgePill: React.FC<GamerBadgePillProps> = ({
  stats,
  size = 'xs',
  showTitle = true,
}) => {
  if (!stats) return null;

  const cfg = getTierConfig(stats.badge?.tier);
  const IconComponent = cfg.icon;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5',
  };

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold tracking-wide backdrop-blur-md transition-all ${sizeClasses[size]} ${cfg.badgeBg}`}
      title={`Level ${stats.level} • ${stats.badge?.title || 'Explorer'} (${stats.xp} Total XP)`}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} />
      <span>Lv. {stats.level}</span>
      {showTitle && stats.badge?.title && (
        <span className="hidden sm:inline font-semibold opacity-90">• {stats.badge.title}</span>
      )}
    </span>
  );
};

interface GamerUserNameProps {
  name: string;
  stats?: GamerStats | null;
  className?: string;
}

export const GamerUserName: React.FC<GamerUserNameProps> = ({
  name,
  stats,
  className = '',
}) => {
  const cfg = getTierConfig(stats?.badge?.tier);
  return (
    <span className={`inline-block transition-colors ${cfg.nameStyle} ${className}`}>
      {name}
    </span>
  );
};

interface GamerAvatarProps {
  avatar?: string | null;
  name: string;
  stats?: GamerStats | null;
  className?: string;
  sizeClass?: string;
}

export const GamerAvatar: React.FC<GamerAvatarProps> = ({
  avatar,
  name,
  stats,
  className = '',
  sizeClass = 'h-8 w-8',
}) => {
  const cfg = getTierConfig(stats?.badge?.tier);
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass} ${cfg.ringStyle} ${className}`}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 to-purple-800 text-xs font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
