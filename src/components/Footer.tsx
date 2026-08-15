import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="hairline">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-24 text-center">
        <Logo size="xl" className="scale-[1.5] md:scale-[2]" />
        <span className="text-caption text-dust">© MMXXVI · A screening room</span>
      </div>
    </footer>
  );
}