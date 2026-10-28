import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";

const games = [
  {
    id: "symbol-digit",
    title: "Symbol-Digit Substitution",
    description: "Match Greek letter symbols to their corresponding numbers as fast as you can!",
    color: "from-yellow-500 to-cyan-400",
    icon: "αβ",
  },
  {
    id: "digit-span",
    title: "Digit Span",
    description: "Listen to a sequence of digits, then recall them in order - forwards and backwards.",
    color: "from-red-500 to-purple-400",
    icon: "123",
  },
  {
  id: "trails",
  title: "Trails",
  description: "Connect letters and numbers in this classic psychology game.",
  color: "from-purple-500 to-blue-400",
  icon: "1A",
  },
  {
  id: "pop-bubbles",
  title: "Pop the Bubbles",
  description: "Pop colored bubbles according to the rules, and see how many you can pop in a row!",
  color: "from-purple-500 to-yellow-400",
  icon: "!",
  },
  {
  id: "twenty-num",
  title: "2048",
  description: "Swipe and join tiles to get to 2048!",
  color: "from-red-500 to-teal-400",
  icon: "248",
  }
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-game-blue/20 via-transparent to-accent/10" />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full mb-6">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
            The Healthy Minds Brain Games
          </h1>
          <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
            Give your brain a workout with this collection of games created by the Center for Healthy Minds!
          </p>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {games.map((game, i) => (
            <button
              key={i}
              onClick={() => game.id && navigate(`/games/${game.id}`)}
              disabled={!game.id}
              className={`group relative rounded-2xl p-6 text-left transition-all duration-300
                ${game.id
                  ? "bg-card hover:bg-secondary cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
                  : "bg-card/50 cursor-default opacity-50"
                }
                border border-border`}
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4
                  text-xl font-bold text-primary-foreground shadow-md`}
              >
                {game.icon}
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                {game.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {game.description}
              </p>
              {game.id && (
                <div className="mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Play now →
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
