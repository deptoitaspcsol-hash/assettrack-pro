import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Usuario autenticado, compartido por toda la app.
 * Antes cada página y el Layout llamaban a base44.auth.me() por su cuenta (6 peticiones iguales).
 */
export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    currentUser: data ?? null,
    isLoadingUser: isLoading,
    isAdmin: data?.role === "admin",
  };
}
