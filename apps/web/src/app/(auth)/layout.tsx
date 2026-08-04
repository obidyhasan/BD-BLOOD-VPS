import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BD Blood - Authentication",
  description: "Sign in, register, or recover your account on BD Blood.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen">{children}</div>;
}
