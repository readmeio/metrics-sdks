<?php

namespace ReadMe\HAR;

class MaskHelper
{
    public static function mask(string $data): string
    {
        $hashBytes = hash('sha512', $data, true);
        $base64Hash = base64_encode($hashBytes);
        $opts = substr($data, -4);
        return 'sha512-' . $base64Hash . '?' . $opts;
    }
}
