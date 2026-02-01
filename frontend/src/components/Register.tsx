import React, { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';

const Register: React.FC = () => {
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

    const calculatePasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length >= 8) score += 25;
        if (/[a-z]/.test(pass)) score += 25;
        if (/[A-Z]/.test(pass)) score += 25;
        if (/[0-9]/.test(pass)) score += 12.5;
        if (/[^A-Za-z0-9]/.test(pass)) score += 12.5;
        return score;
    };

    const passwordStrength = calculatePasswordStrength(password);

    const getStrengthColor = () => {
        if (passwordStrength < 25) return '#dc3545';
        if (passwordStrength < 50) return '#fd7e14';
        if (passwordStrength < 75) return '#ffc107';
        return '#28a745';
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            try {
                await axios.post("http://localhost:5003/api/user", {
                    uid: user.uid,
                    name,
                    email,
                });
            } catch (apiErr) {
                console.warn("Backend save failed:", apiErr);
            }

            await signOut(auth);
            setSuccess("Account created! Plz login.");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', paddingTop: '50px' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={6}>
                        <Card className="shadow-lg border-0 bg-dark text-white p-4">
                            <h2 className="text-center mb-4">Join ConvoSense</h2>
                            <AnimatePresence>
                                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="danger">{error}</Alert></motion.div>}
                                {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="success">{success}</Alert></motion.div>}
                            </AnimatePresence>
                            <Form onSubmit={handleRegister}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    <ProgressBar now={passwordStrength} className="mt-2" style={{ height: '5px' }} />
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </Form.Group>
                                <Button type="submit" className="w-100 btn-primary py-2" disabled={loading}>
                                    {loading ? "Registering..." : "Create Account"}
                                </Button>
                                <p className="text-center mt-3">Already have an account? <Link to="/login" className="text-info">Login</Link></p>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;
