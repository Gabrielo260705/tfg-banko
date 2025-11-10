import { Users, Search } from 'lucide-react';

export const UsersManagementView = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Users className="h-16 w-16 mr-4" />
          <div>
            <div className="font-semibold text-lg">Gestión de Usuarios</div>
            <div className="text-sm">Vista completa de CRUD disponible para trabajadores</div>
          </div>
        </div>
      </div>
    </div>
  );
};
