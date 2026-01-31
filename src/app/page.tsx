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
            <div className="hidden sm:flex items-center gap-3">
              <StatusBadge name="SFUSD" status="active" />
              <StatusBadge name="CaleProcure" status="active" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="hidden md:inline">Powered by</span>
            <PoweredByLink href="https://firecrawl.dev" name="Firecrawl" />
            <span className="text-border">•</span>
            <PoweredByLink href="https://tambo.co" name="Tambo" />
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

function StatusBadge({ name, status }: { name: string; status: 'active' | 'inactive' }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded border border-border bg-background/50">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'active' ? 'bg-green-500 status-live' : 'bg-muted-foreground'
        }`}
      />
      <span className="font-mono text-xs text-foreground/80">{name}</span>
    </div>
  );
}

function PoweredByLink({ href, name }: { href: string; name: string }) {
  return (
    <a
      href={href}
      className="text-muted-foreground hover:text-primary transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {name}
    </a>
  );
}
