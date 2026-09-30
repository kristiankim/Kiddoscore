"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Reward, Redemption } from "../_lib/types";
import { useKidContext } from "../_lib/context";
import { getRewards, getRedemptions } from "../_lib/storage";
import { redeemForKid, undoRedemption } from "../_lib/rewards";

type Confirmation =
  | { kind: "redeem"; reward: Reward; kidId: string; kidName: string }
  | { kind: "undo"; redemption: Redemption; kidName: string };

export function RewardList() {
  const {
    selectedKid,
    kids,
    setSelectedKid,
    refreshKids,
    isLoading: kidsLoading,
  } = useKidContext();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const busy = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const refreshTrigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  async function loadData() {
    const [nextRewards, nextRedemptions] = await Promise.all([
      getRewards(),
      getRedemptions(),
    ]);
    setRewards(nextRewards);
    setRedemptions(nextRedemptions);
  }
  useEffect(() => {
    let mounted = true;
    loadData()
      .catch(() => {
        if (mounted) {
          setError("Rewards could not be loaded. Please try again.");
          setNeedsRefresh(true);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function close() {
    setConfirmation(null);
    requestAnimationFrame(() => {
      if (trigger.current?.isConnected && !trigger.current.matches(":disabled"))
        trigger.current.focus();
      else (refreshTrigger.current || heading.current)?.focus();
    });
  }
  function ask(value: Confirmation) {
    trigger.current = document.activeElement as HTMLElement;
    setError("");
    setMessage("");
    setConfirmation(value);
  }
  async function refresh() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await loadData();
      await refreshKids();
      setError("");
      setNeedsRefresh(false);
    } catch {
      setError("Rewards could not be refreshed. Please try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function confirm() {
    if (!confirmation || busy.current || needsRefresh) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      if (confirmation.kind === "redeem")
        await redeemForKid(confirmation.kidId, confirmation.reward);
      else await undoRedemption(confirmation.redemption);
      await loadData();
      await refreshKids();
      setMessage(
        confirmation.kind === "redeem"
          ? `${confirmation.kidName} redeemed “${confirmation.reward.label}”.`
          : `Redemption undone. ${confirmation.redemption.cost} points returned to ${confirmation.kidName}.`,
      );
      close();
    } catch {
      setError(
        "We could not finish this change. Refresh rewards and check the balance and history before trying again.",
      );
      setNeedsRefresh(true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const kid = kids.find((item) => item.id === selectedKid?.id) || kids[0];
  const history = redemptions
    .filter((item) => item.kidId === kid?.id)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);
  const cost =
    confirmation?.kind === "redeem"
      ? confirmation.reward.cost
      : confirmation?.redemption.cost || 0;
  function selectKid(id: string) {
    const next = kids.find((item) => item.id === id);
    if (next) setSelectedKid(next);
    setMessage("");
  }
  return (
    <Tabs
      value={kid?.id ?? ""}
      onValueChange={(value) => selectKid(String(value))}
      className="mx-auto max-w-3xl gap-0 pb-12"
    >
      <header className="mb-6">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-semibold outline-none"
        >
          Rewards
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Small goals. Something to look forward to.
        </p>
      </header>
      <div
        role="status"
        aria-live="polite"
        className={
          message
            ? "mb-5 rounded-lg bg-brand-light px-4 py-3 text-sm text-brand"
            : "sr-only"
        }
      >
        {message}
      </div>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
        >
          <p>{error}</p>
          <Button
            variant="ghost"
            className="mt-2 min-h-11"
            disabled={pending}
            ref={refreshTrigger}
            onClick={refresh}
          >
            Refresh rewards
          </Button>
        </div>
      )}
      {loading || kidsLoading ? (
        <div
          role="status"
          aria-label="Loading rewards"
          className="space-y-3 motion-safe:animate-pulse"
        >
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
      ) : !kid ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Add a child to get started</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a profile in parent settings to start earning points for
            rewards.
          </p>
          <Button render={<Link href="/parent" />} className="mt-4 min-h-11">
            Parent settings
          </Button>
        </div>
      ) : (
        <>
          <section
            aria-label="Child and point balance"
            className="mb-6 flex flex-wrap items-center justify-between gap-4"
          >
            {kids.length > 1 ? (
              <div className="min-w-0 w-full md:w-auto md:max-w-full">
                <TabsList
                  aria-label="Rewards for"
                  className="hidden !h-auto max-w-full flex-wrap justify-start gap-1 p-1 md:flex"
                >
                  {kids.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      disabled={pending}
                      className="min-h-11 flex-none max-w-full whitespace-normal break-words px-4"
                    >
                      {item.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="md:hidden">
                  <label
                    htmlFor="reward-kid"
                    className="mb-2 block text-sm font-medium"
                  >
                    Rewards for
                  </label>
                  <div className="relative">
                    <select
                      id="reward-kid"
                      value={kid.id}
                      disabled={pending}
                      onChange={(event) => selectKid(event.target.value)}
                      className="h-12 w-full appearance-none rounded-lg border border-input bg-card py-2 pl-4 pr-11 text-base font-medium shadow-xs transition-colors hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {kids.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <h2 className="min-w-0 break-words text-lg font-semibold">
                {kid.name}’s rewards
              </h2>
            )}
            <p className="text-sm text-muted-foreground">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {kid.points}
              </span>{" "}
              points available
            </p>
          </section>
          <TabsContent
            key={kid.id}
            value={kid.id}
            aria-label={`${kid.name}’s rewards`}
          >
            {rewards.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-semibold">
                  Choose something worth working toward
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first reward in parent settings, like choosing a
                  movie or extra play time.
                </p>
                <Button
                  render={<Link href="/parent" />}
                  variant="outline"
                  className="mt-4 min-h-11"
                >
                  Manage rewards
                </Button>
              </div>
            ) : (
              <section
                aria-label="Available rewards"
                className="divide-y divide-border rounded-xl border border-border bg-card"
              >
                {rewards.map((reward) => {
                  const remaining = Math.max(0, reward.cost - kid.points);
                  return (
                    <article
                      key={reward.id}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-sm font-normal leading-6 text-foreground">
                          {reward.label}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="tabular-nums">{reward.cost}</span>{" "}
                          points <span aria-hidden="true">·</span>{" "}
                          {remaining ? (
                            `${remaining} more to go`
                          ) : (
                            <span className="text-brand">Ready to redeem</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant={remaining ? "outline" : "default"}
                        className="min-h-11 sm:min-w-28"
                        disabled={!!remaining || pending || needsRefresh}
                        aria-label={`Redeem ${reward.label} for ${reward.cost} points`}
                        onClick={() =>
                          ask({
                            kind: "redeem",
                            reward,
                            kidId: kid.id,
                            kidName: kid.name,
                          })
                        }
                      >
                        {remaining ? "Keep earning" : "Redeem"}
                      </Button>
                    </article>
                  );
                })}
              </section>
            )}
            <section className="mt-8" aria-labelledby="history-title">
              <h2 id="history-title" className="mb-3 text-base font-semibold">
                Recent redemptions
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Redeemed rewards will appear here. You can undo a redemption
                  to return its points.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-medium">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <time dateTime={item.at}>
                            {new Date(item.at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>{" "}
                          · {item.cost} points spent
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        className="min-h-11"
                        disabled={pending || needsRefresh}
                        aria-label={`Undo redemption of ${item.label}`}
                        onClick={() =>
                          ask({
                            kind: "undo",
                            redemption: item,
                            kidName: kid.name,
                          })
                        }
                      >
                        Undo
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </>
      )}
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !pending) close();
        }}
      >
        <DialogContent
          showCloseButton={false}
          initialFocus={false}
          className="p-5"
        >
          <DialogTitle className="break-words leading-6">
            {confirmation?.kind === "redeem"
              ? `Redeem “${confirmation.reward.label}”?`
              : "Undo this redemption?"}
          </DialogTitle>
          <DialogDescription>
            {confirmation?.kind === "redeem"
              ? `Spend ${cost} of ${confirmation.kidName}’s points on this reward.`
              : `Return ${cost} points to ${confirmation?.kidName} and remove this redemption from their history.`}
          </DialogDescription>
          {error && (
            <div role="alert" className="text-sm text-destructive">
              <p>{error}</p>
              <Button
                variant="ghost"
                disabled={pending}
                className="mt-2 min-h-11"
                onClick={async () => {
                  close();
                  await refresh();
                }}
              >
                Refresh rewards
              </Button>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              autoFocus
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              className="min-h-11 gap-2"
              disabled={pending || needsRefresh}
              onClick={confirm}
            >
              {pending && (
                <Loader2
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
              )}
              {pending
                ? "Saving…"
                : confirmation?.kind === "redeem"
                  ? "Redeem reward"
                  : "Return points"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
