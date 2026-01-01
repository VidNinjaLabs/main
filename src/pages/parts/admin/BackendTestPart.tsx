import { useState } from "react";
import { useAsyncFn } from "react-use";

import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Box } from "@/components/layout/Box";
import { Divider } from "@/components/utils/Divider";
import { Heading2 } from "@/components/utils/Text";
import { supabase } from "@/lib/supabase";

export function BackendTestPart() {
  const [status, setStatus] = useState<{
    hasTested: boolean;
    success: boolean;
    errorText: string;
    supabaseUrl?: string;
    authenticated?: boolean;
  }>({
    hasTested: false,
    success: false,
    errorText: "",
  });

  const [testState, runTests] = useAsyncFn(async () => {
    setStatus({
      hasTested: false,
      success: false,
      errorText: "",
    });

    try {
      // Test Supabase connection
      const { data: _data, error } = await supabase
        .from("users")
        .select("count");

      if (error) {
        return setStatus({
          hasTested: true,
          success: false,
          errorText: `Supabase error: ${error.message}`,
        });
      }

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      return setStatus({
        hasTested: true,
        success: true,
        errorText: "",
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        authenticated: !!session,
      });
    } catch (err) {
      return setStatus({
        hasTested: true,
        success: false,
        errorText: `Failed to connect to Supabase: ${(err as Error).message}`,
      });
    }
  }, []);

  return (
    <>
      <Heading2 className="mb-8 mt-12">Backend API test</Heading2>
      <Box>
        <div>
          <div className="flex-1">
            {status.hasTested && status.success ? (
              <>
                <p>
                  <span className="inline-block w-36 text-white font-medium">
                    Backend:
                  </span>
                  Supabase
                </p>
                <p>
                  <span className="inline-block w-36 text-white font-medium">
                    URL:
                  </span>
                  {status.supabaseUrl}
                </p>
                <p>
                  <span className="inline-block w-36 text-white font-medium">
                    Status:
                  </span>
                  Connected
                </p>
                <p>
                  <span className="inline-block w-36 text-white font-medium">
                    Authenticated:
                  </span>
                  {status.authenticated ? "Yes" : "No"}
                </p>
                <Divider />
              </>
            ) : null}
          </div>
        </div>
        <div className="w-full flex gap-6 justify-between items-center">
          {!status.hasTested ? (
            <p>Run the test to validate backend</p>
          ) : status.success ? (
            <p className="flex items-center text-md">
              <Icon
                icon={Icons.CIRCLE_CHECK}
                className="text-video-scraping-success mr-2"
              />
              Backend is working as expected
            </p>
          ) : (
            <div>
              <p className="text-white font-bold w-full mb-3 flex items-center gap-1">
                <Icon
                  icon={Icons.CIRCLE_EXCLAMATION}
                  className="text-video-scraping-error mr-2"
                />
                Backend is not working
              </p>
              <p>{status.errorText}</p>
            </div>
          )}
          <Button
            theme="purple"
            loading={testState.loading}
            className="whitespace-nowrap"
            onClick={runTests}
          >
            Test backend
          </Button>
        </div>
      </Box>
    </>
  );
}
