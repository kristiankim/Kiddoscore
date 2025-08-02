import { TaskList } from './_components/TaskList';
import { ProtectedRoute } from './_components/ProtectedRoute';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <TaskList />
      </div>
    </ProtectedRoute>
  );
}