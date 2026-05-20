import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  server: {
    allowedOrigins: [
      "derail-barista-curled.ngrok-free.dev", 
      "192.168.31.192", 
      "192.168.31.192:3000"
    ],
  },
};

export default nextConfig;
module.exports = {
  allowedDevOrigins: ['derail-barista-curled.ngrok-free.dev', 'https://smart-wings-grab.loca.lt' ],
}
