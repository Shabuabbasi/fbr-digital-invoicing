import { useCallback, useEffect, useState } from "react";
import type { Paginated } from "../types/api";
import { extractErrorMessage } from "../services/api/http";

export function usePaginatedList<T, P extends { page?: number; limit?: number }>(
  fetcher: (params: P) => Promise<Paginated<T>>,
  params: P,
) {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetcher(JSON.parse(paramsKey))
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}
