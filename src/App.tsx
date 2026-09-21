import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import SymbolDigitPage from "./pages/SymbolDigitGamePage.tsx";
import DigitSpanPage from "./pages/DigitSpanPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import TrailsPage from "./pages/TrailsPage.tsx";
import PopBubblesPage from "./pages/PopBubblesPage.tsx";
import TwentyNumPage from "./pages/TwentyNumPage.tsx";

import { ParticipantProvider } from "./ParticipantContext.tsx";

const queryClient = new QueryClient();

const PARTICIPANT_STORAGE_KEY = "brain_games_participant_id";

const App = () => {
  // Check whether the participant arrived through a REDCap link
  // containing a participant ID.
  const params = new URLSearchParams(window.location.search);
  const urlParticipantId = params.get("participant_id");

  // If the participant ID is in the URL, save it to localStorage.
  // This happens when the participant first opens the link from REDCap.
  if (urlParticipantId) {
    localStorage.setItem(
      PARTICIPANT_STORAGE_KEY,
      urlParticipantId
    );
  }

  // Get the participant ID either:
  // 1. From the current REDCap URL, or
  // 2. From localStorage if they are returning to the app later.
  const participantId =
    urlParticipantId ||
    localStorage.getItem(PARTICIPANT_STORAGE_KEY);

  // If there is still no participant ID, don't allow access.
  if (!participantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Unable to Open Brain Games
          </h1>

          <p className="text-muted-foreground">
            This page must be accessed using the link provided by the study
            team. Please return to your study email and use the Brain Games
            link provided there.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ParticipantProvider participantId={participantId}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              <Route
                path="/games/symbol-digit"
                element={<SymbolDigitPage />}
              />

              <Route
                path="/games/digit-span"
                element={<DigitSpanPage />}
              />

              <Route
                path="/games/trails"
                element={<TrailsPage />}
              />

              <Route
                path="/games/pop-bubbles"
                element={<PopBubblesPage />}
              />

              <Route
                path="/games/twenty-num"
                element={<TwentyNumPage />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ParticipantProvider>
  );
};

export default App;