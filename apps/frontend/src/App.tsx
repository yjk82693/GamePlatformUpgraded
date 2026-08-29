import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { TypeRoute } from './components/TypeRoute'
import { Placeholder } from './components/Placeholder'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlayerLayout from './pages/player/PlayerLayout'
import ShopPage from './pages/player/ShopPage'
import WalletPage from './pages/player/WalletPage'
import ProfilePage from './pages/player/ProfilePage'
import SocialPage from './pages/player/SocialPage'
import AchievementsPage from './pages/player/AchievementsPage'
import DistributorLayout from './pages/distributor/DistributorLayout'
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
            <Route path="tickets" element={<Placeholder title="Support" />} />
          </Route>
        </Route>

        <Route element={<TypeRoute require="isStaff" />}>
          <Route path="/distributor" element={<DistributorLayout />}>
            <Route index element={<Placeholder title="Catalog" />} />
            <Route path="members" element={<Placeholder title="Members & Roles" />} />
            <Route path="appops" element={<Placeholder title="App Operations" />} />
            <Route path="payments" element={<Placeholder title="Payments" />} />
            <Route path="stats" element={<Placeholder title="Statistics" />} />
            <Route path="config" element={<Placeholder title="Leaderboard / Terms / Redeem" />} />
            <Route path="tickets" element={<Placeholder title="Support" />} />
            <Route path="logs" element={<Placeholder title="Logs" />} />
          </Route>

          <Route path="/coop" element={<CoopLayout />}>
            <Route index element={<Placeholder title="Chat" />} />
            <Route path="planner" element={<Placeholder title="Planner & Calendar" />} />
            <Route path="workspace" element={<Placeholder title="Workspace" />} />
            <Route path="tasks" element={<Placeholder title="Tasks" />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
