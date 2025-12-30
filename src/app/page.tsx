import { PromptBox } from "@/components/prompt-box";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";

export default function Home() {
  return (
    <main className="h-[calc(100vh-128px)] bg-background flex items-center justify-center overflow-hidden relative">
      <StarsBackground />
      <ShootingStars />
      <section className="w-full px-4 relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Drafte — Where YOU design. AI assists.
          </h1>
          <PromptBox />
        </div>
      </section>
    </main>
  );
}
