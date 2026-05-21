import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home — TBA after problem statement (25 May)</div>} />
      <Route path="/login" element={<div>Login</div>} />
      <Route path="/admin/*" element={<div>Admin Dashboard</div>} />
      <Route path="/operator/*" element={<div>Operator Dashboard</div>} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}
