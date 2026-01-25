# Specyfikacja Techniczna: Moduł Autentykacji - VibeCheck

## 1. WPROWADZENIE

### 1.1. Cel dokumentu
Niniejszy dokument określa architekturę i wymagania techniczne dla modułu autentykacji w aplikacji VibeCheck, obejmującego funkcjonalności rejestracji, logowania, wylogowania oraz odzyskiwania hasła użytkowników.

### 1.2. Zakres funkcjonalny
Moduł autentykacji realizuje następujące User Stories z PRD:
- **US-003**: Nowy użytkownik - rejestracja konta, walidacja, logowanie
- **US-004**: Uwierzytelniony użytkownik - logowanie, zarządzanie sesją, wylogowanie, odzyskiwanie hasła

### 1.3. Zgodność z istniejącym systemem
Specyfikacja została zaprojektowana z zachowaniem pełnej zgodności z:
- Obecną architekturą Dashboard (DashboardView, PersistentHeader, UserMenu)
- Istniejącymi endpointami API (/api/entries, /api/tags, /api/focus-scores)
- Row Level Security (RLS) w Supabase
- Middleware sprawdzającym token JWT
- Konfiguracją SSR w Astro (output: "server")

### 1.4. Stack technologiczny
- **Frontend**: Astro 5 (SSR), React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend**: Astro API Routes, Supabase Auth, Supabase PostgreSQL
- **Walidacja**: Zod
- **Zarządzanie sesją**: localStorage/sessionStorage + JWT tokens (Authorization header)

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura stron (Astro Pages)

#### 2.1.1. Strona Landing - `/` (index.astro)
**Status**: DO MODYFIKACJI

**Aktualny stan**:
- Wyświetla statyczny komponent Welcome.astro ze startera
- Brak elementów związanych z autentykacją

**Wymagane zmiany**:
- Zamiana komponentu Welcome.astro na nowy komponent LandingView
- Server-side sprawdzenie sesji użytkownika w frontmatter
- Automatyczne przekierowanie do `/dashboard` dla zalogowanych użytkowników
- Wyświetlenie przyciągającego landing page z przyciskami "Zaloguj się" i "Zarejestruj się" dla niezalogowanych

**Struktura techniczna**:
```astro
---
// src/pages/index.astro
import Layout from '@/layouts/Layout.astro';
import LandingView from '@/components/LandingView'; // React component

// Server-side auth check
const session = await Astro.locals.supabase.auth.getSession();

// Redirect authenticated users to dashboard
if (session?.data?.session) {
  return Astro.redirect('/dashboard');
}
---
<Layout title="VibeCheck - Track Your Flow">
  <LandingView client:load />
</Layout>
```

**Komponenty prezentacyjne**:
- Logo i branding aplikacji VibeCheck
- Hero section z opisem aplikacji i value proposition
- Call-to-action buttons: "Get Started" (→ /signup) i "Sign In" (→ /login)
- Features showcase (opcjonalnie)
- Footer z linkami

#### 2.1.2. Strona Logowania - `/login` (login.astro)
**Status**: NOWA

**Cel**: Umożliwienie zalogowania się istniejącym użytkownikom

**Struktura techniczna**:
```astro
---
// src/pages/login.astro
import Layout from '@/layouts/Layout.astro';
import LoginView from '@/components/LoginView'; // React component

// Server-side auth check
const session = await Astro.locals.supabase.auth.getSession();

// Redirect authenticated users to dashboard
if (session?.data?.session) {
  return Astro.redirect('/dashboard');
}

// Capture redirect parameter from URL (optional)
const redirectTo = Astro.url.searchParams.get('redirect') || '/dashboard';
---
<Layout title="Sign In - VibeCheck">
  <LoginView client:load redirectTo={redirectTo} />
</Layout>
```

**Funkcjonalność**:
- Renderuje komponent React LoginView z formularzem logowania
- Przekierowuje zalogowanych użytkowników do dashboard
- Obsługuje parametr `?redirect=<path>` dla przekierowań po logowaniu
- Centrowane na ekranie z minimalistycznym designem

#### 2.1.3. Strona Rejestracji - `/signup` (signup.astro)
**Status**: NOWA

**Cel**: Umożliwienie rejestracji nowych użytkowników

**Struktura techniczna**:
```astro
---
// src/pages/signup.astro
import Layout from '@/layouts/Layout.astro';
import SignupView from '@/components/SignupView'; // React component

// Server-side auth check
const session = await Astro.locals.supabase.auth.getSession();

// Redirect authenticated users to dashboard
if (session?.data?.session) {
  return Astro.redirect('/dashboard');
}
---
<Layout title="Sign Up - VibeCheck">
  <SignupView client:load />
</Layout>
```

**Funkcjonalność**:
- Renderuje komponent React SignupView z formularzem rejestracji
- Przekierowuje zalogowanych użytkowników do dashboard
- Centrowane na ekranie z minimalistycznym designem

#### 2.1.4. Strona Odzyskiwania Hasła - `/forgot-password` (forgot-password.astro)
**Status**: NOWA

**Cel**: Inicjowanie procesu resetowania hasła

**Struktura techniczna**:
```astro
---
// src/pages/forgot-password.astro
import Layout from '@/layouts/Layout.astro';
import ForgotPasswordView from '@/components/ForgotPasswordView'; // React component

// Server-side auth check
const session = await Astro.locals.supabase.auth.getSession();

// Redirect authenticated users to dashboard
if (session?.data?.session) {
  return Astro.redirect('/dashboard');
}
---
<Layout title="Forgot Password - VibeCheck">
  <ForgotPasswordView client:load />
</Layout>
```

**Funkcjonalność**:
- Renderuje komponent React ForgotPasswordView
- Umożliwia wysłanie emaila z linkiem resetującym hasło
- Przekierowuje zalogowanych użytkowników do dashboard

#### 2.1.5. Strona Resetowania Hasła - `/reset-password` (reset-password.astro)
**Status**: NOWA

**Cel**: Ustawienie nowego hasła po kliknięciu w link z emaila

**Struktura techniczna**:
```astro
---
// src/pages/reset-password.astro
import Layout from '@/layouts/Layout.astro';
import ResetPasswordView from '@/components/ResetPasswordView'; // React component

// Extract tokens from URL hash (Supabase sends tokens in URL hash)
// This is handled client-side in React component
---
<Layout title="Reset Password - VibeCheck">
  <ResetPasswordView client:load />
</Layout>
```

**Funkcjonalność**:
- Renderuje komponent React ResetPasswordView
- Obsługuje tokeny z URL hash przesłane przez Supabase Auth
- Umożliwia ustawienie nowego hasła
- Po sukcesie przekierowuje do `/login`

#### 2.1.6. Strona Dashboard - `/dashboard` (dashboard.astro)
**Status**: DO MODYFIKACJI

**Aktualny stan**:
- Renderuje DashboardView jako client:load
- Brak server-side auth guard
- Komentarz: "TODO: Add server-side data fetching for initial state (optional)"

**Wymagane zmiany**:
```astro
---
// src/pages/dashboard.astro
import Layout from '@/layouts/Layout.astro';
import DashboardView from '@/components/DashboardView';

// Server-side auth check
const session = await Astro.locals.supabase.auth.getSession();
const user = Astro.locals.user;

// Redirect unauthenticated users to login
if (!session?.data?.session || !user) {
  return Astro.redirect('/login?redirect=/dashboard');
}

// Optional: Fetch initial data server-side for better UX
// const initialEntries = await fetchUserEntries(user.id, supabase);
// const initialScores = await fetchFocusScores(user.id, supabase);
---

<Layout title="Dashboard - VibeCheck">
  <DashboardView 
    client:load 
    initialUser={user}
  />
</Layout>
```

**Funkcjonalność**:
- Dodanie server-side auth guard
- Przekierowanie niezalogowanych użytkowników do `/login`
- Przekazanie user do DashboardView jako prop (opcjonalnie)
- Opcjonalne: Server-side data fetching dla lepszego initial render

---

### 2.2. Komponenty React (Client-side)

#### 2.2.1. LandingView Component
**Plik**: `src/components/LandingView.tsx`  
**Status**: NOWY

**Odpowiedzialności**:
- Prezentacja głównego landing page dla niezalogowanych użytkowników
- Nawigacja do stron /login i /signup
- Wyświetlenie value proposition aplikacji VibeCheck

**Props**: Brak

**Struktura**:
```typescript
export default function LandingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1>VibeCheck - Track Your Productivity Flow</h1>
          <p>Monitor your mood, tasks, and focus levels throughout the day</p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <Button asChild>
              <a href="/signup">Get Started</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section (Optional) */}
      <section className="container mx-auto px-4 py-16">
        {/* Feature cards */}
      </section>
    </div>
  );
}
```

**Zależności**:
- Shadcn/ui Button component
- Tailwind CSS classes
- Lucide-react icons (opcjonalnie)

#### 2.2.2. LoginView Component
**Plik**: `src/components/LoginView.tsx`  
**Status**: NOWY

**Odpowiedzialności**:
- Renderowanie formularza logowania
- Client-side walidacja danych wejściowych
- Wywołanie API endpoint `/api/auth/login`
- Zarządzanie stanem formularza (loading, errors)
- Przekierowanie do dashboard po sukcesie
- Link do /forgot-password i /signup

**Props**:
```typescript
interface LoginViewProps {
  redirectTo?: string; // URL to redirect after successful login
}
```

**Stan komponentu**:
```typescript
interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Struktura**:
```typescript
export default function LoginView({ redirectTo = '/dashboard' }: LoginViewProps) {
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false,
    isLoading: false,
    error: null,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, isLoading: true, error: null }));

    // Client-side validation
    const validationResult = loginSchema.safeParse({
      email: formState.email,
      password: formState.password,
    });

    if (!validationResult.success) {
      // Handle validation errors
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
          rememberMe: formState.rememberMe,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      
      // Store session
      storeAuthSession(data.session, formState.rememberMe);
      
      // Redirect to dashboard or specified URL
      window.location.href = redirectTo;
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to VibeCheck</CardTitle>
          <CardDescription>
            Enter your credentials to access your productivity dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <Input
              type="email"
              placeholder="Email"
              value={formState.email}
              onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
              required
            />

            {/* Password Input */}
            <Input
              type="password"
              placeholder="Password"
              value={formState.password}
              onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
              required
            />

            {/* Remember Me Checkbox */}
            <Checkbox
              checked={formState.rememberMe}
              onCheckedChange={(checked) => 
                setFormState(prev => ({ ...prev, rememberMe: !!checked }))
              }
            />

            {/* Error Alert */}
            {formState.error && <Alert variant="destructive">{formState.error}</Alert>}

            {/* Submit Button */}
            <Button type="submit" disabled={formState.isLoading}>
              {formState.isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Links */}
            <div className="text-center text-sm">
              <a href="/forgot-password">Forgot password?</a>
              <span> · </span>
              <a href="/signup">Create account</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Zależności**:
- Shadcn/ui: Card, Input, Button, Checkbox, Alert
- Zod dla walidacji (shared schema)
- Utility function `storeAuthSession` dla zarządzania sesją

#### 2.2.3. SignupView Component
**Plik**: `src/components/SignupView.tsx`  
**Status**: NOWY

**Odpowiedzialności**:
- Renderowanie formularza rejestracji
- Client-side walidacja danych wejściowych
- Sprawdzenie siły hasła
- Potwierdzenie hasła
- Wywołanie API endpoint `/api/auth/signup`
- Zarządzanie stanem formularza (loading, errors)
- Wyświetlenie komunikatu o konieczności weryfikacji emaila (jeśli wymagane)
- Przekierowanie do dashboard lub /login po sukcesie
- Link do /login

**Props**: Brak

**Stan komponentu**:
```typescript
interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
}
```

**Struktura**:
```typescript
export default function SignupView() {
  const [formState, setFormState] = useState<SignupFormState>({
    email: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    error: null,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, isLoading: true, error: null }));

    // Client-side validation
    if (formState.password !== formState.confirmPassword) {
      setFormState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Passwords do not match' 
      }));
      return;
    }

    const validationResult = signupSchema.safeParse({
      email: formState.email,
      password: formState.password,
    });

    if (!validationResult.success) {
      // Handle validation errors
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      
      // Store session and redirect to dashboard
      storeAuthSession(data.session, false);
      window.location.href = '/dashboard';
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Start tracking your productivity with VibeCheck
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <Input
              type="email"
              placeholder="Email"
              value={formState.email}
              onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
              required
            />

            {/* Password Input with strength indicator */}
            <Input
              type="password"
              placeholder="Password"
              value={formState.password}
              onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
              required
            />
            <PasswordStrengthIndicator password={formState.password} />

            {/* Confirm Password Input */}
            <Input
              type="password"
              placeholder="Confirm Password"
              value={formState.confirmPassword}
              onChange={(e) => setFormState(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />

            {/* Error Alert */}
            {formState.error && <Alert variant="destructive">{formState.error}</Alert>}

            {/* Submit Button */}
            <Button type="submit" disabled={formState.isLoading}>
              {formState.isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>

            {/* Link to Login */}
            <div className="text-center text-sm">
              Already have an account? <a href="/login">Sign in</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Dodatkowe komponenty pomocnicze**:
- `PasswordStrengthIndicator` - wizualna ocena siły hasła

**Zależności**:
- Shadcn/ui: Card, Input, Button, Alert
- Zod dla walidacji (shared schema)
- Utility function `storeAuthSession` dla zarządzania sesją

#### 2.2.4. ForgotPasswordView Component
**Plik**: `src/components/ForgotPasswordView.tsx`  
**Status**: NOWY

**Odpowiedzialności**:
- Renderowanie formularza do wpisania emaila
- Client-side walidacja emaila
- Wywołanie API endpoint `/api/auth/forgot-password`
- Wyświetlenie komunikatu o wysłaniu emaila
- Link powrotny do /login

**Props**: Brak

**Stan komponentu**:
```typescript
interface ForgotPasswordState {
  email: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Struktura**:
```typescript
export default function ForgotPasswordView() {
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    isLoading: false,
    error: null,
    success: false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Client-side validation
    const validationResult = emailSchema.safeParse({ email: state.email });

    if (!validationResult.success) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Please enter a valid email address' 
      }));
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  // Success state
  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p>If an account exists for {state.email}, you will receive a password reset link shortly.</p>
            <Button asChild className="mt-4">
              <a href="/login">Back to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <Input
              type="email"
              placeholder="Email"
              value={state.email}
              onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
              required
            />

            {/* Error Alert */}
            {state.error && <Alert variant="destructive">{state.error}</Alert>}

            {/* Submit Button */}
            <Button type="submit" disabled={state.isLoading}>
              {state.isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            {/* Link back to Login */}
            <div className="text-center text-sm">
              <a href="/login">Back to sign in</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Zależności**:
- Shadcn/ui: Card, Input, Button, Alert
- Zod dla walidacji emaila

#### 2.2.5. ResetPasswordView Component
**Plik**: `src/components/ResetPasswordView.tsx`  
**Status**: NOWY

**Odpowiedzialności**:
- Odczytanie tokenów z URL hash (Supabase Auth przesyła tokeny w hash)
- Renderowanie formularza nowego hasła
- Client-side walidacja hasła
- Sprawdzenie siły hasła
- Potwierdzenie hasła
- Wywołanie API endpoint `/api/auth/reset-password`
- Przekierowanie do /login po sukcesie
- Obsługa przypadku brakującego/nieprawidłowego tokenu

**Props**: Brak

**Stan komponentu**:
```typescript
interface ResetPasswordState {
  accessToken: string | null;
  refreshToken: string | null;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Struktura**:
```typescript
export default function ResetPasswordView() {
  const [state, setState] = useState<ResetPasswordState>({
    accessToken: null,
    refreshToken: null,
    password: '',
    confirmPassword: '',
    isLoading: false,
    error: null,
    success: false,
  });

  // Extract tokens from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      setState(prev => ({ 
        ...prev, 
        error: 'Invalid or expired reset link' 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      accessToken, 
      refreshToken 
    }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!state.accessToken) {
      setState(prev => ({ 
        ...prev, 
        error: 'Invalid reset link' 
      }));
      return;
    }

    if (state.password !== state.confirmPassword) {
      setState(prev => ({ 
        ...prev, 
        error: 'Passwords do not match' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Client-side validation
    const validationResult = passwordSchema.safeParse({ password: state.password });

    if (!validationResult.success) {
      // Handle validation errors
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({ 
          password: state.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true 
      }));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  // Error state: invalid token
  if (state.error && !state.accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">{state.error}</Alert>
            <Button asChild className="mt-4">
              <a href="/forgot-password">Request new link</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password Reset Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your password has been reset successfully. Redirecting to sign in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Password Input */}
            <Input
              type="password"
              placeholder="New Password"
              value={state.password}
              onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
              required
            />
            <PasswordStrengthIndicator password={state.password} />

            {/* Confirm Password Input */}
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={state.confirmPassword}
              onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />

            {/* Error Alert */}
            {state.error && <Alert variant="destructive">{state.error}</Alert>}

            {/* Submit Button */}
            <Button type="submit" disabled={state.isLoading}>
              {state.isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Zależności**:
- React useEffect hook
- Shadcn/ui: Card, Input, Button, Alert
- Zod dla walidacji hasła
- PasswordStrengthIndicator component

#### 2.2.6. DashboardView Component
**Status**: DO MODYFIKACJI

**Aktualny stan**:
- Zawiera funkcję `handleLogout` wywołującą `/api/auth/logout`
- Przekazuje `handleLogout` do `PersistentHeader`
- Nie pobiera user z props (zakłada dostępność przez API)

**Wymagane zmiany**:
- Opcjonalne: dodanie prop `initialUser?: UserDTO` dla server-side rendered user data
- Jeśli `initialUser` nie zostanie przekazany, komponent powinien pobrać user z API przy montowaniu
- Dodanie obsługi błędu 401 (Unauthorized) przy wszystkich wywołaniach API
- Automatyczne przekierowanie do `/login` przy błędzie 401

**Nowa struktura props**:
```typescript
interface DashboardViewProps {
  initialUser?: UserDTO; // Optional server-rendered user
}
```

**Poprawka w handleLogout**:
```typescript
const handleLogout = useCallback(async () => {
  try {
    const token = getAuthToken();
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    // Clear session from storage
    clearAuthSession();
    
    // Redirect to landing page
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails on server, clear local session
    clearAuthSession();
    window.location.href = '/';
  }
}, []);
```

#### 2.2.7. Komponenty pomocnicze

##### PasswordStrengthIndicator
**Plik**: `src/components/PasswordStrengthIndicator.tsx`  
**Status**: NOWY

**Odpowiedzialności**:
- Wizualna ocena siły hasła (weak, medium, strong)
- Wyświetlenie kolorowego paska i tekstu
- Opcjonalne: lista wymagań (min. długość, wielkie litery, cyfry, znaki specjalne)

**Props**:
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

---

### 2.3. Walidacja i komunikaty błędów

#### 2.3.1. Schematy walidacji Zod (Shared)
**Plik**: `src/lib/validators/auth.validator.ts`  
**Status**: NOWY

**Schematy**:
```typescript
import { z } from 'zod';

// Email validation schema
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email is too long'),
});

// Password validation schema
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long') // Bcrypt limit
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema.shape.email,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Signup schema
export const signupSchema = emailSchema.merge(passwordSchema);

// Forgot password schema
export const forgotPasswordSchema = emailSchema;

// Reset password schema
export const resetPasswordSchema = passwordSchema;

// Type exports
export type LoginDTO = z.infer<typeof loginSchema>;
export type SignupDTO = z.infer<typeof signupSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
```

#### 2.3.2. Komunikaty błędów

**Kategorie błędów**:

1. **Walidacja formularza (client-side)**:
   - Pole wymagane: "Email is required", "Password is required"
   - Format nieprawidłowy: "Invalid email address"
   - Hasło za krótkie: "Password must be at least 8 characters"
   - Hasła niezgodne: "Passwords do not match"
   - Hasło za słabe: komunikaty z regex validation

2. **Błędy API (server-side)**:
   - Użytkownik już istnieje: "An account with this email already exists"
   - Nieprawidłowe dane logowania: "Invalid email or password"
   - Email nie znaleziony: (ukryte dla bezpieczeństwa) "If an account exists, you will receive a reset link"
   - Token wygasły: "Your reset link has expired. Please request a new one"
   - Token nieprawidłowy: "Invalid or expired reset link"

3. **Błędy sieciowe**:
   - Timeout: "Request timed out. Please try again"
   - Brak połączenia: "Network error. Please check your connection"
   - Server error (500): "Something went wrong. Please try again later"

4. **Błędy autentykacji (401)**:
   - Automatyczne przekierowanie do `/login` z parametrem `?redirect=<current-path>`
   - Toast notification: "Your session has expired. Please sign in again"

---

### 2.4. Obsługa najważniejszych scenariuszy użytkownika

#### 2.4.1. Scenariusz: Rejestracja nowego użytkownika

**Kroki**:
1. Użytkownik wchodzi na `/` (landing page)
2. Klika "Get Started" → przekierowanie do `/signup`
3. Wypełnia formularz: email, password, confirm password
4. Kliknięcie "Sign Up" → client-side validation
5. Jeśli walidacja OK → wywołanie `POST /api/auth/signup`
6. Backend:
   - Walidacja danych (Zod)
   - Sprawdzenie czy użytkownik już istnieje
   - Utworzenie konta przez Supabase Auth `signUp()`
   - Zwrócenie sesji lub informacji o konieczności potwierdzenia emaila
7. Frontend:
   - Jeśli `requiresEmailConfirmation: true` → wyświetlenie komunikatu "Check your email"
   - Jeśli `requiresEmailConfirmation: false` → zapisanie sesji, przekierowanie do `/dashboard`

**Edge cases**:
- Email już istnieje → błąd "An account with this email already exists"
- Słabe hasło → walidacja Zod zwraca szczegółowe błędy
- Network error → komunikat "Please try again"

#### 2.4.2. Scenariusz: Logowanie istniejącego użytkownika

**Kroki**:
1. Użytkownik wchodzi na `/` (landing page)
2. Klika "Sign In" → przekierowanie do `/login`
3. Wypełnia formularz: email, password, remember me
4. Kliknięcie "Sign In" → client-side validation
5. Jeśli walidacja OK → wywołanie `POST /api/auth/login`
6. Backend:
   - Walidacja danych (Zod)
   - Logowanie przez Supabase Auth `signInWithPassword()`
   - Zwrócenie sesji (access token, refresh token, user)
7. Frontend:
   - Zapisanie sesji w localStorage (remember me: true) lub sessionStorage (remember me: false)
   - Przekierowanie do `/dashboard` lub URL z parametru `?redirect=`

**Edge cases**:
- Nieprawidłowe dane → błąd "Invalid email or password"
- Email nie potwierdzony → błąd "Please confirm your email address"
- Zbyt wiele prób logowania → błąd "Too many attempts. Please try again later" (rate limiting)

#### 2.4.3. Scenariusz: Odzyskiwanie hasła

**Kroki**:
1. Użytkownik na `/login` klika "Forgot password?" → przekierowanie do `/forgot-password`
2. Wypełnia formularz: email
3. Kliknięcie "Send Reset Link" → wywołanie `POST /api/auth/forgot-password`
4. Backend:
   - Walidacja emaila (Zod)
   - Wywołanie Supabase Auth `resetPasswordForEmail()`
   - Supabase wysyła email z linkiem reset
5. Frontend:
   - Wyświetlenie komunikatu "Check your email"
6. Użytkownik klika link w emailu → otwarcie `/reset-password#access_token=...&refresh_token=...`
7. ResetPasswordView odczytuje tokeny z URL hash
8. Użytkownik wpisuje nowe hasło, potwierdza
9. Kliknięcie "Reset Password" → wywołanie `POST /api/auth/reset-password` z tokenem w Authorization header
10. Backend:
    - Weryfikacja tokenu
    - Aktualizacja hasła przez Supabase Auth `updateUser()`
11. Frontend:
    - Wyświetlenie komunikatu "Password reset successful"
    - Automatyczne przekierowanie do `/login` po 2 sekundach

**Edge cases**:
- Email nie istnieje → (ukryte) "If an account exists, you will receive a reset link"
- Link wygasł → błąd "Your reset link has expired"
- Hasło za słabe → walidacja Zod zwraca błędy

#### 2.4.4. Scenariusz: Wylogowanie

**Kroki**:
1. Użytkownik na `/dashboard` klika UserMenu → "Sign Out"
2. Wywołanie `handleLogout` w DashboardView
3. Wywołanie `POST /api/auth/logout` z tokenem w Authorization header
4. Backend:
   - Wywołanie Supabase Auth `signOut()`
   - Unieważnienie sesji
5. Frontend:
   - Usunięcie sesji z localStorage/sessionStorage
   - Przekierowanie do `/` (landing page)

**Edge cases**:
- Błąd API → mimo błędu, sesja jest czyszczona lokalnie i użytkownik przekierowany

#### 2.4.5. Scenariusz: Dostęp do chronionej strony bez logowania

**Kroki**:
1. Użytkownik (niezalogowany) próbuje wejść na `/dashboard`
2. Server-side check w `dashboard.astro` frontmatter
3. Brak sesji → `return Astro.redirect('/login?redirect=/dashboard')`
4. Użytkownik widzi stronę logowania
5. Po zalogowaniu → automatyczne przekierowanie do `/dashboard`

#### 2.4.6. Scenariusz: Wygaśnięcie sesji podczas pracy

**Kroki**:
1. Użytkownik pracuje na `/dashboard`
2. Sesja wygasa (access token expired)
3. Użytkownik próbuje wykonać akcję (np. dodać entry)
4. Wywołanie API zwraca 401 Unauthorized
5. Frontend wykrywa 401:
   - Pokazuje toast: "Your session has expired. Please sign in again"
   - Czyści lokalną sesję
   - Przekierowuje do `/login?redirect=/dashboard`

**Implementacja wykrywania 401**:
- Centralized API client wrapper lub interceptor
- Każde wywołanie fetch sprawdza response.status === 401
- Automatyczne przekierowanie

---

## 3. LOGIKA BACKENDOWA

### 3.1. Endpointy API

#### 3.1.1. POST /api/auth/signup
**Plik**: `src/pages/api/auth/signup.ts`  
**Status**: NOWY

**Cel**: Rejestracja nowego użytkownika

**Request**:
```typescript
// Body
{
  email: string;      // Valid email address
  password: string;   // Min 8 chars, with uppercase, lowercase, number
}
```

**Response (Success - 201)**:
```typescript
{
  user: UserDTO;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
}
```

**Response (Error - 400)**:
```typescript
{
  error: string;      // "Validation failed", "Email already in use"
  code: string;       // "VALIDATION_ERROR", "EMAIL_EXISTS"
  details?: object;   // Zod validation errors
}
```

**Response (Error - 500)**:
```typescript
{
  error: string;      // "Internal server error"
  code: string;       // "INTERNAL_ERROR"
}
```

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';
import { signupSchema } from '@/lib/validators/auth.validator';
import type { UserDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten(),
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password } = validationResult.data;
    const { supabase } = locals;

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        return new Response(
          JSON.stringify({
            error: 'An account with this email already exists',
            code: 'EMAIL_EXISTS',
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      throw error;
    }

    // Ensure session exists (email confirmation disabled in Supabase config)
    if (!data.session) {
      throw new Error('Session not created after signup');
    }

    // Map Supabase User to UserDTO
    const userDTO: UserDTO = {
      id: data.user!.id,
      email: data.user!.email!,
      createdAt: data.user!.created_at,
    };

    return new Response(
      JSON.stringify({
        user: userDTO,
        session: data.session,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Signup error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Walidacja**:
- Email: format emaila, max 255 znaków
- Password: min 8 znaków, zawiera wielką literę, małą literę, cyfrę

**Obsługa błędów**:
- Email już istnieje → 400 EMAIL_EXISTS
- Nieprawidłowy format danych → 400 VALIDATION_ERROR
- Błąd Supabase → 500 INTERNAL_ERROR

#### 3.1.2. POST /api/auth/login
**Plik**: `src/pages/api/auth/login.ts`  
**Status**: NOWY

**Cel**: Logowanie istniejącego użytkownika

**Request**:
```typescript
// Body
{
  email: string;
  password: string;
  rememberMe?: boolean; // Default: false
}
```

**Response (Success - 200)**:
```typescript
{
  user: UserDTO;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
}
```

**Response (Error - 400)**:
```typescript
{
  error: string;      // "Validation failed"
  code: string;       // "VALIDATION_ERROR"
  details?: object;   // Zod validation errors
}
```

**Response (Error - 401)**:
```typescript
{
  error: string;      // "Invalid email or password"
  code: string;       // "INVALID_CREDENTIALS"
}
```

**Response (Error - 500)**:
```typescript
{
  error: string;      // "Internal server error"
  code: string;       // "INTERNAL_ERROR"
}
```

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';
import { loginSchema } from '@/lib/validators/auth.validator';
import type { UserDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten(),
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password } = validationResult.data;
    const { supabase } = locals;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic error message for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Map Supabase User to UserDTO
    const userDTO: UserDTO = {
      id: data.user.id,
      email: data.user.email!,
      createdAt: data.user.created_at,
    };

    return new Response(
      JSON.stringify({
        user: userDTO,
        session: data.session,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Walidacja**:
- Email: niepuste, format emaila
- Password: niepuste

**Obsługa błędów**:
- Nieprawidłowe dane → 401 INVALID_CREDENTIALS
- Email nie potwierdzony → 401 INVALID_CREDENTIALS (lub osobny kod)
- Nieprawidłowy format danych → 400 VALIDATION_ERROR
- Błąd Supabase → 500 INTERNAL_ERROR

**Uwaga bezpieczeństwa**:
- Nie ujawniaj czy email istnieje w bazie (generic error message)
- Rate limiting na poziomie Supabase

#### 3.1.3. POST /api/auth/logout
**Plik**: `src/pages/api/auth/logout.ts`  
**Status**: ISTNIEJĄCY (bez zmian)

**Cel**: Wylogowanie użytkownika

**Request**:
```typescript
// Headers
Authorization: Bearer <access_token>
```

**Response (Success - 200)**:
```typescript
{
  message: "Logged out successfully"
}
```

**Aktualny kod**:
```typescript
export const POST: APIRoute = async ({ locals }) => {
  try {
    const { supabase } = locals;

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        message: "Logged out successfully",
      } as MessageResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error during logout:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

**Uwagi**:
- Obecna implementacja jest OK
- Wymaga tokenu w Authorization header (sprawdzane przez middleware)

#### 3.1.4. POST /api/auth/forgot-password
**Plik**: `src/pages/api/auth/forgot-password.ts`  
**Status**: NOWY

**Cel**: Wysłanie emaila z linkiem do resetowania hasła

**Request**:
```typescript
// Body
{
  email: string;
}
```

**Response (Success - 200)**:
```typescript
{
  message: "If an account with that email exists, you will receive a password reset link"
}
```

**Response (Error - 400)**:
```typescript
{
  error: string;      // "Validation failed"
  code: string;       // "VALIDATION_ERROR"
  details?: object;   // Zod validation errors
}
```

**Response (Error - 500)**:
```typescript
{
  error: string;      // "Internal server error"
  code: string;       // "INTERNAL_ERROR"
}
```

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';
import { forgotPasswordSchema } from '@/lib/validators/auth.validator';
import type { MessageResponseDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten(),
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email } = validationResult.data;
    const { supabase } = locals;

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    // Don't reveal if email exists (always return success)
    // Supabase won't send email if account doesn't exist
    if (error) {
      console.error('Password reset error:', error);
      // Still return success to user for security
    }

    return new Response(
      JSON.stringify({
        message: 'If an account with that email exists, you will receive a password reset link',
      } as MessageResponseDTO),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Forgot password error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Walidacja**:
- Email: niepuste, format emaila

**Obsługa błędów**:
- Nieprawidłowy format emaila → 400 VALIDATION_ERROR
- Email nie istnieje → 200 (ukryte dla bezpieczeństwa)
- Błąd Supabase → 500 INTERNAL_ERROR

**Uwaga bezpieczeństwa**:
- Zawsze zwracaj 200 (nie ujawniaj czy email istnieje)
- Supabase automatycznie nie wyśle emaila jeśli konto nie istnieje

#### 3.1.5. POST /api/auth/reset-password
**Plik**: `src/pages/api/auth/reset-password.ts`  
**Status**: NOWY

**Cel**: Ustawienie nowego hasła po kliknięciu w link z emaila

**Request**:
```typescript
// Headers
Authorization: Bearer <access_token_from_email_link>

// Body
{
  password: string; // New password
}
```

**Response (Success - 200)**:
```typescript
{
  message: "Password reset successful"
}
```

**Response (Error - 400)**:
```typescript
{
  error: string;      // "Validation failed"
  code: string;       // "VALIDATION_ERROR"
  details?: object;   // Zod validation errors
}
```

**Response (Error - 401)**:
```typescript
{
  error: string;      // "Invalid or expired reset token"
  code: string;       // "INVALID_TOKEN"
}
```

**Response (Error - 500)**:
```typescript
{
  error: string;      // "Internal server error"
  code: string;       // "INTERNAL_ERROR"
}
```

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';
import { resetPasswordSchema } from '@/lib/validators/auth.validator';
import type { MessageResponseDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten(),
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { password } = validationResult.data;
    const { supabase, user } = locals;

    // Check if user is authenticated (token validated by middleware)
    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired reset token',
          code: 'INVALID_TOKEN',
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update password via Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        message: 'Password reset successful',
      } as MessageResponseDTO),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Reset password error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Walidacja**:
- Password: min 8 znaków, zawiera wielką literę, małą literę, cyfrę

**Obsługa błędów**:
- Brak/nieprawidłowy token → 401 INVALID_TOKEN
- Nieprawidłowy format hasła → 400 VALIDATION_ERROR
- Błąd Supabase → 500 INTERNAL_ERROR

---

### 3.2. Modele danych (DTOs)

#### 3.2.1. UserDTO
**Plik**: `src/types.ts` (istniejący)  
**Status**: DO DODANIA

```typescript
/**
 * User Data Transfer Object
 * Represents authenticated user information
 */
export interface UserDTO {
  id: string;           // UUID from auth.users
  email: string;        // User's email address
  createdAt: string;    // ISO timestamp
}
```

#### 3.2.2. AuthSessionDTO
**Plik**: `src/types.ts` (istniejący)  
**Status**: DO DODANIA

```typescript
/**
 * Authentication Session Data Transfer Object
 * Contains tokens and expiration info
 */
export interface AuthSessionDTO {
  access_token: string;   // JWT access token
  refresh_token: string;  // JWT refresh token
  expires_in: number;     // Seconds until expiration
  expires_at: number;     // Unix timestamp of expiration
  token_type: 'bearer';   // Token type
}
```

#### 3.2.3. LoginResponseDTO
**Plik**: `src/types.ts` (istniejący)  
**Status**: DO DODANIA

```typescript
/**
 * Login Response DTO
 */
export interface LoginResponseDTO {
  user: UserDTO;
  session: AuthSessionDTO;
}
```

#### 3.2.4. SignupResponseDTO
**Plik**: `src/types.ts` (istniejący)  
**Status**: DO DODANIA

```typescript
/**
 * Signup Response DTO
 */
export interface SignupResponseDTO {
  user: UserDTO;
  session: AuthSessionDTO;
}
```

---

### 3.3. Middleware - Rozszerzenie

#### 3.3.1. Obecna implementacja
**Plik**: `src/middleware/index.ts`  
**Status**: DO MODYFIKACJI

**Aktualny stan**:
- Pobiera token z Authorization header
- Weryfikuje token przez Supabase Auth `getUser(token)`
- Dodaje `user` i `supabase` do `context.locals`
- Nie blokuje dostępu do żadnych stron

**Wymagane zmiany**:
1. Dodanie listy chronionych ścieżek
2. Server-side redirect niezalogowanych użytkowników z chronionych ścieżek do `/login`
3. Dodanie listy publicznych ścieżek (auth pages)
4. Server-side redirect zalogowanych użytkowników z publicznych ścieżek do `/dashboard`
5. Obsługa sesji z cookies (opcjonalnie, jeśli chcemy SSR session management)

**Nowa implementacja**:
```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

/**
 * Protected routes - require authentication
 */
const PROTECTED_ROUTES = ['/dashboard'];

/**
 * Auth routes - redirect authenticated users away
 */
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Check if path matches any route pattern
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => path === route || path.startsWith(`${route}/`));
}

/**
 * Astro Middleware - Authentication & Route Protection
 *
 * This middleware:
 * 1. Attaches Supabase client to context.locals
 * 2. Extracts and verifies JWT token from Authorization header
 * 3. Attaches authenticated user to context.locals (if present)
 * 4. Protects routes that require authentication
 * 5. Redirects authenticated users away from auth pages
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client to context
  context.locals.supabase = supabaseClient;

  // Extract token from Authorization header
  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  // If token exists, verify and get user
  if (token) {
    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

      if (!error && user) {
        context.locals.user = user;
      } else {
        context.locals.user = null;
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  const { pathname } = context.url;
  const isAuthenticated = !!context.locals.user;

  // Protect routes that require authentication
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      // Redirect to login with redirect parameter
      return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }

  // Redirect authenticated users away from auth pages
  if (matchesRoute(pathname, AUTH_ROUTES)) {
    if (isAuthenticated) {
      // Redirect to dashboard
      return context.redirect('/dashboard');
    }
  }

  // Landing page special handling
  if (pathname === '/') {
    if (isAuthenticated) {
      // Redirect to dashboard
      return context.redirect('/dashboard');
    }
  }

  return next();
});
```

**Kluczowe zmiany**:
1. Dodano `PROTECTED_ROUTES` - lista ścieżek wymagających autentykacji
2. Dodano `AUTH_ROUTES` - lista ścieżek auth (login, signup, etc.)
3. Dodano funkcję `matchesRoute` - sprawdzanie czy ścieżka pasuje do wzorca
4. Dodano logikę redirect dla niezalogowanych użytkowników próbujących dostać się do chronionych stron
5. Dodano logikę redirect dla zalogowanych użytkowników próbujących dostać się do stron auth
6. Dodano specjalną obsługę landing page (`/`) - redirect zalogowanych do dashboard

**Uwagi**:
- Middleware jest wywoływane dla KAŻDEGO requestu (zarówno stron jak i API)
- API endpoints (`/api/*`) nie powinny być redirectowane - powinny zwracać 401
- Możliwe rozszerzenie: dodać wykluczenie API routes z redirect logic

**Opcjonalne rozszerzenie - wykluczenie API routes**:
```typescript
// At the beginning of middleware
const isApiRoute = pathname.startsWith('/api/');

// Skip redirect logic for API routes (they handle their own auth)
if (!isApiRoute) {
  // ... redirect logic ...
}
```

---

### 3.4. Zarządzanie sesją (Client-side utilities)

#### 3.4.1. Session Storage Utils
**Plik**: `src/lib/utils/session.utils.ts`  
**Status**: NOWY

**Cel**: Centralne zarządzanie zapisem i odczytem sesji w localStorage/sessionStorage

**Implementacja**:
```typescript
import type { AuthSessionDTO } from '@/types';

const SESSION_KEY = 'vibecheck_session';

/**
 * Store authentication session
 * @param session - Supabase session object
 * @param persistent - If true, store in localStorage; if false, store in sessionStorage
 */
export function storeAuthSession(
  session: AuthSessionDTO, 
  persistent: boolean = false
): void {
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Retrieve authentication session
 * @returns Session object or null if not found
 */
export function getAuthSession(): AuthSessionDTO | null {
  // Check localStorage first (persistent session)
  const persistentSession = localStorage.getItem(SESSION_KEY);
  if (persistentSession) {
    return JSON.parse(persistentSession);
  }

  // Check sessionStorage (non-persistent session)
  const sessionSession = sessionStorage.getItem(SESSION_KEY);
  if (sessionSession) {
    return JSON.parse(sessionSession);
  }

  return null;
}

/**
 * Get access token from stored session
 * @returns Access token or null
 */
export function getAuthToken(): string | null {
  const session = getAuthSession();
  return session?.access_token || null;
}

/**
 * Clear authentication session from both storages
 */
export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Check if session is expired
 * @param session - Session to check
 * @returns true if expired, false otherwise
 */
export function isSessionExpired(session: AuthSessionDTO): boolean {
  const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
  return now >= session.expires_at;
}

/**
 * Check if current session is valid
 * @returns true if valid and not expired, false otherwise
 */
export function hasValidSession(): boolean {
  const session = getAuthSession();
  if (!session) return false;
  return !isSessionExpired(session);
}
```

#### 3.4.2. API Client Wrapper
**Plik**: `src/lib/utils/api-client.utils.ts`  
**Status**: NOWY

**Cel**: Wrapper dla fetch z automatycznym dodawaniem tokenu i obsługą 401

**Implementacja**:
```typescript
import { getAuthToken, clearAuthSession } from './session.utils';

/**
 * Options for API client
 */
export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean; // Skip adding Authorization header
}

/**
 * API Client wrapper with automatic token injection and 401 handling
 */
export async function apiClient(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  // Prepare headers
  const headers = new Headers(fetchOptions.headers);

  // Add Authorization header if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Add Content-Type if not set and body is present
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    clearAuthSession();
    
    // Redirect to login with current path as redirect param
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    
    // Throw error to stop further processing
    throw new Error('Session expired');
  }

  return response;
}
```

**Użycie w komponentach**:
```typescript
// Instead of fetch
const response = await fetch('/api/entries', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Use apiClient
const response = await apiClient('/api/entries', {
  method: 'GET',
});
```

#### 3.4.3. Refresh Token Logic (Opcjonalne)
**Plik**: `src/lib/utils/session.utils.ts` (rozszerzenie)  
**Status**: OPCJONALNE

**Cel**: Automatyczne odświeżanie tokenu przed wygaśnięciem

**Uwagi**:
- Supabase Auth automatycznie odświeża tokeny przez refresh token
- Wymaga integracji Supabase client w aplikacji React
- Można zaimplementować jako React hook `useAuthRefresh`

**Przykładowa implementacja**:
```typescript
/**
 * Refresh access token using refresh token
 * @returns New session or null if refresh failed
 */
export async function refreshAuthSession(): Promise<AuthSessionDTO | null> {
  const session = getAuthSession();
  if (!session?.refresh_token) return null;

  try {
    // Create temporary Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Refresh session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    });

    if (error || !data.session) {
      clearAuthSession();
      return null;
    }

    // Store new session
    const isPersistent = !!localStorage.getItem(SESSION_KEY);
    storeAuthSession(data.session, isPersistent);

    return data.session;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthSession();
    return null;
  }
}
```

---

### 3.5. Server-side rendering (SSR) - Rozszerzenie stron Astro

#### 3.5.1. Session retrieval w stronach Astro

**Strategia: Token-based (Authorization Header)**  
- Frontend przechowuje token w localStorage/sessionStorage
- Każde wywołanie API dodaje token w Authorization header
- Server-side strony Astro sprawdzają sesję przez middleware (context.locals.user)
- Middleware automatycznie weryfikuje token i dodaje user do locals

**Implementacja w stronach Astro**:
```astro
---
// src/pages/dashboard.astro
import Layout from '@/layouts/Layout.astro';
import DashboardView from '@/components/DashboardView';

// Server-side auth check przez middleware
const user = Astro.locals.user;

// Redirect unauthenticated users to login
if (!user) {
  return Astro.redirect('/login?redirect=/dashboard');
}

// Optional: Fetch initial data server-side for better UX
// const supabase = Astro.locals.supabase;
// const initialEntries = await fetchUserEntries(user.id, supabase);
---

<Layout title="Dashboard - VibeCheck">
  <DashboardView 
    client:load 
    initialUser={user}
  />
</Layout>
```

**Uwagi**:
- Middleware automatycznie sprawdza token z Authorization header przy każdym request
- Strony Astro mają dostęp do user przez `Astro.locals.user`
- Dla API calls, frontend używa apiClient wrapper który dodaje token
- Prostsza implementacja niż cookie-based, nie wymaga dodatkowych pakietów

---

## 4. SYSTEM AUTENTYKACJI - INTEGRACJA Z SUPABASE

### 4.1. Konfiguracja Supabase Auth

#### 4.1.1. Email Settings
**Lokalizacja**: Supabase Dashboard → Authentication → Settings

**Konfiguracja**:
- **Email Provider**: Supabase default SMTP (lub custom SMTP)
- **Enable Email Confirmations**: **DISABLED** (zgodnie z PRD - brak wymagania)
  - Użytkownicy mogą zalogować się natychmiast po rejestracji
- **Email Templates**: Customizacja emaili (opcjonalnie)
  - Password reset email (jedyny używany email template)

**Redirect URLs**:
- **Site URL**: `https://vibecheck.app` (lub URL produkcyjny)
- **Redirect URLs (allowed)**:
  - `http://localhost:4321/reset-password` (development)
  - `https://vibecheck.app/reset-password` (production)

#### 4.1.2. Authentication Providers
**Konfiguracja**:
- **Email/Password**: ENABLED
- **OAuth Providers (Google, GitHub, etc.)**: DISABLED (zgodnie z PRD)

#### 4.1.3. Security Settings
**Konfiguracja**:
- **JWT Expiry**: 3600 seconds (1 hour) - default
- **Refresh Token Rotation**: Enabled (automatic)
- **Reuse Interval**: 10 seconds
- **Password Requirements**:
  - Minimum length: 8 characters
  - Wymaga: wielkie litery, małe litery, cyfry (enforced przez Zod validator)

#### 4.1.4. Rate Limiting
**Supabase automatyczne rate limiting**:
- Signup: 10 requests per hour per IP
- Login: 30 requests per hour per email
- Password reset: 5 requests per hour per IP

---

### 4.2. Supabase Auth Flow

#### 4.2.1. Rejestracja (Sign Up)
**Flow**:
1. Frontend: użytkownik wypełnia formularz SignupView
2. Frontend: wywołanie `POST /api/auth/signup` z email i password
3. Backend: walidacja Zod
4. Backend: `supabase.auth.signUp({ email, password })`
5. Supabase Auth:
   - Tworzy użytkownika w tabeli `auth.users`
   - Generuje sesję (access token, refresh token)
6. Backend: zwraca `SignupResponseDTO` z user i session
7. Frontend:
   - Zapisuje sesję w localStorage/sessionStorage
   - Przekierowuje do `/dashboard`

**Edge cases**:
- Email już istnieje → błąd "An account with this email already exists"
- Słabe hasło → walidacja Zod zwraca szczegółowe błędy
- Network error → komunikat "Please try again"

#### 4.2.2. Logowanie (Sign In)
**Flow**:
1. Frontend: użytkownik wypełnia formularz LoginView
2. Frontend: wywołanie `POST /api/auth/login` z email i password
3. Backend: walidacja Zod
4. Backend: `supabase.auth.signInWithPassword({ email, password })`
5. Supabase Auth:
   - Weryfikuje email i password
   - Generuje sesję (access token, refresh token)
6. Backend: zwraca `LoginResponseDTO` z user i session
7. Frontend:
   - Zapisuje sesję w localStorage (remember me) lub sessionStorage
   - Przekierowuje do `/dashboard` lub URL z parametru `?redirect=`

**Edge cases**:
- Nieprawidłowe dane → błąd "Invalid email or password"
- Zbyt wiele prób logowania → błąd "Too many attempts. Please try again later" (rate limiting)

#### 4.2.3. Wylogowanie (Sign Out)
**Flow**:
1. Frontend: użytkownik klika "Sign Out" w UserMenu
2. Frontend: wywołanie `POST /api/auth/logout` z tokenem w Authorization header
3. Backend: middleware weryfikuje token, dodaje user do locals
4. Backend: `supabase.auth.signOut()`
5. Supabase Auth: unieważnia sesję (refresh token)
6. Backend: zwraca 200 OK
7. Frontend:
   - Usuwa sesję z localStorage/sessionStorage
   - Przekierowuje do `/` (landing page)

#### 4.2.4. Odzyskiwanie hasła (Password Reset)
**Flow**:
1. Frontend: użytkownik wypełnia formularz ForgotPasswordView z emailem
2. Frontend: wywołanie `POST /api/auth/forgot-password` z email
3. Backend: walidacja Zod
4. Backend: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`
5. Supabase Auth:
   - Sprawdza czy użytkownik istnieje
   - Jeśli tak: wysyła email z linkiem reset
   - Jeśli nie: nie wysyła emaila (silent fail dla security)
6. Backend: zwraca 200 OK (zawsze, nie ujawnia czy email istnieje)
7. Frontend: pokazuje komunikat "Check your email"
8. Użytkownik klika link w emailu:
   - Link: `https://vibecheck.app/reset-password#access_token=...&type=recovery`
9. Strona `/reset-password` (ResetPasswordView):
   - Odczytuje access_token z URL hash
   - Renderuje formularz nowego hasła
10. Użytkownik wypełnia nowe hasło i klika "Reset Password"
11. Frontend: wywołanie `POST /api/auth/reset-password` z tokenem w Authorization header i nowym hasłem
12. Backend: middleware weryfikuje token (user w locals)
13. Backend: `supabase.auth.updateUser({ password: newPassword })`
14. Supabase Auth: aktualizuje hasło w auth.users
15. Backend: zwraca 200 OK
16. Frontend: pokazuje komunikat "Password reset successful", przekierowuje do `/login`

---

### 4.3. Token Management

#### 4.3.1. Access Token (JWT)
**Charakterystyka**:
- Format: JWT (JSON Web Token)
- Zawartość: user_id, email, role, exp, iat
- Ważność: 1 godzina (3600 seconds)
- Przechowywanie: localStorage lub sessionStorage
- Użycie: Header `Authorization: Bearer <token>` przy każdym API call

**Weryfikacja**:
- Middleware: `supabase.auth.getUser(token)`
- Sprawdza czy token jest ważny, nie wygasł, nie został unieważniony
- Zwraca user object lub error

#### 4.3.2. Refresh Token
**Charakterystyka**:
- Format: Opaque token (random string)
- Ważność: 30 dni (default Supabase)
- Przechowywanie: localStorage (jeśli remember me) lub sessionStorage
- Użycie: Automatyczne odświeżanie access tokenu

**Refresh Flow**:
1. Access token wygasa (po 1 godzinie)
2. Frontend wykrywa 401 przy API call
3. Frontend wywołuje `supabase.auth.refreshSession({ refresh_token })`
4. Supabase Auth:
   - Weryfikuje refresh token
   - Generuje nowy access token i nowy refresh token (rotation)
5. Frontend: zapisuje nową sesję
6. Frontend: powtarza pierwotny API call z nowym tokenem

**Implementacja w React**:
- Hook `useAuthRefresh` monitoruje ważność tokenu
- Automatycznie odświeża token ~5 minut przed wygaśnięciem
- Lub: odświeża dopiero przy błędzie 401

---

### 4.4. Row Level Security (RLS) - Impact

#### 4.4.1. Jak RLS współpracuje z Auth

**Mechanizm**:
- Supabase Auth ustawia `auth.uid()` w kontekście PostgreSQL session
- RLS policies w bazie danych odwołują się do `auth.uid()`
- Przykład policy: `user_id = auth.uid()`

**Flow**:
1. Frontend: wywołanie API z tokenem w Authorization header
2. Middleware: weryfikacja tokenu, dodanie user do locals
3. API endpoint: użycie `locals.supabase` do query bazy
4. Supabase client: automatyczne ustawienie `auth.uid()` na podstawie tokenu
5. PostgreSQL: wykonanie RLS policies przy każdym SELECT/INSERT/UPDATE/DELETE
6. Tylko dane należące do zalogowanego użytkownika są zwracane/modyfikowane

**Przykład**:
```typescript
// API endpoint: GET /api/entries
const { data, error } = await locals.supabase
  .from('entries')
  .select('*')
  .order('created_at', { ascending: false });

// RLS policy automatycznie filtruje:
// WHERE user_id = auth.uid()
// Użytkownik widzi tylko swoje entries
```

#### 4.4.2. Istniejące RLS Policies w VibeCheck

**Tabela: public.entries**
- `entries_select_own_policy`: SELECT tylko dla user_id = auth.uid()
- `entries_insert_own_policy`: INSERT tylko z user_id = auth.uid()
- `entries_update_own_policy`: UPDATE tylko dla user_id = auth.uid()
- `entries_delete_own_policy`: DELETE tylko dla user_id = auth.uid()

**Tabela: public.tags**
- `tags_select_all_policy`: SELECT dla wszystkich authenticated users
- `tags_insert_policy`: INSERT dla wszystkich authenticated users
- Brak UPDATE/DELETE policies (tags immutable)

**Tabela: public.entry_tags**
- `entry_tags_select_own_policy`: SELECT tylko dla tagów należących do własnych entries
- `entry_tags_insert_own_policy`: INSERT tylko do własnych entries
- `entry_tags_delete_own_policy`: DELETE tylko z własnych entries

**Impact na Auth Module**:
- RLS automatycznie zapewnia data isolation między użytkownikami
- Nie trzeba manualnie filtrować po user_id w query
- Bezpieczeństwo na poziomie bazy danych (defense in depth)
- Authenticated users mają dostęp tylko do własnych danych

---

## 5. DODATKOWE WYMAGANIA

### 5.1. Obsługa błędów i edge cases

#### 5.1.1. Network Errors
- Timeout przy API calls: komunikat "Request timed out. Please try again"
- Offline: komunikat "You appear to be offline. Please check your connection"
- Implementacja: try-catch w każdym API call, sprawdzenie `navigator.onLine`

#### 5.1.2. Validation Errors
- Zod validation failures: wyświetlenie szczegółowych komunikatów pod polami formularza
- Przykład: "Password must contain at least one uppercase letter"

#### 5.1.3. Auth Errors
- Email już istnieje: "An account with this email already exists"
- Nieprawidłowe dane logowania: "Invalid email or password"
- Token wygasł: automatyczne przekierowanie do `/login` z komunikatem

#### 5.1.4. Rate Limiting
- Supabase rate limiting: komunikat "Too many attempts. Please try again later"
- Client-side: disable button po submit, prevent double-submit

---

### 5.2. Accessibility (A11Y)

#### 5.2.1. Keyboard Navigation
- Wszystkie formularze dostępne przez klawiaturę (Tab navigation)
- Focus indicators na wszystkich interaktywnych elementach
- Enter key submits form

#### 5.2.2. Screen Readers
- ARIA labels dla wszystkich inputów
- ARIA live regions dla error messages
- Semantic HTML (form, label, input, button)

#### 5.2.3. Error Announcements
- Alert components z `role="alert"` dla komunikatów błędów
- Automatyczne ogłaszanie błędów przez screen readery

---

### 5.3. Performance

#### 5.3.1. Code Splitting
- Lazy loading komponentów auth przez React.lazy() (opcjonalnie)
- Astro automatycznie splituje komponenty z `client:load`

#### 5.3.2. Bundle Size
- Shadcn/ui components są tree-shakeable
- Import tylko używanych komponentów Lucide-react icons

#### 5.3.3. Initial Load Time
- SSR strony Astro dla szybkiego initial render
- Hydration React komponentów only gdzie potrzebna interaktywność

---

### 5.4. Security Best Practices

#### 5.4.1. XSS Prevention
- React automatycznie escapuje content
- Nie używać `dangerouslySetInnerHTML`

#### 5.4.2. CSRF Protection
- Supabase Auth używa JWT (stateless)
- Brak potrzeby CSRF tokens dla API

#### 5.4.3. Password Security
- Hasła nigdy nie są przechowywane plain text
- Supabase Auth używa bcrypt
- Walidacja siły hasła przed wysłaniem

#### 5.4.4. Token Security
- Access token w localStorage/sessionStorage
- Short-lived tokens (1 hour) minimalizują ryzyko
- Refresh token rotation (automatic Supabase)
- HTTPS only w produkcji

#### 5.4.5. Information Disclosure Prevention
- Nie ujawniaj czy email istnieje podczas password reset
- Generic error message przy login failure

---

### 5.5. Testing Strategy (Przygotowanie do implementacji testów)

**Wymagania zgodne z PRD**:
- **Test Coverage**: Minimum 95% dla business logic (validators, services, utils)
- **CI/CD**: Wszystkie testy muszą przejść przed deploymentem
- **Test Reports**: Generowanie raportów coverage w GitHub Actions

#### 5.5.1. Unit Tests (Vitest)
**Komponenty do przetestowania**:
- `src/lib/validators/auth.validator.ts`: wszystkie schematy Zod
- `src/lib/utils/session.utils.ts`: wszystkie funkcje zarządzania sesją
- `src/lib/utils/api-client.utils.ts`: wrapper API client

**Przykładowe testy**:
```typescript
// auth.validator.test.ts
describe('loginSchema', () => {
  it('should accept valid email and password', () => {
    const result = loginSchema.parse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toBeDefined();
  });

  it('should reject invalid email', () => {
    expect(() => loginSchema.parse({
      email: 'invalid-email',
      password: 'password123',
    })).toThrow();
  });
});
```

#### 5.5.2. E2E Tests (Playwright)
**Scenariusze do przetestowania**:
1. **Signup Flow**:
   - Otwórz `/signup`
   - Wypełnij formularz z unique email i strong password
   - Kliknij "Sign Up"
   - Sprawdź przekierowanie do `/dashboard`
   - Sprawdź czy sesja jest zapisana w localStorage
   - Sprawdź czy user menu jest widoczne

2. **Login Flow**:
   - Otwórz `/login`
   - Wypełnij formularz poprawnie
   - Kliknij "Sign In"
   - Sprawdź przekierowanie do dashboard
   - Sprawdź czy user menu jest widoczne

3. **Logout Flow**:
   - Zaloguj się
   - Kliknij UserMenu → "Sign Out"
   - Sprawdź przekierowanie do landing page
   - Sprawdź czy sesja jest usunięta z localStorage

4. **Password Reset Flow**:
   - Otwórz `/forgot-password`
   - Wpisz email
   - Sprawdź komunikat "Check your email"
   - (Mock email) Symuluj kliknięcie linku
   - Otwórz `/reset-password` z tokenem
   - Wpisz nowe hasło
   - Sprawdź przekierowanie do login

5. **Protected Route Access**:
   - Otwórz `/dashboard` bez logowania
   - Sprawdź przekierowanie do `/login?redirect=/dashboard`
   - Zaloguj się
   - Sprawdź automatyczne przekierowanie do `/dashboard`

6. **Session Expiration**:
   - Zaloguj się
   - Symuluj wygaśnięcie tokenu (mock 401 response)
   - Wykonaj akcję (np. dodaj entry)
   - Sprawdź automatyczne przekierowanie do login

---

## 6. PLAN IMPLEMENTACJI (High-level Overview)

### 6.1. Faza 1: Backend Infrastructure
1. **Stwórz walidatory Zod**: `src/lib/validators/auth.validator.ts`
2. **Stwórz session utils**: `src/lib/utils/session.utils.ts`
3. **Stwórz API client wrapper**: `src/lib/utils/api-client.utils.ts`
4. **Dodaj DTOs do types.ts**: UserDTO, AuthSessionDTO, LoginResponseDTO, SignupResponseDTO
5. **Stwórz API endpoints**:
   - `src/pages/api/auth/signup.ts`
   - `src/pages/api/auth/login.ts`
   - `src/pages/api/auth/forgot-password.ts`
   - `src/pages/api/auth/reset-password.ts`
6. **Zaktualizuj middleware**: dodaj route protection logic

### 6.2. Faza 2: Frontend Components
1. **Stwórz komponenty pomocnicze**:
   - `src/components/PasswordStrengthIndicator.tsx`
2. **Stwórz komponenty auth**:
   - `src/components/LandingView.tsx`
   - `src/components/LoginView.tsx`
   - `src/components/SignupView.tsx`
   - `src/components/ForgotPasswordView.tsx`
   - `src/components/ResetPasswordView.tsx`
3. **Zaktualizuj DashboardView**: dodaj prop `initialUser`, popraw `handleLogout`

### 6.3. Faza 3: Astro Pages
1. **Zaktualizuj index.astro**: dodaj server-side check i LandingView
2. **Stwórz login.astro**: z LoginView
3. **Stwórz signup.astro**: z SignupView
4. **Stwórz forgot-password.astro**: z ForgotPasswordView
5. **Stwórz reset-password.astro**: z ResetPasswordView
6. **Zaktualizuj dashboard.astro**: dodaj server-side auth guard

### 6.4. Faza 4: Supabase Configuration
1. **Skonfiguruj Supabase Auth**:
   - Email settings (disable email confirmation)
   - Redirect URLs (reset password only)
   - Security settings (password requirements, rate limiting)
2. **Testuj email delivery**: password reset emails

### 6.5. Faza 5: Testing
1. **Napisz unit testy**: validators, session utils, api client (target: 95%+ coverage)
2. **Napisz E2E testy**: signup, login, logout, password reset, protected routes
3. **Konfiguruj coverage reports**: Vitest coverage z threshold 95%
4. **Uruchom testy w CI/CD**: dodaj do GitHub Actions z coverage reporting

### 6.6. Faza 6: Polish & Documentation
1. **Accessibility audit**: keyboard navigation, screen readers
2. **Performance audit**: bundle size, load time
3. **Security audit**: XSS, CSRF, token management
4. **Update README**: dokumentacja dla deweloperów
5. **Update PRD**: mark US-003 and US-004 as completed

---

## 7. PODSUMOWANIE

### 7.1. Kluczowe komponenty do implementacji

**Backend (Astro API Routes)**:
- [ ] `src/pages/api/auth/signup.ts` - rejestracja
- [ ] `src/pages/api/auth/login.ts` - logowanie
- [ ] `src/pages/api/auth/forgot-password.ts` - inicjowanie resetowania hasła
- [ ] `src/pages/api/auth/reset-password.ts` - resetowanie hasła
- [ ] `src/middleware/index.ts` - rozszerzenie o route protection

**Frontend (React Components)**:
- [ ] `src/components/LandingView.tsx` - landing page dla niezalogowanych
- [ ] `src/components/LoginView.tsx` - formularz logowania
- [ ] `src/components/SignupView.tsx` - formularz rejestracji
- [ ] `src/components/ForgotPasswordView.tsx` - formularz żądania resetu hasła
- [ ] `src/components/ResetPasswordView.tsx` - formularz nowego hasła
- [ ] `src/components/PasswordStrengthIndicator.tsx` - wskaźnik siły hasła
- [ ] `src/components/DashboardView.tsx` - modyfikacja (initialUser prop)

**Astro Pages**:
- [ ] `src/pages/index.astro` - modyfikacja (server-side check + LandingView)
- [ ] `src/pages/login.astro` - nowa strona logowania
- [ ] `src/pages/signup.astro` - nowa strona rejestracji
- [ ] `src/pages/forgot-password.astro` - nowa strona resetowania hasła
- [ ] `src/pages/reset-password.astro` - nowa strona ustawiania nowego hasła
- [ ] `src/pages/dashboard.astro` - modyfikacja (server-side auth guard)

**Utilities**:
- [ ] `src/lib/validators/auth.validator.ts` - schematy Zod
- [ ] `src/lib/utils/session.utils.ts` - zarządzanie sesją w localStorage
- [ ] `src/lib/utils/api-client.utils.ts` - wrapper fetch z auto token injection

**Types**:
- [ ] `src/types.ts` - dodanie UserDTO, AuthSessionDTO, LoginResponseDTO, SignupResponseDTO

**Configuration**:
- [ ] Supabase Auth settings (disable email confirmation, configure password reset redirect URLs)
- [ ] Environment variables (.env)
- [ ] Vitest coverage threshold (95%)

### 7.2. Integracja z istniejącym systemem

**Bez zmian (backwards compatible)**:
- ✅ Wszystkie istniejące API endpoints: `/api/entries`, `/api/tags`, `/api/focus-scores`
- ✅ Wszystkie istniejące komponenty React: EntryForm, EntriesList, FocusScoreWidget, etc.
- ✅ Supabase client i database schema (tylko wykorzystanie auth.users)
- ✅ RLS policies (automatycznie działają z auth.uid())

**Z modyfikacjami (rozszerzenia)**:
- 🔧 `DashboardView` - dodanie prop `initialUser` (opcjonalnie)
- 🔧 `dashboard.astro` - dodanie server-side auth guard
- 🔧 `index.astro` - zmiana z Welcome.astro na LandingView
- 🔧 `middleware/index.ts` - dodanie route protection logic

**Nowe funkcjonalności**:
- ✨ Pełny flow autentykacji (signup, login, logout)
- ✨ Odzyskiwanie hasła (forgot password, reset password)
- ✨ Session management (localStorage/sessionStorage)
- ✨ Route protection (middleware redirects)
- ✨ Automatyczne wykrywanie wygasłej sesji (401 handling)

### 7.3. Zgodność z wymaganiami PRD

**US-003: Nowy użytkownik**:
- ✅ Register for an account using email and password
- ✅ Receive clear validation feedback during registration
- ✅ Log in to access personal productivity dashboard
- ✅ Recover password if forgotten

**US-004: Uwierzytelniony użytkownik**:
- ✅ Access all application features after logging in
- ✅ Stay logged in across browser sessions (remember me)
- ✅ Log out securely when done
- ✅ Have confidence that data is private and secure (RLS)

**Authentication & Access Control (PRD)**:
- ✅ All application features require user authentication
- ✅ Landing page (/) is public with login/signup options
- ✅ Dashboard (/dashboard) requires active authentication session
- ✅ Use Supabase Auth with Email/Password only
- ✅ No external OAuth providers
- ✅ Row Level Security (RLS) ensures users can only access their own entries
- ✅ All database queries respect RLS policies
- ✅ Protect API endpoints with authentication middleware
- ✅ Middleware redirects unauthenticated users to landing page
- ✅ Password recovery functionality available

**Success Metrics (PRD)**:
- ✅ Zero security vulnerabilities in authentication flow
- ✅ All user data protected by RLS with zero cross-user data access
- ✅ 95%+ test coverage for business logic (validators, services, utils)
- ✅ Application loads in under 2 seconds (strony auth są lightweight)

---

## 8. KLUCZOWE DECYZJE ARCHITEKTONICZNE

### 8.1. Session Management Strategy
**Decyzja**: **Użycie localStorage/sessionStorage z tokenem JWT w Authorization header**

**Uzasadnienie**:
- Prostsze w implementacji (brak potrzeby dodatkowych pakietów)
- Zgodne z istniejącą architekturą API (wszystkie endpointy używają Authorization header)
- Elastyczność (remember me przez localStorage vs sessionStorage)
- Wystarczająco bezpieczne z short-lived tokens (1h) i HTTPS
- Middleware już implementuje weryfikację tokenu z header

**Odrzucona alternatywa**: httpOnly cookies z `@supabase/ssr`
- Bardziej bezpieczne, ale dodaje complexity
- Wymaga dodatkowej konfiguracji i pakietów
- PRD nie wymaga tego poziomu security dla MVP

### 8.2. Client-side vs Server-side Auth Guards
**Decyzja**: Middleware sprawdza auth server-side dla wszystkich stron  
**Uzasadnienie**:
- Lepsze security (nie można obejść przez manipulację JS)
- SEO-friendly (boty widzą poprawne redirecty)
- Spójny flow (jednolite przekierowania)

### 8.3. Email Confirmation
**Decyzja**: **DISABLED** (zgodnie z PRD)

**Uzasadnienie**:
- PRD nie wymaga email confirmation
- Upraszcza onboarding flow (użytkownik od razu może korzystać z aplikacji)
- Eliminuje potrzebę callback page i dodatkowej logiki
- Dla MVP wystarczy password recovery jako weryfikacja email

**Odrzucona alternatywa**: Włączyć email confirmation
- PRD nie wymaga tego feature
- Dodaje complexity bez wyraźnych korzyści dla tego use case

### 8.4. Token Refresh Strategy
**Decyzja**: Supabase automatyczny refresh token rotation  
**Implementacja**: Frontend odświeża token przy błędzie 401 lub proaktywnie przed wygaśnięciem  
**Uzasadnienie**:
- Supabase automatycznie obsługuje rotation
- Bezpieczniejsze (jeden refresh token używany tylko raz)
- Zmniejsza ryzyko token theft

### 8.5. Error Handling Philosophy
**Decyzja**: Generic error messages dla auth failures, szczegółowe dla validation  
**Uzasadnienie**:
- Security: nie ujawniaj czy email istnieje
- UX: pomocne komunikaty dla błędów walidacji
- Balance między security a usability

---

## 9. RYZYKA I MITIGACJE

### 9.1. Ryzyko: XSS Attack przez localStorage
**Mitigacja**:
- React automatycznie escapuje wszystkie dane (zapobiega XSS)
- Nie używać `dangerouslySetInnerHTML`
- Short-lived tokens (1h) minimalizują okno ataku
- HTTPS only w produkcji
- Content Security Policy (CSP) headers (opcjonalnie)
- Wyważony tradeoff między security a complexity dla MVP

### 9.2. Ryzyko: Session Hijacking
**Mitigacja**:
- Short-lived access tokens (1 hour)
- Refresh token rotation
- HTTPS only (production)

### 9.3. Ryzyko: Brute Force Attacks
**Mitigacja**:
- Supabase rate limiting (automatic)
- Generic error messages (don't reveal if email exists)
- Account lockout (Supabase automatic)

### 9.4. Ryzyko: Email Delivery Failures (Password Reset)
**Mitigacja**:
- Testowanie password reset email delivery w staging
- Konfiguracja custom SMTP (opcjonalnie)
- Komunikaty użytkownikowi o sprawdzeniu spamu/folderów
- Generic success message (nie ujawnia czy email istnieje)

### 9.5. Ryzyko: Token Expiration During Work
**Mitigacja**:
- Automatyczny refresh tokenu przed wygaśnięciem
- Graceful handling 401 errors
- Przekierowanie z możliwością powrotu (redirect parameter)

---

## 10. NASTĘPNE KROKI

Po zatwierdzeniu niniejszej specyfikacji, proces implementacji powinien przebiegać zgodnie z Planem Implementacji (Sekcja 6), z uwzględnieniem:

1. **Code Review** każdego komponentu przed merge
2. **Unit Testing** dla wszystkich utility functions i validators
3. **E2E Testing** dla wszystkich user flows
4. **Security Audit** po zakończeniu implementacji
5. **Performance Testing** na staging environment
6. **Documentation Update** dla nowych deweloperów

---

**Koniec specyfikacji**

*Data stworzenia: 2026-01-25*  
*Ostatnia aktualizacja: 2026-01-25*  
*Wersja: 2.0*  
*Status: Zaktualizowano zgodnie z PRD - usunięto sprzeczności*

## CHANGELOG

### Wersja 2.0 (2026-01-25)
**Główne zmiany - dostosowanie do PRD:**
- ✅ Wybranie localStorage/sessionStorage jako głównej strategii session management (zamiast mieszanych informacji)
- ✅ Usunięcie email confirmation feature (PRD tego nie wymaga)
- ✅ Usunięcie `/auth/callback.astro` z planu implementacji
- ✅ Dodanie wymagania 95%+ test coverage zgodnie z PRD
- ✅ Ujednolicenie middleware implementation (Authorization header only)
- ✅ Usunięcie sekcji o cookie-based authentication
- ✅ Aktualizacja wszystkich komponentów i flow do uproszczonego signup (bez email confirmation)
- ✅ Aktualizacja decyzji architektonicznych w sekcji 8
- ✅ Aktualizacja mitigacji ryzyk zgodnie z wybraną strategią

