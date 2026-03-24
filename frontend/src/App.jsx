import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { BookOpen, Sparkles, Calendar, Clock, ArrowRight, BrainCircuit, CheckCircle, ChevronRight, Loader2, Play, Pause, RotateCcw, Trash2, Sun, Moon, Copy, Edit2, Save } from 'lucide-react';
import './App.css';

const Navbar = ({ theme, toggleTheme, user, setUser }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo text-gradient">
        <BookOpen size={28} color="#2563eb" />
        StudySync AI
      </Link>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" className="nav-link">Home</Link>
        {user && <Link to="/dashboard" className="nav-link">My Plan</Link>}
        <button onClick={toggleTheme} className="glass-button" title="Toggle Theme" style={{ padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {user ? (
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="glass-button secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Logout</button>
          </div>
        ) : (
          <Link to="/login" className="glass-button primary" style={{ padding: '0.5rem 1rem' }}>Login</Link>
        )}
      </div>
    </nav>
  );
};

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      
      const userObj = { id: data.user_id, name: formData.name || formData.email.split('@')[0], email: formData.email };
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex justify-center mt-8">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 className="mb-6 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        {error && <div className="badge mb-4" style={{ background: 'var(--status-danger)', color: 'white', width: '100%', padding: '0.5rem', whiteSpace: 'normal', display: 'block' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          {!isLogin && (
            <div className="form-group mb-0">
              <label className="form-label">Full Name</label>
              <input required type="text" className="glass-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          <div className="form-group mb-0">
            <label className="form-label">Email Address</label>
            <input required type="email" className="glass-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Password</label>
            <input required type="password" className="glass-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="glass-button primary mt-2 w-100" style={{ width: '100%' }} disabled={loading}>
            {loading ? <Loader2 className="loader" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-gradient" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="animate-fade-in">
      <div className="hero-section">
        <div className="badge purple mb-4">✨ AI-Powered Learning</div>
        <h1 className="hero-title">
          Academic structure with <br/><span className="text-gradient">Intelligent Planning</span>
        </h1>
        <p className="hero-subtitle">
          Stop guessing what to study next. Our AI analyzes your goals, availability, and exams to generate the perfect structured syllabus.
        </p>
        <button 
          onClick={() => navigate('/create-plan')} 
          className="glass-button primary large"
        >
          Generate Syllabus <ArrowRight size={20} />
        </button>
      </div>

      <div className="grid-3 mt-8">
        <div className="glass-card">
          <div className="feature-icon"><BrainCircuit size={24} /></div>
          <h3>Smart Analysis</h3>
          <p>Our AI understands your syllabus and breaks it down into manageable daily milestones.</p>
        </div>
        <div className="glass-card">
          <div className="feature-icon"><Calendar size={24} /></div>
          <h3>Dynamic Scheduling</h3>
          <p>Plans that adapt to your life. Miss a day? The schedule automatically recalibrates.</p>
        </div>
        <div className="glass-card">
          <div className="feature-icon"><CheckCircle size={24} /></div>
          <h3>Track Progress</h3>
          <p>Visualize your mastery over topics and stay motivated as you approach exam day.</p>
        </div>
      </div>
    </div>
  );
};

const CreatePlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    examDate: '',
    hoursPerDay: '2',
    currentLevel: 'beginner'
  });

  const popularSubjects = ['Mathematics', 'Biology', 'Computer Science', 'History', 'Physics', 'Economics'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call to our backend
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      // Store in local storage for dashboard
      localStorage.setItem('currentStudyPlan', JSON.stringify(data.plan));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to generate plan', error);
      alert('Error connecting to backend. Please ensure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 className="text-gradient text-center mb-8">Configure Your AI Plan</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject / Course Name</label>
            <input 
              required
              type="text" 
              className="glass-input" 
              placeholder="e.g. Advanced Calculus, AP Biology..."
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            />
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Suggested:</span>
              {popularSubjects.map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setFormData({...formData, subject: sub})}
                  className="badge"
                  style={{ 
                    border: formData.subject === sub ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)', 
                    background: formData.subject === sub ? 'rgba(139, 92, 246, 0.2)' : 'transparent', 
                    cursor: 'pointer',
                    color: formData.subject === sub ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Exam Date</label>
              <input 
                required
                type="date" 
                className="glass-input" 
                value={formData.examDate}
                onChange={e => setFormData({...formData, examDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hours / Day</label>
              <select 
                className="glass-input"
                value={formData.hoursPerDay}
                onChange={e => setFormData({...formData, hoursPerDay: e.target.value})}
              >
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="4">4 Hours</option>
                <option value="6">6+ Hours</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Current Knowledge Level</label>
            <select 
              className="glass-input"
              value={formData.currentLevel}
              onChange={e => setFormData({...formData, currentLevel: e.target.value})}
            >
              <option value="beginner">Beginner (Starting from scratch)</option>
              <option value="intermediate">Intermediate (Need review & practice)</option>
              <option value="advanced">Advanced (Only mock tests & weak areas)</option>
            </select>
          </div>
          
          <button type="submit" className="glass-button primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <><Loader2 className="loader" /> Building Syllabus...</> : <><Sparkles size={20}/> Generate Syllabus</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const PomodoroTimer = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Focus Timer", { 
          body: isBreak ? "Break is over! Time to focus." : "Focus session complete! Take a 5 min break." 
        });
      }
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };
  const switchMode = (breakMode) => {
    setIsBreak(breakMode);
    setIsActive(false);
    setTimeLeft(breakMode ? 5 * 60 : 25 * 60);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="glass-panel text-center mb-8 animate-fade-in relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-white transition-colors" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          ✕
        </button>
      )}
      <h3 className="mb-4 flex justify-center items-center gap-2"><Clock size={20}/> Focus Timer</h3>
      <div className="flex justify-center gap-4 mb-4">
        <button className={`glass-button ${!isBreak ? 'primary' : ''}`} onClick={() => switchMode(false)}>Focus (25m)</button>
        <button className={`glass-button ${isBreak ? 'primary' : ''}`} onClick={() => switchMode(true)}>Break (5m)</button>
      </div>
      <div className="text-gradient" style={{ fontSize: '4rem', fontWeight: 'bold', margin: '1.5rem 0', fontFamily: 'monospace' }}>
        {mins}:{secs}
      </div>
      <div className="flex justify-center gap-4">
        <button className="glass-button primary large flex items-center gap-2" onClick={toggleTimer}>
          {isActive ? <Pause size={20}/> : <Play size={20}/>} {isActive ? 'Pause' : 'Start'}
        </button>
        <button className="glass-button large flex items-center gap-2" onClick={resetTimer}>
          <RotateCcw size={20}/> Reset
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ topic: '', description: '', hours: 0 });

  React.useEffect(() => {
    const savedPlan = localStorage.getItem('currentStudyPlan');
    if (savedPlan) {
      const parsed = JSON.parse(savedPlan);
      const updatedModules = parsed.modules.map(m => ({ ...m, isCompleted: m.isCompleted || false }));
      setPlan({ ...parsed, modules: updatedModules });
    }
  }, []);

  const handleToggleComplete = (index) => {
    const updatedPlan = { ...plan };
    updatedPlan.modules[index].isCompleted = !updatedPlan.modules[index].isCompleted;
    setPlan(updatedPlan);
    localStorage.setItem('currentStudyPlan', JSON.stringify(updatedPlan));
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditForm({ ...plan.modules[index] });
  };

  const saveEdit = () => {
    const updatedPlan = { ...plan };
    updatedPlan.modules[editingIndex] = { ...updatedPlan.modules[editingIndex], ...editForm };
    setPlan(updatedPlan);
    localStorage.setItem('currentStudyPlan', JSON.stringify(updatedPlan));
    setEditingIndex(null);
  };

  const handleCopyPlan = () => {
    const text = `Study Plan: ${plan.subject}\nExam Date: ${new Date(plan.examDate).toLocaleDateString()}\n\n` +
      plan.modules.map(m => `Day ${m.day}: ${m.topic} (${m.hours}h)\n${m.description}`).join('\n\n');
    navigator.clipboard.writeText(text);
    alert('Plan copied to clipboard!');
  };

  const handleStartFresh = () => {
    if(window.confirm('Are you sure you want to delete your current plan and start fresh?')) {
      localStorage.removeItem('currentStudyPlan');
      navigate('/create-plan');
    }
  };

  if (!plan) {
    return (
      <div className="text-center mt-8 glass-panel" style={{ padding: '3rem' }}>
        <h2>No Active Study Plan</h2>
        <p className="mb-4">You haven't generated a study plan yet.</p>
        <Link to="/create-plan" className="glass-button primary">Create One Now</Link>
      </div>
    );
  }

  const completedCount = plan.modules.filter(m => m.isCompleted).length;
  const progressPercent = Math.round((completedCount / plan.modules.length) * 100) || 0;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-gradient">Your Master Plan for {plan.subject}</h2>
          <p>Exam Date: {new Date(plan.examDate).toLocaleDateString()} • Level: {plan.level}</p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="badge purple">Target: {plan.totalStudyHours} Total Hours</div>
          <button className="glass-button flex items-center gap-2 transition-all" onClick={() => setShowTimer(!showTimer)}>
            <Clock size={16}/> {showTimer ? 'Hide Timer' : 'Focus Timer'}
          </button>
          <button className="glass-button flex items-center gap-2 transition-all" onClick={handleCopyPlan}>
            <Copy size={16}/> Copy Plan
          </button>
          <button className="glass-button flex items-center gap-2 transition-all" onClick={handleStartFresh} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Trash2 size={16}/> Start Fresh
          </button>
        </div>
      </div>
      
      {/* Progress Bar Container */}
      <div className="glass-panel mb-8" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between mb-2">
          <span>Overall Progress</span>
          <span className="text-gradient font-bold">{progressPercent}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {showTimer && <PomodoroTimer onClose={() => setShowTimer(false)} />}
      
      <div className="grid-3">
        <div style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-4 flex items-center gap-2"><Calendar size={20}/> Daily Modules</h3>
          <div className="flex-col gap-4">
            {plan.modules.map((mod, i) => (
              <div key={i} className={`glass-card flex justify-between items-center transition-all ${mod.isCompleted ? 'module-completed' : ''}`} style={{ opacity: mod.isCompleted ? 0.7 : 1 }}>
                {editingIndex === i ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginRight: '1rem' }}>
                    <input className="glass-input" value={editForm.topic} onChange={e => setEditForm({...editForm, topic: e.target.value})} placeholder="Topic Name" />
                    <textarea className="glass-input" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows="2" placeholder="Description" />
                    <div className="flex gap-2">
                       <input type="number" className="glass-input" value={editForm.hours} onChange={e => setEditForm({...editForm, hours: e.target.value})} style={{ width: '80px' }} title="Hours" />
                       <button onClick={saveEdit} className="glass-button primary flex items-center gap-1"><Save size={16}/> Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge">Day {mod.day}</span>
                      <span className="badge academic-type">{mod.type || 'Study'}</span>
                      {mod.isCompleted && <CheckCircle size={14} color="var(--status-success)"/>}
                    </div>
                    <h4 style={{ marginBottom: '0.25rem', textDecoration: mod.isCompleted ? 'line-through' : 'none', color: mod.isCompleted ? 'var(--text-muted)' : 'var(--text-main)' }}>{mod.topic}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{mod.description}</p>
                    {mod.subtopics && mod.subtopics.length > 0 && (
                      <ul style={{ margin: '0.5rem 0 0 1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {mod.subtopics.map((st, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{st}</li>)}
                      </ul>
                    )}
                    {mod.video && (
                      <a href={mod.video.url} target="_blank" rel="noreferrer" className="badge mt-2" style={{ textDecoration: 'none', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.2)', padding: '0.35rem 0.6rem' }}>
                        <Play size={12} style={{marginRight: '6px'}}/> {mod.video.title}
                      </a>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2" style={{ color: mod.isCompleted ? 'var(--text-muted)' : 'var(--accent-blue)' }}>
                      <Clock size={16}/> {mod.hours}h
                      <button onClick={() => startEditing(i)} className="glass-button" style={{ padding: '0.25rem', border: 'none', background: 'transparent', boxShadow: 'none' }} title="Edit Module"><Edit2 size={16} color="var(--text-muted)"/></button>
                    </div>
                    <button 
                      className={`glass-button transition-all ${mod.isCompleted ? 'success' : ''}`} 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleToggleComplete(i)}
                    >
                      {mod.isCompleted ? 'Completed ✓' : 'Mark Done'}
                    </button>
                  </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="mb-4 flex items-center gap-2"><Sparkles size={20}/> AI Advice</h3>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
              {plan.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <ChevronRight size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.95rem' }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {plan.mockTests && plan.mockTests.length > 0 && (
             <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
               <h3 className="mb-4 flex items-center gap-2">🎯 Mock Exams</h3>
               <div className="flex-col gap-4">
                 {plan.mockTests.map((test, i) => (
                   <div key={i} className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
                     <div className="flex justify-between items-start mb-2">
                       <h4 style={{ margin: 0 }}>{test.title}</h4>
                       <span className="badge" style={{ color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}>Day {test.recommendedDay}</span>
                     </div>
                     <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>{test.description}</p>
                     <div className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                       <Clock size={14}/> Duration: {test.duration}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {plan.advancedResources && plan.advancedResources.length > 0 && (
             <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
               <h3 className="mb-4 flex items-center gap-2">📚 Top Resources</h3>
               <div className="flex-col gap-3">
                 {plan.advancedResources.map((res, i) => (
                   <a key={i} href={res.link} className="glass-card flex items-center gap-3" style={{ padding: '1rem', textDecoration: 'none', cursor: 'pointer' }}>
                     <div className="badge purple flex items-center justify-center" style={{ padding: '0.6rem', fontSize: '1.2rem', width: '40px', height: '40px', borderRadius: '10px' }}>
                        {res.type === 'Video Course' ? '▶️' : res.type === 'Community' ? '💬' : '🧠'}
                     </div>
                     <div>
                       <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{res.title}</div>
                       <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{res.type}</div>
                     </div>
                   </a>
                 ))}
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  
  React.useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Router>
      <div className={`bg-blob bg-blob-1 ${theme}`}></div>
      <div className={`bg-blob bg-blob-2 ${theme}`}></div>
      
      <div className="app-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage setUser={setUser} />} />
          <Route path="/create-plan" element={user ? <CreatePlan /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
