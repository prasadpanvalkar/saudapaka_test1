"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 cursor-pointer" onClick={closeMobileMenu}>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2D5F3F]">
              Sauda<span className="text-[#4A9B6D]">pakka.com</span>
            </h1>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/search?type=BUY"
              className="text-gray-700 hover:text-[#2D5F3F] transition-colors font-medium text-sm lg:text-base"
            >
              Buy
            </Link>

            <Link
              href="/search?type=RENT"
              className="text-gray-700 hover:text-[#2D5F3F] transition-colors font-medium text-sm lg:text-base"
            >
              Rent
            </Link>

            {user ? (
              <Link href={user.is_staff || user.is_superuser ? "/admin" : "/dashboard/overview"}>
                <Button className="bg-[#2D5F3F] hover:bg-[#1B3A2C] text-white px-6 py-2.5 rounded-lg font-medium shadow-sm border-none transition-all">
                  {user.is_staff || user.is_superuser ? "Admin Panel" : "Dashboard"}
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-[#2D5F3F] hover:bg-[#1B3A2C] text-white px-6 py-2.5 rounded-lg font-medium shadow-sm border-none transition-all">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-[#2D5F3F] transition-colors p-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-3 bg-white border-t border-gray-100 shadow-lg">
          <Link
            href="/search?type=BUY"
            className="block px-4 py-3 text-gray-700 hover:text-[#2D5F3F] hover:bg-[#E8F5E9] rounded-lg transition-all font-medium"
            onClick={closeMobileMenu}
          >
            Buy Property
          </Link>
          <Link
            href="/search?type=SELL"
            className="block px-4 py-3 text-gray-700 hover:text-[#2D5F3F] hover:bg-[#E8F5E9] rounded-lg transition-all font-medium"
            onClick={closeMobileMenu}
          >
            Sell Property
          </Link>
          <Link
            href="/search?type=RENT"
            className="block px-4 py-3 text-gray-700 hover:text-[#2D5F3F] hover:bg-[#E8F5E9] rounded-lg transition-all font-medium"
            onClick={closeMobileMenu}
          >
            Rent Property
          </Link>

          {/* Mobile CTA Button */}
          <div className="pt-3 border-t border-gray-100">
            {user ? (
              <Link href={user.is_staff || user.is_superuser ? "/admin" : "/dashboard/overview"} onClick={closeMobileMenu}>
                <Button className="w-full bg-[#2D5F3F] hover:bg-[#1B3A2C] text-white py-3 rounded-lg font-semibold shadow-md border-none transition-all">
                  {user.is_staff || user.is_superuser ? "Go to Admin Panel" : "Go to Dashboard"}
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={closeMobileMenu}>
                <Button className="w-full bg-[#2D5F3F] hover:bg-[#1B3A2C] text-white py-3 rounded-lg font-semibold shadow-md border-none transition-all">
                  Login / Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
