import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGoogle } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const user = await signInWithGoogle();
        if (user) navigate("/");
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', paddingTop: '100px' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={5}>
                        <Card className="shadow-lg border-0 bg-dark text-white p-5">
                            <h2 className="text-center mb-4">Login to ConvoSense</h2>
                            <AnimatePresence>
                                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="danger">{error}</Alert></motion.div>}
                            </AnimatePresence>
                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </Form.Group>
                                <Button type="submit" className="w-100 btn-primary py-2 mb-3" disabled={loading}>
                                    {loading ? "Signing in..." : "Login"}
                                </Button>
                                <div className="text-center mb-3">OR</div>
                                <Button onClick={handleGoogleLogin} variant="outline-light" className="w-100 py-2 mb-4">
                                    Sign in with Google
                                </Button>
                                <p className="text-center">New user? <Link to="/register" className="text-info">Create Account</Link></p>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Login;
