export type HelpSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type HelpQuickLink = {
  id: string;
  label: string;
  href: '/(app)/inbox' | '/(app)/contacts' | '/(app)/profile' | '/(app)/settings';
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'messaging',
    title: 'Messaging',
    paragraphs: [
      'Compose SMS in a conversation or from New conversation. Messages update live while the app is open.',
    ],
    bullets: [
      'SMS body is limited to 1600 characters.',
      'Enter starts a new line; tap Send to deliver.',
      'History-only inboxes (no Twilio number) can view threads but cannot send.',
    ],
  },
  {
    id: 'mms',
    title: 'Attachments (MMS)',
    paragraphs: [
      'Attach photos from the camera or gallery with the ＋ button on the composer.',
    ],
    bullets: [
      'Up to 10 files per send.',
      'About 4 MB per file after compression.',
      'Images and short media only — no PDFs.',
      'Tap an attachment in a bubble to view it full screen.',
    ],
  },
  {
    id: 'receiving',
    title: 'Receiving messages',
    paragraphs: [
      'Inbound SMS and MMS appear in the open thread via Realtime. When the app is backgrounded, you get a system notification.',
    ],
    bullets: [
      'Tap a notification to open the correct conversation.',
      'Allow notifications in Settings (and OS settings) so alerts can reach you.',
      'Sound for in-app alerts can be toggled under Settings.',
    ],
  },
  {
    id: 'inbox',
    title: 'Inbox basics',
    paragraphs: [
      'Your inbox list uses the same filters as the web app.',
    ],
    bullets: [
      'Tabs: Active, Unread, and Done Deals.',
      'Long-press a thread to mark read/unread or mark done/reopen.',
      'Tap the inbox name in the header to switch inboxes.',
      'If you have no inboxes yet, use Request access from the empty state.',
    ],
  },
  {
    id: 'contacts',
    title: 'Contacts',
    paragraphs: [
      'Browse External and Team contacts, search by name or phone, then tap to start a new message with the number filled in.',
    ],
    bullets: [
      'Contacts are read-only in this app — create or edit them on the web.',
      'Saved groups are not included in v1.',
    ],
  },
  {
    id: 'account',
    title: 'Account',
    paragraphs: [
      'Manage your identity and device preferences from the user menu.',
    ],
    bullets: [
      'Profile — edit display name and mobile number (E.164). Email and role are read-only.',
      'Settings — notification permission status and inbound sound toggle.',
      'Sign out clears your session and unregisters this device for push.',
    ],
  },
  {
    id: 'mobile-notes',
    title: 'Mobile notes',
    paragraphs: [
      'Some web keyboard shortcuts do not apply here. Use on-screen actions instead of ⌘/Ctrl+K search, Enter-to-send, or Esc to dismiss modals.',
    ],
    bullets: [
      'Global search is not available in v1 (search icon is a placeholder).',
      'Use Back / ← Inbox to leave a screen.',
    ],
  },
];

export const HELP_QUICK_LINKS: HelpQuickLink[] = [
  { id: 'inbox', label: 'Text', href: '/(app)/inbox' },
  { id: 'chat', label: 'Chats', href: '/(app)/chat' },
  { id: 'contacts', label: 'Contacts', href: '/(app)/contacts' },
  { id: 'profile', label: 'Profile', href: '/(app)/profile' },
];
