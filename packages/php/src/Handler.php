<?php
namespace ReadMe;

use Illuminate\Http\Request;

interface Handler
{
    public static function constructGroup(Request $request): array;
}
