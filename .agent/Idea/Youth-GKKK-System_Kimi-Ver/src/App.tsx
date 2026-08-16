import { Routes, Route } from 'react-router'
import { AppShell } from './components/AppShell'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Gatherings from './pages/Gatherings'
import GatheringDetail from './pages/GatheringDetail'
import Members from './pages/Members'
import MemberDetail from './pages/MemberDetail'
import CrossGroups from './pages/CrossGroups'
import Finance from './pages/Finance'
import Meetings from './pages/Meetings'
import MeetingDetail from './pages/MeetingDetail'
import AuditLog from './pages/AuditLog'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AppShell><Home /></AppShell>} />
      <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
      <Route path="/gatherings" element={<AppShell><Gatherings /></AppShell>} />
      <Route path="/gatherings/:id" element={<AppShell><GatheringDetail /></AppShell>} />
      <Route path="/members" element={<AppShell><Members /></AppShell>} />
      <Route path="/members/:id" element={<AppShell><MemberDetail /></AppShell>} />
      <Route path="/cross" element={<AppShell><CrossGroups /></AppShell>} />
      <Route path="/finance" element={<AppShell><Finance /></AppShell>} />
      <Route path="/meetings" element={<AppShell><Meetings /></AppShell>} />
      <Route path="/meetings/:id" element={<AppShell><MeetingDetail /></AppShell>} />
      <Route path="/audit" element={<AppShell><AuditLog /></AppShell>} />
      <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
