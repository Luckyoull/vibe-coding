import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'kms-auth-storage',
    }
  )
);

export const useNoteStore = create((set) => ({
  notes: [],
  currentNote: null,
  folders: [],
  tags: [],
  searchQuery: '',
  selectedFolderId: null,
  selectedTagId: null,

  setNotes: (notes) => set({ notes }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setFolders: (folders) => set({ folders }),
  setTags: (tags) => set({ tags }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSelectedTagId: (id) => set({ selectedTagId: id }),
  
  addNote: (note) => set((state) => ({ 
    notes: [note, ...state.notes] 
  })),
  
  updateNote: (updatedNote) => set((state) => ({
    notes: state.notes.map(n => n.id === updatedNote.id ? updatedNote : n),
    currentNote: state.currentNote?.id === updatedNote.id ? updatedNote : state.currentNote,
  })),
  
  removeNote: (noteId) => set((state) => ({
    notes: state.notes.filter(n => n.id !== noteId),
    currentNote: state.currentNote?.id === noteId ? null : state.currentNote,
  })),
}));
