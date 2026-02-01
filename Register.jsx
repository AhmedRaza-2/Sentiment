import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, ProgressBar } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/hologram.css';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) score += 12.5;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);
  const getStrengthColor = () => {
    if (passwordStrength < 25) return '#dc3545';
    if (passwordStrength < 50) return '#fd7e14';
    if (passwordStrength < 75) return '#ffc107';
    return '#28a745';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    
    try {
      // Firebase registration
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user in MongoDB
      try {
        await axios.post("http://209.38.120.178:5000/api/user", {
          uid: user.uid,
          name,
          email,
        });
      } catch (apiErr) {
        console.warn("MongoDB save failed, but user created:", apiErr);
      }

      // Sign out the user after registration so they need to login
      await signOut(auth);
      setSuccess("Registration successful! Redirecting to login...");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      default:
        return 'Registration failed. Please try again.';
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.4, delay: 0.2 }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0F1F 0%, #141A34 50%, #1B2448 100%)',
      paddingTop: '100px',
      paddingBottom: '60px'
    }}>
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
            >
              {/* Back Button */}
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link 
                  to="/login" 
                  className="text-decoration-none d-flex align-items-center"
                  style={{ color: '#7CC9FF', fontSize: '1rem', fontWeight: '500' }}
                >
                  <svg width="16" height="16" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                  </svg>
                  Back to Login
                </Link>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="holo-card border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(15, 21, 48, 0.8)', 
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                  {/* Header */}
                  <Card.Header className="border-0 text-center py-4"
                               style={{ 
                                 background: 'linear-gradient(135deg, rgba(0, 164, 255, 0.1), rgba(110, 58, 255, 0.1))',
                                 borderRadius: '20px 20px 0 0'
                               }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                    >
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{
                          width: '80px',
                          height: '80px',
                          background: 'linear-gradient(135deg, #00A4FF, #6E3AFF)',
                          boxShadow: '0 10px 30px rgba(0, 164, 255, 0.3)'
                        }}
                      >
                        <svg width="32" height="32" fill="white" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                      </div>
                    </motion.div>
                    <h2 className="fw-bold mb-2 holo-glow">Join PhishShield</h2>
                    <p className="mb-0" style={{ color: '#B8C5D6' }}>Create your account and start protecting your digital life</p>
                  </Card.Header>

                  {/* Body */}
                  <Card.Body className="p-5">
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="mb-4"
                        >
                          <Alert variant="danger" className="border-0" style={{
                            background: 'rgba(220, 53, 69, 0.1)',
                            color: '#ff6b7a',
                            borderRadius: '12px'
                          }}>
                            <svg width="16" height="16" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                            </svg>
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="mb-4"
                        >
                          <Alert variant="success" className="border-0" style={{
                            background: 'rgba(40, 167, 69, 0.1)',
                            color: '#28a745',
                            borderRadius: '12px'
                          }}>
                            <svg width="16" height="16" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                            </svg>
                            {success}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Form onSubmit={handleRegister}>
                      {/* Name Field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold mb-2" style={{ color: '#E8F4FD' }}>
                            Full Name
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRight: 'none',
                              color: '#00A4FF'
                            }}>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                              </svg>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Enter your full name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderLeft: 'none',
                                color: '#E8F4FD',
                                fontSize: '1rem',
                                padding: '12px 16px'
                              }}
                            />
                          </InputGroup>
                        </Form.Group>
                      </motion.div>

                      {/* Email Field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold mb-2" style={{ color: '#E8F4FD' }}>
                            Email Address
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRight: 'none',
                              color: '#00A4FF'
                            }}>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                              </svg>
                            </InputGroup.Text>
                            <Form.Control
                              type="email"
                              placeholder="Enter your email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderLeft: 'none',
                                color: '#E8F4FD',
                                fontSize: '1rem',
                                padding: '12px 16px'
                              }}
                            />
                          </InputGroup>
                        </Form.Group>
                      </motion.div>

                      {/* Password Field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold mb-2" style={{ color: '#E8F4FD' }}>
                            Password
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRight: 'none',
                              color: '#00A4FF'
                            }}>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                              </svg>
                            </InputGroup.Text>
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderLeft: 'none',
                                borderRight: 'none',
                                color: '#E8F4FD',
                                fontSize: '1rem',
                                padding: '12px 16px'
                              }}
                            />
                            <InputGroup.Text 
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderLeft: 'none',
                                color: '#00A4FF',
                                cursor: 'pointer'
                              }}
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                                </svg>
                              ) : (
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                </svg>
                              )}
                            </InputGroup.Text>
                          </InputGroup>
                          {password && (
                            <div className="mt-2">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <small style={{ color: '#B8C5D6' }}>Password Strength:</small>
                                <small style={{ color: getStrengthColor(), fontWeight: '600' }}>{getStrengthText()}</small>
                              </div>
                              <ProgressBar 
                                now={passwordStrength} 
                                style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)' }}
                                className="rounded"
                              >
                                <ProgressBar 
                                  now={passwordStrength} 
                                  style={{ background: getStrengthColor() }}
                                />
                              </ProgressBar>
                            </div>
                          )}
                        </Form.Group>
                      </motion.div>

                      {/* Confirm Password Field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold mb-2" style={{ color: '#E8F4FD' }}>
                            Confirm Password
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRight: 'none',
                              color: '#00A4FF'
                            }}>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                              </svg>
                            </InputGroup.Text>
                            <Form.Control
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderLeft: 'none',
                                borderRight: 'none',
                                color: '#E8F4FD',
                                fontSize: '1rem',
                                padding: '12px 16px'
                              }}
                            />
                            <InputGroup.Text 
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderLeft: 'none',
                                color: '#00A4FF',
                                cursor: 'pointer'
                              }}
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                                </svg>
                              ) : (
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                </svg>
                              )}
                            </InputGroup.Text>
                          </InputGroup>
                          {confirmPassword && password !== confirmPassword && (
                            <small className="text-danger mt-1 d-block">
                              <svg width="12" height="12" className="me-1" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                              </svg>
                              Passwords do not match
                            </small>
                          )}
                        </Form.Group>
                      </motion.div>

                      {/* Register Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          size="lg"
                          disabled={loading || !password || password !== confirmPassword}
                          className="w-100 fw-bold py-3 mb-4"
                          style={{
                            background: loading || !password || password !== confirmPassword
                              ? 'rgba(0, 164, 255, 0.3)' 
                              : 'linear-gradient(135deg, #00A4FF, #6E3AFF)',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            boxShadow: '0 8px 25px rgba(0, 164, 255, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {loading ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <svg width="20" height="20" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                              </svg>
                              Create Account
                            </>
                          )}
                        </Button>
                      </motion.div>

                      {/* Login Link */}
                      <div className="text-center">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 }}
                          className="mb-0" 
                          style={{ color: '#B8C5D6' }}
                        >
                          Already have an account?{" "}
                          <Link 
                            to="/login" 
                            className="text-decoration-none fw-semibold"
                            style={{ color: '#6E3AFF' }}
                          >
                            Sign In Here
                          </Link>
                        </motion.p>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
