import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNoteStore, useAuthStore } from '../store';
import { notesAPI, foldersAPI, tagsAPI } from '../api';
import { ArrowLeft, Save, Folder, Tag, X, Loader2 } from 'lucide-react';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { currentNote, setCurrentNote, addNote, updateNote } = useNoteStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folderId: '',
    tagIds: [],
  });

  useEffect(() => {
    loadFoldersAndTags();
    if (id && id !== 'new') {
      loadNote();
    }
  }, [id]);

  const loadFoldersAndTags = async () => {
    try {
      const [foldersRes, tagsRes] = await Promise.all([
        foldersAPI.getAll(),
        tagsAPI.getAll(),
      ]);
      if (foldersRes.data.success) setFolders(foldersRes.data.data);
      if (tagsRes.data.success) setTags(tagsRes.data.data);
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const loadNote = async () => {
    try {
      setLoading(true);
      const res = await notesAPI.getById(id);
      if (res.data.success) {
        const note = res.data.data;
        setCurrentNote(note);
        setFormData({
          title: note.title,
          content: note.content,
          folderId: note.folderId || '',
          tagIds: note.tags?.map(nt => nt.tag.id) || [],
        });
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
      alert('加载笔记失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        folderId: formData.folderId || null,
      };

      if (id && id !== 'new') {
        const res = await notesAPI.update(id, data);
        if (res.data.success) {
          updateNote(res.data.data);
          alert('笔记已更新');
        }
      } else {
        const res = await notesAPI.create(data);
        if (res.data.success) {
          addNote(res.data.data);
          navigate(`/notes/${res.data.data.id}`);
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.includes(tagId)
        ? formData.tagIds.filter(id => id !== tagId)
        : [...formData.tagIds, tagId],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {id && id !== 'new' ? '编辑笔记' : '新建笔记'}
            </h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.title.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="笔记标题"
            className="text-3xl font-bold w-full border-none bg-transparent focus:outline-none 
                       placeholder:text-gray-300"
            required
          />

          {/* Folder & Tags */}
          <div className="flex flex-wrap gap-4">
            {/* Folder Selector */}
            <div className="relative">
              <select
                value={formData.folderId}
                onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                className="input-field pr-10 w-48"
              >
                <option value="">选择文件夹</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <Folder className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Tags */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400" />
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 
                               transition-all ${
                                 formData.tagIds.includes(tag.id)
                                   ? 'text-white'
                                   : 'hover:opacity-80'
                               }`}
                    style={{ 
                      backgroundColor: formData.tagIds.includes(tag.id) ? tag.color : `${tag.color}30`,
                      color: formData.tagIds.includes(tag.id) ? '#fff' : tag.color
                    }}
                  >
                    {tag.name}
                    {formData.tagIds.includes(tag.id) && (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="开始记录你的想法..."
            className="w-full h-96 p-4 bg-white border border-gray-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       resize-none text-gray-700 leading-relaxed"
          />
        </form>
      </main>
    </div>
  );
}
