export type HeroDecisions = {
  alignment: "left" | "center" | "right";
  layout: "text-only" | "split";
  density: "compact" | "comfortable";
  cta: "none" | "single" | "dual";
  background: "solid" | "transparent";
};

export type HeroContent = {
  title: string;
  subtitle?: string;
  image?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  interactionMode?: "preview" | "interactive";
  onNavigate?: (data: {
    type: "cta-primary" | "cta-secondary";
    label: string;
  }) => void;
};

export type HeroProps = HeroDecisions & HeroContent;
