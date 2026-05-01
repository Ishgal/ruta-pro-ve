export interface User {
  id: string
  email: string
  name: string
  role: 'estudiante' | 'docente' | 'admin'
  plan: 'bronce' | 'plata' | 'oro'
  setupStatus?: 'pending' | 'active'
  isActive?: boolean
  avatarUrl?: string
  linkedinId?: string
  createdAt?: string
}
