import { useState, useEffect } from "react";
import Hls from "@rev9dev-netizen/vidply.js";
import { Spinner } from "@/components/layout/Spinner";
import { Navigation } from "@/components/layout/Navigation";

export function TestPage() {
  const [tmdbId, setTmdbId] = useState("66732"); // Default Stranger Things
  const [type, setType] = useState("show");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activeStream, setActiveStream] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setResults([]);
    setActiveStream(null);
    try {
      const backendUrl =
        localStorage.getItem("backend_url") || "https://api.vidninja.pro";
      // Construct URL
      let url = `${backendUrl}/stream/test/${type}/${tmdbId}`;
      if (type === "show") {
        url += `?season=${season}&episode=${episode}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Test failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <Navigation />
      <div className="max-w-4xl mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-6 text-purple-400">
          Provider Test Dashboard
        </h1>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="movie">Movie</option>
              <option value="show">TV Show</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">TMDB ID</label>
            <input
              type="text"
              value={tmdbId}
              onChange={(e) => setTmdbId(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {type === "show" && (
            <>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Season
                </label>
                <input
                  type="number"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="bg-gray-700 text-white p-2 rounded w-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Episode
                </label>
                <input
                  type="number"
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                  className="bg-gray-700 text-white p-2 rounded w-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </>
          )}

          <button
            onClick={runTest}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Testing..." : "Run Test"}
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {activeStream && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8">
                <div className="relative w-full max-w-5xl aspect-video bg-black rounded border border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setActiveStream(null)}
                    className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded z-10 hover:bg-red-700"
                  >
                    Close Player
                  </button>
                  <TestPlayer url={activeStream} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <div className="grid grid-cols-12 gap-4 text-gray-400 border-b border-gray-700 pb-2 px-4 uppercase text-xs font-bold">
                <div className="col-span-1">Rank</div>
                <div className="col-span-3">Provider</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-5 text-right">Action</div>
              </div>
              {results.map((r) => (
                <div
                  key={r.id}
                  className={`grid grid-cols-12 gap-4 items-center p-4 rounded border ${
                    r.status === "success"
                      ? "bg-green-900/10 border-green-800"
                      : "bg-red-900/10 border-red-800 opacity-75"
                  }`}
                >
                  <div className="col-span-1 font-mono text-gray-500">
                    {r.rank}
                  </div>
                  <div className="col-span-3 font-bold text-white">
                    {r.name}
                  </div>
                  <div className="col-span-3">
                    <span
                      className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                        r.status === "success"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.error && (
                      <div className="text-xs text-red-400 mt-1 truncate">
                        {r.error}
                      </div>
                    )}
                  </div>
                  <div className="col-span-5 text-right">
                    {r.status === "success" && r.stream?.url && (
                      <button
                        onClick={() => setActiveStream(r.stream.url)}
                        className="bg-white text-black px-4 py-1 rounded text-sm font-bold hover:bg-gray-200"
                      >
                        Play Stream
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TestPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
    }
  }, [url]);

  return <video ref={videoRef} className="w-full h-full" controls autoPlay />;
}

import { useRef } from "react";
