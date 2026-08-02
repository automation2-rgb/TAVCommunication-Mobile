/**
 * Per-icon imports from dist paths — avoids the lucide-react-native barrel (1700+
 * icons) and broken package "exports" resolution on Windows/Metro.
 */
import type { ComponentType } from 'react';

export type LucideIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
};

export type LucideIcon = ComponentType<LucideIconProps>;

export { default as AlertCircle } from 'lucide-react-native/dist/esm/icons/circle-alert';
export { default as Archive } from 'lucide-react-native/dist/esm/icons/archive';
export { default as ArchiveRestore } from 'lucide-react-native/dist/esm/icons/archive-restore';
export { default as ArrowLeft } from 'lucide-react-native/dist/esm/icons/arrow-left';
export { default as Briefcase } from 'lucide-react-native/dist/esm/icons/briefcase';
export { default as Building2 } from 'lucide-react-native/dist/esm/icons/building-2';
export { default as Check } from 'lucide-react-native/dist/esm/icons/check';
export { default as CheckCheck } from 'lucide-react-native/dist/esm/icons/check-check';
export { default as ChevronDown } from 'lucide-react-native/dist/esm/icons/chevron-down';
export { default as Clock } from 'lucide-react-native/dist/esm/icons/clock';
export { default as Inbox } from 'lucide-react-native/dist/esm/icons/inbox';
export { default as Mail } from 'lucide-react-native/dist/esm/icons/mail';
export { default as MessageSquare } from 'lucide-react-native/dist/esm/icons/message-square';
export { default as MessagesSquare } from 'lucide-react-native/dist/esm/icons/messages-square';
export { default as MoreVertical } from 'lucide-react-native/dist/esm/icons/ellipsis-vertical';
export { default as Paperclip } from 'lucide-react-native/dist/esm/icons/paperclip';
export { default as Phone } from 'lucide-react-native/dist/esm/icons/phone';
export { default as Plus } from 'lucide-react-native/dist/esm/icons/plus';
export { default as Search } from 'lucide-react-native/dist/esm/icons/search';
export { default as Send } from 'lucide-react-native/dist/esm/icons/send';
export { default as Smartphone } from 'lucide-react-native/dist/esm/icons/smartphone';
export { default as X } from 'lucide-react-native/dist/esm/icons/x';
