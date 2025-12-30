"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/theme-toggle";
import logo from "../../public/drafte.svg";

export function Header() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <Image
            src={logo}
            alt="Drafte"
            width={80}
            height={80}
            priority={true}
          />
        </Link>
        <nav className="flex items-center gap-4">
          {isLoaded &&
            (isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex items-center gap-4">
                <Button asChild variant="default">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                {/* <Button asChild variant="outline">
                  <Link href="/sign-up">Get Started</Link>
                </Button> */}
              </div>
            ))}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
