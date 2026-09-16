import { Logo } from "@/components/Logo";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-dust/15 bg-velvet/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-12 text-center md:gap-8 md:px-6 md:py-16 pb-28 md:pb-16">
        <Logo size="lg" variant="brass" className="scale-[1.05] md:scale-[1.3] transition-transform hover:scale-110" />
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-dust">
          <Link to="/feed" className="hover:text-paper transition-colors">The Reel</Link>
          <span className="text-dust/30">·</span>
          <Link to="/search" className="hover:text-paper transition-colors">The Vault</Link>
          <span className="text-dust/30">·</span>
          <Link to="/login" className="hover:text-paper transition-colors">Sign In</Link>
          <span className="text-dust/30">·</span>
          <Link to="/signup" className="hover:text-paper transition-colors">Join the List</Link>
        </div>

        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-dust/10 w-full max-w-sm">
          <p className="font-serif italic text-xs text-paper/70">"A room. A projector. A verdict about to be read."</p>
          <span className="text-caption text-dust text-[10px] tracking-widest uppercase mt-1">© MMXXVI · The Screening Room Protocol</span>
        </div>
      </div>
    </footer>
  );
}