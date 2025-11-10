import { CreditCard, DollarSign, Shield, TrendingUp, Lock, Building2 } from 'lucide-react';

interface PublicHomeProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const PublicHome = ({ onLogin, onRegister }: PublicHomeProps) => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-500">Banko</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={onRegister}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-gray-950"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Banca Digital de Nueva Generación
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Gestiona tus finanzas con total seguridad. Cuentas multicurrency, inversiones, préstamos y más.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRegister}
                className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Abrir Cuenta
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Acceder
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros Servicios</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 transition-all">
              <CreditCard className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cuentas Bancarias</h3>
              <p className="text-gray-400">
                Cuentas corrientes y de ahorro en EUR, GBP y USD. Cambio de divisa en tiempo real.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 transition-all">
              <CreditCard className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tarjetas</h3>
              <p className="text-gray-400">
                Débito, crédito y tarjetas desechables. Acumula puntos de fidelidad con cada compra.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 transition-all">
              <DollarSign className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Préstamos e Hipotecas</h3>
              <p className="text-gray-400">
                Solicita préstamos personales o hipotecas con tasas competitivas y aprobación rápida.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 transition-all">
              <TrendingUp className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inversiones</h3>
              <p className="text-gray-400">
                Acciones, fondos y cuentas de ahorro con intereses. Simulador de inversión disponible.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 transition-all">
              <Shield className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Seguros</h3>
              <p className="text-gray-400">
                Protección para tu hogar, vida, salud y automóvil. Asociados a tus hipotecas.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 transition-all">
              <Lock className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Seguridad Máxima</h3>
              <p className="text-gray-400">
                Autenticación 2FA, cifrado MD5, detección de fraude y monitoreo 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">¿Por qué Banko?</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">100%</div>
              <div className="text-gray-400">Seguro y Cifrado</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">24/7</div>
              <div className="text-gray-400">Soporte Disponible</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">0€</div>
              <div className="text-gray-400">Sin Comisiones</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>© 2025 Banko. Todos los derechos reservados.</p>
          <p className="mt-2 text-sm">Banca digital segura y confiable</p>
        </div>
      </footer>
    </div>
  );
};
