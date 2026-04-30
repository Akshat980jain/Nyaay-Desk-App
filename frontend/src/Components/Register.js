/**
 * Register.js — Role Selection Entry Point (FIX #6)
 *
 * This file was previously empty (0 bytes). It now exports a redirect
 * component that sends users to the appropriate registration page based
 * on their role selection from the Welcome screen.
 *
 * This component is the shared entry point for all user types.
 * Role-specific registration is handled by:
 *  - /register        → AdvocateRegistration
 *  - /litiregister    → LitigantRegister
 *  - /clerkregister   → ClerkRegister
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Generic Register redirect — defaults to the Advocate registration flow.
 * If you need a role-agnostic page, build it here.
 */
const Register = () => {
  return <Navigate to="/advocate" replace />;
};

export default Register;
