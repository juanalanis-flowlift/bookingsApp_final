import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Business, SubscriptionTier } from "@shared/schema";

interface TierContextValue {
  tier: SubscriptionTier;
  isStarter: boolean;
  isPro: boolean;
  isTeams: boolean;
  canAccessFeature: (requiredTier: SubscriptionTier) => boolean;
  isLoading: boolean;
}

const TierContext = createContext<TierContextValue | null>(null);

const tierOrder: Record<SubscriptionTier, number> = {
  starter: 0,
  pro: 1,
  teams: 2,
};

export function TierProvider({ children }: { children: React.ReactNode }) {
  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
    retry: false,
  });

  const value = useMemo<TierContextValue>(() => {
    const tier = (business?.subscriptionTier as SubscriptionTier) || "starter";
    
    return {
      tier,
      isStarter: tier === "starter",
      isPro: tier === "pro",
      isTeams: tier === "teams",
      canAccessFeature: (requiredTier: SubscriptionTier) => {
        return tierOrder[tier] >= tierOrder[requiredTier];
      },
      isLoading,
    };
  }, [business?.subscriptionTier, isLoading]);

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier(): TierContextValue {
  const context = useContext(TierContext);
  if (!context) {
    return {
      tier: "starter",
      isStarter: true,
      isPro: false,
      isTeams: false,
      canAccessFeature: () => true,
      isLoading: false,
    };
  }
  return context;
}

export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro+";
    case "teams":
      return "Teams";
  }
}

export function getUpgradeTierLabel(currentTier: SubscriptionTier): string {
  switch (currentTier) {
    case "starter":
      return "Pro+";
    case "pro":
      return "Teams";
    case "teams":
      return "Teams";
  }
}
