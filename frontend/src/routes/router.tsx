import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ProfilePage } from '@/features/users/pages/ProfilePage'
import { UsersListPage } from '@/features/users/pages/UsersListPage'
import { TeamsListPage } from '@/features/teams/pages/TeamsListPage'
import { TeamDetailPage } from '@/features/teams/pages/TeamDetailPage'
import { TasksListPage } from '@/features/tasks/pages/TasksListPage'
import { TaskDetailPage } from '@/features/tasks/pages/TaskDetailPage'
import { ChatsListPage } from '@/features/chats/pages/ChatsListPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { NotFoundPage } from '@/routes/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: 'profile', element: <ProfilePage /> },

      // Tasks
      { path: 'tasks', element: <TasksListPage /> },
      { path: 'tasks/:id', element: <TaskDetailPage /> },

      // Teams
      { path: 'teams', element: <TeamsListPage /> },
      { path: 'teams/:id', element: <TeamDetailPage /> },

      // Chats & notifications
      { path: 'chats', element: <ChatsListPage /> },
      { path: 'notifications', element: <NotificationsPage /> },

      // Admin-only
      {
        path: 'users',
        element: (
          <ProtectedRoute roles={['admin']}>
            <UsersListPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
