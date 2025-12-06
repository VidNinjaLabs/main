import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Paragraph } from "@/components/text/Paragraph";
import { Title } from "@/components/text/Title";

export function PremiumPreRoll(props: {
  onWatchWithAds: () => void;
  onGoPremium: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8 text-center h-full w-full absolute inset-0 bg-background-main/90 z-50 backdrop-blur-sm">
      <div className="max-w-md w-full bg-modal-background p-8 rounded-2xl shadow-2xl border border-white/5 space-y-6">
        <div className="flex justify-center">
          <Icon icon={Icons.PLAY} className="text-6xl text-purple-500" />
        </div>

        <Title className="!mt-0">Watch Video</Title>

        <Paragraph>
          Support CloudClash to watch in 4K without ads, or continue watching
          with ads.
        </Paragraph>

        <div className="space-y-4 pt-4">
          <Button
            theme="purple"
            className="w-full justify-center py-4 text-lg font-bold shadow-lg shadow-purple-900/20"
            onClick={props.onGoPremium}
          >
            <Icon icon={Icons.DIAMOND} className="mr-3" />
            Go Premium
          </Button>

          <Button
            theme="secondary"
            className="w-full justify-center py-3 opacity-80 hover:opacity-100"
            onClick={props.onWatchWithAds}
          >
            Watch with Ads
          </Button>
        </div>
      </div>
    </div>
  );
}
