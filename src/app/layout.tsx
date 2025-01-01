import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "../index.css";

export const metadata: Metadata = {
  icons: {
    icon: "icon.png",
  },
  title: "CMU Maps Data Visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_FRONTEND_API}>
      <html lang="en">
        <head>
          <script>const global = globalThis;</script>
        </head>
        <body className="bg-gray-100">
          <div id="root">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
