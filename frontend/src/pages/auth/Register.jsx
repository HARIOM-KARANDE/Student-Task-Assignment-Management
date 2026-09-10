import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input, Textarea } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        role: 'student',
      });
      toast.success(`Account created! Welcome, ${newUser.full_name}!`);
      navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your details.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-200 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Student Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Join classes, download questions, and submit assignments
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/40">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Alex Morgan"
              icon={User}
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
            />

            <Input
              label="Student Email Address *"
              type="email"
              placeholder="e.g. alex@student.edu"
              icon={Mail}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password *"
                type="password"
                placeholder="Min 6 chars"
                icon={Lock}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
              />

              <Input
                label="Confirm Password *"
                type="password"
                placeholder="Repeat password"
                icon={Lock}
                value={formData.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                required
              />
            </div>

            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />

            <Textarea
              label="Academic Bio (Optional)"
              placeholder="Your major, academic interests, or background..."
              rows={2}
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-4"
            >
              Register & Enter Portal <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
