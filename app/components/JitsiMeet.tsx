//app/components/JitsiMeet.tsx
"use client"; // Next.js usa "use client" para componentes interativos
import { useEffect, useRef } from "react";

const JitsiMeet = ({ roomName, userName }: { roomName: string; userName: string }) => {
  const jitsiContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      console.error("Jitsi API não carregada!");
      return;
    }

    const domain = "meet.jit.si";
    const options = {
      roomName,
      parentNode: jitsiContainer.current,
      userInfo: { displayName: userName },
      configOverwrite: {
        prejoinPageEnabled: false, // Remove a tela de pré-entrada
        startWithAudioMuted: true,
        startWithVideoMuted: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => {
      api.dispose(); // Garante que a instância seja destruída ao desmontar o componente
    };
  }, [roomName, userName]);

  return <div ref={jitsiContainer} style={{ width: "100%", height: "500px" }} />;
};

export default JitsiMeet;



