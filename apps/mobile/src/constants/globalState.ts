import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Production backend URL (Render) — used when running as a standalone APK
const PRODUCTION_BACKEND_URL = 'https://trellis-major-project.onrender.com';

function getAutoDetectedIp(): string {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost') {
        return ip;
      }
    }
  } catch (err) {
    console.log('Auto IP detection note:', err);
  }
  return '127.0.0.1';
}

class GlobalState {
  private _token: string | null = null;
  private _ipAddress: string = getAutoDetectedIp();
  private _userRole: string | null = null;
  private _studentBranch: string = '';
  private _studentYear: number = 1;
  private _studentSemester: number = 1;
  private _listeners: (() => void)[] = [];
  private _initialized: boolean = false;

  constructor() {
    this.loadPersistedState();
  }

  private async loadPersistedState() {
    try {
      const [token, ip, role, branch, year, sem] = await Promise.all([
        AsyncStorage.getItem('trellis_token'),
        AsyncStorage.getItem('trellis_ip'),
        AsyncStorage.getItem('trellis_role'),
        AsyncStorage.getItem('trellis_branch'),
        AsyncStorage.getItem('trellis_year'),
        AsyncStorage.getItem('trellis_semester'),
      ]);

      if (token) this._token = token;
      
      // Prioritize auto-detected Metro host IP if saved IP is default 127.0.0.1
      const detected = getAutoDetectedIp();
      if (ip && ip !== '127.0.0.1') {
        this._ipAddress = ip;
      } else if (detected !== '127.0.0.1') {
        this._ipAddress = detected;
      }

      if (role) this._userRole = role;
      if (branch) this._studentBranch = branch;
      if (year) this._studentYear = parseInt(year) || 1;
      if (sem) this._studentSemester = parseInt(sem) || 1;

      this._initialized = true;
      this.notify();
    } catch (e) {
      console.warn('Failed to load persisted auth state:', e);
    }
  }

  get isInitialized() {
    return this._initialized;
  }

  get token() {
    return this._token;
  }

  setToken(val: string | null) {
    this._token = val;
    if (val) {
      AsyncStorage.setItem('trellis_token', val).catch(() => {});
    } else {
      AsyncStorage.removeItem('trellis_token').catch(() => {});
      AsyncStorage.removeItem('trellis_role').catch(() => {});
      AsyncStorage.removeItem('trellis_branch').catch(() => {});
      AsyncStorage.removeItem('trellis_year').catch(() => {});
      AsyncStorage.removeItem('trellis_semester').catch(() => {});
    }
    this.notify();
  }

  get ipAddress() {
    return this._ipAddress;
  }

  setIpAddress(val: string) {
    this._ipAddress = val;
    AsyncStorage.setItem('trellis_ip', val).catch(() => {});
    this.notify();
  }

  get userRole() {
    return this._userRole;
  }

  setUserRole(val: string | null) {
    this._userRole = val;
    if (val) {
      AsyncStorage.setItem('trellis_role', val).catch(() => {});
    } else {
      AsyncStorage.removeItem('trellis_role').catch(() => {});
    }
    this.notify();
  }

  get studentBranch() {
    return this._studentBranch;
  }

  setStudentBranch(val: string) {
    this._studentBranch = val;
    AsyncStorage.setItem('trellis_branch', val).catch(() => {});
    this.notify();
  }

  get studentYear() {
    return this._studentYear;
  }

  setStudentYear(val: number) {
    this._studentYear = val;
    AsyncStorage.setItem('trellis_year', val.toString()).catch(() => {});
    this.notify();
  }

  get studentSemester() {
    return this._studentSemester;
  }

  setStudentSemester(val: number) {
    this._studentSemester = val;
    AsyncStorage.setItem('trellis_semester', val.toString()).catch(() => {});
    this.notify();
  }

  get backendUrl() {
    // In local Expo Go dev mode: use auto-detected LAN IP
    // In standalone APK build: use live Render production URL
    const isLocalDev = this._ipAddress !== '127.0.0.1';
    if (isLocalDev) {
      return `http://${this._ipAddress}:5000`;
    }
    return PRODUCTION_BACKEND_URL;
  }

  subscribe(listener: () => void) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this._listeners.forEach(l => l());
  }
}

export const globalState = new GlobalState();

