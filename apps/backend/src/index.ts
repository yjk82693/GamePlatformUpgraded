import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerManual, login, logout } from "@game-platform/commons";

import shopRoutes from "./routes/shop.js";
import walletRoutes from "./routes/wallet.js";
import downloadRoutes from "./routes/download.js";
import profileRoutes from "./routes/profile.js";
import rankingRoutes from "./routes/ranking.js";
import socialRoutes from "./routes/social.js";
import supportRoutes from "./routes/support.js";

import catalogRoutes from "./routes/catalog.js";
import distMembersRoutes from "./routes/members.js";
import appopsRoutes from "./routes/appops.js";
import distPaymentsRoutes from "./routes/payments.js";
import distStatsRoutes from "./routes/stats.js";
import distConfigRoutes from "./routes/config.js";
import distStaffsupportRoutes from "./routes/staffsupport.js";
import logsRoutes from "./routes/logs.js";

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

app.use("/player/shop", shopRoutes);
app.use("/player/wallet", walletRoutes);
app.use("/player/download", downloadRoutes);
app.use("/player/profile", profileRoutes);
app.use("/player/ranking", rankingRoutes);
app.use("/player/social", socialRoutes);
app.use("/player/tickets", supportRoutes);

app.use("/distributor/catalog", catalogRoutes);
app.use("/distributor/members", distMembersRoutes);
app.use("/distributor/appops", appopsRoutes);
app.use("/distributor/payments", distPaymentsRoutes);
app.use("/distributor/stats", distStatsRoutes);
app.use("/distributor/config", distConfigRoutes);
app.use("/distributor/tickets", distStaffsupportRoutes);
app.use("/distributor/logs", logsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
