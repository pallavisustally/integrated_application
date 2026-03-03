'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const users: any[] = [];

export default function AdminDashboard() {
  const router = useRouter();
  const [usersData, setUsersData] = useState<any[]>([]);
  const [slotsBookedCount, setSlotsBookedCount] = useState<number>(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackModal, setFeedbackModal] = useState<{ text: string; facility: string } | null>(null);
  const itemsPerPage = 8;

  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || 'http://localhost:3001';

    const fetchApplications = async () => {
      try {
        setApiError(null);
        const res = await fetch(`${API_URL}/api/scope2-applications?limit=1000`);
        const data = await res.json();
        if (data && data.docs) {
          const mappedUsers = data.docs.map((doc: any) => ({
            id: doc.id,
            username: doc.facilityName || 'N/A',
            company: doc.facilityName || 'N/A',
            contact: '-',
            email: doc.email || '-',
            regDate: new Date(doc.createdAt).toISOString().split('T')[0],
            subDate: new Date(doc.createdAt).toISOString().split('T')[0],
            appDate: new Date(doc.updatedAt).toISOString().split('T')[0],
            status: doc.status === 'PENDING' ? 'Pending Review' : doc.status === 'IN_PROGRESS' ? 'In Progress' : doc.status === 'APPROVED' ? 'Approved' : doc.status === 'REJECTED' ? 'Rejected' : 'In Progress',
            statusColor: doc.status === 'PENDING' ? 'bg-orange-50 text-orange-500 border border-orange-200' :
              doc.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-500 border border-blue-200' :
                doc.status === 'APPROVED' ? 'bg-green-50 text-emerald-500 border border-emerald-200' :
                  doc.status === 'REJECTED' ? 'bg-red-50 text-red-500 border border-red-200' :
                    'bg-blue-50 text-blue-500 border border-blue-200',
            reviewLink: true,
            action: doc.status === 'PENDING' || doc.status === 'IN_PROGRESS' || !doc.status,
            feedback: doc.rejectionReason || '---',
            originalDoc: doc
          }));
          setUsersData(mappedUsers);
        }
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setApiError('Backend unreachable. Ensure Sustally is running: cd sustally && pnpm dev (port 3001).');
      }
    };

    const fetchSlotsBooked = async () => {
      try {
        const res = await fetch(`${API_URL}/api/slot-bookings?limit=0`);
        const data = await res.json();
        setSlotsBookedCount(data.totalDocs ?? 0);
      } catch (err) {
        console.error('Failed to fetch slot bookings:', err);
      }
    };

    fetchApplications();
    fetchSlotsBooked();
  }, []);

  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase().replace(' ', '-') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aValue = String(a[key as keyof typeof a]);
    const bValue = String(b[key as keyof typeof b]);

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="text-gray-500 ml-1.5 inline-block align-middle pb-0.5 opacity-80 font-extrabold text-[12px]">⇅</span>;
    }
    return (
      <span className="text-blue-700 ml-1.5 inline-block align-middle pb-0.5 font-black text-[14px]">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const handleApprove = async (id: number | string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/scope2-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      setUsersData(usersData.map(u =>
        u.id === id ? { ...u, status: 'Approved', statusColor: 'bg-green-50 text-emerald-500 border border-emerald-200', action: false } : u
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: number | string) => {
    const reason = window.prompt("Please enter the reason for rejection (feedback):");
    if (reason === null) return; // Action cancelled
    try {
      const API_URL = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/scope2-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason })
      });
      setUsersData(usersData.map(u =>
        u.id === id ? { ...u, status: 'Rejected', statusColor: 'bg-red-50 text-red-500 border border-red-200', action: false, feedback: reason } : u
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#f3f4f6] flex flex-col p-3 md:p-5 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 px-1 md:px-2 gap-3 md:gap-0 shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800">Scope 2 Emissions Admin Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Monitor and manage Scope-2 emissions assessments</p>
        </div>
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <Image src="/sustally-logo.png" alt="Sustally Logo" width={120} height={32} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
          <div className="border-l border-gray-300 pl-2 ml-2 text-[10px] text-gray-500 max-w-[120px] leading-tight font-medium hidden sm:block">
            Choose Sustally as your<br /> sustainability ally
          </div>
        </div>
      </header>

      {apiError && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Cannot connect to backend</p>
            <p className="mt-1">{apiError}</p>
            <p className="mt-2 text-amber-700">Start Sustally in a separate terminal: <code className="bg-amber-100 px-1.5 py-0.5 rounded">cd sustally && pnpm dev</code></p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-4 overflow-y-auto shrink-0 pb-1 lg:pb-0 lg:overflow-visible">
        {[
          { title: 'Total Registered Users', value: usersData.length.toString(), iconColor: 'text-blue-500', iconBg: 'bg-blue-50 border border-blue-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
          { title: 'Assessments In Progress', value: usersData.filter((u: any) => u.status === 'In Progress').length.toString(), iconColor: 'text-purple-500', iconBg: 'bg-purple-50 border border-purple-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
          { title: 'Assessments Submitted', value: usersData.length.toString(), iconColor: 'text-cyan-500', iconBg: 'bg-cyan-50 border border-cyan-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
          { title: 'Pending Review', value: usersData.filter((u: any) => u.status === 'Pending Review').length.toString(), iconColor: 'text-orange-500', iconBg: 'bg-orange-50 border border-orange-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { title: 'Approved Assessments', value: usersData.filter((u: any) => u.status === 'Approved').length.toString(), iconColor: 'text-green-500', iconBg: 'bg-green-50 border border-green-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> },
          { title: 'Rejected Assessments', value: usersData.filter((u: any) => u.status === 'Rejected').length.toString(), iconColor: 'text-red-500', iconBg: 'bg-red-50 border border-red-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> },
          { title: 'Slots Booked', value: slotsBookedCount.toString(), iconColor: 'text-indigo-500', iconBg: 'bg-indigo-50 border border-indigo-100', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        ].map((card, i) => (
          <div key={i} className="bg-white p-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-semibold pr-1 leading-tight" title={card.title}>{card.title}</span>
              <div className={`w-6 h-6 rounded-md ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}>
                {card.icon}
              </div>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1.5">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white px-3 md:px-4 py-2.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between mb-4 gap-3 md:gap-0 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center flex-1 gap-3 sm:gap-0">
          <div className="flex items-center min-w-[120px] sm:border-r border-gray-100 sm:pr-3 sm:mr-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-medium rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 outline-none cursor-pointer"
              aria-label="Status filter"
            >
              <option value="all">All Status</option>
              <option value="in-progress">In Progress</option>
              <option value="pending-review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-gray-700 text-[11px] focus:ring-0 block w-full pl-6 p-1.5 outline-none placeholder-gray-400"
              placeholder="Search by name, company, email, phone number..."
            />
          </div>
        </div>
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setSortConfig(null);
            setCurrentPage(1);
          }}
          className="flex items-center justify-center md:justify-start space-x-1.5 text-[11px] font-semibold border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
          <h2 className="text-[13px] font-bold text-gray-800">Assessment Records</h2>
        </div>

        <div className="overflow-x-auto flex-1 h-full min-h-0">
          <table className="w-full text-[11px] text-left text-gray-600">
            <thead className="text-[11px] text-gray-500 bg-gray-50/50 uppercase border-b border-gray-100 font-bold tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('username')}>Username {renderSortIcon('username')}</th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('company')}>Company Name {renderSortIcon('company')}</th>
                <th className="px-4 py-3 whitespace-nowrap">Contact Number</th>
                <th className="px-4 py-3 whitespace-nowrap">Email ID</th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('regDate')}>Registration Date {renderSortIcon('regDate')}</th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('subDate')}>Submission Date {renderSortIcon('subDate')}</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Review Link</th>
                <th className="px-4 py-3 whitespace-nowrap">Feedback</th>
                <th className="px-4 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-gray-800">{user.username}</td>
                    <td className="px-4 py-3 text-gray-500">{user.company}</td>
                    <td className="px-4 py-3 text-gray-500">{user.contact}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.regDate}</td>
                    <td className="px-4 py-3 text-gray-500">{user.subDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded ${user.statusColor} whitespace-nowrap`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.reviewLink ? (
                        <span
                          onClick={() => router.push(`/assessment/${user.id}`)}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center text-[11px] whitespace-nowrap cursor-pointer"
                        >
                          View
                          <svg className="w-2.5 h-2.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </span>
                      ) : (
                        <span className="text-gray-300">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.feedback && user.feedback !== '---' ? (
                        <button
                          onClick={() => setFeedbackModal({ text: user.feedback, facility: user.company })}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] underline underline-offset-1 cursor-pointer text-left"
                        >
                          View reason
                        </button>
                      ) : (
                        <span className="text-gray-300">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.action ? (
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleApprove(user.id)} className="bg-[#00b050] text-white pl-1.5 pr-2.5 py-1 rounded text-[11px] font-semibold flex items-center hover:bg-[#009040] transition-colors cursor-pointer">
                            <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Approve
                          </button>
                          <button onClick={() => handleReject(user.id)} className="text-red-500 pl-1.5 pr-2.5 py-1 rounded text-[11px] font-semibold flex items-center hover:bg-red-50 transition-colors cursor-pointer">
                            <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300">---</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 border-t border-gray-100 mt-auto bg-white rounded-b-lg shrink-0 gap-3 md:gap-0">
          <div className="text-[11px] md:text-[12px] text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-700">{sortedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> of <span className="font-semibold text-gray-700">{sortedUsers.length}</span> results
          </div>
          <div className="flex items-center space-x-1 flex-wrap justify-center overflow-x-auto max-w-full">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-[11px] font-semibold flex items-center ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-5 h-5 flex items-center justify-center text-[10px] rounded text-center font-semibold ${currentPage === idx + 1 ? 'bg-[#00b050] text-white font-bold shadow' : 'text-gray-600 hover:bg-gray-50'}`}>
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2 py-1 text-[11px] font-semibold flex items-center ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}>
              Next
              <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Reason Popup */}
      {feedbackModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setFeedbackModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Rejection Reason / Feedback</h3>
                {feedbackModal.facility && <p className="text-xs text-gray-500 mt-0.5">{feedbackModal.facility}</p>}
              </div>
              <button
                onClick={() => setFeedbackModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 -m-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap break-words">{feedbackModal.text}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
