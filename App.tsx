
import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, LogOut, HardDrive, Search, 
  FileArchive, Shield, Eye, Trash2, 
  Share2, Network, MessageSquare, X, Cpu, Activity,
  ShieldCheck, Zap, Terminal, Fingerprint,
  Globe, Download, ArrowRight, ShieldAlert, Key, Link as LinkIcon,
  Mail, User as UserIcon, Lock, Scale, FileCheck, LayoutGrid, Plus, MoreVertical,
  ChevronRight, Command, Bell, Settings, History, Bookmark, Grid3X3, Layers, Compass,
  ChevronLeft, RotateCw, ExternalLink, Monitor, Smartphone, Laptop, Briefcase, Baby
} from 'lucide-react';
import { User, DLGFile, ScrapedContent } from './types';
import { neuralSearchInterpret, quantumScrapeEngine, startAssistantChat, generateAppIcon, analyzeDirectLink } from './services/geminiService';
import { downloadAsPDF } from './services/pdfService';
import { coreService } from './Service';
import { loginUser, registerUser, updateUser, getUserByEmail, resetPasswordWithCode } from './DLG';

const DriveSearchLogo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">
      <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" stroke="#6366f1" strokeWidth="4" />
      <path d="M50 20L75 32V68L50 80L25 68V32L50 20Z" fill="#6366f1" fillOpacity="0.2" />
      <circle cx="50" cy="50" r="10" fill="#6366f1" />
    </svg>
    <div className="flex flex-col">
      <span className="text-xl font-black italic tracking-tighter leading-none text-white">DriveSearch</span>
      <span className="text-[10px] font-black text-indigo-500 tracking-[0.3em]">v1.0X</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'vault' | 'dashboard' | 'link-linker' | 'browser'>('home');
  const [query, setQuery] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [results, setResults] = useState<ScrapedContent[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dlgFiles, setDlgFiles] = useState<DLGFile[]>([]);
  const [showAgreement, setShowAgreement] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewContent, setPreviewContent] = useState<ScrapedContent | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  
  // Browser (Web Hub) State
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com/search?igu=1');
  const [browserInput, setBrowserInput] = useState('');

  // AI Chat (Copilot Style)
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'bot', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('DLG_SESSION_USER');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (!parsed.agreementAccepted) setShowAgreement(true);
      } catch (e) {
        localStorage.removeItem('DLG_SESSION_USER');
      }
    }
    const savedFiles = localStorage.getItem('DLG_DISC_FILES');
    if (savedFiles) setDlgFiles(JSON.parse(savedFiles));
    
    setIsLoaded(true);
    chatSessionRef.current = startAssistantChat();
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('DLG_DISC_FILES', JSON.stringify(dlgFiles));
  }, [dlgFiles, user]);

  const handleAcceptAgreement = async () => {
    if (!user) return;
    try {
      const updated = await updateUser(user.id, { agreementAccepted: true });
      setUser(updated);
      localStorage.setItem('DLG_SESSION_USER', JSON.stringify(updated));
      setShowAgreement(false);
    } catch (e) { alert("Authorization update failed."); }
  };

  const handleSearch = async () => {
    if (!user?.agreementAccepted) { setShowAgreement(true); return; }
    if (!query.trim()) return;
    setIsScraping(true);
    setActiveTab('search');
    setResults([]);
    try {
      const interpretation = await neuralSearchInterpret(query);
      const data = await quantumScrapeEngine(interpretation.keywords?.join(' ') || query);
      setResults(data);
    } catch (e) { console.error(e); }
    finally { setIsScraping(false); }
  };

  const openInBrowser = (url: string) => {
    if (!user?.agreementAccepted) { setShowAgreement(true); return; }
    setBrowserUrl(url);
    setBrowserInput(url);
    setActiveTab('browser');
  };

  const handleLinkScrape = async () => {
    if (!user?.agreementAccepted) { setShowAgreement(true); return; }
    if (!linkInput.trim()) return;
    setIsScraping(true);
    try {
      const analyzed = await analyzeDirectLink(linkInput);
      setResults([analyzed]);
      setLinkInput('');
      setActiveTab('search');
    } catch (e: any) {
      alert(e.message || "Błąd analizy linku.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeploy = async () => {
    if (!user?.agreementAccepted) { setShowAgreement(true); return; }
    if (!user || dlgFiles.length === 0) return;
    setIsDeploying(true);
    try {
      const res = await coreService.deployApplication(user, "DriveSearch_App_" + user.dlgId.replace(/-/g, '_'), dlgFiles);
      setDeploySuccess(res);
    } catch (e) { alert("Deployment error."); }
    finally { setIsDeploying(false); }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isThinking) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(p => [...p, {role: 'user', text: msg}]);
    setIsThinking(true);
    try {
      const result = await chatSessionRef.current.sendMessage({ message: msg });
      setChatMessages(p => [...p, {role: 'bot', text: result.text}]);
    } catch (e) { console.error(e); }
    finally { setIsThinking(false); }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('DLG_SESSION_USER');
    setShowProfileMenu(false);
  };

  const addToVault = (r: ScrapedContent) => {
    if (!user?.agreementAccepted) { setShowAgreement(true); return; }
    const newFile: DLGFile = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: r.title.replace(/\s+/g, '_').substring(0, 30) + ".DLG", 
      size: '156KB', 
      type: r.contentType || 'Scraped-Node', 
      icon: 'globe', 
      createdAt: Date.now(), 
      isEncrypted: true 
    };
    setDlgFiles(p => [newFile, ...p]);
    alert(`Node "${r.title}" dodany do DriveSearch Vault.`);
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
      <p className="text-slate-500 font-medium uppercase tracking-[0.4em] text-[10px]">Initializing DriveSearch v1.0X...</p>
    </div>
  );
  
  if (!user) return <AuthGateway onAuth={(u) => { 
    setUser(u); 
    localStorage.setItem('DLG_SESSION_USER', JSON.stringify(u)); 
    if(!u.agreementAccepted) setShowAgreement(true); 
  }} />;

  return (
    <div className="min-h-screen bg-slate-950 flex font-inter text-slate-100 selection:bg-indigo-500 overflow-hidden">
      
      {/* Edge-Style Sidebar Navigation */}
      <aside className="w-[64px] flex flex-col items-center py-6 bg-slate-900/90 border-r border-white/5 z-[60] shrink-0">
         <div className="mb-10 cursor-pointer hover:rotate-12 transition-transform" onClick={() => setActiveTab('home')}>
            <DriveSearchLogo size={32} className="flex-col" />
         </div>
         
         <div className="flex flex-col gap-5 flex-grow">
            <SidebarItem icon={<Search size={22}/>} active={activeTab === 'home' || activeTab === 'search'} onClick={() => setActiveTab('home')} label="DriveSearch" />
            <SidebarItem icon={<Monitor size={22}/>} active={activeTab === 'browser'} onClick={() => setActiveTab('browser')} label="Web Hub" />
            <SidebarItem icon={<LinkIcon size={22}/>} active={activeTab === 'link-linker'} onClick={() => setActiveTab('link-linker')} label="Node Linker" />
            <SidebarItem icon={<HardDrive size={22}/>} active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} label="Vault" />
            <SidebarItem icon={<Activity size={22}/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Ecosystem Status" />
            <div className="h-[1px] w-8 bg-white/10 mx-auto my-3"></div>
            <SidebarItem icon={<Bookmark size={22}/>} label="Collections" />
         </div>

         <div className="mt-auto flex flex-col gap-4">
            <SidebarItem icon={<Settings size={22}/>} label="Preferences" />
            <div className="relative">
              <img 
                src={user.avatar} 
                className="w-10 h-10 rounded-xl cursor-pointer ring-2 ring-transparent hover:ring-indigo-500/50 transition-all object-cover" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              />
              {showProfileMenu && (
                <div className="absolute left-full bottom-0 ml-4 w-72 glass border border-white/10 rounded-3xl p-6 shadow-2xl z-[100] animate-in slide-in-from-left-2">
                   <div className="flex flex-col items-center text-center space-y-4">
                      <img src={user.avatar} className="w-20 h-20 rounded-2xl border-2 border-indigo-500 shadow-xl" />
                      <div>
                         <p className="font-black text-white">{user.name}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.dlgId}</p>
                      </div>
                      <div className="w-full h-[1px] bg-white/5 my-2"></div>
                      <button onClick={handleLogout} className="w-full py-3 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                        <LogOut size={14}/> Sign Out
                      </button>
                   </div>
                </div>
              )}
            </div>
         </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        
        {activeTab === 'browser' && (
            <div className="flex-grow flex flex-col bg-[#121212]">
               <div className="bg-[#1e1e1e] p-3 flex items-center gap-4 border-b border-black/30 shrink-0">
                  <div className="flex items-center gap-1">
                     <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"><ChevronLeft size={20}/></button>
                     <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all rotate-180"><ChevronLeft size={20}/></button>
                     <button onClick={() => setBrowserUrl(browserUrl)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"><RotateCw size={18}/></button>
                  </div>
                  <div className="flex-grow max-w-4xl flex items-center bg-black/40 border border-white/5 rounded-xl px-5 py-2">
                     <Lock size={14} className="text-emerald-500 mr-3" />
                     <input 
                        type="text" 
                        className="flex-grow bg-transparent border-none outline-none text-xs text-slate-400 font-mono"
                        value={browserInput}
                        onChange={(e) => setBrowserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setBrowserUrl(browserInput.includes('://') ? browserInput : 'https://' + browserInput)}
                     />
                     <ExternalLink size={14} className="text-slate-500 ml-3 cursor-pointer hover:text-indigo-400" onClick={() => window.open(browserUrl, '_blank')} />
                  </div>
               </div>
               <iframe 
                key={browserUrl}
                src={browserUrl} 
                className="flex-grow w-full border-none"
                title="DriveSearch Web Hub"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
            </div>
        )}

        {activeTab === 'home' && (
            <div className="min-h-full flex flex-col items-center justify-center pb-32 px-6 animate-in fade-in duration-1000">
               <div className="mb-12 text-center relative">
                  <h1 className="text-[110px] font-black italic tracking-tighter leading-none select-none relative z-10">
                    <span className="text-blue-500">D</span>
                    <span className="text-red-500">r</span>
                    <span className="text-yellow-500">i</span>
                    <span className="text-blue-500">v</span>
                    <span className="text-green-500">e</span>
                    <span className="text-red-500">S</span>
                  </h1>
                  <p className="text-[12px] font-black uppercase tracking-[1.2em] text-slate-600 mt-4 ml-6">Neural Search Ecosystem</p>
               </div>

               <div className="w-full max-w-[620px] group relative mb-10">
                  <div className="relative z-10 flex items-center bg-[#202124] hover:bg-[#303134] border border-white/10 rounded-[2rem] px-8 py-4 shadow-2xl transition-all">
                     <Search size={22} className="text-slate-500 mr-5" />
                     <input 
                        type="text" 
                        autoFocus
                        placeholder="Przeszukaj sieć DriveSearch..."
                        className="flex-grow bg-transparent border-none outline-none text-white text-lg font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                     />
                     <Monitor size={20} className="text-sky-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => setActiveTab('browser')} />
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={handleSearch} className="px-8 py-3 bg-[#303134] hover:bg-slate-700 text-sm font-black uppercase tracking-widest rounded-xl transition-all">Drive Search</button>
                  <button className="px-8 py-3 bg-[#303134] hover:bg-slate-700 text-sm font-black uppercase tracking-widest rounded-xl transition-all">I'm Feeling Quantum</button>
               </div>
            </div>
        )}

        {activeTab === 'search' && (
            <div className="max-w-4xl px-8 lg:px-44 py-10 animate-in fade-in">
               <div className="flex items-center gap-8 mb-10 border-b border-white/5 pb-8">
                  <div className="w-full max-w-2xl flex items-center bg-[#303134] border border-white/5 rounded-2xl px-7 py-3">
                    <input 
                        type="text" 
                        className="flex-grow bg-transparent border-none outline-none text-white font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Search size={20} className="text-indigo-400 cursor-pointer" onClick={handleSearch}/>
                  </div>
               </div>
               <div className="space-y-12">
                  {results.map(r => (
                    <div key={r.id} className="group max-w-3xl">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => openInBrowser(r.url)}>
                             <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-slate-500"><Monitor size={16}/></div>
                             <span className="text-xs font-mono text-slate-400">{new URL(r.url).hostname}</span>
                          </div>
                          <h3 onClick={() => setPreviewContent(r)} className="text-2xl font-black text-indigo-400 group-hover:underline cursor-pointer tracking-tight">{r.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{r.snippet}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
        )}
        
        {activeTab === 'vault' && (
            <div className="p-16 max-w-[1600px] mx-auto w-full animate-in fade-in">
                <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-16">
                    <h2 className="text-6xl font-black italic uppercase text-white tracking-tighter">DriveSearch <span className="text-indigo-500">Vault</span></h2>
                    <button onClick={handleDeploy} disabled={isDeploying || dlgFiles.length === 0} className="px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase italic shadow-2xl transition-all">
                        {isDeploying ? <Loader2 className="animate-spin" /> : 'Package Distribution'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {dlgFiles.map(file => (
                      <div key={file.id} className="p-12 bg-[#1a1a1a] border border-white/5 rounded-[4rem] group hover:border-indigo-500/50 transition-all relative">
                         <button onClick={() => setDlgFiles(p => p.filter(f => f.id !== file.id))} className="absolute top-8 right-8 text-slate-700 hover:text-red-500"><Trash2 size={20}/></button>
                         <FileArchive size={48} className="text-indigo-500 mb-8" />
                         <h4 className="text-lg font-black italic uppercase text-white truncate">{file.name}</h4>
                      </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Auth Modal UI */}
      {showAgreement && (
        <div className="fixed inset-0 z-[3000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in">
            <div className="max-w-2xl w-full bg-[#151515] border border-indigo-500/40 rounded-[4rem] p-16 space-y-12 shadow-2xl">
                <div className="flex items-center gap-8">
                    <ShieldCheck size={48} className="text-indigo-400" />
                    <h2 className="text-4xl font-black italic uppercase text-white">DriveSearch<span className="text-indigo-500">.pl</span></h2>
                </div>
                <div className="bg-black/60 rounded-[2.5rem] p-10 border border-white/5 max-h-[350px] overflow-y-auto custom-scrollbar font-mono text-xs text-slate-500 leading-relaxed">
                    <p className="mb-4 text-indigo-500 font-black">DRIVESEARCH v1.0X ECOSYSTEM AGREEMENT</p>
                    <p>By connecting to the DriveSearch network, you agree to secure data distribution and neural node indexing. All transactions are local and end-to-end encrypted via Quantum-Shadow protocols.</p>
                </div>
                <button onClick={handleAcceptAgreement} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase italic transition-all flex items-center justify-center gap-4">
                    <FileCheck size={22}/> Verify Node Authenticity
                </button>
            </div>
        </div>
      )}

      {deploySuccess && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in">
           <div className="max-w-2xl w-full glass border-2 border-emerald-500/40 p-20 rounded-[6rem] text-center space-y-10 shadow-2xl">
              <FileArchive size={100} className="text-emerald-500 mx-auto" />
              <h3 className="text-5xl font-black italic uppercase text-white tracking-tighter">Node <span className="text-emerald-500">Live</span></h3>
              <div className="p-10 bg-black/60 rounded-[3rem] border border-white/5 space-y-4 shadow-inner">
                 <p className="text-[11px] font-black uppercase text-slate-700 tracking-[0.5em]">Global Distribution Link</p>
                 <p className="text-3xl font-mono text-emerald-400 break-all select-all font-bold">{deploySuccess.url}</p>
              </div>
              <button onClick={() => setDeploySuccess(null)} className="w-full py-7 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2.5rem] uppercase italic tracking-[0.3em] transition-all">Dismiss</button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- WORLD-CLASS AUTHENTICATION GATEWAY ---

const AuthGateway: React.FC<{ onAuth: (u: User) => void }> = ({ onAuth }) => {
  const [step, setStep] = useState<'email' | 'password' | 'register-type' | 'register-form' | 'recovery-email' | 'recovery-code' | 'reset-password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'Personal' | 'Child' | 'Business'>('Personal');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'email') {
        const u = getUserByEmail(email);
        if (!u) setStep('register-type');
        else setStep('password');
      } else if (step === 'password') {
        const u = await loginUser(email, password);
        onAuth(u);
      } else if (step === 'register-form') {
        const u = await registerUser({ name, email, password, accountType });
        onAuth(u);
      } else if (step === 'recovery-email') {
        // Send simulated recovery code
        setStep('recovery-code');
      } else if (step === 'recovery-code') {
        if (recoveryCode === '123456') setStep('reset-password');
        else throw new Error("Incorrect security verification code.");
      } else if (step === 'reset-password') {
        const u = await resetPasswordWithCode(email, newPassword);
        onAuth(u);
      }
    } catch (e: any) {
      setError(e.message || "Ecosystem Authentication Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-8 font-inter relative overflow-hidden">
      {/* Dynamic background element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent animate-pulse"></div>
      
      <div className="max-w-[480px] w-full bg-[#0f0f12] border border-white/5 rounded-[4rem] p-12 md:p-16 shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-700 relative z-10">
        <div className="text-center space-y-6">
           <div className="flex justify-center mb-4">
              <DriveSearchLogo size={80} className="flex-col" />
           </div>
           <div className="space-y-2">
             <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                {step === 'email' && 'Authenticate'}
                {step === 'password' && `Access Key`}
                {step === 'register-type' && 'Create Identity'}
                {step === 'register-form' && 'Node Enrollment'}
                {(step === 'recovery-email' || step === 'recovery-code') && 'Recovery Flow'}
                {step === 'reset-password' && 'Security Reset'}
             </h1>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                {step === 'email' && 'Use your DriveSearch enclave'}
                {step === 'password' && `Connecting: ${email}`}
                {step === 'register-type' && 'Select your node profile type'}
                {step === 'recovery-email' && 'Code will be sent to your enclave'}
             </p>
           </div>
        </div>

        {error && (
           <div className="mt-8 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase flex items-center gap-4 animate-shake">
              <ShieldAlert size={18}/> {error}
           </div>
        )}

        <form onSubmit={handleNext} className="mt-10 space-y-6">
           {step === 'email' && (
              <div className="space-y-4">
                <input 
                   type="email" 
                   placeholder="Identity Email" 
                   required 
                   className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold shadow-inner"
                   value={email} 
                   onChange={e => setEmail(e.target.value)} 
                />
                <div className="flex justify-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer border border-white/10">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer border border-white/10">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#F25022"/></svg>
                   </div>
                </div>
              </div>
           )}

           {step === 'password' && (
              <div className="space-y-4">
                 <input 
                    type="password" 
                    placeholder="Enclave Access Key" 
                    required 
                    autoFocus
                    className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold shadow-inner"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                 />
                 <button type="button" onClick={() => setStep('recovery-email')} className="text-indigo-500 font-black text-[10px] uppercase tracking-widest hover:underline block mx-auto">Forgot Access Key?</button>
              </div>
           )}

           {step === 'register-type' && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4">
                 <AccountTypeOption 
                    icon={<UserIcon size={24}/>} 
                    title="Osobiste" 
                    desc="Individual neural distribution node." 
                    onClick={() => { setAccountType('Personal'); setStep('register-form'); }}
                 />
                 <AccountTypeOption 
                    icon={<Baby size={24}/>} 
                    title="Dla dziecka" 
                    desc="Supervised access with safety protocols." 
                    onClick={() => { setAccountType('Child'); setStep('register-form'); }}
                 />
                 <AccountTypeOption 
                    icon={<Briefcase size={24}/>} 
                    title="Firmowe" 
                    desc="Advanced business multi-node management." 
                    onClick={() => { setAccountType('Business'); setStep('register-form'); }}
                 />
              </div>
           )}

           {step === 'register-form' && (
              <div className="space-y-4">
                 <div className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl items-center mb-6">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                       {accountType === 'Personal' && <UserIcon size={16}/>}
                       {accountType === 'Child' && <Baby size={16}/>}
                       {accountType === 'Business' && <Briefcase size={16}/>}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typ: {accountType === 'Personal' ? 'Osobiste' : accountType === 'Child' ? 'Dla dziecka' : 'Firmowe'}</span>
                 </div>
                 <input type="text" placeholder="Identity Name" required className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold" value={name} onChange={e => setName(e.target.value)} />
                 <input type="password" placeholder="Set Access Key" required className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
           )}

           {step === 'recovery-email' && (
              <input 
                 type="email" 
                 placeholder="Recovery Identity Email" 
                 required 
                 className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold"
                 value={email} 
                 onChange={e => setEmail(e.target.value)} 
              />
           )}

           {step === 'recovery-code' && (
              <div className="space-y-4">
                 <p className="text-[10px] text-slate-600 font-black uppercase text-center tracking-widest">Verification Node: 123456</p>
                 <input type="text" placeholder="------" required className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white text-center text-3xl tracking-[0.5em] font-mono font-black" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} />
              </div>
           )}

           {step === 'reset-password' && (
              <input type="password" placeholder="New Access Key" required className="w-full bg-black border border-white/10 px-6 py-5 rounded-2xl text-white font-bold" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
           )}

           <div className="flex justify-between items-center pt-8">
              {step !== 'email' && (
                <button type="button" onClick={() => setStep('email')} className="text-slate-600 font-black uppercase text-[11px] tracking-widest hover:text-white transition-all">Back</button>
              )}
              <div className="ml-auto">
                <button 
                    type="submit" 
                    disabled={loading || step === 'register-type'} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase italic text-[12px] tracking-[0.3em] px-12 py-5 rounded-3xl shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all flex items-center gap-4 active:scale-95 disabled:opacity-0"
                >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : 'Proceed'}
                    {!loading && <ArrowRight size={20}/>}
                </button>
              </div>
           </div>
        </form>

        {step === 'email' && (
            <div className="mt-14 pt-10 border-t border-white/5 space-y-6">
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em] text-center">Create Node Identity For:</p>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => { setAccountType('Child'); setStep('register-form'); }} className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                       <Baby size={18} className="text-indigo-400"/>
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Child</span>
                    </button>
                    <button onClick={() => { setAccountType('Personal'); setStep('register-form'); }} className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                       <UserIcon size={18} className="text-indigo-400"/>
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Personal</span>
                    </button>
                    <button onClick={() => { setAccountType('Business'); setStep('register-form'); }} className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                       <Briefcase size={18} className="text-indigo-400"/>
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Business</span>
                    </button>
                </div>
            </div>
        )}
      </div>
      
      <footer className="mt-16 flex gap-10 text-[9px] font-black uppercase tracking-[0.5em] text-slate-800">
         <span className="text-indigo-700 animate-pulse">DriveSearch Node Active</span>
         <a href="#" className="hover:text-slate-600 transition-colors">Privacy Vault</a>
         <a href="#" className="hover:text-slate-600 transition-colors">Legal Protocol</a>
      </footer>
    </div>
  );
};

const AccountTypeOption: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
    <button onClick={onClick} className="w-full p-6 bg-black/40 border border-white/5 rounded-[2.5rem] flex items-center gap-6 hover:bg-indigo-600/10 hover:border-indigo-600/50 group transition-all text-left">
        <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-indigo-600/20 transition-colors text-indigo-400 group-hover:text-indigo-300">{icon}</div>
        <div>
            <p className="font-black uppercase text-xs tracking-widest text-white">{title}</p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-400 font-bold leading-tight mt-1">{desc}</p>
        </div>
        <ChevronRight size={20} className="ml-auto text-slate-800 group-hover:text-indigo-400 transition-all transform group-hover:translate-x-1" />
    </button>
);

const SidebarItem: React.FC<{ icon: React.ReactNode; active?: boolean; onClick?: () => void; label: string }> = ({ icon, active, onClick, label }) => (
  <div className="relative group px-2">
     <button 
       onClick={onClick} 
       className={`p-3.5 rounded-2xl transition-all duration-300 relative ${active ? 'bg-indigo-600/20 text-indigo-400 shadow-xl' : 'text-slate-600 hover:bg-white/5 hover:text-white'}`}
     >
        {icon}
        {active && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,1)]"></div>}
     </button>
  </div>
);

export default App;
