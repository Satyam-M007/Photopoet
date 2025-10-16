import { Feather } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Feather className="h-6 w-6 text-primary" />
            <span className="font-headline text-2xl font-bold tracking-tight text-primary">
              PhotoPoet
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
