import { useState } from 'react';
import { Shield, Bell, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const SettingsView = () => {
  const { profile } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(profile?.two_fa_enabled || false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configuración</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-500" />
          Seguridad
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Autenticación de Dos Factores (2FA)</div>
              <div className="text-sm text-gray-400">Añade una capa extra de seguridad</div>
            </div>
            <button
              onClick={() => setTwoFAEnabled(!twoFAEnabled)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                twoFAEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {twoFAEnabled ? 'Activado' : 'Desactivado'}
            </button>
          </div>
          <div className="pt-4 border-t border-gray-800">
            <button className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-500" />
          Notificaciones
        </h3>
        <div className="space-y-3">
          {['Transacciones', 'Alertas de Fraude', 'Vencimientos', 'Promociones'].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span>{item}</span>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                Activado
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
