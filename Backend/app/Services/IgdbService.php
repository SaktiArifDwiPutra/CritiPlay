<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IgdbService
{
    protected $clientId;
    protected $clientSecret;
    protected $baseUrl = 'https://api.igdb.com/v4';

    public function __construct()
    {
        $this->clientId = env('IGDB_CLIENT_ID');
        $this->clientSecret = env('IGDB_CLIENT_SECRET');
    }

    protected function getAccessToken()
    {
        return Cache::remember('igdb_access_token', 4320000, function () {
            $response = Http::post('https://id.twitch.tv/oauth2/token', [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type' => 'client_credentials'
            ]);

            if ($response->failed()) {
                Log::error('IGDB Token Error: ' . $response->body());
                throw new \Exception('Gagal mendapatkan token IGDB.');
            }

            return $response->json('access_token');
        });
    }

    public function request($endpoint, $body)
    {
        $token = $this->getAccessToken();

        return Http::withHeaders([
            'Client-ID' => $this->clientId,
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'text/plain'
        ])->withBody($body, 'text/plain')
          ->post($this->baseUrl . '/' . $endpoint);
    }

    public function poolRequests(array $requests)
    {
        $token = $this->getAccessToken();
        $headers = [
            'Client-ID' => $this->clientId,
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'text/plain'
        ];

        return Http::pool(function ($pool) use ($requests, $headers) {
            $poolCalls = [];
            foreach ($requests as $key => $req) {
                $endpoint = is_array($req) ? ($req['endpoint'] ?? 'games') : 'games';
                $body = is_array($req) ? $req['body'] : $req;
                $poolCalls[$key] = $pool->withHeaders($headers)
                    ->withBody($body, 'text/plain')
                    ->post($this->baseUrl . '/' . $endpoint);
            }
            return $poolCalls;
        });
    }
}