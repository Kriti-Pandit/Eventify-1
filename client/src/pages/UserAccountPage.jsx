import { Link } from "react-router-dom";
import { IoMdArrowBack } from 'react-icons/io';
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../UserContext";
import { Navigate } from "react-router-dom";

export default function UserAccountPage() {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return <Navigate to={'/login'} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#00002a]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-cyan-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow p-4 sm:p-6 bg-[#00002a] min-h-screen">
      <div className="mb-8">
        <Link to='/' className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
          <IoMdArrowBack className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-4">My Account</h1>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-[#000033] rounded-xl shadow-md overflow-hidden border border-gray-700">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-cyan-400">Full Name</p>
                <p className="text-gray-300">{user.name}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-cyan-400">Email</p>
                <p className="text-gray-300 break-all">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-cyan-400">Account Created</p>
                <p className="text-gray-400">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}