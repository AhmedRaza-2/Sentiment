import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithGithub } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('❌ Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('❌ Password must be at least 6 characters!');
      return;
    }

    if (!formData.name.trim()) {
      setError('❌ Please enter your name!');
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      console.log('✅ User created:', userCredential.user.uid);

      // Create user profile in MongoDB backend (optional)
      try {
        const response = await fetch('http://localhost:5000/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: formData.name,
            createdAt: new Date().toISOString()
          })
        });

        if (response.ok) {
          console.log('✅ MongoDB profile created');
        }
      } catch (dbError) {
        console.warn('⚠️ MongoDB connection failed:', dbError);
        // Continue anyway - user is created in Firebase
      }

      localStorage.setItem('convosense_user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: formData.name
      }));

      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      
      let errorMessage = 'Registration failed.';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = '❌ Email already registered. Try logging in.';
          break;
        case 'auth/invalid-email':
          errorMessage = '❌ Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = '❌ Password too weak. Use at least 6 characters.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '❌ Email/Password sign-up is disabled. Please enable it in Firebase Console.';
          break;
        default:
          errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      if (user) {
        console.log('✅ Google signup successful:', user.uid);
        
        // Create MongoDB profile (optional)
        try {
          await fetch('http://localhost:5000/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              createdAt: new Date().toISOString()
            })
          });
        } catch (dbError) {
          console.warn('⚠️ MongoDB error:', dbError);
        }

        localStorage.setItem('convosense_user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Google signup error:', err);
      setError('❌ Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGithub();
      if (user) {
        console.log('✅ GitHub signup successful:', user.uid);
        
        // Create MongoDB profile (optional)
        try {
          await fetch('http://localhost:5000/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              createdAt: new Date().toISOString()
            })
          });
        } catch (dbError) {
          console.warn('⚠️ MongoDB error:', dbError);
        }

        localStorage.setItem('convosense_user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ GitHub signup error:', err);
      setError('❌ GitHub sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🧠 ConvoSense</h1>
          <p className="tagline">Social Media Intelligence Dashboard</p>
        </div>
        
        <h2>Create Account</h2>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              autoComplete="name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              autoComplete="new-password"
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
              autoComplete="new-password"
              disabled={loading}
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignup} 
          disabled={loading}
          className="btn-google"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <button 
          onClick={handleGithubSignup} 
          disabled={loading}
          className="btn-github"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>

        <div className="auth-footer">
          <p className="auth-switch">
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
