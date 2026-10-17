"use client";

import { useEffect, useState } from "react";

type UseVehicleBrandsOptions = Readonly<{
  /** When provided (e.g. from server), skips the client fetch. */
  initialBrands?: readonly string[];
  enabled?: boolean;
}>;

type UseVehicleBrandsResult = Readonly<{
  brands: string[];
  isLoading: boolean;
  error: string | null;
}>;

export function useVehicleBrands({
  initialBrands,
  enabled = true,
}: UseVehicleBrandsOptions = {}): UseVehicleBrandsResult {
  const hasInitial = initialBrands != null;
  const [brands, setBrands] = useState<string[]>(
    initialBrands ? [...initialBrands] : [],
  );
  const [isLoading, setIsLoading] = useState(enabled && !hasInitial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialBrands) {
      setBrands([...initialBrands]);
      setIsLoading(false);
      setError(null);
    }
  }, [initialBrands]);

  useEffect(() => {
    if (!enabled || hasInitial) {
      return;
    }

    const controller = new AbortController();

    const loadBrands = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vehicles/brands", {
          method: "GET",
          cache: "force-cache",
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          success?: boolean;
          brands?: string[];
          message?: string;
        };

        if (!response.ok || !body.success || !Array.isArray(body.brands)) {
          throw new Error(body.message ?? "Unable to load brands.");
        }

        if (!controller.signal.aborted) {
          setBrands(body.brands);
        }
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(
          caught instanceof Error ? caught.message : "Unable to load brands.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadBrands();

    return () => controller.abort();
  }, [enabled, hasInitial]);

  return { brands, isLoading, error };
}
