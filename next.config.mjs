/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: {
    // pdfkit lit ses fichiers de données à l'exécution: il ne doit pas être empaqueté.
    serverComponentsExternalPackages: ["pdfkit", "exceljs"],
    // Polices embarquées dans les PDF (exports et factures).
    outputFileTracingIncludes: {
      "/api/exports": ["./assets/fonts/**"],
      "/api/billing/invoices/[id]": ["./assets/fonts/**"],
    },
  },
};
