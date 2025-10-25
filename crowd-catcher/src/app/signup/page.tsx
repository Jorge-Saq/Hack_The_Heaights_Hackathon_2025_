'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { FileDropzone } from '@/components/FileDropzone';
import { Stepper } from '@/components/Stepper';
import { Toast } from '@/components/Toast';
import { fakeApi } from '@/lib/fakeApi';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });
  const [facePhotos, setFacePhotos] = useState<File[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (facePhotos.length < 10) {
      setErrors({ photos: 'Please upload at least 10 face photos' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      // Create account
      await fakeApi.signUp({
        email: formData.email,
        studentId: formData.studentId,
        password: formData.password,
      });

      // Enroll face photos
      await fakeApi.enrollFaceSet(facePhotos);

      setToast({ message: 'Enrollment complete!', type: 'success' });
      setTimeout(() => {
        router.push('/gallery');
      }, 1500);
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Enrollment failed', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-600">Join Crowd Catcher to find your photos in events</p>
        </div>

        <Stepper currentStep={currentStep} totalSteps={3} className="mb-8" />

        <Card className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Student Information</h2>
                <p className="text-slate-600">Tell us a bit about yourself</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  placeholder="your.email@university.edu"
                />

                <Input
                  label="Student ID"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  error={errors.studentId}
                  placeholder="12345678"
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Upload Face Photos</h2>
                <p className="text-slate-600 mb-4">
                  Upload 10 clear photos of your face. These help us find you in event photos.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Privacy Note:</strong> Crowd Catcher uses your photos to create a temporary model 
                    that helps us find pictures of you at events. You can delete your data anytime.
                  </p>
                </div>
              </div>

              <FileDropzone
                onFilesSelected={setFacePhotos}
                maxFiles={10}
                acceptedTypes={['image/*']}
              />

              {errors.photos && (
                <p className="text-sm text-red-600">{errors.photos}</p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Review & Enroll</h2>
                <p className="text-slate-600">Review your information and complete enrollment</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">Account Details</h3>
                  <p className="text-sm text-slate-600">Email: {formData.email}</p>
                  <p className="text-sm text-slate-600">Student ID: {formData.studentId}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">Face Photos ({facePhotos.length}/10)</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {facePhotos.map((file, index) => (
                      <div key={index} className="aspect-square bg-slate-200 rounded border flex items-center justify-center">
                        <span className="text-xs text-slate-500">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div>
              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleEnroll} 
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Enrolling...' : 'Enroll'}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium">
                Log in
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
