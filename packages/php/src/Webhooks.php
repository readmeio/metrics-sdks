<?php

namespace ReadMe;

class Webhooks
{
    /**
     * @throws MetricsException
     */
    public static function verify(array $body, string $signature, string $secret): array
    {
        if (!$signature) {
            throw new MetricsException('Missing Signature');
        }

        $expectedScheme = 'v0';
        $sig = array_reduce(explode(',', $signature), function ($accum, $item) use ($expectedScheme): array {
            $kv = explode('=', $item);

            if ($kv[0] === 't') {
                $accum['time'] = (int)$kv[1];
            } elseif ($kv[0] === $expectedScheme) {
                $accum['readmeSignature'] = $kv[1];
            }

            return $accum;
        }, [
            'time' => -1,
            'readmeSignature' => '',
        ]);

        $THIRTY_MINUTES = 30 * 60 * 1000;
        if (floor(microtime(true) * 1000) - $sig['time'] > $THIRTY_MINUTES) {
            throw new MetricsException('Expired Signature');
        }

        // Verify the signature is valid
        $unsigned = $sig['time'] . '.' . json_encode($body);
        $verifySignature = hash_hmac('sha256', $unsigned, $secret);
        if ($verifySignature !== $sig['readmeSignature']) {
            throw new MetricsException('Invalid Signature');
        }

        return $body;
    }
}
