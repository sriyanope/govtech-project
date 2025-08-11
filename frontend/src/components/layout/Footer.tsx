'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              {/* <TreePine className="w-6 h-6 mr-2" /> */}
              <img src="/parks4people-logo-final.svg" alt="Parks4People Logo" className="w-15 h-15 mr-3 object-contain" />
              <span className="font-bold">Parks4People</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/privacy" onClick={(e) => e.preventDefault()} className="hover:text-green-400 disabled">Privacy Policy</a>
              <a href="/terms" onClick={(e) => e.preventDefault()} className="hover:text-green-400 disabled">Terms of Service</a>
              <a href="https://forms.gle/HofwYkRe3abAuoLJ9"  className="hover:text-green-400" target="_blank" rel="noopener noreferrer">Feedback</a>
            </div>
          </div>
          <div className="mt-4 text-center text-gray-800 text-sm">
            © 2024 Parks4People. All rights reserved.
          </div>
        </div>
    </footer>
  );
}