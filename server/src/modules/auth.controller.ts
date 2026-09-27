import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        jurisdiction_state: user.jurisdiction_state,
        jurisdiction_district: user.jurisdiction_district
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role, phone, organization_name, state, district } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = `usr-${uuidv4().substring(0, 8)}`;
    const orgId = `org-${uuidv4().substring(0, 8)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    if (organization_name) {
      await query(
        `INSERT INTO organizations (id, name, type, registration_no, state, district, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orgId, organization_name, role === 'OWNER' ? 'BUSINESS' : 'GOVERNMENT_DEPT', `REG-${Date.now()}`, state || 'Delhi', district || 'Central Delhi', 'Registered Office Address']
      );
    }

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, phone, organization_id, jurisdiction_state, jurisdiction_district, verification_scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, passwordHash, role, phone || '+91 99000 00000', organization_name ? orgId : null, state || 'Delhi', district || 'Central Delhi', JSON.stringify(['WEIGHING', 'MEASURING'])]
    );

    const newUser = { id: userId, name, email, role, organization_id: organization_name ? orgId : null, jurisdiction_state: state, jurisdiction_district: district };
    const token = generateToken(newUser);

    return res.status(201).json({ token, user: newUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  return res.json({ user: req.user });
}
