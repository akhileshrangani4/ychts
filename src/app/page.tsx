import { TamboWrapper } from '@/components/TamboWrapper';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Compact Header */}
      <header className="flex-shrink-0 px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Government Bid<span className="text-primary"> Finder</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Full-screen Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <TamboWrapper />
      </div>
    </main>
  );
}

