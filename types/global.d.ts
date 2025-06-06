// 📁 types/global.d.ts

interface JitsiMeetUserInfo {
  displayName?: string;
  email?: string;
}

interface JitsiMeetConfigOptions {
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  prejoinPageEnabled?: boolean;
  [key: string]: unknown; 
}

interface JitsiMeetInterfaceConfigOptions {
  TOOLBAR_BUTTONS?: string[];
  SHOW_JITSI_WATERMARK?: boolean;
  SHOW_BRAND_WATERMARK?: boolean;
  SHOW_WATERMARK_FOR_GUESTS?: boolean;
  [key: string]: unknown;
}

interface JitsiMeetExternalAPIOptions {
  roomName: string;
  width?: string | number;
  height?: string | number;
  parentNode: HTMLElement | null; 
  configOverwrite?: JitsiMeetConfigOptions;
  interfaceConfigOverwrite?: JitsiMeetInterfaceConfigOptions;
  userInfo?: JitsiMeetUserInfo;
  jwt?: string;
}

interface JitsiParticipantInfo {
    displayName: string;
    participantId: string;
    formattedDisplayName: string;
    [key: string]: unknown; 
}

interface JitsiMeetExternalAPIInstance {
  executeCommand: (command: string, ...args: unknown[]) => void;
  addEventListener: (event: string, listener: (payload: unknown) => void) => void;
  removeEventListener: (event: string, listener: (payload: unknown) => void) => void;
  dispose: () => void;
  getParticipantsInfo: () => JitsiParticipantInfo[];
  getNumberOfParticipants: () => number;
  isAudioMuted: () => Promise<boolean>;
  isVideoMuted: () => Promise<boolean>;
  getAvatarURL: (participantId: string) => string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: JitsiMeetExternalAPIOptions
    ) => JitsiMeetExternalAPIInstance;
  }
}

export {}; // MUITO IMPORTANTE para o TypeScript tratar como módulo e aplicar o `declare global`