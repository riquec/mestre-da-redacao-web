declare module '@/hooks/use-professor-proposals' {
  export function useProfessorProposals(): {
    proposals: any[];
    loading: boolean;
    error: string | null;
  }
}

declare module '@/hooks/use-auth' {
  export function useAuth(): {
    user: any;
    loading: boolean;
  }
} 