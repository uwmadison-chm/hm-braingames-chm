interface SymbolBoxProps {
  data?: string[];
  currentSymbol?: string;
}

export default function SymbolBox({ data, currentSymbol }: SymbolBoxProps) {
  if (data) {
    return (
      <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2">
        {data.map((value, index) => (
          <div
            key={index}
            className="border-2 border-primary-foreground rounded-lg text-center w-12 md:w-14"
          >
            <div className="text-lg md:text-xl font-semibold py-1 text-primary-foreground">{value}</div>
            <div className="border-t border-primary-foreground" />
            <div className="text-sm py-1 text-primary-foreground/80">{index + 1}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <div className="border-3 border-primary-foreground rounded-lg text-center w-16 h-16 flex items-center justify-center">
        <span className="text-3xl font-bold text-primary-foreground">{currentSymbol}</span>
      </div>
    </div>
  );
}
