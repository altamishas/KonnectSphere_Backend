export const config = {
  matcher: [
    /*
      Match all routes except:
      - Static files (/_next/*, /favicon.ico, etc)
      - API routes
    */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
