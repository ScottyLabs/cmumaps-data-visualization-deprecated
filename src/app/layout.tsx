import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "../index.css";
import StoreProvider from "./StoreProvider";

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
      <StoreProvider>
        <html lang="en">
          <head>
            <script>const global = globalThis;</script>
          </head>
          <body className="bg-gray-300">
            <div id="root">{children}</div>
          </body>
        </html>
      </StoreProvider>
    </ClerkProvider>
  );
}
