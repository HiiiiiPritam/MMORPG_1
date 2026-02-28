import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, GraduationCap, ChevronRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Validate NIT JSR email
      if (email.endsWith('@nitjsr.ac.in')) {
        localStorage.setItem('nitjsr_email', email);
        navigate('/select');
      } else {
        setError('Only valid @nitjsr.ac.in emails are allowed.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="page-container">
      <div className="bg-orb orb-1 animate-float"></div>
      <div className="bg-orb orb-2 animate-float"></div>

      <div className="glass-panel animate-fade-in">
        <div className="text-center mb-8">
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'16px' }}>
            <div style={{ background:'rgba(255,255,255,0.1)', width:'80px', height:'80px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GraduationCap size={40} color="#f43f5e" />
            </div>
          </div>
          <h1 style={{ color: 'white' }}>NIT JSR <span className="text-gradient">Games</span></h1>
          <p style={{ color: '#cbd5e1' }}>Enter the student multiverse.</p>
        </div>

        <form onSubmit={handleLogin}>
          <label style={{display:'block', marginBottom:'8px', color:'#94a3b8', fontSize:'14px'}}>College Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rollno@nitjsr.ac.in"
            className="input-field"
            required
          />

          {error && <div className="error-msg animate-fade-in">{error}</div>}

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <Gamepad2 size={20} />
                Authenticate
                <ChevronRight size={18} style={{marginLeft:'auto'}} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p style={{fontSize:'12px'}}>Strictly for students of National Institute of Technology, Jamshedpur.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
