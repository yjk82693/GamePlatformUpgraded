import "dotenv/config";

import express from "express";
import cors from "cors";
import {
  registerManual,
  login,
  logout,
} from "@game-platform/commons";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await registerManual(email, password);
    res.json({ id: account.id, email: account.email });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const session = await login(email, password);
    res.json({ token: session.token, expiresAt: session.expiresAt });
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

app.post("/auth/logout", async (req, res) => {
  try {
    const { token } = req.body;
    await logout(token);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
