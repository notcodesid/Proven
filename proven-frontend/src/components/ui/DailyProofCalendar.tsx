"use client"
import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { CalendarDay } from '../../services/proofService';
import { API_BASE_URL } from '../../config/api';

interface DailyProofCalendarProps {
  calendar: CalendarDay[];
  onUploadProof: (date: string) => void;
  isLoading?: boolean;
}

/**
 * ✅ OPTIMIZATION: Memoized helper functions to prevent recreation on every render
 */
const DailyProofCalendar: React.FC<DailyProofCalendarProps> = ({
  calendar,
  onUploadProof,
  isLoading = false
}) => {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Parse 'YYYY-MM-DD' as local time to avoid UTC shifting issues
  const parseLocalDate = useCallback((dateStr: string): Date => {
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr);
    if (m) {
      const y = Number(m[1]);
      const month = Number(m[2]);
      const day = Number(m[3]);
      return new Date(y, month - 1, day);
    }
    return new Date(dateStr);
  }, []);

  const getStatusIcon = useCallback((status: CalendarDay['status']) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'submitted':
        return '🟡';
      case 'rejected':
        return '❌';
      case 'not_submitted':
        return '⚪';
      case 'locked':
        return '🔒';
      default:
        return '⚪';
    }
  }, []);

  const getStatusColor = useCallback((status: CalendarDay['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 border-green-500';
      case 'submitted':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'rejected':
        return 'bg-red-500/20 border-red-500';
      case 'not_submitted':
        return 'bg-gray-500/20 border-gray-500';
      case 'locked':
        return 'bg-gray-300/10 border-gray-600';
      default:
        return 'bg-gray-500/20 border-gray-500';
    }
  }, []);

  const getStatusText = useCallback((status: CalendarDay['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      case 'not_submitted':
        return 'Not Submitted';
      case 'locked':
        return 'Future Date';
      default:
        return 'Unknown';
    }
  }, []);

  const getDayName = useCallback((dayOfWeek: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek];
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.getDate();
  }, [parseLocalDate]);

  const formatFullDate = useCallback((dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [parseLocalDate]);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Daily Progress</h3>
        <div className="text-sm text-gray-400">
          {calendar.filter(day => day.status === 'approved').length} / {calendar.length} days completed
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendar.map((day) => (
          <button
            key={day.date}
            onClick={() => setSelectedDay(day)}
            disabled={isLoading}
            className={`
              relative aspect-square p-2 rounded-lg border-2 transition-all duration-200
              ${getStatusColor(day.status)}
              ${day.isToday ? 'ring-2 ring-blue-500' : ''}
              ${!day.isFuture ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-50'}
              ${selectedDay?.date === day.date ? 'ring-2 ring-white' : ''}
            `}
          >
            {/* Day number */}
            <div className="text-xs font-medium text-white mb-1">
              {formatDate(day.date)}
            </div>
            
            {/* Status icon */}
            <div className="text-lg">
              {getStatusIcon(day.status)}
            </div>

            {/* Today indicator */}
            {day.isToday && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Upload Today Button */}
      {calendar.some(day => day.canSubmit) && (
        <div className="mt-6">
          <button
            onClick={() => {
              const today = calendar.find(day => day.canSubmit);
              if (today) onUploadProof(today.date);
            }}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#FF5757] to-[#FF7F50] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            📤 Upload Today&apos;s Proof
          </button>
        </div>
      )}

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {formatFullDate(selectedDay.date)}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(selectedDay.status)}</span>
                <div>
                  <p className="text-white font-medium">{getStatusText(selectedDay.status)}</p>
                  {selectedDay.isToday && <p className="text-blue-400 text-sm">Today</p>}
                </div>
              </div>

              {/* Submission details */}
              {selectedDay.submission && (
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Submitted:</p>
                    <p className="text-white">
                      {new Date(selectedDay.submission.submissionDate).toLocaleString()}
                    </p>
                  </div>

                  {selectedDay.submission.description && (
                    <div>
                      <p className="text-gray-400 text-sm">Description:</p>
                      <p className="text-white">{selectedDay.submission.description}</p>
                    </div>
                  )}

                  {selectedDay.submission.reviewComments && (
                    <div>
                      <p className="text-gray-400 text-sm">Review Comments:</p>
                      <p className="text-white">{selectedDay.submission.reviewComments}</p>
                    </div>
                  )}

                  {selectedDay.submission.imageUrl && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Proof Image:</p>
                      <div className="w-full max-h-[60vh] bg-[#0f0f0f] rounded-lg overflow-hidden flex items-center justify-center relative">
                        <Image
                          src={(function(){
                            const url = selectedDay.submission?.imageUrl || '';
                            if (!url) return '';
                            if (/^https?:\/\//i.test(url)) return url;
                            return `${API_BASE_URL}/storage/proof?path=${encodeURIComponent(url)}`;
                          })()}
                          alt="Proof submission"
                          fill
                          className="object-contain"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <a
                          href={(function(){
                            const url = selectedDay.submission?.imageUrl || '';
                            if (!url) return '#';
                            if (/^https?:\/\//i.test(url)) return url;
                            return `${API_BASE_URL}/storage/proof?path=${encodeURIComponent(url)}`;
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          View full size
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4">
                {selectedDay.canSubmit && (
                  <button
                    onClick={() => {
                      onUploadProof(selectedDay.date);
                      setSelectedDay(null);
                    }}
                    className="flex-1 py-2 bg-[#FF5757] text-white rounded-lg font-medium"
                  >
                    Upload Proof
                  </button>
                )}
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mt-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span>Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🟡</span>
            <span>Pending Review</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>Rejected</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⚪</span>
            <span>Not Submitted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProofCalendar; 