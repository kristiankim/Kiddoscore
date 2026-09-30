"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Settings, ListChecks, Gift, LogOut, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "../_lib/auth";
import { isSupabaseConfigured } from "../_lib/storage";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const isDemo = mounted && !isSupabaseConfigured();
  useEffect(() => {
    setMounted(true);
  }, []);
  function closePin() {
    setShowPin(false);
    setPin("");
    requestAnimationFrame(() => settingsTrigger.current?.focus());
  }
  function navStyle(active: boolean) {
    return `min-h-11 min-w-0 flex-1 gap-2 px-3 md:flex-none ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`;
  }
  if (pathname?.startsWith("/auth")) return null;
  return (
    <>
      <header className="site-header">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            aria-label="Sparkquest home"
            className="flex min-h-11 w-fit max-w-full items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-lg font-bold text-white"
            >
              S
            </span>
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              Sparkquest
            </span>
            {isDemo && (
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                Demo
              </span>
            )}
          </Link>
          <nav
            aria-label="App navigation"
            className="col-span-2 row-start-2 mt-2 flex min-w-0 gap-1 border-t border-border pt-2 md:col-span-1 md:col-start-2 md:row-start-1 md:mt-0 md:border-0 md:pt-0"
          >
            <Button
              render={
                <Link
                  href="/"
                  aria-current={pathname === "/" ? "page" : undefined}
                />
              }
              variant="ghost"
              className={navStyle(pathname === "/")}
            >
              <ListChecks aria-hidden="true" />
              Tasks
            </Button>
            <Button
              render={
                <Link
                  href="/rewards"
                  aria-current={pathname === "/rewards" ? "page" : undefined}
                />
              }
              variant="ghost"
              className={navStyle(pathname === "/rewards")}
            >
              <Gift aria-hidden="true" />
              Rewards
            </Button>
            {(user || isDemo) &&
              (pathname === "/parent" ? (
                <Button
                  render={
                    <Link
                      href="/parent"
                      aria-current="page"
                      aria-label="Parent settings"
                    />
                  }
                  variant="ghost"
                  className={navStyle(true)}
                >
                  <Settings aria-hidden="true" />
                  <span className="hidden lg:inline">Parent settings</span>
                  <span className="lg:hidden">Settings</span>
                </Button>
              ) : (
                <Button
                  ref={settingsTrigger}
                  variant="ghost"
                  className={navStyle(false)}
                  aria-label="Parent settings"
                  aria-haspopup="dialog"
                  aria-expanded={showPin}
                  onClick={() => {
                    setPin("");
                    setShowPin(true);
                  }}
                >
                  <Settings aria-hidden="true" />
                  <span className="hidden lg:inline">Parent settings</span>
                  <span className="lg:hidden">Settings</span>
                </Button>
              ))}
          </nav>
          <div className="col-start-2 row-start-1 flex justify-end md:col-start-3">
            {user ? (
              <Button
                variant="ghost"
                className="min-h-11 gap-2 px-3 text-muted-foreground"
                disabled={pending}
                aria-label={pending ? "Signing out" : "Sign out"}
                onClick={async () => {
                  setPending(true);
                  setError("");
                  try {
                    await signOut();
                  } catch {
                    setError("Sign out failed. Please try again.");
                  } finally {
                    setPending(false);
                  }
                }}
              >
                {pending ? (
                  <Loader2
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <LogOut aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {pending ? "Signing out…" : "Sign out"}
                </span>
              </Button>
            ) : (
              <Button
                render={<Link href="/auth/signin" />}
                variant="outline"
                className="min-h-11 px-3"
              >
                Sign in
              </Button>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="col-span-full mt-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
      </header>
      <Dialog
        open={showPin}
        onOpenChange={(open) => {
          if (!open) closePin();
        }}
      >
        <DialogContent showCloseButton={false} className="p-5">
          <DialogTitle>Parent settings</DialogTitle>
          <DialogDescription>
            Enter any 4-digit PIN to continue.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (/^\d{4}$/.test(pin)) {
                setShowPin(false);
                setPin("");
                router.push("/parent");
              }
            }}
          >
            <label
              htmlFor="parent-pin"
              className="mb-2 block text-sm font-medium"
            >
              Parent PIN
            </label>
            <Input
              id="parent-pin"
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              value={pin}
              onChange={(event) => {
                if (/^\d{0,4}$/.test(event.target.value))
                  setPin(event.target.value);
              }}
              className="h-11 text-lg tracking-widest"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={closePin}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-h-11"
                disabled={pin.length !== 4}
              >
                Open settings
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
