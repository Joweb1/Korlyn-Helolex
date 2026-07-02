import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  let vite: any;
  const isProd = process.env.NODE_ENV === "production";

  // Vite middleware for development
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Custom router so we can intercept and serve dynamic index.html
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static files first, but skip index.html since we want our dynamic route to handle it
    app.use(express.static(distPath, { index: false }));
  }

  // Dynamic index.html template middleware for social scraper crawlers and path-specific SEO
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let templatePath = "";
      if (!isProd) {
        templatePath = path.resolve(process.cwd(), "index.html");
      } else {
        templatePath = path.resolve(process.cwd(), "dist/index.html");
      }

      if (!fs.existsSync(templatePath)) {
        return res.status(404).send("Application shell index.html not found.");
      }

      let html = fs.readFileSync(templatePath, "utf-8");

      // Replace the default index.html SEO tags block with route-specific social media meta tags
      const startTag = "<!-- SEO_META_TAGS_START -->";
      const endTag = "<!-- SEO_META_TAGS_END -->";
      const startIndex = html.indexOf(startTag);
      const endIndex = html.indexOf(endTag);

      if (startIndex !== -1 && endIndex !== -1) {
        const host = req.get("host") || "korlyn-helolex.onrender.com";
        const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
        const customMeta = getMetaTagsForPath(url, host, protocol);
        html = html.substring(0, startIndex + startTag.length) + "\n" + customMeta + "\n" + html.substring(endIndex);
      }

      // Transform HTML with Vite in development mode (injects HMR / modules)
      if (!isProd && vite) {
        html = await vite.transformIndexHtml(url, html);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

/**
 * Returns customized SEO and social card headers based on the requested URL pathname.
 */
function getMetaTagsForPath(urlPath: string, host: string, protocol: string): string {
  const pathname = urlPath.split('?')[0];
  const baseUrl = `${protocol}://${host}`;

  if (pathname === '/helolex' || pathname.startsWith('/helolex')) {
    return `    <title>HELOLEX Realms | Play Epic Indie Games &amp; Claim Game Passes</title>
    <meta name="description" content="Play premium indie games like Solstice Assassin, Ludo Max, and Sweet Match on HELOLEX. Claim your official verified game pass and unlock your mobile validation QR code. Enter the elite gaming lobby now." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="HELOLEX Realms | Play Epic Indie Games &amp; Claim Game Passes" />
    <meta property="og:description" content="Play premium indie games like Solstice Assassin, Ludo Max, and Sweet Match on HELOLEX. Claim your official verified game pass and unlock your mobile validation QR code. Enter the elite gaming lobby now." />
    <meta property="og:image" content="${baseUrl}/helolex_game_banner.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:url" content="${baseUrl}/helolex" />
    <meta property="og:site_name" content="KORLYN &amp; HELOLEX Protocol" />
    <meta property="og:image:alt" content="HELOLEX Cinematic Game Realms Banner" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="HELOLEX Realms | Play Epic Indie Games &amp; Claim Game Passes" />
    <meta name="twitter:description" content="Play premium indie games like Solstice Assassin, Ludo Max, and Sweet Match on HELOLEX. Claim your official verified game pass and unlock your mobile validation QR code. Enter the elite gaming lobby now." />
    <meta name="twitter:image" content="${baseUrl}/helolex_game_banner.png" />`;
  }

  if (pathname === '/admin' || pathname.startsWith('/admin')) {
    return `    <title>HELOLEX Admin Console | Secure Verification &amp; Audit Panel</title>
    <meta name="description" content="Secure administrative interface. Oversee digital ownership contracts, audit incoming financial records, manage bank transfers, and provision secure mobile validation QR certificates." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="HELOLEX Admin Console | Secure Verification &amp; Audit Panel" />
    <meta property="og:description" content="Secure administrative interface. Oversee digital ownership contracts, audit incoming financial records, manage bank transfers, and provision secure mobile validation QR certificates." />
    <meta property="og:image" content="${baseUrl}/korlyn_cube_illustration.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1200" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:url" content="${baseUrl}/admin" />
    <meta property="og:site_name" content="KORLYN &amp; HELOLEX Protocol" />
    <meta property="og:image:alt" content="Premium Security Gateway" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="HELOLEX Admin Console | Secure Verification &amp; Audit Panel" />
    <meta name="twitter:description" content="Secure administrative interface. Oversee digital ownership contracts, audit incoming financial records, manage bank transfers, and provision secure mobile validation QR certificates." />
    <meta name="twitter:image" content="${baseUrl}/korlyn_cube_illustration.jpg" />`;
  }

  if (pathname === '/print-certificate' || pathname.startsWith('/print-certificate')) {
    return `    <title>Registry Verification Certificate | Secured Record</title>
    <meta name="description" content="Official digital title verification registry page. Print or download certified credentials proving premium digital ownership under the HELOLEX protocol." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Registry Verification Certificate | Secured Record" />
    <meta property="og:description" content="Official digital title verification registry page. Print or download certified credentials proving premium digital ownership under the HELOLEX protocol." />
    <meta property="og:image" content="${baseUrl}/korlyn_cube_illustration.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1200" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:url" content="${baseUrl}/print-certificate" />
    <meta property="og:site_name" content="KORLYN &amp; HELOLEX Protocol" />
    <meta property="og:image:alt" content="Premium Verification Seal" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Registry Verification Certificate | Secured Record" />
    <meta name="twitter:description" content="Official digital title verification registry page. Print or download certified credentials proving premium digital ownership under the HELOLEX protocol." />
    <meta name="twitter:image" content="${baseUrl}/korlyn_cube_illustration.jpg" />`;
  }

  // Default Fallback Case (Using the HELOLEX banner image and details as fallback SEO cards)
  return `    <title>KORLYN | Your Premium Platform for Digital Assets &amp; Direct Payments</title>
    <meta name="description" content="Claim, showcase, and monetize your digital creations instantly with KORLYN. Easy-to-use live dashboards, verified ownership registries, and fast global payouts. No code required. Set up your custom digital store and start earning today." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="KORLYN | Your Premium Platform for Digital Assets &amp; Direct Payments" />
    <meta property="og:description" content="Claim, showcase, and monetize your digital creations instantly with KORLYN. Easy-to-use live dashboards, verified ownership registries, and fast global payouts. No code required. Set up your custom digital store and start earning today." />
    <meta property="og:image" content="${baseUrl}/helolex_game_banner.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:url" content="${baseUrl}/" />
    <meta property="og:site_name" content="KORLYN &amp; HELOLEX Protocol" />
    <meta property="og:image:alt" content="HELOLEX Cinematic Game Realms Banner" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="KORLYN | Your Premium Platform for Digital Assets &amp; Direct Payments" />
    <meta name="twitter:description" content="Claim, showcase, and monetize your digital creations instantly with KORLYN. Easy-to-use live dashboards, verified ownership registries, and fast global payouts. No code required. Set up your custom digital store and start earning today." />
    <meta name="twitter:image" content="${baseUrl}/helolex_game_banner.png" />`;
}

startServer();
