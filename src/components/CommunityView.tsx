import { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, Flame, ThumbsUp, Plus, Bookmark, Eye, Trophy, Zap, Shield, Star } from 'lucide-react';
import { DiscussionPost, Comment, CommunityMember } from '../types';
import { sgtAgent } from '../agent';
import { useAuth } from './AuthContext';

interface CommunityViewProps {
  onSelectAsset: (id: string) => void;
}

export default function CommunityView({ onSelectAsset }: CommunityViewProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [communityTab, setCommunityTab] = useState<'discussions' | 'members' | 'settings'>('discussions');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Profile preferences
  const [settingsName, setSettingsName] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsBadge, setSettingsBadge] = useState('Retail Scout');
  const [settingsIsPublic, setSettingsIsPublic] = useState(true);
  const [settingsColor, setSettingsColor] = useState('bg-[#FE8C00]/10 text-[#FE8C00] border-[#FE8C00]/20');

  const [activeSector, setActiveSector] = useState<'all' | 'banks' | 'tech' | 'crypto' | 'general'>('all');
  const [loading, setLoading] = useState(true);
  
  // New discussion post form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSector, setNewSector] = useState<'banks' | 'tech' | 'crypto' | 'general'>('general');
  const [newReaction, setNewReaction] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');

  // Saved/bookmarked debates
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sgt_saved_debates') || '[]');
    } catch { return []; }
  });

  // Presence indicators (simulated)
  const [liveViewers, setLiveViewers] = useState<Record<string, number>>({});
  
  // Comments/threads expansion
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<{ [postId: string]: string }>({});
  const [newCommentReaction, setNewCommentReaction] = useState<'bullish' | 'bearish' | 'neutral' | null>(null);

  const fetchPosts = async () => {
    try {
      const result = await sgtAgent.dispatch({ type: 'FETCH_DISCUSSIONS' });
      setPosts(result.posts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const result = await sgtAgent.dispatch({ type: 'FETCH_MEMBERS' });
      setMembers(result.members);
    } catch (e) {
      console.error(e);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user || !user.email) return;
    try {
      const result = await sgtAgent.dispatch({
        type: 'SAVE_PROFILE',
        data: {
          email: user.email,
          displayName: settingsName || user.email.split('@')[0],
          bio: settingsBio,
          badge: settingsBadge,
          isPublic: settingsIsPublic,
          avatarColor: settingsColor,
          uid: user.uid
        }
      });
      if (result.success) {
        const customEvent = new CustomEvent('show-toast', {
          detail: {
            message: `Profile settings updated successfully!`,
            type: 'success'
          }
        });
        window.dispatchEvent(customEvent);
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchMembers();
    const timer = setInterval(() => {
      fetchPosts();
      fetchMembers();
    }, 15000); // Polling forum active counts and members list
    return () => clearInterval(timer);
  }, []);

  // Autofill forms on user / members sync
  useEffect(() => {
    if (user && members.length > 0) {
      const self = members.find(m => m.email.toLowerCase() === user.email?.toLowerCase());
      if (self) {
        setSettingsName(self.displayName);
        setSettingsBio(self.bio);
        setSettingsBadge(self.badge);
        setSettingsIsPublic(self.isPublic);
        setSettingsColor(self.avatarColor);
      } else {
        setSettingsName(user.displayName || '');
        setSettingsBio("SGT community trader. Specializing in high-conviction signals.");
      }
    }
  }, [user, members]);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const result = await sgtAgent.dispatch({
        type: 'CREATE_DISCUSSION',
        data: {
          sector: newSector,
          title: newTitle,
          content: newContent,
          authorName: user?.displayName || "Alpha Retailer",
          authorEmail: user?.email || "guest@sgtshow.com",
          userReaction: newReaction
        }
      });
      if (result.success) {
        setNewTitle('');
        setNewContent('');
        setShowCreateModal(false);
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newCommentTexts[postId];
    if (!text || !text.trim()) return;

    try {
      const result = await sgtAgent.dispatch({
        type: 'ADD_COMMENT',
        postId,
        data: {
          content: text.trim(),
          authorName: user?.displayName || "Market Observer",
          authorEmail: user?.email || "guest@sgtshow.com",
          reaction: newCommentReaction
        }
      });
      if (result.success) {
        setNewCommentTexts({
          ...newCommentTexts,
          [postId]: ''
        });
        setNewCommentReaction(null);
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate live presence viewers for each post
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const next = { ...prev };
        posts.forEach(p => {
          // Random viewer count between 1 and 12 per post
          next[p.id] = Math.floor(Math.random() * 11) + 1;
        });
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [posts]);

  // Save/unsave debate
  const toggleSaved = (postId: string) => {
    setSavedPostIds(prev => {
      const next = prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId];
      localStorage.setItem('sgt_saved_debates', JSON.stringify(next));
      
      const toastEvt = new CustomEvent('show-toast', {
        detail: {
          message: next.includes(postId) ? 'Debate saved to your research board' : 'Removed from saved debates',
          type: 'info'
        }
      });
      window.dispatchEvent(toastEvt);
      return next;
    });
  };

  // XP badge mapping
  const getXpBadge = (member: CommunityMember) => {
    const totalComments = posts.filter(p => p.comments.some(c => c.authorEmail === member.email)).length;
    if (totalComments > 10) return { icon: '🏆', label: 'Elite Analyst', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (totalComments > 5) return { icon: '⭐', label: 'Verified Scout', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (totalComments > 2) return { icon: '📡', label: 'Active Researcher', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
    return { icon: '🟢', label: 'Community Member', color: 'text-zinc-400 bg-zinc-800/30 border-zinc-800/40' };
  };

  // Reaction emoji picker
  const EMOJI_REACTIONS = ['👍', '🔥', '💡', '📉', '📈', '👀', '🚀', '🧐'];
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const [postEmojiReactions, setPostEmojiReactions] = useState<Record<string, Record<string, number>>>({});

  const handleEmojiReact = (postId: string, emoji: string) => {
    setPostEmojiReactions(prev => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        [emoji]: (prev[postId]?.[emoji] || 0) + 1
      }
    }));
    setEmojiPickerOpen(null);
  };

  const handlePostReaction = async (postId: string, reactionType: 'bullish' | 'bearish' | 'neutral') => {
    // Optimistic or simple increment logic:
    // We mock reaction increment client-side, in proper full implementation, this calls PUT.
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [reactionType]: p.reactions[reactionType] + 1
          }
        };
      }
      return p;
    }));
  };

  const filteredPosts = activeSector === 'all' 
    ? posts 
    : posts.filter(p => p.sector === activeSector);

  const sectorLabels = {
    all: "ALL THEMES",
    banks: "BANKING (NGX)",
    tech: "TECH & TELECOMS",
    crypto: "CRYPTOCURRENCIES",
    general: "MACRO & FOREX"
  };

  return (
    <div className="space-y-6 text-left">
      {/* Main Community Header */}
      <div>
        <h2 className="font-display text-base font-extrabold text-white tracking-wider uppercase flex items-center gap-1.5">
          <MessageSquare className="h-4.5 w-4.5 text-[#FE8C00]" />
          SGT Community Hub
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5 font-medium">Verify credentials, raise investment thesis discussions, and build public visibility.</p>
      </div>

      {/* Community Tab Navigation Menu */}
      <div className="flex border-b border-zinc-900 pb-0.5 gap-5">
        <button
          onClick={() => setCommunityTab('discussions')}
          className={`text-[11px] font-bold font-mono tracking-wider uppercase pb-2.5 border-b-2 transition-all cursor-pointer ${
            communityTab === 'discussions'
              ? 'border-[#FE8C00] text-white font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          💬 Forum Boards
        </button>
        <button
          onClick={() => setCommunityTab('members')}
          className={`text-[11px] font-bold font-mono tracking-wider uppercase pb-2.5 border-b-2 transition-all cursor-pointer ${
            communityTab === 'members'
              ? 'border-[#FE8C00] text-white font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          👥 Member Directory
        </button>
        <button
          onClick={() => setCommunityTab('settings')}
          className={`text-[11px] font-bold font-mono tracking-wider uppercase pb-2.5 border-b-2 transition-all cursor-pointer ${
            communityTab === 'settings'
              ? 'border-[#FE8C00] text-white font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          ⚙ My Profile settings
        </button>
      </div>

      {communityTab === 'discussions' && (
        <div className="space-y-6">
          {/* Sector Selection Hub */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto hide-scrollbar">
              {(['all', 'banks', 'tech', 'crypto', 'general'] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveSector(sec)}
                  className={`text-[9.5px] tracking-wider font-mono font-bold uppercase px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    activeSector === sec
                      ? 'border-[#FE8C00] bg-[#FE8C00]/10 text-[#FE8C00]'
                      : 'border-zinc-800 bg-zinc-90 w-full md:w-auto text-zinc-400 hover:text-white'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (!user) {
                  const customEvt = new CustomEvent('show-toast', {
                    detail: { message: "Please sign in or join the community to raise a discussion topic.", type: 'info' }
                  });
                  window.dispatchEvent(customEvt);
                  return;
                }
                setShowCreateModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-[#FE8C00] px-4.5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#E07B00] transition-colors cursor-pointer glow-accent"
            >
              <Plus className="h-4 w-4 text-zinc-950" /> Raise Discussion
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
              <p className="mt-4 text-xs text-zinc-400 font-mono">syncing forum rooms...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass-panel py-16 text-center text-zinc-500 text-xs">
              No conversations raised in {sectorLabels[activeSector]} yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                const totalReactions = post.reactions.bullish + post.reactions.bearish + post.reactions.neutral;
                const bullishRatio = totalReactions > 0 ? Math.round((post.reactions.bullish / totalReactions) * 100) : 0;

                return (
                  <div 
                    key={post.id} 
                    className="glass-panel p-5 space-y-4 relative hover:border-zinc-800 transition-all text-left"
                  >
                    <div className="flex items-start justify-between border-b border-zinc-900 db-opacity-40 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-[#FE8C00]/5 border border-[#FE8C00]/20 flex items-center justify-center text-xs font-black text-[#FE8C00]">
                          {post.authorName.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h3 
                            onClick={() => {
                              setExpandedPostId(isExpanded ? null : post.id);
                            }}
                            className="font-display text-sm font-bold text-white hover:text-[#FE8C00] transition-colors cursor-pointer leading-snug"
                          >
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium mt-0.5">
                            <span className="text-[#FE8C00] font-bold">@{post.authorName}</span>
                            <span>•</span>
                            <span className="uppercase font-mono text-[9px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500">
                              {post.sector}
                            </span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Sentiment Index */}
                      {totalReactions > 0 && (
                        <div className="text-right">
                          <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {bullishRatio}% BULLISH
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Post Body text */}
                    <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                      {post.content}
                    </p>

                    {/* AI Thread Synthesis */}
                    {post.aiSummary && (
                      <div className="rounded-xl bg-[#FE8C00]/5 border border-[#FE8C00]/10 p-3.5 flex items-start gap-2.5">
                        <Sparkles className="h-4.5 w-4.5 text-[#FE8C00] shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <span className="text-[9px] font-mono font-bold tracking-widest text-[#FE8C00] uppercase">
                            AI Debate Consensus Synthesis
                          </span>
                          <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed font-semibold">
                            {post.aiSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action panel metrics */}
                    <div className="flex items-center gap-4 text-xs h-9 border-t border-zinc-900/40 pt-3 text-zinc-500">
                      <button
                        onClick={() => {
                          setExpandedPostId(isExpanded ? null : post.id);
                        }}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold text-[11px]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {post.comments.length} Comments
                      </button>

                      <div className="flex items-center gap-1.5 border-l border-zinc-900 pl-4">
                        <button 
                          onClick={() => handlePostReaction(post.id, 'bullish')}
                          className="text-[10px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/10 px-2 py-1 rounded-md cursor-pointer"
                        >
                          👍 Bullish ({post.reactions.bullish})
                        </button>
                        <button 
                          onClick={() => handlePostReaction(post.id, 'bearish')}
                          className="text-[10px] font-mono uppercase font-bold text-rose-450 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 px-2 py-1 rounded-md cursor-pointer"
                        >
                          👎 Bearish ({post.reactions.bearish})
                        </button>
                      </div>

                      {/* Save/Bookmark debate button */}
                      <button
                        onClick={() => toggleSaved(post.id)}
                        className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                          savedPostIds.includes(post.id)
                            ? 'text-[#FE8C00] bg-[#FE8C00]/10 border-[#FE8C00]/30'
                            : 'text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                        title={savedPostIds.includes(post.id) ? 'Remove from saved debates' : 'Save debate to research board'}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${savedPostIds.includes(post.id) ? 'fill-[#FE8C00]' : ''}`} />
                        {savedPostIds.includes(post.id) ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    {/* Comments Expanded section */}
                    {isExpanded && (
                      <div className="border-t border-zinc-900/60 pt-4 mt-4 space-y-4">
                        <div className="space-y-3 pl-3 border-l-2 border-zinc-850">
                          {post.comments.map((com) => (
                            <div key={com.id} className="bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-900">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-300">@{com.authorName}</span>
                                {com.reaction && (
                                  <span className={`text-[8px] font-mono font-bold uppercase rounded px-1.5 py-0.5 ${
                                    com.reaction === 'bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                                    com.reaction === 'bearish' ? 'bg-rose-500/10 text-rose-403' : 'bg-zinc-800 text-zinc-400'
                                  }`}>
                                    {com.reaction}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-300 mt-1 pl-1 leading-normal font-medium">
                                {com.content}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Inline add replies */}
                        <div className="flex gap-2.5 items-center">
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex gap-1">
                              {(['bullish', 'bearish', 'neutral'] as const).map((re) => (
                                <button
                                  key={re}
                                  onClick={() => setNewCommentReaction(re === newCommentReaction ? null : re)}
                                  className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded transition-colors ${
                                    newCommentReaction === re 
                                      ? 'bg-[#FE8C00]/15 text-[#FE8C00] border border-[#FE8C00]/25' 
                                      : 'text-zinc-500 hover:text-white cursor-pointer'
                                  }`}
                                >
                                  {re}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={user ? "Add outlook comments to thread..." : "Sign in to add your comment..."}
                                disabled={!user}
                                value={newCommentTexts[post.id] || ''}
                                onChange={(e) => setNewCommentTexts({ ...newCommentTexts, [post.id]: e.target.value })}
                                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-95 px-4.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FE8C00] outline-none disabled:opacity-50"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!user}
                                className="p-2.5 rounded-xl bg-[#FE8C00] text-zinc-950 hover:bg-[#E07B00] disabled:opacity-55 cursor-pointer"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {communityTab === 'members' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xs font-black text-sky-400 uppercase tracking-wider font-mono">👥 Verifiable Community Scout Registry</h3>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium">Browse verified profiles, specific desk credentials, and macro stances of active SGT scouts.</p>
          </div>

          {membersLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border border-[#FE8C00] border-t-transparent animate-pulse" />
              <p className="text-[10px] text-zinc-500 font-mono mt-3">indexing registry logs...</p>
            </div>
          ) : members.filter(m => m.isPublic).length === 0 ? (
            <div className="glass-panel py-16 text-center text-zinc-500 text-xs">
              No public member records listed. Be the first to build visibility!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.filter(m => m.isPublic).map((member) => {
                const isSelf = user?.email?.toLowerCase() === member.email.toLowerCase();
                return (
                  <div 
                    key={member.uid} 
                    className={`glass-panel p-5 space-y-4 border transition-all flex flex-col justify-between ${
                      isSelf ? 'border-[#FE8C00]/40 bg-[#FE8C00]/[0.02]' : 'border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-11 w-11 rounded-xl border flex items-center justify-center text-sm font-black uppercase ${member.avatarColor || 'bg-zinc-900/10 text-zinc-400 border-zinc-800'}`}>
                            {member.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-display text-sm font-black text-white leading-tight flex items-center gap-1.5">
                              @{member.displayName}
                              {isSelf && <span className="text-[8px] px-1 bg-[#FE8C00]/10 border border-[#FE8C00]/30 rounded uppercase font-mono text-[#FE8C00]">YOU</span>}
                            </h4>
                            <span className="text-[9.5px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono font-black text-[#FE8C00] uppercase inline-block mt-1">
                              🛡️ {member.badge || 'Scout'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs text-zinc-300 mt-4 leading-relaxed font-semibold font-sans">
                        "{member.bio || 'New investor scout.'}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-90 w-full flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>STANCE: RETAIL DEFENSIVE</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        ● VERIFIED MEMBER
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {communityTab === 'settings' && (
        <div className="glass-panel p-6 space-y-6 max-w-xl animate-fade-in">
          <div>
            <h3 className="font-display text-xs font-black text-emerald-400 uppercase tracking-wider font-mono">⚙ profile vetting preferences</h3>
            <p className="text-[11px] text-zinc-400 mt-1">Configure your display alignment, choose appropriate desk credentials, and toggle profile directory visibility.</p>
          </div>

          {!user ? (
            <div className="rounded-xl border border-zinc-850 bg-zinc-90/10 p-6 text-center space-y-4">
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed font-semibold">
                You must be logged in to configure a public-facing investigator profile and toggle indexing list options.
              </p>
              <button
                onClick={() => {
                  const customEvent = new CustomEvent('open-auth-modal');
                  window.dispatchEvent(customEvent);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#FE8C00] text-zinc-950 font-bold text-xs uppercase hover:bg-[#E07B00] transition-all cursor-pointer inline-block"
              >
                Sign In / Join now
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-505 font-bold uppercase tracking-wider block">DISPLAY ALIAS</label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Sovereign Trader"
                    className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-95 px-4 py-2.5 text-xs text-white outline-none focus:border-[#FE8C00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-505 font-bold uppercase tracking-wider block">ACCREDITATION BADGE</label>
                  <select
                    value={settingsBadge}
                    onChange={(e) => setSettingsBadge(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-95 px-3.5 py-2.5 text-xs text-zinc-300 outline-none focus:border-[#FE8C00]"
                  >
                    <option value="Retail Scout">Retail Scout</option>
                    <option value="Tier-1 Bank Auditor">Tier-1 Bank Auditor</option>
                    <option value="Macro Specialist">Macro Specialist</option>
                    <option value="Liquidity Specialist">Liquidity Specialist</option>
                    <option value="General Speculator">General Speculator</option>
                    <option value="Sovereign Watcher">Sovereign Watcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-505 font-bold uppercase tracking-wider block">PERSONAL SCOUT BIO</label>
                <textarea
                  rows={3}
                  maxLength={150}
                  value={settingsBio}
                  onChange={(e) => setSettingsBio(e.target.value)}
                  placeholder="Explain your market interests (e.g., specialized on mid-cap NGX banks, OTC liquidity overlays...)"
                  className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-95 px-4 py-2.5 text-xs text-white resize-none outline-none focus:border-[#FE8C00]"
                />
                <p className="text-[9px] text-zinc-500 text-right mt-1 font-mono">{settingsBio.length}/150 characters</p>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-505 font-bold uppercase tracking-wider block mb-2">PICK KEY AMBIENCE THEME</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { style: 'bg-[#FE8C00]/10 text-white border-[#FE8C00]/20', name: 'Amber SGT' },
                    { style: 'bg-emerald-500/10 text-white border-emerald-500/20', name: 'Fintech Emerald' },
                    { style: 'bg-sky-500/10 text-white border-sky-500/20', name: 'Forex Blue' },
                    { style: 'bg-indigo-500/10 text-white border-indigo-500/20', name: 'Deep Indigo' },
                    { style: 'bg-rose-500/10 text-white border-rose-500/20', name: 'Protection Red' }
                  ].map((preset) => (
                    <button
                      key={preset.style}
                      type="button"
                      onClick={() => setSettingsColor(preset.style)}
                      className={`text-[9.5px] font-mono uppercase px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        settingsColor === preset.style
                          ? 'border-[#FE8C00] bg-zinc-90 text-white'
                          : 'border-zinc-900 bg-zinc-95/30 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="isPublicCheck"
                    checked={settingsIsPublic}
                    onChange={(e) => setSettingsIsPublic(e.target.checked)}
                    className="h-4.5 w-4.5 bg-zinc-95 border-zinc-800 rounded text-[#FE8C00] accent-[#FE8C00] cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="isPublicCheck" className="text-xs font-bold text-white cursor-pointer select-none">
                      Publish Profile Publicly to Directory
                    </label>
                    <p className="text-[9.5px] text-zinc-500 leading-normal">
                      When enabled, other SGT members can view your badge, bio, and stance. Uncheck to make your profile completely private.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#FE8C00] text-zinc-950 hover:bg-[#E07B00] text-xs font-bold transition-all cursor-pointer inline-block"
                >
                  Save settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raising Discussion Dialog modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/75 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto modal-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4.5 w-4.5 text-[#FE8C00]" />
                Raise Discussion Topic
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3.5 text-left">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 tracking-wider">TOPIC TITLE</label>
                <input 
                  type="text" 
                  placeholder="e.g. Is SOL flipping ETH transactional volumes?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-90 px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 tracking-wider">SECTOR AREA</label>
                  <select
                    value={newSector}
                    onChange={(e: any) => setNewSector(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-90 px-3.5 py-2.5 text-xs text-zinc-300"
                  >
                    <option value="banks">Banking (NGX)</option>
                    <option value="tech">Tech & Telecoms</option>
                    <option value="crypto">Crypto</option>
                    <option value="general">Macro / Forex</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 tracking-wider">MY OUTLOOK</label>
                  <select
                    value={newReaction}
                    onChange={(e: any) => setNewReaction(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-90 px-3.5 py-2.5 text-xs text-zinc-300"
                  >
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 tracking-wider">DISCUSSION BODY</label>
                <textarea 
                  rows={4}
                  placeholder="Explain your outlook catalysts simply so community members can reply..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-90 px-4 py-2.5 text-xs text-white resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#FE8C00] px-4.5 py-3 text-xs font-bold text-zinc-950 hover:bg-[#E07B00] cursor-pointer"
            >
              Raise Topic To Forum
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
