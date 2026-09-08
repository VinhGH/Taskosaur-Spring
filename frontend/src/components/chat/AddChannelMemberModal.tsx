import React, { useState, useEffect, useMemo } from 'react';
import { EligibleMember } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Search, Check, Users, Building2, FolderKanban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddChannelMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  channelId: string | null;
  onGetEligibleMembers: (channelId: string) => Promise<EligibleMember[]>;
  onAddMembers: (channelId: string, userIds: string[]) => Promise<void>;
}

export default function AddChannelMemberModal({
  isOpen,
  onClose,
  channelName,
  channelId,
  onGetEligibleMembers,
  onAddMembers,
}: AddChannelMemberModalProps) {
  const [candidates, setCandidates] = useState<EligibleMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && channelId) {
      setLoading(true);
      setSearch('');
      setSelectedIds([]);
      onGetEligibleMembers(channelId)
        .then((data) => {
          setCandidates(data || []);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, channelId, onGetEligibleMembers]);

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates;
    const query = search.toLowerCase().trim();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
    );
  }, [candidates, search]);

  const handleToggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || selectedIds.length === 0) return;

    setSubmitting(true);
    try {
      await onAddMembers(channelId, selectedIds);
      onClose();
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      // Error is handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 bg-white dark:bg-[#181a22] text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
        <DialogHeader className="p-5 pb-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/80 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                Thêm thành viên vào #{channelName}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Mời đồng nghiệp trong Workspace hoặc Dự án tham gia kênh trò chuyện này.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Search Box & Quick Controls */}
          <div className="p-3.5 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email đồng nghiệp..."
                className="pl-8 text-xs bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
            {filteredCandidates.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white shrink-0 h-9"
              >
                {selectedIds.length === filteredCandidates.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
              </Button>
            )}
          </div>

          {/* Candidates List */}
          <div className="p-3.5 space-y-2 max-h-[340px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400 dark:text-gray-500 text-xs">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                <span>Đang tải danh sách thành viên...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-500">
                <Users size={32} className="opacity-40 mb-2" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {search ? 'Không tìm thấy ai phù hợp' : 'Không có thành viên mới để thêm'}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  {search
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Tất cả thành viên trong Workspace hoặc Dự án đã có mặt trong kênh này.'}
                </p>
              </div>
            ) : (
              filteredCandidates.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                const isProject = user.source === 'PROJECT';

                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleSelect(user.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10 dark:border-blue-500/50 shadow-xs'
                        : 'border-gray-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 hover:bg-gray-50 dark:hover:bg-neutral-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      <Avatar className="w-8 h-8 border border-gray-200 dark:border-neutral-800">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs font-semibold uppercase bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          {user.name ? user.name.substring(0, 2) : 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {user.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium flex items-center gap-1 border shrink-0 ${
                              isProject
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                            }`}
                          >
                            {isProject ? <FolderKanban size={10} /> : <Building2 size={10} />}
                            {isProject ? 'Dự án' : 'Workspace'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50/60 dark:bg-neutral-900/30 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Đã chọn: <strong className="text-gray-900 dark:text-white">{selectedIds.length}</strong> người
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || selectedIds.length === 0}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <UserPlus size={13} />
                    Thêm vào kênh
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
