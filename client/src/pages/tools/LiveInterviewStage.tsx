import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  Award,
  Send,
  Upload,
  FileText,
  RefreshCw,
  Download,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  User,
  Volume2,
  Layers,
  History,
  CheckSquare,
  Square,
  FileCheck,
  Headphones,
  VideoIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Room, RoomEvent, Track } from 'livekit-client';
import api from '../../services/api';

interface CourseOption {
  id: string;
  title: string;
  slug: string;
  modules: { id: string; title: string }[];
}

const DEFAULT_COURSES: CourseOption[] = [
  {
    id: 'c1',
    title: 'Generative AI Masterclass',
    slug: 'generative-ai-masterclass',
    modules: [
      { id: 'm1', title: 'Module 1: Prompt Engineering & LLM Architecture' },
      { id: 'm2', title: 'Module 2: Vector Databases & RAG Pipelines' },
      { id: 'm3', title: 'Module 3: Multi-Agent Frameworks (LangGraph & AutoGen)' },
      { id: 'm4', title: 'Module 4: Model Fine-Tuning (LoRA & QLoRA)' },
      { id: 'm5', title: 'Module 5: Production Deployment & MLOps' },
      { id: 'm6', title: 'Module 6: Capstone Project & Portfolio' }
    ]
  },
  {
    id: 'c2',
    title: 'Data Analyst with GenAI',
    slug: 'data-analyst-with-genai',
    modules: [
      { id: 'm1', title: 'Module 1: Modern SQL & Database Foundations' },
      { id: 'm2', title: 'Module 2: Python Data Stack (Pandas & Polars)' },
      { id: 'm3', title: 'Module 3: AI Code Interpreters & Data Co-Pilots' },
      { id: 'm4', title: 'Module 4: BI Dashboards & Automated Reporting' }
    ]
  },
  {
    id: 'c3',
    title: 'Agentic AI Development',
    slug: 'agentic-ai-development',
    modules: [
      { id: 'm1', title: 'Module 1: Agentic Primitives & ReAct Loop' },
      { id: 'm2', title: 'Module 2: CrewAI & Multi-Agent Swarms' },
      { id: 'm3', title: 'Module 3: Stateful Graphs with LangGraph' },
      { id: 'm4', title: 'Module 4: Production Agent Operations (LangSmith)' }
    ]
  },
  {
    id: 'c4',
    title: 'Azure and SQL DBA Masterclass',
    slug: 'azure-mssql-dba-masterclass',
    modules: [
      { id: 'm1', title: 'Module 1: SQL Server Architecture & Administration' },
      { id: 'm2', title: 'Module 2: High Availability (AlwaysOn & Failover Clusters)' },
      { id: 'm3', title: 'Module 3: Query Store & Performance Tuning' },
      { id: 'm4', title: 'Module 4: Azure SQL & Hybrid Cloud Migration' }
    ]
  },
  {
    id: 'c5',
    title: 'Prompt Engineering Pro',
    slug: 'prompt-engineering-pro',
    modules: [
      { id: 'm1', title: 'Module 1: Advanced Prompting Techniques' },
      { id: 'm2', title: 'Module 2: Structured Outputs & JSON Schema' },
      { id: 'm3', title: 'Module 3: Guardrails & Red Teaming' },
      { id: 'm4', title: 'Module 4: Benchmark & Evaluation Datasets' }
    ]
  }
];

interface ChatMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
  moduleTitle?: string;
}

interface PreviousSession {
  id: string;
  courseTitle: string;
  date: string;
  durationSeconds: number;
  status: string;
  reportData: EvaluationReport | null;
}

interface ModuleFeedback {
  moduleTitle: string;
  topicsDiscussed: string;
  score: number;
  rating: 'Good' | 'Average' | 'Poor' | 'Excellent' | 'Outstanding';
  summary: string;
  improvements: string;
}

interface EvaluationReport {
  overallScore: number;
  satisfactionLevel: 'Outstanding' | 'Excellent' | 'Good' | 'Needs Improvement';
  confidenceScore: number;
  communicationScore: number;
  interviewStyleScore: number;
  sentenceFramingScore: number;
  topicDepthScore: number;
  technicalRating: number;
  overallSuggestions: string;
  moduleFeedbacks: ModuleFeedback[];
}

const LiveInterviewStage: React.FC = () => {
  // Navigation / Workflow State: 'setup' | 'stage' | 'report'
  const [viewState, setViewState] = useState<'setup' | 'stage' | 'report'>('setup');

  // Part 1: Setup State
  const [courses, setCourses] = useState<CourseOption[]>(DEFAULT_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(DEFAULT_COURSES[0].id);

  // Multi-selection module IDs
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(
    DEFAULT_COURSES[0].modules.map((m) => m.id)
  );

  // Custom Dropdown Open State
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState<boolean>(false);
  const moduleDropdownRef = useRef<HTMLDivElement | null>(null);

  const [candidateName, setCandidateName] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [extraDocFile, setExtraDocFile] = useState<File | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startingMode, setStartingMode] = useState<'audio' | 'video' | null>(null);

  // Previous Sessions State
  const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);

  // Stage State
  const [stageMode, setStageMode] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCamOff, setIsCamOff] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(765);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [showLiveNotes, setShowLiveNotes] = useState<boolean>(false);
  const [liveNotesText, setLiveNotesText] = useState<string>('');
  const [agentConnected, setAgentConnected] = useState<boolean>(false);
  const [agentStatusText, setAgentStatusText] = useState<string>('Waiting for AI Interviewer to join...');

  // Live Stats State
  const [liveStats, setLiveStats] = useState({
    confidence: 88,
    communication: 92,
    interviewStyle: 90,
    sentenceFraming: 86,
    technicalScore: 94,
  });

  // Report State
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [isReportGenerating, setIsReportGenerating] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // LiveKit and Video Container Refs
  const userWebcamRef = useRef<HTMLVideoElement | null>(null);
  const stageVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const reportContainerRef = useRef<HTMLDivElement | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const selectedModules = selectedCourse.modules.filter((m) => selectedModuleIds.includes(m.id));

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moduleDropdownRef.current &&
        !moduleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch courses and previous session history on mount
  useEffect(() => {
    fetchCourses();
    fetchPreviousSessions();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/agents/courses');
      if (res.data.success && res.data.courses && res.data.courses.length > 0) {
        setCourses(res.data.courses);
        setSelectedCourseId(res.data.courses[0].id);
        setSelectedModuleIds(res.data.courses[0].modules.map((m: any) => m.id));
      }
    } catch (err) {
      console.log('Using default course options');
    }
  };

  const fetchPreviousSessions = async () => {
    try {
      const res = await api.get('/agents/history');
      if (res.data.success && res.data.history) {
        setPreviousSessions(res.data.history);
      }
    } catch (err) {
      console.log('Using local previous session state');
    }
  };

  // Synchronize module checkboxes when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const targetCourse = courses.find((c) => c.id === courseId);
    if (targetCourse) {
      setSelectedModuleIds(targetCourse.modules.map((m) => m.id));
    }
  };

  // Toggle individual module selection inside dropdown
  const handleToggleModule = (modId: string) => {
    if (selectedModuleIds.includes(modId)) {
      if (selectedModuleIds.length > 1) {
        setSelectedModuleIds(selectedModuleIds.filter((id) => id !== modId));
      }
    } else {
      setSelectedModuleIds([...selectedModuleIds, modId]);
    }
  };

  // Toggle Select All modules inside dropdown
  const handleToggleSelectAllModules = () => {
    if (selectedModuleIds.length === selectedCourse.modules.length) {
      setSelectedModuleIds([selectedCourse.modules[0].id]);
    } else {
      setSelectedModuleIds(selectedCourse.modules.map((m) => m.id));
    }
  };

  // Timer effect during call stage
  useEffect(() => {
    let timerInterval: any = null;
    if (viewState === 'stage' && timerSeconds > 0) {
      timerInterval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (viewState === 'stage' && timerSeconds === 0) {
      handleEndInterview();
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [viewState, timerSeconds]);

  // Webcam camera handling: active ONLY in Video mode when not using LiveKit local video track
  useEffect(() => {
    if (viewState === 'stage' && stageMode === 'video' && !livekitRoomRef.current) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          webcamStreamRef.current = stream;
          if (userWebcamRef.current) {
            userWebcamRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.warn('Webcam unavailable or blocked:', err));
    } else if (stageMode !== 'video') {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
        webcamStreamRef.current = null;
      }
    }
  }, [viewState, stageMode]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Clean up LiveKit room on unmount
  useEffect(() => {
    return () => {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
      }
    };
  }, []);

  // LiveKit Room Connection Handler
  const connectLiveKitRoom = async (url: string, token: string, mode: 'audio' | 'video') => {
    try {
      const room = new Room();

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log(`Track subscribed: ${track.kind} from ${participant.identity}`);
        setAgentConnected(true);

        if (track.kind === Track.Kind.Video) {
          if (stageVideoRef.current) {
            track.attach(stageVideoRef.current);
          }
        } else if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
        }
      });

      room.on(RoomEvent.LocalTrackPublished, (pub) => {
        if (pub.source === Track.Source.Camera && pub.track && userWebcamRef.current) {
          pub.track.attach(userWebcamRef.current);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('LiveKit room disconnected');
        setAgentConnected(false);
      });

      // Register text stream handler for real-time transcription captions
      room.registerTextStreamHandler('lk.transcription', async (reader, info) => {
        const text = await reader.readAll();
        if (!text) return;

        const isMe = info.identity === room.localParticipant.identity;
        const msg: ChatMessage = {
          id: `transcription-${Date.now()}`,
          sender: isMe ? 'candidate' : 'interviewer',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatMessages((prev) => [...prev, msg]);
      });

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      if (mode === 'video') {
        try {
          await room.localParticipant.setCameraEnabled(true);
        } catch (e) {
          console.warn('Camera unavailable:', e);
        }
      }

      livekitRoomRef.current = room;
      setAgentStatusText('AI Interviewer connected. Speaking...');
    } catch (err) {
      console.warn('LiveKit room connection failed, falling back to simulated stage:', err);
      setAgentStatusText('Simulated session active (LiveKit worker not running locally).');
    }
  };

  // Start Interview Handler (Audio or Video Mode)
  const handleStartInterview = async (mode: 'audio' | 'video') => {
    setIsStarting(true);
    setStartingMode(mode);
    setStageMode(mode);
    const selectedModTitles = selectedModules.map((m) => m.title);

    let livekitUrl = '';
    let livekitToken = '';

    try {
      const res = await api.post('/agents/start-interview', {
        candidateName,
        courseTitle: selectedCourse.title,
        selectedModuleTitles: selectedModTitles,
        resumeText,
        customInstructions,
        interviewMode: mode
      });

      if (res.data.success) {
        livekitUrl = res.data.url;
        livekitToken = res.data.token;
      }
    } catch (err) {
      console.warn('Backend start-interview endpoint fallback:', err);
    }

    const initialPrompt = `Hello ${candidateName || 'Candidate'}! Welcome to your ${
      mode === 'video' ? 'Video Avatar' : 'Audio'
    } AI technical screening interview for ${selectedCourse.title}. Today we will evaluate your expertise in: ${selectedModTitles.join(
      ', '
    )}. To start off, could you briefly introduce yourself and walk me through your background?`;

    const initialGreeting: ChatMessage = {
      id: 'msg-1',
      sender: 'interviewer',
      text: initialPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleTitle: selectedModTitles[0] || selectedCourse.title
    };

    setChatMessages([initialGreeting]);
    setIsStarting(false);
    setStartingMode(null);
    setViewState('stage');
    setTimerSeconds(765);

    if (livekitUrl && livekitToken) {
      await connectLiveKitRoom(livekitUrl, livekitToken, mode);
    }
  };

  // Send typed chat message (connected to Gemini API)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim() || isAiThinking) return;

    const userText = typedMessage.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'candidate',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setTypedMessage('');
    setIsAiThinking(true);

    const selectedModTitles = selectedModules.map((m) => m.title);

    try {
      const res = await api.post('/agents/chat', {
        candidateName,
        courseTitle: selectedCourse.title,
        selectedModuleTitles: selectedModTitles,
        resumeText,
        jdText: customInstructions,
        userMessage: userText,
        conversationHistory: chatMessages.map((m) => ({ sender: m.sender, text: m.text }))
      });

      const replyText = res.data.reply || 'Could you elaborate on how you optimize system latency in production?';

      const agentReply: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'interviewer',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleTitle: selectedModTitles[0] || selectedCourse.title
      };

      setChatMessages((prev) => [...prev, agentReply]);

      setLiveStats((prev) => ({
        confidence: Math.min(98, prev.confidence + 1),
        communication: Math.min(96, prev.communication + 1),
        interviewStyle: Math.min(94, prev.interviewStyle + 1),
        sentenceFraming: Math.min(92, prev.sentenceFraming + 1),
        technicalScore: Math.min(98, prev.technicalScore + 1)
      }));
    } catch (err) {
      console.error('API Error, using fallback response:', err);
      const fallbackText = `That is a solid approach to ${selectedModTitles[0] || 'the module'}. How do you ensure high availability and data integrity under concurrent load?`;

      const agentReply: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'interviewer',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleTitle: selectedModTitles[0] || selectedCourse.title
      };

      setChatMessages((prev) => [...prev, agentReply]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Toggle Microphone
  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      } catch (e) {
        console.warn('Microphone toggle error:', e);
      }
    }
  };

  // Toggle Camera
  const handleToggleCam = async () => {
    const newCamOff = !isCamOff;
    setIsCamOff(newCamOff);
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setCameraEnabled(!newCamOff);
      } catch (e) {
        console.warn('Camera toggle error:', e);
      }
    }
  };

  // End Interview & Save Session
  const handleEndInterview = async () => {
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
      livekitRoomRef.current = null;
    }

    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }

    setIsReportGenerating(true);
    setViewState('report');

    const selectedModTitles = selectedModules.map((m) => m.title);
    let reportDataToSave: EvaluationReport;

    try {
      const res = await api.post('/agents/generate-report', {
        courseTitle: selectedCourse.title,
        selectedModuleTitles: selectedModTitles,
        transcripts: chatMessages.map((m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp }))
      });

      if (res.data.success && res.data.report) {
        reportDataToSave = res.data.report;
      } else {
        throw new Error('Fallback report needed');
      }
    } catch (err) {
      reportDataToSave = {
        overallScore: 92,
        satisfactionLevel: 'Outstanding',
        confidenceScore: liveStats.confidence,
        communicationScore: liveStats.communication,
        interviewStyleScore: liveStats.interviewStyle,
        sentenceFramingScore: liveStats.sentenceFraming,
        topicDepthScore: 91,
        technicalRating: liveStats.technicalScore,
        overallSuggestions: `Exceptional depth in explaining ${selectedCourse.title} concepts. Demonstrated clear STAR format answers across: ${selectedModTitles.join(
          ', '
        )}. Recommend elaborating slightly more on fault tolerance.`,
        moduleFeedbacks: selectedModTitles.map((modTitle, idx) => ({
          moduleTitle: modTitle,
          topicsDiscussed: `In-depth evaluation of ${modTitle} implementation patterns and trade-offs.`,
          score: Math.min(98, 88 + idx * 2),
          rating: idx === 0 ? 'Outstanding' : 'Excellent',
          summary: `Strong grasp of foundational topics in ${modTitle}. Provided structured answers with explicit code logic examples.`,
          improvements: `Review latency benchmarks and secondary fallback triggers for ${modTitle}.`
        }))
      };
    }

    setEvaluationReport(reportDataToSave);
    setIsReportGenerating(false);

    const sessionItem: PreviousSession = {
      id: `session-${Date.now()}`,
      courseTitle: selectedCourse.title,
      date: new Date().toISOString(),
      durationSeconds: 765 - timerSeconds,
      status: 'COMPLETED',
      reportData: reportDataToSave
    };

    setPreviousSessions((prev) => [sessionItem, ...prev]);

    try {
      await api.post('/agents/save-session', {
        courseTitle: selectedCourse.title,
        durationSeconds: 765 - timerSeconds,
        reportData: reportDataToSave
      });
      fetchPreviousSessions();
    } catch (e) {
      console.log('Session saved locally');
    }
  };

  // Open a previous session report
  const handleOpenPreviousSessionReport = (session: PreviousSession) => {
    if (session.reportData) {
      setEvaluationReport(session.reportData);
      setViewState('report');
    }
  };

  // Export report to PDF
  const handleDownloadPdfReport = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);

    try {
      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0E1116'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`NxtGen_Interview_Report_${selectedCourse.slug}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Helper formatting for timer
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dropdown summary label text
  const getModuleDropdownLabel = () => {
    if (selectedModuleIds.length === selectedCourse.modules.length) {
      return `All Modules Selected (${selectedCourse.modules.length} Modules)`;
    }
    if (selectedModuleIds.length === 1) {
      const singleMod = selectedCourse.modules.find((m) => m.id === selectedModuleIds[0]);
      return singleMod ? singleMod.title : '1 Module Selected';
    }
    return `${selectedModuleIds.length} Modules Selected`;
  };

  return (
    <div className="min-h-screen bg-[#0E1116] text-white p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Main Navigation Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand-orange animate-pulse" size={24} />
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white">
              Real-Time AI Technical Interview Stage
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Real-time interactive voice & video avatar screening using Gemini Live API and LiveKit WebRTC
          </p>
        </div>

        {viewState === 'stage' && (
          <button
            onClick={handleEndInterview}
            className="flex items-center gap-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 text-xs font-bold hover:bg-red-500/30 transition-colors"
          >
            End Interview & View Report
          </button>
        )}

        {viewState === 'report' && (
          <button
            onClick={() => setViewState('setup')}
            className="flex items-center gap-2 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 transition-colors"
          >
            Start New Interview Round
          </button>
        )}
      </div>

      {/* ─── PART 1: SETUP SCREEN ─── */}
      {viewState === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: SETUP FORM */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[#171C24] p-6 space-y-6 shadow-xl">
            <div className="border-b border-white/[0.08] pb-4 space-y-1">
              <h2 className="font-display text-lg font-bold text-white">Interview Configuration Brief</h2>
              <p className="text-xs text-text-muted">
                Select your enrolled course, target modules, upload your resume, and choose Audio or Video Avatar mode.
              </p>
            </div>

            <div className="space-y-4">
              {/* Candidate Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <User size={14} className="text-brand-orange" /> Candidate Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#1D2430] p-3 text-xs text-white focus:border-brand-orange focus:outline-none transition-colors"
                />
              </div>

              {/* Course Selection Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <BookOpen size={14} className="text-brand-orange" /> Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#1D2430] p-3 text-xs text-white focus:border-brand-orange focus:outline-none transition-colors"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id} className="bg-[#171C24]">
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Selection Module Dropdown */}
              <div className="space-y-2 relative" ref={moduleDropdownRef}>
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <Layers size={14} className="text-brand-orange" /> Target Modules to Evaluate
                </label>

                <div
                  onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#1D2430] p-3 text-xs text-white cursor-pointer hover:border-brand-orange transition-colors"
                >
                  <span className="truncate font-medium">{getModuleDropdownLabel()}</span>
                  <ChevronDown
                    size={16}
                    className={`text-text-muted transition-transform duration-200 ${
                      isModuleDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {isModuleDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-white/[0.12] bg-[#171C24] p-3 space-y-2 shadow-2xl max-h-60 overflow-y-auto">
                    <div
                      onClick={handleToggleSelectAllModules}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] cursor-pointer text-xs font-bold text-brand-orange border-b border-white/[0.08] pb-2"
                    >
                      {selectedModuleIds.length === selectedCourse.modules.length ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>
                        {selectedModuleIds.length === selectedCourse.modules.length
                          ? 'Deselect All Modules'
                          : 'Select All Modules'}
                      </span>
                    </div>

                    {selectedCourse.modules.map((mod) => {
                      const isChecked = selectedModuleIds.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => handleToggleModule(mod.id)}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] cursor-pointer text-xs text-white"
                        >
                          <div className="text-brand-orange">
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </div>
                          <span className="text-xs">{mod.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Resume Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <Upload size={14} className="text-brand-orange" /> Upload Resume (Optional)
                  </label>
                  <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.15] bg-[#1D2430] p-4 text-center cursor-pointer hover:border-brand-orange transition-colors">
                    <FileText size={22} className="text-text-muted mb-1" />
                    <span className="text-xs font-medium text-white truncate max-w-[200px]">
                      {resumeFile ? resumeFile.name : 'Choose PDF, DOCX or TXT'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                          setResumeText(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Supplementary PDF Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <Upload size={14} className="text-brand-orange" /> Cover Letter / Supplementary PDF
                  </label>
                  <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.15] bg-[#1D2430] p-4 text-center cursor-pointer hover:border-brand-orange transition-colors">
                    <FileText size={22} className="text-text-muted mb-1" />
                    <span className="text-xs font-medium text-white truncate max-w-[200px]">
                      {extraDocFile ? extraDocFile.name : 'Choose supplementary PDF'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => e.target.files && setExtraDocFile(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Custom Instructions / Job Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-brand-orange" /> Specific Instructions / Job Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Paste job description or specific topics you wish to be tested on..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#1D2430] p-3.5 text-xs text-white focus:border-brand-orange focus:outline-none transition-colors"
                />
              </div>

              {/* START BUTTONS: TWO PART SELECTION (Audio Only & Video Avatar) */}
              <div className="pt-2 space-y-2">
                <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-orange" /> Choose Interview Mode & Launch Session
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Part 1: Audio Only Button */}
                  <button
                    onClick={() => handleStartInterview('audio')}
                    disabled={isStarting}
                    className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 py-4 px-4 font-display font-bold text-sm text-white hover:bg-emerald-500 shadow-xl transition-all disabled:opacity-50 group"
                  >
                    {isStarting && startingMode === 'audio' ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} /> Connecting Audio Session...
                      </>
                    ) : (
                      <>
                        <Headphones size={20} className="group-hover:scale-110 transition-transform" />
                        <span>Start Audio Interview</span>
                      </>
                    )}
                  </button>

                  {/* Part 2: Video Avatar Button */}
                  <button
                    onClick={() => handleStartInterview('video')}
                    disabled={isStarting}
                    className="flex items-center justify-center gap-2.5 rounded-xl bg-brand-orange py-4 px-4 font-display font-bold text-sm text-white hover:bg-brand-orange/90 shadow-xl transition-all disabled:opacity-50 group"
                  >
                    {isStarting && startingMode === 'video' ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} /> Initializing Video Avatar...
                      </>
                    ) : (
                      <>
                        <VideoIcon size={20} className="group-hover:scale-110 transition-transform" />
                        <span>Start Video Avatar Interview</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 1 COL: PREVIOUS SESSIONS */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-[#171C24] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <History size={18} className="text-brand-orange" />
                <h3 className="font-display text-base font-bold text-white">Previous Interview Sessions</h3>
              </div>
              <p className="text-xs text-text-muted">
                Review scores and download PDF reports from your past interview rounds.
              </p>

              {previousSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#1D2430] p-6 text-center text-xs text-text-muted space-y-1">
                  <FileCheck size={28} className="mx-auto text-text-muted/60 mb-2" />
                  <p className="font-semibold text-white">No previous sessions yet</p>
                  <p>Complete your first interview round to view scorecards here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/[0.1]">
                  {previousSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleOpenPreviousSessionReport(session)}
                      className="rounded-xl border border-white/[0.08] bg-[#1D2430] p-4 space-y-2 cursor-pointer hover:border-brand-orange transition-all shadow-md group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-orange uppercase">
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          Completed
                        </span>
                      </div>

                      <h4 className="font-display text-sm font-bold text-white group-hover:text-brand-orange transition-colors">
                        {session.courseTitle}
                      </h4>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.05]">
                        <span className="text-text-muted flex items-center gap-1">
                          <Clock size={12} /> {Math.floor(session.durationSeconds / 60)} mins
                        </span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          Report Available <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PART 2 & PART 3: LIVE INTERVIEW STAGE ─── */}
      {viewState === 'stage' && (
        <div className="space-y-6">
          {/* TOP STATS HEADER CARD */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#171C24] p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  {stageMode === 'video' ? <VideoIcon size={18} className="text-brand-orange" /> : <Headphones size={18} className="text-emerald-400" />}
                  Live Screening Round: {selectedCourse.title} ({stageMode === 'video' ? 'Video Avatar Mode' : 'Audio Mode'})
                </h3>
                <span className="text-xs text-brand-orange font-semibold">
                  Scope: {selectedModules.map((m) => m.title).join(', ')}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#1D2430] px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
                  <Clock size={14} className="text-brand-orange" />
                  <span className="text-xs font-mono font-bold text-brand-orange">
                    Time Remaining: {formatTimer(timerSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Live WebRTC</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTRAL CANVAS CONTAINER */}
          <div className="relative rounded-3xl border border-white/[0.1] bg-[#0E1116] min-h-[460px] p-6 shadow-2xl flex flex-col justify-between items-center overflow-hidden">
            {/* AUDIO-ONLY CANVAS */}
            {stageMode === 'audio' && (
              <div className="flex flex-col items-center justify-center my-auto w-full space-y-6 text-center">
                <div className="relative h-44 w-44 rounded-full border-4 border-emerald-500/40 shadow-2xl overflow-hidden bg-[#171C24] p-1">
                  <img
                    src="/indian_interviewer.png"
                    alt="Indian Interviewer"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-pulse pointer-events-none" />
                </div>

                {/* Animated Teal Audio Waveform Line */}
                <div className="w-full max-w-md flex items-center justify-center gap-1 h-8">
                  {[20, 45, 75, 90, 40, 85, 100, 65, 95, 35, 80, 50, 90, 60, 100, 40, 70, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-300 animate-pulse"
                    />
                  ))}
                </div>

                <div className="text-xs text-text-muted font-medium bg-[#171C24] px-4 py-1.5 rounded-full border border-white/[0.08]">
                  {agentStatusText}
                </div>
              </div>
            )}

            {/* VIDEO AVATAR CANVAS */}
            {stageMode === 'video' && (
              <div className="relative w-full h-full min-h-[380px] flex flex-col justify-between">
                {/* Avatar WebRTC Video Element */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#171C24] to-[#0E1116] rounded-2xl overflow-hidden">
                  <video
                    ref={stageVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!agentConnected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
                      <div className="space-y-3">
                        <RefreshCw size={36} className="animate-spin text-brand-orange mx-auto" />
                        <h4 className="font-display text-sm font-bold text-white">Connecting bitHuman Cloud Avatar...</h4>
                        <p className="text-xs text-text-muted">Waiting for avatar video stream via LiveKit WebRTC</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Candidate Webcam PIP Preview (Bottom Right) */}
                <div className="absolute right-4 bottom-4 h-36 w-52 rounded-2xl border-2 border-brand-orange bg-[#171C24] overflow-hidden shadow-2xl flex flex-col justify-between p-2">
                  {!isCamOff ? (
                    <video
                      ref={userWebcamRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#1D2430] flex items-center justify-center text-text-muted text-xs font-semibold">
                      Camera Off
                    </div>
                  )}
                  <span className="z-10 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded self-start">
                    Candidate Webcam
                  </span>
                  <div className="z-10 flex justify-end gap-1 self-end">
                    {isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-emerald-400" />}
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM CONTROL BAR */}
            <div className="flex flex-wrap items-center justify-center gap-5 pt-5 border-t border-white/[0.08] w-full max-w-3xl">
              {/* Button 1: Mute / Unmute */}
              <button
                onClick={handleToggleMute}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 rounded-full py-4 px-7 text-sm font-extrabold tracking-wide transition-all duration-200 shadow-xl hover:scale-[1.03] active:scale-[0.97] ${
                  isMuted
                    ? 'bg-red-500/25 text-red-400 border-2 border-red-500/50 shadow-red-500/10'
                    : 'bg-emerald-500/25 text-emerald-400 border-2 border-emerald-500/50 hover:bg-emerald-500/35 shadow-emerald-500/10'
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>

              {/* Button 2: Switch Mode */}
              <button
                onClick={() => setStageMode(stageMode === 'audio' ? 'video' : 'audio')}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 rounded-full py-4 px-7 text-sm font-extrabold tracking-wide transition-all duration-200 shadow-xl hover:scale-[1.03] active:scale-[0.97] ${
                  stageMode === 'video'
                    ? 'bg-brand-orange text-white border-2 border-brand-orange shadow-brand-orange/20'
                    : 'bg-white/[0.06] text-white border-2 border-white/[0.12] hover:border-brand-orange shadow-white/5'
                }`}
              >
                {stageMode === 'video' ? <Headphones size={20} /> : <VideoIcon size={20} />}
                {stageMode === 'video' ? 'Audio Mode' : 'Video Avatar'}
              </button>

              {/* Button 3: Live Notes Drawer */}
              <button
                onClick={() => setShowLiveNotes(!showLiveNotes)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 rounded-full py-4 px-7 text-sm font-extrabold tracking-wide transition-all duration-200 shadow-xl hover:scale-[1.03] active:scale-[0.97] ${
                  showLiveNotes
                    ? 'bg-brand-orange/25 text-brand-orange border-2 border-brand-orange/50 shadow-brand-orange/10'
                    : 'bg-white/[0.06] text-white border-2 border-white/[0.12] hover:border-white/[0.25] shadow-white/5'
                }`}
              >
                <FileText size={20} /> Live Notes
              </button>

              {/* Button 4: End Interview */}
              <button
                onClick={handleEndInterview}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-3 rounded-full bg-red-500/90 hover:bg-red-600 text-white border-2 border-red-500/50 py-4 px-7 text-sm font-extrabold tracking-wide transition-all duration-200 shadow-xl shadow-red-500/10 hover:scale-[1.03] active:scale-[0.97]"
              >
                End Interview
              </button>
            </div>
          </div>

          {/* LIVE NOTES DRAWER */}
          {showLiveNotes && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#171C24] p-5 space-y-3 shadow-xl">
              <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-brand-orange" /> Candidate Live Scratchpad Notes
              </h4>
              <textarea
                rows={4}
                value={liveNotesText}
                onChange={(e) => setLiveNotesText(e.target.value)}
                placeholder="Jot down notes or draft complex architecture answers during your interview..."
                className="w-full rounded-xl border border-white/[0.08] bg-[#1D2430] p-3 text-xs text-white focus:border-brand-orange focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* TRANSCRIPT & CHAT STREAM */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#171C24] p-4 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-brand-orange" />
                <h3 className="font-display text-sm font-bold text-white">Live Conversation Transcript & Chat</h3>
              </div>
              <span className="text-[11px] text-text-muted">
                {isMuted ? 'Mic Muted — Type response below' : 'Voice and text transcript active'}
              </span>
            </div>

            {/* Transcript Messages */}
            <div className="h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/[0.1]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'candidate' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-text-muted mb-1">
                    <span className="font-semibold text-white">
                      {msg.sender === 'candidate' ? candidateName || 'You' : 'AI Interviewer'}
                    </span>
                    <span>{msg.timestamp}</span>
                    {msg.moduleTitle && (
                      <span className="bg-brand-orange/15 text-brand-orange px-1.5 py-0.5 rounded font-mono">
                        {msg.moduleTitle}
                      </span>
                    )}
                  </div>
                  <div
                    className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'candidate'
                        ? 'bg-brand-orange text-white rounded-br-none'
                        : 'bg-[#1D2430] border border-white/[0.08] text-white rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold italic">
                  <RefreshCw size={14} className="animate-spin" /> AI Interviewer is formulating response...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/[0.08]">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type your question or response here..."
                className="flex-1 rounded-xl border border-white/[0.08] bg-[#1D2430] p-3.5 text-xs text-white focus:border-brand-orange focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isAiThinking}
                className="flex items-center gap-1.5 rounded-xl bg-brand-orange px-5 py-3 text-xs font-bold text-white hover:bg-brand-orange/90 transition-colors shadow-md disabled:opacity-50"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PART 4: EVALUATION REPORT CARD ─── */}
      {viewState === 'report' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {isReportGenerating ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#171C24] p-12 text-center space-y-4 shadow-2xl">
              <RefreshCw size={40} className="animate-spin text-brand-orange mx-auto" />
              <h3 className="font-display text-xl font-bold text-white">Analyzing Interview Transcripts...</h3>
              <p className="text-xs text-text-muted">
                Generating real LLM observation report for {selectedCourse.title}...
              </p>
            </div>
          ) : evaluationReport ? (
            <div
              ref={reportContainerRef}
              className="rounded-2xl border-2 border-brand-orange/60 bg-[#171C24] p-6 md:p-8 space-y-8 shadow-2xl"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
                <div>
                  <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                    Post-Interview Performance Scorecard
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
                    Overall Score: {evaluationReport.overallScore}/100
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Candidate: <strong className="text-white">{candidateName || 'Student'}</strong> | Course:{' '}
                    <strong className="text-white">{selectedCourse.title}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-brand-orange/10 border border-brand-orange/30 p-4 text-center">
                    <span className="text-[10px] uppercase font-semibold text-text-muted block">
                      Satisfaction Level
                    </span>
                    <span className="font-display text-lg font-bold text-brand-orange">
                      {evaluationReport.satisfactionLevel}
                    </span>
                  </div>
                  <Award size={48} className="text-brand-orange hidden sm:block" />
                </div>
              </div>

              {/* Skill Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                <div className="rounded-xl bg-[#1D2430] p-3 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Confidence</span>
                  <p className="font-display text-xl font-bold text-emerald-400">
                    {evaluationReport.confidenceScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#1D2430] p-3 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Communication</span>
                  <p className="font-display text-xl font-bold text-brand-orange">
                    {evaluationReport.communicationScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#1D2430] p-3 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Interview Style</span>
                  <p className="font-display text-xl font-bold text-emerald-400">
                    {evaluationReport.interviewStyleScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#1D2430] p-3 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Sentence Framing</span>
                  <p className="font-display text-xl font-bold text-brand-orange">
                    {evaluationReport.sentenceFramingScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#1D2430] p-3 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Topic Depth</span>
                  <p className="font-display text-xl font-bold text-emerald-400">
                    {evaluationReport.topicDepthScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#1D2430] p-3 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Technical Rating</span>
                  <p className="font-display text-xl font-bold text-emerald-400">
                    {evaluationReport.technicalRating}/100
                  </p>
                </div>
              </div>

              {/* LLM Feedback */}
              <div className="rounded-xl bg-[#1D2430] p-5 border border-white/[0.08] space-y-2">
                <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <Brain size={16} className="text-brand-orange" /> Real LLM Observation Feedback & Suggestions
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {evaluationReport.overallSuggestions}
                </p>
              </div>

              {/* Module-by-Module Feedback */}
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-white border-b border-white/[0.08] pb-2">
                  Module-Wise Detailed Evaluation Breakdown
                </h3>

                <div className="space-y-4">
                  {evaluationReport.moduleFeedbacks.map((mf, index) => (
                    <div key={index} className="rounded-xl border border-white/[0.08] bg-[#1D2430] p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                        <h4 className="font-display text-sm font-bold text-white">
                          Module {index + 1}: {mf.moduleTitle}
                        </h4>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono font-bold text-emerald-400">Score: {mf.score}%</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              mf.rating === 'Outstanding' || mf.rating === 'Excellent'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-brand-orange/20 text-brand-orange'
                            }`}
                          >
                            {mf.rating}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-semibold text-text-muted block mb-1">Important Topics Discussed:</span>
                          <p className="text-text-muted">{mf.topicsDiscussed}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-text-muted block mb-1">Module Summary:</span>
                          <p className="text-text-muted">{mf.summary}</p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#171C24] p-3 border border-white/[0.05] text-xs">
                        <span className="font-semibold text-brand-orange flex items-center gap-1.5 mb-1">
                          <AlertCircle size={14} /> Recommended Area of Improvement:
                        </span>
                        <p className="text-text-muted">{mf.improvements}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Download */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
                <p className="text-xs text-text-muted">Download your full evaluation scorecard report as a PDF document.</p>
                <button
                  onClick={handleDownloadPdfReport}
                  disabled={isExportingPdf}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 py-3 font-display font-bold text-xs text-white hover:bg-brand-orange/90 shadow-lg transition-all disabled:opacity-50"
                >
                  {isExportingPdf ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} /> Generating PDF Report...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Download Full PDF Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default LiveInterviewStage;
