"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../hooks/useAuth';
import { useUserProfile } from '../../../src/hooks/useUserProfile';
import { useAdminAccess } from '../../../src/hooks/useAdminAccess';
import { fetchPendingSubmissions, reviewSubmission, getSubmissionImageUrl, AdminSubmissionItem } from '../../../src/services/admin/reviewService';
import { LoadingSkeleton } from '../../../src/components/ui/LoadingSkeleton';

export default function AdminReviewPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter(); 
  const { profile, loading: profileLoading } = useUserProfile();

  const [items, setItems] = useState<AdminSubmissionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterChallengeId, setFilterChallengeId] = useState('');
  const [limit] = useState(10);

  const isAdmin = useAdminAccess(profile?.isAdmin);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
      return;
    }
  }, [loading, isAuthenticated, router]);

  const loadPage = useCallback(async (p = 1) => {
    try {
      setBusy(true);
      setError(null);
      const data = await fetchPendingSubmissions({ page: p, limit, challengeId: filterChallengeId || undefined });
      setItems(data.submissions);
      setTotalPages(data.pagination.totalPages);
      setPage(data.pagination.currentPage);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pending submissions');
    } finally {
      setBusy(false);
    }
  }, [limit, filterChallengeId]);

  useEffect(() => { loadPage(1); }, [loadPage, filterChallengeId]);

  const handleReview = async (submissionId: string, status: 'APPROVED' | 'REJECTED', comments?: string) => {
    try {
      setBusy(true);
      const res = await reviewSubmission(submissionId, status, comments);
      if (!res.success) throw new Error(res.message);
      await loadPage(page);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  };

  if (loading || profileLoading || !isAuthenticated) return <LoadingSkeleton count={3} />;
  if (!isAdmin) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-lg">Admin access required</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-[#FF5757] rounded">Go back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Pending Submissions</h1>
          <p className="text-sm text-gray-400">Review and approve/reject user proofs</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Filter by Challenge ID"
            value={filterChallengeId}
            onChange={(e) => setFilterChallengeId(e.target.value)}
            className="px-3 py-2 rounded bg-[#1c1c1e] border border-[#2a2a2a] text-sm"
          />
          <button onClick={() => loadPage(1)} className="px-3 py-2 rounded bg-[#2a2a2a] text-sm">Refresh</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded">{error}</div>
      )}

      {busy && items.length === 0 ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <div key={s.id} className="rounded-lg bg-[#121214] border border-[#2a2a2a] overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
                <div className="col-span-1">
                  <div className="w-full h-full max-h-64 bg-[#0f0f0f] flex items-center justify-center relative">
                    <Image
                      src={getSubmissionImageUrl(s.imageUrl)}
                      alt="submission"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="col-span-2 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Submitted</p>
                      <p className="text-sm">{new Date(s.submissionDate).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.urgency === 'high' ? 'bg-red-500/30 text-red-300' : s.urgency === 'medium' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-green-500/30 text-green-300'}`}>{s.urgency}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">User</p>
                      <p>{s.user.name || s.user.email || s.user.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Challenge</p>
                      <p>{s.challenge.title}</p>
                    </div>
                  </div>
                  {s.description && (
                    <div>
                      <p className="text-gray-400 text-sm">Description</p>
                      <p className="text-sm">{s.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <textarea id={`c-${s.id}`} placeholder="Review comments (optional)" className="flex-1 bg-[#1c1c1e] border border-[#2a2a2a] rounded px-3 py-2 text-sm" />
                    <button disabled={busy} onClick={() => handleReview(s.id, 'REJECTED', (document.getElementById(`c-${s.id}`) as HTMLTextAreaElement)?.value)} className="px-3 py-2 bg-red-600 rounded text-sm disabled:opacity-50">Reject</button>
                    <button disabled={busy} onClick={() => handleReview(s.id, 'APPROVED', (document.getElementById(`c-${s.id}`) as HTMLTextAreaElement)?.value)} className="px-3 py-2 bg-green-600 rounded text-sm disabled:opacity-50">Approve</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button disabled={busy || page <= 1} onClick={() => loadPage(page - 1)} className="px-4 py-2 bg-[#1c1c1e] border border-[#2a2a2a] rounded disabled:opacity-50">Prev</button>
        <p className="text-sm text-gray-400">Page {page} / {totalPages}</p>
        <button disabled={busy || page >= totalPages} onClick={() => loadPage(page + 1)} className="px-4 py-2 bg-[#1c1c1e] border border-[#2a2a2a] rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
