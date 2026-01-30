import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadService, Lead } from '../lib/leadService'

// Query keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...leadKeys.lists(), filters] as const,
  paginated: (filters: Record<string, any>) => [...leadKeys.all, 'paginated', filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  notes: (leadId: string) => [...leadKeys.all, 'notes', leadId] as const,
  stats: () => [...leadKeys.all, 'stats'] as const,
}

// Fetch leads with optional filters
export function useLeads(filters?: {
  status?: string
  minScore?: number
  state?: string
  stormId?: string
  limit?: number
}) {
  return useQuery({
    queryKey: leadKeys.list(filters || {}),
    queryFn: () => leadService.getLeads(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch paginated leads
export function useLeadsPaginated(filters?: {
  status?: string
  minScore?: number
  state?: string
  stormId?: string
  page?: number
  pageSize?: number
  sortBy?: 'lead_score' | 'created_at' | 'property_value'
  sortOrder?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: leadKeys.paginated(filters || {}),
    queryFn: () => leadService.getLeadsPaginated(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  })
}

// Fetch single lead
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadService.getLead(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Fetch lead notes
export function useLeadNotes(leadId: string) {
  return useQuery({
    queryKey: leadKeys.notes(leadId),
    queryFn: () => leadService.getLeadNotes(leadId),
    enabled: !!leadId,
    staleTime: 2 * 60 * 1000,
  })
}

// Fetch lead stats
export function useLeadStats() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: () => leadService.getStats(),
    staleTime: 5 * 60 * 1000,
  })
}

// Update lead status mutation
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) =>
      leadService.updateLeadStatus(id, status),
    onSuccess: (updatedLead) => {
      // Update the specific lead in cache
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead)
      
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() })
    },
  })
}

// Update lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      leadService.updateLead(id, updates),
    onSuccess: (updatedLead) => {
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead)
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

// Create lead mutation
export function useCreateLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) =>
      leadService.createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() })
    },
  })
}

// Delete lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() })
    },
  })
}

// Add lead note mutation
export function useAddLeadNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ leadId, content }: { leadId: string; content: string }) =>
      leadService.addLeadNote(leadId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.notes(variables.leadId) })
    },
  })
}

// Delete lead note mutation
export function useDeleteLeadNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ noteId, leadId }: { noteId: string; leadId: string }) =>
      leadService.deleteLeadNote(noteId).then(() => leadId),
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.notes(leadId) })
    },
  })
}
