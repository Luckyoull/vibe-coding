import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNoteStore } from '../store';
import { notesAPI, foldersAPI, tagsAPI } from '../api';
import { 
  Book, Folder, Tag, Search, Plus, Trash2, FileText,
  Menu, X, LogOut, Settings, RotateCcw, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const { 
    notes, setNotes, folders, setFolders, tags, setTags,
    searchQuery, setSearchQuery, selectedFolderId, setSelectedFolderId,
    selectedTagId, setSelectedTagId, addNote, removeNote
  } = useNoteStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('notes');
  const [deletedNotes, setDeletedNotes] = useState([]);

  useEffect(() => {
    loadData();
  }, [selectedFolderId, selectedTagId, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesRes, foldersRes, tagsRes] = await Promise.all([
        notesAPI.getAll({ 
          folderId: selectedFolderId, 
          tagId: selectedTagId,
          search: searchQuery || undefined 
        }),
        foldersAPI.getTree(),
        tagsAPI.getAll(),
      ]);

      if (notesRes.data.success) setNotes(notesRes.data.data.notes);
      if (foldersRes.data.success) setFolders(foldersRes.data.data);
      if (tagsRes.data.success) setTags(tagsRes.data.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedNotes = async () => {
    try {
      const res = await notesAPI.getDeleted();
      if (res.data.success) {
        setDeletedNotes(res.data.data);
      }
    } catch (error) {
      console.error('加载回收站失败:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  const handleNoteClick = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个笔记吗？')) return;
    
    try {
      await notesAPI.delete(noteId);
      removeNote(noteId);
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleRestoreNote = async (noteId) => {
    try {
      await notesAPI.restore(noteId);
      await loadDeletedNotes();
      await loadData();
    } catch (error) {
      alert('恢复失败');
    }
  };

  const handlePermanentDelete = async (noteId) => {
    if (!confirm('确定要永久删除吗？此操作不可恢复！')) return;
    
    try {
      await notesAPI.permanentDelete(noteId);
      await loadDeletedNotes();
    } catch (error) {
      alert('删除失败');
    }
  };

  const clearFilters = () => {
    setSelectedFolderId(null);
    setSelectedTagId(null);
    setSearchQuery('');
  };

  const FolderTree = ({ folders, level = 0 }) => {
    return (
      <div className="space-y-1">
        {folders.map((folder) => (
          <div key={folder.id}>
            <button
              onClick={() => setSelectedFolderId(
                selectedFolderId === folder.id ? null : folder.id
              )}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                         transition-colors ${
                           selectedFolderId === folder.id
                             ? 'bg-primary-100 text-primary-700'
                             : 'hover:bg-gray-100 text-gray-700'
                         }`}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
              <Folder className="w-4 h-4" />
              <span className="flex-1 text-left truncate">{folder.name}</span>
              <span className="text-xs text-gray-400">{folder._count?.notes || 0}</span>
            </button>
            {folder.children?.length > 0 && (
              <FolderTree folders={folder.children} level={level + 1} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">知识管理系统</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索笔记..."
                className="input-field pl-10 w-64"
              />
            </div>
            
            <button onClick={handleCreateNote} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新建笔记
            </button>

            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 
                          transform transition-transform duration-200 z-10
                          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 space-y-6 overflow-y-auto h-full">
            <nav className="space-y-1">
              <button
                onClick={() => { setView('notes'); clearFilters(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                           transition-colors ${
                             view === 'notes' && !selectedFolderId && !selectedTagId
                               ? 'bg-primary-100 text-primary-700'
                               : 'hover:bg-gray-100 text-gray-700'
                           }`}
              >
                <FileText className="w-4 h-4" />
                全部笔记
                <span className="ml-auto text-xs text-gray-400">{notes.length}</span>
              </button>
              
              <button
                onClick={() => { setView('trash'); loadDeletedNotes(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                           transition-colors ${
                             view === 'trash'
                               ? 'bg-primary-100 text-primary-700'
                               : 'hover:bg-gray-100 text-gray-700'
                           }`}
              >
                <Trash2 className="w-4 h-4" />
                回收站
                <span className="ml-auto text-xs text-gray-400">{deletedNotes.length}</span>
              </button>
            </nav>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                文件夹
              </h3>
              <FolderTree folders={folders} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                标签
              </h3>
              <div className="space-y-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagId(
                      selectedTagId === tag.id ? null : tag.id
                    )}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                               transition-colors ${
                                 selectedTagId === tag.id
                                   ? 'bg-primary-100 text-primary-700'
                                   : 'hover:bg-gray-100 text-gray-700'
                               }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-left truncate">{tag.name}</span>
                    <span className="text-xs text-gray-400">{tag._count?.notes || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-6 transition-all duration-200 ${sidebarOpen ? 'ml-64' : ''}`}>
          {view === 'trash' ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">回收站</h2>
              {deletedNotes.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">回收站为空</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedNotes.map((note) => (
                    <div key={note.id} className="card flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{note.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          删除于 {new Date(note.deletedAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestoreNote(note.originalNoteId)}
                          className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                          title="恢复"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(note.originalNoteId)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          title="永久删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {(selectedFolderId || selectedTagId || searchQuery) && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">筛选:</span>
                  {selectedFolderId && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      文件夹
                    </span>
                  )}
                  {selectedTagId && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      标签
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      "{searchQuery}"
                    </span>
                  )}
                  <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700">
                    清除
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery ? '没有找到匹配的笔记' : '还没有笔记，创建一个吧！'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteClick(note.id)}
                      className="card cursor-pointer hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                        <button
                          onClick={(e) => handleDeleteNote(e, note.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {note.content || '无内容'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {note.folder && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Folder className="w-3 h-3" />
                              {note.folder.name}
                            </span>
                          )}
                          {note.tags?.slice(0, 3).map((nt) => (
                            <span
                              key={nt.tag.id}
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ 
                                backgroundColor: `${nt.tag.color}20`,
                                color: nt.tag.color
                              }}
                            >
                              {nt.tag.name}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
