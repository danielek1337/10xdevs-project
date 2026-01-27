/**
 * LandingView Component
 *
 * Landing page for unauthenticated users.
 *
 * Features:
 * - Hero section with value proposition
 * - Call-to-action buttons (Get Started, Sign In)
 * - Features showcase
 * - Modern, gradient background design
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Target, Shield } from "lucide-react";
import { hasValidSession } from "@/lib/utils/session.utils";

export default function LandingView() {
  // Client-side auth check - redirect to dashboard if logged in
  useEffect(() => {
    if (hasValidSession()) {
      window.location.href = "/dashboard";
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="h-12 w-12 text-white" aria-hidden="true" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">VibeCheck</h1>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Track Your Productivity Flow</h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Monitor your mood, tasks, and focus levels throughout the day. Stay in flow, maximize productivity, and
            understand your work patterns.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-white text-purple-900 hover:bg-blue-50 shadow-lg font-semibold"
            >
              <a href="/signup">Get Started</a>
            </Button>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-900 shadow-lg font-semibold transition-all"
            >
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Feature 1: Mood Tracking */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-4">
              <Activity className="h-6 w-6 text-purple-200" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Mood Tracking</h3>
            <p className="text-blue-100">
              Log your mood throughout the day and discover patterns in your productivity.
            </p>
          </div>

          {/* Feature 2: Focus Score */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
              <Target className="h-6 w-6 text-blue-200" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Daily Focus Score</h3>
            <p className="text-blue-100">
              Automatically calculated score based on your mood, consistency, and work patterns.
            </p>
          </div>

          {/* Feature 3: Insights */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 mb-4">
              <TrendingUp className="h-6 w-6 text-indigo-200" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Productivity Insights</h3>
            <p className="text-blue-100">
              Visualize your trends with charts and understand when you&apos;re most productive.
            </p>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-2 text-blue-100 text-sm">
          <Shield className="h-4 w-4" aria-hidden="true" />
          <span>Your data is private and secure</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <p className="text-blue-200 text-sm">
          © {new Date().getFullYear()} VibeCheck. Track your flow, maximize your productivity.
        </p>
      </footer>
    </div>
  );
}
