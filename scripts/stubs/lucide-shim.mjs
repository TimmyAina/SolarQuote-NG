/**
 * ESM shim for lucide-react inside the render harness.
 * ---------------------------------------------------------------------------
 * lucide-react is CommonJS with ~5,200 re-exported icons. When the harness
 * bundles a single app file with esbuild, its CJS->ESM interop drops the named
 * bindings, so the bundle throws "Grid3X3 is not defined" at runtime even
 * though the import is valid.
 *
 * The real Vite/browser build resolves the ESM entry correctly, so this is a
 * test-harness concern only. The shim re-exports the exact names the app uses.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lucide = require('lucide-react');

export default lucide;

export const {
  AlertCircle, ArrowLeft, ArrowRight, BatteryCharging, Bolt, Briefcase,
  Building2, Calculator, Check, Crown, Eye, EyeOff, FileDown, FileText,
  Fuel, Grid3X3, Grid3x3, Home, Landmark, Laptop, Lock, MapPin, Monitor,
  MonitorIcon, Moon, Plug, Plus, Search, Settings, SettingsIcon, ShieldCheck,
  SlidersHorizontal, Sparkles, Sun, Trash2, TrendingDown, TrendingUp, User,
  Wallet, Wrench, X, Zap,
} = lucide;
