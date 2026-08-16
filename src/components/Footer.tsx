import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="hairline">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 py-16 text-center md:gap-10 md:px-6 md:py-24">
        <Logo size="xl" className="scale-[1.1] md:scale-[2]" />
        <span className="text-caption text-dust">© MMXXVI · A screening room</span>
      </div>
    </footer>
  );
}