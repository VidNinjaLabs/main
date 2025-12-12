import { WideContainer } from "@/components/layout/WideContainer";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-type-divider py-6 md:py-4">
      <WideContainer ultraWide classNames="flex flex-col gap-3">
        {/* Copyright */}
        <p className="text-sm text-type-emphasis">
          © {currentYear} VidNinja. All rights reserved.
        </p>

        {/* DMCA Disclaimer */}
        <p className="text-sm text-type-secondary max-w-4xl">
          <span className="font-semibold text-type-emphasis">
            DMCA Disclaimer:
          </span>{" "}
          VidNinja is a content aggregator that scrapes publicly available
          sources. We don&apos;t host or store copyrighted content. All content
          is gathered automatically from third-party websites. Copyright
          infringement claims should be directed to the respective third-party
          sites. For DMCA requests, please contact the original content
          provider.
        </p>
      </WideContainer>
    </footer>
  );
}

export function FooterView(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["flex min-h-screen flex-col", props.className || ""].join(
        " ",
      )}
    >
      <div style={{ flex: "1 0 auto" }}>{props.children}</div>
      <Footer />
    </div>
  );
}
