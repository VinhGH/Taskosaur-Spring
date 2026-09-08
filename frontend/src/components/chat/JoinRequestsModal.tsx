import React, { useState } from 'react';
import { ChannelJoinRequest } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, Check, X, ShieldAlert, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface JoinRequestsModalProps {
  channelName: string;
  isOpen: boolean;
  onClose: () => void;
  requests: ChannelJoinRequest[];
  onReview: (requestId: string, approve: boolean) => Promise<void>;
}

export default function JoinRequestsModal({
  channelName,
  isOpen,
  onClose,
  requests,
  onReview,
}: JoinRequestsModalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, approve: boolean) => {
    setProcessingId(requestId);
    try {
      await onReview(requestId, approve);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#181a22] text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              Yêu cầu tham gia #{channelName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Danh sách các thành viên đang chờ phê duyệt để tham gia vào kênh này.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {requests.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <ShieldAlert size={36} className="text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Không có yêu cầu chờ duyệt nào</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs">
                Các yêu cầu tham gia mới sẽ xuất hiện tại đây khi người dùng quét mã QR hoặc truy cập link.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/80 transition-colors shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="w-8 h-8 border border-gray-200 dark:border-neutral-800 shrink-0 mt-0.5">
                    <AvatarImage src={req.userAvatar || undefined} />
                    <AvatarFallback className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                      {req.userName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {req.userName}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-400 flex items-center gap-0.5">
                        <Clock size={10} />
                        {dayjs(req.createdAt).fromNow()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{req.userEmail}</p>
                    {req.message && (
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-1 italic bg-gray-50 dark:bg-neutral-900 p-1.5 rounded border border-gray-200 dark:border-neutral-800">
                        &quot;{req.message}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(req.id, false)}
                    disabled={processingId === req.id}
                    className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                  >
                    <X size={13} className="mr-0.5" />
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAction(req.id, true)}
                    disabled={processingId === req.id}
                    className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
                  >
                    <Check size={13} />
                    Duyệt
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-neutral-800 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
