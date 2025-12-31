import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] bg-background text-foreground px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold tracking-tighter">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          Sorry, we couldn't find the page or project you're looking for. It
          might have been deleted or moved.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
