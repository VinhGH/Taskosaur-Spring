import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QRCodeDisplay from '@/components/chat/QRCodeDisplay';
import {
  Hash,
  Lock,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JoinChannelPage() {
  const router = useRouter();
  const { inviteCode } = router.query;
  const { isAuthenticated } = useAuth();
  const isAuth = isAuthenticated();

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [joinedChannel, setJoinedChannel] = useState<any>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleJoin = async () => {
    if (!inviteCode || typeof inviteCode !== 'string') return;
    if (!isAuth) {
      router.push(`/login?redirect=/join/${inviteCode}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/chat/channels/join-by-code/${inviteCode}`, {
        message: message.trim() || undefined,
      });
      const { status, channel } = res.data;
      setResultStatus(status);
      setJoinedChannel(channel);

      if (status === 'JOINED_SUCCESSFULLY' || status === 'ALREADY_MEMBER') {
        toast.success(`Đã tham gia #${channel.name}`);
        // Redirect after 1.5s
        setTimeout(() => {
          if (channel.projectId) {
            router.push(`/${channel.workspaceId}/${channel.projectId}/chat`);
          } else {
            router.push(`/${channel.workspaceId}/chat`);
          }
        }, 1500);
      } else if (status === 'REQUEST_SUBMITTED') {
        toast.info('Yêu cầu tham gia đã gửi tới Quản trị viên');
      } else if (status === 'REQUEST_ALREADY_PENDING') {
        toast.warning('Bạn đã có yêu cầu đang chờ duyệt');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Mã mời không hợp lệ hoặc đã hết hạn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mời tham gia Kênh Trò Chuyện | Taskosaur</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#161822] border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-6">
          {/* Logo / Header */}
          <div className="space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <Hash size={28} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Lời Mời Tham Gia Kênh
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Bạn được mời tham gia vào kênh cộng tác trên Taskosaur Platform
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <QRCodeDisplay value={currentUrl} size={180} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-mono">
              Mã mời: {inviteCode}
            </span>
          </div>

          {/* State 1: Successfully Joined */}
          {resultStatus === 'JOINED_SUCCESSFULLY' || resultStatus === 'ALREADY_MEMBER' ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-sm">
                <CheckCircle2 size={18} />
                <span>Bạn đã là thành viên của kênh!</span>
              </div>
              <p className="text-xs opacity-80">
                Đang chuyển hướng tới giao diện trò chuyện...
              </p>
            </div>
          ) : resultStatus === 'REQUEST_SUBMITTED' || resultStatus === 'REQUEST_ALREADY_PENDING' ? (
            /* State 2: Approval Pending */
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-sm">
                <Clock size={18} />
                <span>Yêu cầu đang chờ phê duyệt</span>
              </div>
              <p className="text-xs opacity-90">
                Quản trị viên kênh sẽ sớm xem xét yêu cầu của bạn. Vui lòng kiểm tra lại sau!
              </p>
            </div>
          ) : (
            /* State 3: Join Action Form */
            <div className="space-y-3 pt-1 text-left">
              {isAuth ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      Lời nhắn gửi Quản trị viên (nếu cần xét duyệt):
                    </label>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Chào admin, mình là thành viên team..."
                      className="text-xs bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleJoin}
                    disabled={submitting}
                    className="w-full gap-2 text-sm font-semibold h-10 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? 'Đang xử lý...' : 'Tham gia Kênh ngay'}
                    <ArrowRight size={15} />
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Bạn cần đăng nhập vào tài khoản Taskosaur để tham gia kênh này.
                  </p>
                  <Button
                    type="button"
                    onClick={() => router.push(`/login?redirect=/join/${inviteCode}`)}
                    className="w-full gap-2 text-sm font-semibold h-10 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <LogIn size={15} />
                    Đăng nhập để tham gia
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
