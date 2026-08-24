import { createContext, useContext, type ReactNode } from "react";

interface ParticipantContextType {
  participantId: string;
}

const ParticipantContext = createContext<ParticipantContextType | null>(null);

interface ParticipantProviderProps {
  participantId: string;
  children: ReactNode;
}

export function ParticipantProvider({
  participantId,
  children,
}: ParticipantProviderProps) {
  return (
    <ParticipantContext.Provider value={{ participantId }}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  const context = useContext(ParticipantContext);

  if (!context) {
    throw new Error(
      "useParticipant must be used within a ParticipantProvider"
    );
  }

  return context;
}