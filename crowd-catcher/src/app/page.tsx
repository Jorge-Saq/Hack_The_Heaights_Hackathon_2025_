import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Camera, Users, Shield, Mail } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6">
              📸 Crowd Catcher
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 mb-4">
              Find your moments in the crowd.
            </p>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
              Upload your photos once — we'll find your best event shots for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Log In
                </Button>
              </Link>
              <Link href="/upload">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                  Upload Event Photos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A simple, privacy-friendly way to find yourself in event photos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Camera className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Upload Once
              </h3>
              <p className="text-slate-600">
                Upload 10 face photos during signup. We create a temporary model to help find you in event photos.
              </p>
            </Card>

            <Card className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Smart Matching
              </h3>
              <p className="text-slate-600">
                When event photos are uploaded, we automatically find potential matches and send you emails to confirm.
              </p>
            </Card>

            <Card className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Privacy First
              </h3>
              <p className="text-slate-600">
                You control your data. Delete your account anytime. All matching happens locally in this prototype.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to find your photos?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join students who are already discovering their best event moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Upload Photos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <Camera className="h-6 w-6 text-sky-600" />
              <span className="text-lg font-semibold text-slate-900">
                📸 Crowd Catcher
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-600">
              <a href="#" className="hover:text-slate-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-slate-900 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-slate-900 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}