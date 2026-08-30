import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { TypeRoute } from './components/TypeRoute'
import { StaffThemeProvider } from './components/admin'
import { Placeholder } from './components/Placeholder'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlayerLayout from './pages/player/PlayerLayout'
import ShopPage from './pages/player/ShopPage'
import WalletPage from './pages/player/WalletPage'
import ProfilePage from './pages/player/ProfilePage'
import SocialPage from './pages/player/SocialPage'
import AchievementsPage from './pages/player/AchievementsPage'
import SupportPage from './pages/player/SupportPage'
import DistributorLayout from './pages/distributor/DistributorLayout'
import CatalogPage from './pages/distributor/CatalogPage'
import MembersPage from './pages/distributor/MembersPage'
import AppOpsPage from './pages/distributor/AppOpsPage'
import PaymentsPage from './pages/distributor/PaymentsPage'
import StatsPage from './pages/distributor/StatsPage'
import ConfigPage from './pages/distributor/ConfigPage'
import TicketsPage from './pages/distributor/TicketsPage'
import LogsPage from './pages/distributor/LogsPage'
import CoopLayout from './pages/coop/CoopLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />

        <Route element={<TypeRoute require="isPlayer" />}>
          <Route path="/player" element={<PlayerLayout />}>
            <Route index element={<ShopPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="social" element={<SocialPage />} />
            <Route path="rankings" element={<AchievementsPage />} />
            <Route path="tickets" element={<SupportPage />} />
          </Route>
        </Route>

        <Route element={<TypeRoute require="isStaff" />}>
          <Route element={<StaffThemeProvider />}>
            <Route path="/distributor" element={<DistributorLayout />}>
              <Route index element={<CatalogPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="appops" element={<AppOpsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="config" element={<ConfigPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>

            <Route path="/coop" element={<CoopLayout />}>
              <Route index element={<Placeholder title="Chat" />} />
              <Route path="planner" element={<Placeholder title="Planner & Calendar" />} />
              <Route path="workspace" element={<Placeholder title="Workspace" />} />
              <Route path="tasks" element={<Placeholder title="Tasks" />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
