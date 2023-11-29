import { authMiddleware } from "@clerk/nextjs";
 
// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware

// authMiddleware will run the logic to protect out routes. Can pass in options - e.g. publicRoutes array which dictates which endpoints are public
 export default authMiddleware({
  publicRoutes: ["/"],
 }); 

export const config = {
  // This matcher array dictates which endpoints will trigger this middleware which puts those pages behind the login wall
      matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
 