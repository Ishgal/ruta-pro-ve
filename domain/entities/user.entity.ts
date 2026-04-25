export interface User {
  id: string
  email: string
  name: string
  role: 'estudiante' | 'docente' | 'admin'
  subscription: 'freemium' | 'premium'
  setupStatus?: 'pending' | 'active'
  isActive?: boolean
  avatarUrl?: string
  linkedinId?: string
  createdAt?: string
}
