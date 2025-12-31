export type FooterDecisions = {
  alignment: "left" | "center" | "right";
  layout: "text" | "links";
  density: "compact" | "comfortable";
  showCopyright: boolean;
};

export type FooterContent = {
  links?: Array<{
    name: string;
    href: string;
  }>;
  copyright?: string;
  onNavigate?: (link: { name: string; href: string }) => void;
  interactionMode?: "preview" | "interactive";
};

export type FooterProps = FooterDecisions & FooterContent;
