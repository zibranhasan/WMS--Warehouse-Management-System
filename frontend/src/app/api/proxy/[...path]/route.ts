import { NextRequest, NextResponse } from "next/server";

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/v1";

const BACKEND_BASE = INTERNAL_API_URL.replace(/\/+$/, "");

/**
 * Catch-all proxy: forwards browser API requests to the backend
 * using INTERNAL_API_URL (server-only), preserving cookies and
 * Set-Cookie headers so Better Auth sessions work cross-origin.
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[]
) {
  const path = pathSegments.join("/");
  const backendUrl = new URL(`${BACKEND_BASE}/${path}`);

  // Preserve query string from the incoming request
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  // Forward relevant request headers (excluding host/origin)
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "origin" ||
      lower === "referer" ||
      lower === "connection"
    ) {
      return;
    }
    forwardHeaders.set(key, value);
  });

  // Read the request body (if any) before passing through
  let requestBody: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    requestBody = await request.arrayBuffer();
  }

  const backendResponse = await fetch(backendUrl.toString(), {
    method: request.method,
    headers: forwardHeaders,
    body: requestBody,
  });

  // Build the response to return to the browser
  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Preserve Set-Cookie (may appear multiple times — use append)
    if (lower === "set-cookie") {
      responseHeaders.append(key, value);
    } else if (
      lower !== "transfer-encoding" &&
      lower !== "content-encoding" &&
      lower !== "content-length"
    ) {
      responseHeaders.set(key, value);
    }
  });

  // Read the response body
  const responseBody = await backendResponse.arrayBuffer();

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}
