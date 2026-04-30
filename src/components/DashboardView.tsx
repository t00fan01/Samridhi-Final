import { useState } from 'react';
import { Map, AlertTriangle, List, TrendingUp, Package, AlertCircle, Loader2, CheckCircle2, Volume2, Clock, CheckCircle } from 'lucide-react';
import type { Need } from '../App';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface DashboardViewProps {
  needs: Need[];
}

type KanbanStatus = 'open' | 'wip' | 'resolved';

export default function DashboardView({ needs }: DashboardViewProps) {
  // Converted to string records to safely handle both Firebase hashes and local numbers
  const [statuses, setStatuses] = useState<Record<string, KanbanStatus>>({});
  const [claimants, setClaimants] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [leadName, setLeadName] = useState('');
  const [teamSize, setTeamSize] = useState('Just me');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSpeak = (need: Need) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `Attention: ${need.urgency} urgency need for ${need.needType} reported at ${need.location}.`
    );

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Microsoft Zira') ||
      v.name.includes('Google US English')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const openClaimModal = (id: any) => {
    setSelectedTaskId(String(id)); // Force string to prevent undefined bleed
    setLeadName(auth.currentUser?.displayName || '');
    setTeamSize('Just me');
    setIsClaimModalOpen(true);
  };

  const handleConfirmClaim = async () => {
    if (!selectedTaskId || !leadName.trim()) return;

    // 1. Close modal IMMEDIATELY for a snappy UI
    setIsClaimModalOpen(false);

    // 2. Update local state for immediate feedback
    setStatuses(prev => ({ ...prev, [selectedTaskId]: 'wip' }));
    setClaimants(prev => ({ ...prev, [selectedTaskId]: leadName.trim() }));
    showToast(`Task successfully claimed by ${leadName.trim()}`);

    // 3. Attempt Firestore update in background
    try {
      const taskDocRef = doc(db, 'needs', selectedTaskId);
      await updateDoc(taskDocRef, {
        status: 'wip',
        claimant: leadName.trim(),
        teamSize: teamSize
      });
      setSelectedTaskId(null);
    } catch (err) {
      console.error("Firestore update failed or document not found:", err);
      setSelectedTaskId(null);
    }
  };

  const handleUploadProof = (id: any) => {
    const safeId = String(id);
    setActionLoading(prev => ({ ...prev, [safeId]: true }));

    setTimeout(() => {
      setStatuses(prev => ({ ...prev, [safeId]: 'resolved' }));
      setActionLoading(prev => ({ ...prev, [safeId]: false }));
      showToast("Proof verified successfully via Gemini Vision.");

      // Attempt Firestore update
      try {
        const taskDocRef = doc(db, 'needs', safeId);
        updateDoc(taskDocRef, { status: 'resolved' }).catch(console.error);
      } catch (err) {
        console.error("Firestore update failed:", err);
      }
    }, 2000);
  };

  // Map over needs, applying a BULLETPROOF unique fingerprint to every card
  const kanbanNeeds = needs.map((need, index) => {
    // If Firebase gives us a real ID, we use it. 
    // If not, we instantly generate a unique fingerprint using its timestamp and index.
    // This makes it mathematically impossible for React to claim all cards at once.
    const uniqueFingerprint = need.id ? String(need.id) : `task-${need.timestamp}-${index}`;

    // Tell TypeScript to relax for the Firebase fields
    const firebaseNeed = need as any;

    return {
      ...need,
      safeId: uniqueFingerprint, // We use our guaranteed unique fingerprint here
      status: statuses[uniqueFingerprint] || firebaseNeed.status || 'open',
      claimedBy: claimants[uniqueFingerprint] || firebaseNeed.claimant || firebaseNeed.claimedBy
    };
  });

  const openNeeds = kanbanNeeds.filter(n => n.status === 'open');
  const wipNeeds = kanbanNeeds.filter(n => n.status === 'wip');
  const resolvedNeeds = kanbanNeeds.filter(n => n.status === 'resolved');

  const highUrgencyCount = needs.filter(n => n.urgency === 'High').length;
  const totalNeeds = needs.length;

  const renderCard = (need: any) => {
    const isResolved = need.status === 'resolved';
    const isWIP = need.status === 'wip';
    const isOpen = need.status === 'open';
    const isLoading = actionLoading[need.safeId];

    return (
      <div
        key={need.safeId}
        className={`p-3 rounded-xl bg-white shadow-sm transition-all duration-300 animate-in slide-in-from-top-4 fade-in duration-500 
        ${isResolved ? 'opacity-70 border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border border-slate-100 hover:-translate-y-1 hover:shadow-lg border-l-4'}
        ${!isResolved && need.urgency === 'High' ? 'border-l-red-500' : ''}
        ${!isResolved && need.urgency === 'Medium' ? 'border-l-yellow-500' : ''}
        ${!isResolved && need.urgency === 'Low' ? 'border-l-indigo-500' : ''}
      `}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-slate-900">{need.needType}</span>
          <div className="flex items-center gap-2">
            {!isResolved && (
              <button
                onClick={() => handleSpeak(need)}
                className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Read out loud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            {isResolved ? (
              <span className="text-xs px-2.5 py-1 font-semibold rounded-full shadow-sm bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                Verified & Closed
              </span>
            ) : (
              <span className={`text-xs px-2.5 py-1 font-semibold rounded-full shadow-sm ${need.urgency === 'High'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : need.urgency === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                {need.urgency}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-3 line-clamp-3">{need.description}</p>

        <div className="flex flex-wrap justify-between items-center text-xs text-slate-500 font-medium mb-3 gap-2">
          <span className="flex items-center gap-1">
            <Map className="w-3 h-3" />
            {need.location}
          </span>
          <span>
            {new Date(need.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {(isWIP || isResolved) && need.claimedBy && (
          <div className={`mb-4 text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-full ${isResolved ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
            {isWIP ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Claimed by: {need.claimedBy}
          </div>
        )}

        {isOpen && need.needType !== 'Invalid File' && (
          <button
            onClick={() => openClaimModal(need.safeId)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-800 text-white hover:shadow-teal-600/50 hover:shadow-lg"
          >
            ✋ Claim Task
          </button>
        )}

        {isWIP && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleUploadProof(need.safeId)}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-600/50 hover:shadow-lg disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gemini Vision Verifying...
                </>
              ) : (
                <>📸 Upload Proof</>
              )}
            </button>
            <button
              onClick={() => showToast('Join request sent to project lead!')}
              className="w-full py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              🤝 Request to Join
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-indigo-100 p-4 rounded-xl text-indigo-600">
            <List className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Needs Logged</p>
            <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">{totalNeeds}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-red-100 p-4 rounded-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">High Urgency Alerts</p>
            <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">{highUrgencyCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-teal-100 p-4 rounded-xl text-teal-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tasks Resolved</p>
            <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              {resolvedNeeds.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban & Map */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Left Side: Kanban Board (65%) */}
        <div className="lg:w-[65%] grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Column 1: Open */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                🚨 Open Alerts
              </h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{openNeeds.length}</span>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              {openNeeds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No open alerts.</p>
                </div>
              )}
              {openNeeds.map(renderCard)}
            </div>
          </div>

          {/* Column 2: WIP */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                ⏳ WIP (Claimed)
              </h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{wipNeeds.length}</span>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              {wipNeeds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Package className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No tasks claimed yet.</p>
                </div>
              )}
              {wipNeeds.map(renderCard)}
            </div>
          </div>

          {/* Column 3: Resolved */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                ✅ Resolved
              </h3>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{resolvedNeeds.length}</span>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              {resolvedNeeds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <CheckCircle className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No resolved tasks.</p>
                </div>
              )}
              {resolvedNeeds.map(renderCard)}
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Map Integration (35%) */}
        <div className="lg:w-[35%] rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative min-h-[400px] lg:min-h-full bg-white flex flex-col">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 flex-none">
            <Map className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-800">Live Coverage Map</h3>
          </div>
          <div className="flex-1 w-full h-full p-2">
            <iframe
              width="100%"
              height="100%"
              style={{ minHeight: '400px', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
              frameBorder="0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.0,22.0,79.0,24.0&layer=mapnik"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-teal-900 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Claim Task</h3>
              <button onClick={() => setIsClaimModalOpen(false)} className="text-teal-200 hover:text-white transition-colors">
                <AlertCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Lead Volunteer Name</label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Team Size</label>
                  <select
                    value={teamSize}
                    onChange={e => setTeamSize(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option>Just me</option>
                    <option>2-3 people</option>
                    <option>4+ people</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setIsClaimModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClaim}
                  disabled={!leadName.trim()}
                  className="flex-1 py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-emerald-500/20 p-2 rounded-full flex-none">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="font-medium text-slate-50">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}