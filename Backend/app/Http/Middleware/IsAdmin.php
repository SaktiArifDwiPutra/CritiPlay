<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Jika user belum login ATAU bukan admin, tolak aksesnya! (Status 403 Forbidden)
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Anda bukan Admin.'], 403);
        }

        return $next($request);
    }
}