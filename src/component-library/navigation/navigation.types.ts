export type NavigationDecisions = {
  alignment: "left" | "center" | "right";
  density: "compact" | "comfortable";
  background: "solid" | "transparent" | "blur";
};

export type NavigationContent = {
  primaryLinks: Array<{
    id?: string;
    label: string;
    href: string;
    icon?: string;
  }>;
  onNavigate?: (link: { id: string; href: string; label: string }) => void;
  interactionMode?: "preview" | "interactive";
};

export type NavigationProps = NavigationDecisions & NavigationContent;
