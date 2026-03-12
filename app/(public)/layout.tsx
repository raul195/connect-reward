import { CookieConsent } from "@/components/CookieConsent";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CookieConsent />
    </>
  );
}
